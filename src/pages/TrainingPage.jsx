import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Fade from '@mui/material/Fade';
import HomeRounded from '@mui/icons-material/HomeRounded';
import BackspaceRounded from '@mui/icons-material/BackspaceRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import confetti from 'canvas-confetti';
import {
  loadData,
  saveData,
  updateExercise,
  addSession,
  getExerciseKey,
  getAnswer,
  getSymbol,
} from '../utils/storage';
import {
  generateExercises,
  selectNextExercise,
} from '../utils/spacedRepetition';

const TOTAL_QUESTIONS = 20;

// Different confetti effects for correct answers — cycles through them
const correctEffects = [
  // 1. Classic burst from bottom-center
  () => {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#7c4dff', '#ff6d00', '#00c853', '#ffab00'],
    });
  },
  // 2. Stars burst
  () => {
    confetti({
      particleCount: 30,
      spread: 80,
      origin: { y: 0.65 },
      shapes: ['star'],
      colors: ['#ffd600', '#ff6d00', '#ff1744'],
      scalar: 1.2,
    });
  },
  // 3. Two-sided cannons
  () => {
    confetti({
      particleCount: 25,
      angle: 60,
      spread: 50,
      origin: { x: 0, y: 0.6 },
      colors: ['#7c4dff', '#b388ff', '#ea80fc'],
    });
    confetti({
      particleCount: 25,
      angle: 120,
      spread: 50,
      origin: { x: 1, y: 0.6 },
      colors: ['#ff6d00', '#ffab40', '#ffd740'],
    });
  },
  // 4. Circle burst
  () => {
    confetti({
      particleCount: 35,
      spread: 360,
      startVelocity: 20,
      origin: { y: 0.5, x: 0.5 },
      colors: ['#00e676', '#69f0ae', '#b9f6ca', '#1de9b6'],
      ticks: 60,
    });
  },
  // 5. Shower from top
  () => {
    confetti({
      particleCount: 50,
      spread: 100,
      origin: { y: 0, x: 0.5 },
      gravity: 1.2,
      colors: ['#e040fb', '#7c4dff', '#536dfe', '#448aff'],
      startVelocity: 30,
    });
  },
];

// Big celebration for perfect session (all correct)
function firePerfectSessionConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    // Fireworks from both sides
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#7c4dff', '#ff6d00', '#ffd600', '#00e676'],
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#e040fb', '#536dfe', '#ff1744', '#00bcd4'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();

  // Big center burst after a short delay
  setTimeout(() => {
    confetti({
      particleCount: 150,
      spread: 160,
      origin: { y: 0.6, x: 0.5 },
      colors: ['#ffd600', '#ff6d00', '#ff1744', '#7c4dff', '#00e676'],
      shapes: ['star', 'circle'],
      scalar: 1.3,
      startVelocity: 45,
    });
  }, 500);
}

// Good session celebration (≥70%)
function fireGoodSessionConfetti() {
  confetti({
    particleCount: 80,
    spread: 100,
    origin: { y: 0.6 },
    colors: ['#7c4dff', '#ff6d00', '#ffd600', '#00c853'],
    shapes: ['star', 'circle'],
    scalar: 1.1,
  });
}

