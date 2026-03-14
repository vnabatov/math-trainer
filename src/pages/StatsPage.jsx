import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import HomeRounded from '@mui/icons-material/HomeRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import {
  loadData,
  getExerciseKey,
  getExerciseData,
  getAnswer,
  getSymbol,
  resetStats,
  OPERATIONS,
} from '../utils/storage';
import {
  generateExercises,
  getMasteryLevel,
  getStarRating,
  getOverallMastery,
} from '../utils/spacedRepetition';

const MUL_NUMBERS = [2, 3, 4, 5, 6, 7, 8, 9];
const ADD_SUB_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const OP_KEYS = ['multiply', 'add', 'subtract'];

function getMasteryColor(data, a, b, op) {
  const exData = getExerciseData(data, a, b, op);
  const mastery = getMasteryLevel(exData);
  if (mastery >= 80) return '#00c853';
  if (mastery >= 60) return '#69f0ae';
  if (mastery >= 40) return '#fff176';
  if (mastery >= 20) return '#ffab91';
  if (exData.lastSeen) return '#ef9a9a';
  return '#e0e0e0';
}

function GridCell({ bg, value }) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        p: 0.5,
        borderRadius: 1,
        bgcolor: bg,
        color: 'rgba(0,0,0,0.65)',
        fontWeight: 600,
        fontSize: '0.85rem',
      }}
    >
      {value}
    </Box>
  );
}

function MasteryGridMultiply({ data, numbers }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `auto repeat(${numbers.length}, 1fr)`,
        gap: 0.5,
        fontSize: '0.9rem',
      }}
    >
      <Box sx={{ fontWeight: 700, textAlign: 'center', p: 0.5 }}>×</Box>
      {numbers.map((n) => (
        <Box key={n} sx={{ fontWeight: 700, textAlign: 'center', p: 0.5 }}>{n}</Box>
      ))}
      {numbers.map((row) => (
        <React.Fragment key={row}>
          <Box sx={{ fontWeight: 700, textAlign: 'center', p: 0.5 }}>{row}</Box>
          {numbers.map((col) => (
            <GridCell
              key={col}
              bg={getMasteryColor(data, row, col, 'multiply')}
              value={row * col}
            />
          ))}
        </React.Fragment>
      ))}
    </Box>
  );
}

function MasteryGridAddSub({ data, numbers, op }) {
  const symbol = op === 'add' ? '+' : '−';
  // For addition: rows = first number (a), cols = second number (b), answer = a+b
  // For subtraction: rows = selected number (subtrahend), cols = b (1-9),
  //   exercise stored as { a: s+b, b: s } → displayed as (s+b) − s = b
  //   So grid: row = s (subtrahend), col = b (answer), cell shows s+b
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `auto repeat(${numbers.length}, 1fr)`,
        gap: 0.5,
        fontSize: '0.9rem',
      }}
    >
      <Box sx={{ fontWeight: 700, textAlign: 'center', p: 0.5 }}>{symbol}</Box>
      {numbers.map((n) => (
        <Box key={n} sx={{ fontWeight: 700, textAlign: 'center', p: 0.5 }}>{n}</Box>
      ))}
      {numbers.map((row) => (
        <React.Fragment key={row}>
          <Box sx={{ fontWeight: 700, textAlign: 'center', p: 0.5 }}>{row}</Box>
          {numbers.map((col) => {
            if (op === 'add') {
              return (
                <GridCell
                  key={col}
                  bg={getMasteryColor(data, row, col, 'add')}
                  value={row + col}
                />
              );
            }
            // subtract: exercise is { a: row+col, b: row } → (row+col) − row = col
            const displayA = row + col;
            return (
              <GridCell
                key={col}
                bg={getMasteryColor(data, displayA, row, 'subtract')}
                value={displayA}
              />
            );
          })}
        </React.Fragment>
      ))}
    </Box>
  );
}

function BoxBadge({ box }) {
  const colors = {
    1: 'error',
    2: 'warning',
    3: 'info',
    4: 'primary',
    5: 'success',
  };
  const labels = {
    1: 'Новичок',
    2: 'Ученик',
    3: 'Знаток',
    4: 'Мастер',
    5: 'Эксперт',
  };
  return (
    <Chip
      label={labels[box] || `Ур. ${box}`}
      size="small"
      color={colors[box] || 'default'}
      sx={{ fontWeight: 600, minWidth: 64, fontSize: '0.85rem', height: 30 }}
    />
  );
}

