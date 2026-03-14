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
  const feedbackTimeout = useRef(null);

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
    },
    [exercises, questionNum, sessionCorrect, sessionWrong]
  );

  const handleSubmit = useCallback(() => {
    if (!current || input === '' || feedback) return;

    const answer = parseInt(input, 10);
    const correctAnswer = getAnswer(current);
    const isCorrect = answer === correctAnswer;

    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      setSessionCorrect((c) => c + 1);
    } else {
      setSessionWrong((w) => w + 1);
    }

    const updatedData = updateExercise(data, current.a, current.b, isCorrect, current.op);
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

  // Session complete screen
  if (sessionDone) {
    const total = sessionCorrect + sessionWrong;
    const pct = total > 0 ? Math.round((sessionCorrect / total) * 100) : 0;
    const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0;

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
          {pct >= 90
            ? 'Amazing! 🌟'
            : pct >= 70
            ? 'Great job! 👏'
            : pct >= 50
            ? 'Good effort! 💪'
            : 'Keep practicing! 📚'}
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
                Correct
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" color="error.main">
                {sessionWrong}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Wrong
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
          Train Again
        </Button>

        <Button
          variant="outlined"
          size="large"
          startIcon={<HomeRounded />}
          onClick={() => navigate('/')}
          sx={{ width: '100%', maxWidth: 300 }}
        >
          Home
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
            fontSize: { xs: '2.5rem', sm: '3.5rem' },
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
              fontSize: { xs: '2.5rem', sm: '3.5rem' },
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
              Correct answer: {correctAnswer}
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
                py: 2,
                fontSize: '1.8rem',
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
                minHeight: 56,
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
              py: 2,
              fontSize: '1.8rem',
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
              minHeight: 56,
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