export default function TrainingPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(loadData);
  const [exercises, setExercises] = useState([]);
  const [current, setCurrent] = useState(null);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [questionNum, setQuestionNum] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [lastExercise, setLastExercise] = useState(null);
  const [sessionTotalTime, setSessionTotalTime] = useState(0);
  const feedbackTimeout = useRef(null);
  const questionStartTime = useRef(Date.now());
  const correctCount = useRef(0); // tracks correct answers for confetti variety

  // Initialize exercises from selected numbers and operation
  useEffect(() => {
    const loadedData = loadData();
    setData(loadedData);
    const op = loadedData.selectedOperation || 'multiply';
    const nums = loadedData.selections?.[op] || loadedData.selectedNumbers || [2, 3, 4, 5];
    const exs = generateExercises(nums, op);
    setExercises(exs);
    const first = selectNextExercise(exs, loadedData, null);
    setCurrent(first);
    setQuestionNum(1);
    questionStartTime.current = Date.now();
  }, []);

  const nextQuestion = useCallback(
    (updatedData, currentExercise) => {
      if (questionNum >= TOTAL_QUESTIONS) {
        // Session complete
        const session = {
          date: Date.now(),
          correct: sessionCorrect,
          wrong: sessionWrong,
          total: TOTAL_QUESTIONS,
          numbers: updatedData.selections?.[updatedData.selectedOperation] || updatedData.selectedNumbers,
          operation: updatedData.selectedOperation || 'multiply',
        };
        const finalData = addSession(updatedData, session);
        saveData(finalData);
        setData(finalData);
        setSessionDone(true);
        return;
      }

      const next = selectNextExercise(exercises, updatedData, currentExercise);
      setCurrent(next);
      setLastExercise(currentExercise);
      setQuestionNum((q) => q + 1);
      setInput('');
      questionStartTime.current = Date.now();
    },
    [exercises, questionNum, sessionCorrect, sessionWrong]
  );

  const handleSubmit = useCallback(() => {
    if (!current || input === '' || feedback) return;

    const answer = parseInt(input, 10);
    const correctAnswer = getAnswer(current);
    const isCorrect = answer === correctAnswer;
    const elapsed = Date.now() - questionStartTime.current;

    setFeedback(isCorrect ? 'correct' : 'wrong');
    setSessionTotalTime((t) => t + elapsed);

    if (isCorrect) {
      // Fire a different confetti effect each time
      const effectIndex = correctCount.current % correctEffects.length;
      correctEffects[effectIndex]();
      correctCount.current += 1;
      setSessionCorrect((c) => c + 1);
    } else {
      setSessionWrong((w) => w + 1);
    }

    const updatedData = updateExercise(data, current.a, current.b, isCorrect, current.op, elapsed);
    saveData(updatedData);
    setData(updatedData);

    // Show feedback then move on
    feedbackTimeout.current = setTimeout(() => {
      setFeedback(null);
      nextQuestion(updatedData, current);
    }, isCorrect ? 600 : 1500);
  }, [current, input, feedback, data, nextQuestion]);

  const handleKeyPress = useCallback(
    (digit) => {
      if (feedback) return;
      if (input.length < 2) {
        setInput((prev) => prev + digit);
      }
    },
    [feedback, input]
  );

  const handleBackspace = useCallback(() => {
    if (feedback) return;
    setInput((prev) => prev.slice(0, -1));
  }, [feedback]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    };
  }, []);

  // Fire session confetti once when session completes
  useEffect(() => {
    if (!sessionDone) return;
    const total = sessionCorrect + sessionWrong;
    const pct = total > 0 ? Math.round((sessionCorrect / total) * 100) : 0;
    if (pct === 100) {
      firePerfectSessionConfetti();
    } else if (pct >= 70) {
      fireGoodSessionConfetti();
    }
  }, [sessionDone]); // eslint-disable-line react-hooks/exhaustive-deps

  // Session complete screen
  if (sessionDone) {
    const total = sessionCorrect + sessionWrong;
    const pct = total > 0 ? Math.round((sessionCorrect / total) * 100) : 0;
    const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0;
    const avgTimeSec = total > 0 ? (sessionTotalTime / total / 1000).toFixed(1) : '0.0';
    const isPerfect = pct === 100;

    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          maxWidth: 500,
          mx: 'auto',
          width: '100%',
        }}
      >
        <Typography variant="h4" sx={{ mb: 2, textAlign: 'center' }}>
          {isPerfect
            ? 'Идеально! 🏆🌟🏆'
            : pct >= 90
            ? 'Великолепно! 🌟'
            : pct >= 70
            ? 'Отличная работа! 👏'
            : pct >= 50
            ? 'Хороший результат! 💪'
            : 'Продолжай тренироваться! 📚'}
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            width: '100%',
            textAlign: 'center',
            border: '2px solid',
            borderColor: 'primary.light',
            mb: 3,
          }}
        >
          <Typography variant="h2" sx={{ mb: 1, color: 'primary.main' }}>
            {pct}%
          </Typography>

          <Typography variant="h5" sx={{ mb: 2 }}>
            {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 4,
              mb: 1,
            }}
          >
            <Box>
              <Typography variant="h4" color="success.main">
                {sessionCorrect}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Верно
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" color="error.main">
                {sessionWrong}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ошибки
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" color="text.secondary">
                {avgTimeSec}с
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ср. время
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Button
          variant="contained"
          size="large"
          onClick={() => navigate(0)}
          sx={{
            mb: 2,
            width: '100%',
            maxWidth: 300,
            py: 1.5,
            background: 'linear-gradient(135deg, #7c4dff 0%, #651fff 100%)',
          }}
        >
          Ещё раз
        </Button>

        <Button
          variant="outlined"
          size="large"
          startIcon={<HomeRounded />}
          onClick={() => navigate('/')}
          sx={{ width: '100%', maxWidth: 300 }}
        >
          На главную
        </Button>
      </Box>
    );
  }

  if (!current) return null;

  const correctAnswer = getAnswer(current);
  const symbol = getSymbol(current.op);
  const progress = ((questionNum - 1) / TOTAL_QUESTIONS) * 100;

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 500,
        mx: 'auto',
        width: '100%',
        p: 2,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 2,
          gap: 1,
        }}
      >
        <IconButton onClick={() => navigate('/')} size="small">
          <HomeRounded />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: 'rgba(124, 77, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                background:
                  'linear-gradient(90deg, #7c4dff 0%, #ff6d00 100%)',
              },
            }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40, textAlign: 'right' }}>
          {questionNum}/{TOTAL_QUESTIONS}
        </Typography>
      </Box>

      {/* Exercise Card */}
      <Paper
        elevation={0}
        sx={{
          flex: '0 0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          px: 3,
          mb: 2,
          border: '3px solid',
          transition: 'all 0.3s ease',
          borderColor:
            feedback === 'correct'
              ? 'success.main'
              : feedback === 'wrong'
              ? 'error.main'
              : 'primary.light',
          bgcolor:
            feedback === 'correct'
              ? 'rgba(0, 200, 83, 0.05)'
              : feedback === 'wrong'
              ? 'rgba(255, 23, 68, 0.05)'
              : 'white',
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontSize: { xs: '3rem', sm: '4rem' },
            color: 'text.primary',
            letterSpacing: 4,
          }}
        >
          {current.a} {symbol} {current.b} =
        </Typography>

        <Box
          sx={{
            mt: 2,
            minWidth: 120,
            minHeight: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '3px solid',
            borderColor: feedback
              ? feedback === 'correct'
                ? 'success.main'
                : 'error.main'
              : 'primary.main',
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: '3rem', sm: '4rem' },
              color: feedback
                ? feedback === 'correct'
                  ? 'success.main'
                  : 'error.main'
                : 'primary.main',
              fontWeight: 800,
            }}
          >
            {input || '\u00A0'}
          </Typography>
        </Box>

        {/* Show correct answer on wrong */}
        {feedback === 'wrong' && (
          <Fade in>
            <Typography
              variant="h5"
              color="error.main"
              sx={{ mt: 1.5, fontWeight: 700 }}
            >
              Правильный ответ: {correctAnswer}
            </Typography>
          </Fade>
        )}
      </Paper>

      {/* Number Keyboard */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1.5,
            maxWidth: 360,
            mx: 'auto',
            width: '100%',
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <Button
              key={digit}
              variant="contained"
              onClick={() => handleKeyPress(String(digit))}
              disabled={!!feedback}
              sx={{
                py: 2.5,
                fontSize: '2.2rem',
                fontWeight: 700,
                bgcolor: 'white',
                color: 'text.primary',
                border: '2px solid',
                borderColor: 'grey.300',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                '&:hover': {
                  bgcolor: 'primary.light',
                  color: 'white',
                  borderColor: 'primary.light',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
                '&.Mui-disabled': {
                  bgcolor: 'grey.100',
                  color: 'grey.400',
                },
                minHeight: 64,
              }}
            >
              {digit}
            </Button>
          ))}

          {/* Bottom row: Backspace, 0, Submit */}
          <Button
            variant="contained"
            onClick={handleBackspace}
            disabled={!!feedback || input.length === 0}
            sx={{
              py: 2,
              bgcolor: 'grey.200',
              color: 'text.primary',
              border: '2px solid',
              borderColor: 'grey.300',
              '&:hover': { bgcolor: 'grey.300' },
              minHeight: 56,
            }}
          >
            <BackspaceRounded />
          </Button>

          <Button
            variant="contained"
            onClick={() => handleKeyPress('0')}
            disabled={!!feedback}
            sx={{
              py: 2.5,
              fontSize: '2.2rem',
              fontWeight: 700,
              bgcolor: 'white',
              color: 'text.primary',
              border: '2px solid',
              borderColor: 'grey.300',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              '&:hover': {
                bgcolor: 'primary.light',
                color: 'white',
                borderColor: 'primary.light',
              },
              minHeight: 64,
            }}
          >
            0
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!!feedback || input.length === 0}
            sx={{
              py: 2,
              fontSize: '1.4rem',
              background: input.length > 0
                ? 'linear-gradient(135deg, #7c4dff 0%, #651fff 100%)'
                : undefined,
              bgcolor: input.length === 0 ? 'grey.200' : undefined,
              color: input.length > 0 ? 'white' : 'grey.500',
              boxShadow: input.length > 0
                ? '0 4px 12px rgba(124, 77, 255, 0.3)'
                : 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #651fff 0%, #6200ea 100%)',
              },
              minHeight: 56,
            }}
          >
            <CheckRounded sx={{ fontSize: 32 }} />
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