export default function StatsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(loadData);
  const [confirmReset, setConfirmReset] = useState(false);
  const [operation, setOperation] = useState('multiply');

  const allNumbers = operation === 'multiply' ? MUL_NUMBERS : ADD_SUB_NUMBERS;
  const allExercises = generateExercises(allNumbers, operation);
  const overallMastery = getOverallMastery(allExercises, data);
  const overallStars = getStarRating(overallMastery);
  const symbol = getSymbol(operation);

  // Build exercise list
  const seen = new Set();
  const exerciseList = [];
  for (const ex of allExercises) {
    const key = getExerciseKey(ex.a, ex.b, ex.op);
    if (!seen.has(key)) {
      seen.add(key);
      const exData = getExerciseData(data, ex.a, ex.b, ex.op);
      const answer = getAnswer(ex);
      exerciseList.push({ key, ...ex, ...exData, answer });
    }
  }

  exerciseList.sort((a, b) => {
    if (a.box !== b.box) return a.box - b.box;
    return a.key.localeCompare(b.key);
  });

  const handleReset = () => {
    resetStats();
    setData(loadData());
    setConfirmReset(false);
  };

  const totalSessions = data.sessions ? data.sessions.length : 0;
  const totalAnswered = data.sessions
    ? data.sessions.reduce((sum, s) => sum + s.total, 0)
    : 0;
  const totalCorrect = data.sessions
    ? data.sessions.reduce((sum, s) => sum + s.correct, 0)
    : 0;

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        maxWidth: 700,
        mx: 'auto',
        width: '100%',
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
        <Typography variant="h5" sx={{ flex: 1 }}>
          Статистика
        </Typography>
        <IconButton
          onClick={() => setConfirmReset(true)}
          size="small"
          color="error"
        >
          <DeleteRounded />
        </IconButton>
      </Box>

      {/* Operation Tabs */}
      <Tabs
        value={operation}
        onChange={(_, val) => setOperation(val)}
        variant="fullWidth"
        sx={{
          mb: 2,
          '& .MuiTab-root': { fontWeight: 700, fontSize: '0.9rem' },
        }}
      >
        {OP_KEYS.map((op) => (
          <Tab
            key={op}
            value={op}
            label={`${OPERATIONS[op].symbol} ${OPERATIONS[op].label}`}
          />
        ))}
      </Tabs>

      {/* Summary */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          border: '2px solid',
          borderColor: 'primary.light',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          justifyContent: 'center',
        }}
      >
        <Box sx={{ textAlign: 'center', minWidth: 80 }}>
          <Typography variant="h4" color="primary.main">
            {Math.round(overallMastery)}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Уровень
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: 80 }}>
          <Typography variant="h4">
            {'⭐'.repeat(overallStars)}{'☆'.repeat(3 - overallStars)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Рейтинг
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: 80 }}>
          <Typography variant="h4" color="text.primary">
            {totalSessions}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Сессий
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: 80 }}>
          <Typography variant="h4" color="success.main">
            {totalAnswered > 0
              ? Math.round((totalCorrect / totalAnswered) * 100)
              : 0}
            %
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Точность
          </Typography>
        </Box>
      </Paper>

      {/* Mastery Grid */}
      <Paper
        elevation={0}
        sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'grey.200' }}
      >
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontSize: '1rem' }}>
          Таблица прогресса
        </Typography>
        {operation === 'multiply' ? (
          <MasteryGridMultiply data={data} numbers={MUL_NUMBERS} />
        ) : operation === 'add' ? (
          <MasteryGridAddSub data={data} numbers={ADD_SUB_NUMBERS} op="add" />
        ) : (
          <MasteryGridAddSub data={data} numbers={ADD_SUB_NUMBERS} op="subtract" />
        )}
      </Paper>

      {/* Exercise table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Пример</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Уровень</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>✓</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>✗</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Серия</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Ср. время</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {exerciseList.map((ex) => (
              <TableRow key={ex.key}>
                <TableCell sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                  {ex.a} {symbol} {ex.b} = {ex.answer}
                </TableCell>
                <TableCell align="center">
                  <BoxBadge box={ex.box} />
                </TableCell>
                <TableCell align="center" sx={{ color: 'success.main', fontWeight: 600 }}>
                  {ex.correctCount}
                </TableCell>
                <TableCell align="center" sx={{ color: 'error.main', fontWeight: 600 }}>
                  {ex.wrongCount}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  {ex.streak > 0 ? `🔥 ${ex.streak}` : '-'}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '1rem' }}>
                  {ex.answerCount > 0
                    ? `${((ex.totalTimeMs || 0) / ex.answerCount / 1000).toFixed(1)}s`
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<HomeRounded />}
          onClick={() => navigate('/')}
          fullWidth
        >
          На главную
        </Button>
      </Box>

      {/* Reset confirmation dialog */}
      <Dialog open={confirmReset} onClose={() => setConfirmReset(false)}>
        <DialogTitle>Сбросить всю статистику?</DialogTitle>
        <DialogContent>
          <Typography>
            Это безвозвратно удалит весь прогресс тренировок и
            статистику. Отменить нельзя.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmReset(false)}>Отмена</Button>
          <Button onClick={handleReset} color="error" variant="contained">
            Сбросить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
