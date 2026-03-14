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
  resetStats,
} from '../utils/storage';
import {
  generateExercises,
  getMasteryLevel,
  getStarRating,
  getOverallMastery,
} from '../utils/spacedRepetition';

const ALL_NUMBERS = [2, 3, 4, 5, 6, 7, 8, 9];

function BoxBadge({ box }) {
  const colors = {
    1: 'error',
    2: 'warning',
    3: 'info',
    4: 'primary',
    5: 'success',
  };
  return (
    <Chip
      label={`Box ${box}`}
      size="small"
      color={colors[box] || 'default'}
      sx={{ fontWeight: 600, minWidth: 64, fontSize: '0.75rem', height: 28 }}
    />
  );
}

export default function StatsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(loadData);
  const [confirmReset, setConfirmReset] = useState(false);

  const allExercises = generateExercises(ALL_NUMBERS);
  const overallMastery = getOverallMastery(allExercises, data);
  const overallStars = getStarRating(overallMastery);

  // Build table: rows are multiplier (2-9), for each show unique exercises
  const seen = new Set();
  const exerciseList = [];
  for (const num of ALL_NUMBERS) {
    for (let b = 2; b <= 9; b++) {
      const key = getExerciseKey(num, b);
      if (!seen.has(key)) {
        seen.add(key);
        const exData = getExerciseData(data, num, b);
        exerciseList.push({ key, a: Math.min(num, b), b: Math.max(num, b), ...exData });
      }
    }
  }

  // Sort by box (weakest first) then by key
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
          Statistics
        </Typography>
        <IconButton
          onClick={() => setConfirmReset(true)}
          size="small"
          color="error"
        >
          <DeleteRounded />
        </IconButton>
      </Box>

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
            Mastery
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: 80 }}>
          <Typography variant="h4">
            {'⭐'.repeat(overallStars)}{'☆'.repeat(3 - overallStars)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Rating
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', minWidth: 80 }}>
          <Typography variant="h4" color="text.primary">
            {totalSessions}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Sessions
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
            Accuracy
          </Typography>
        </Box>
      </Paper>

      {/* Multiplication Grid - visual overview */}
      <Paper
        elevation={0}
        sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'grey.200' }}
      >
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
          Mastery Grid
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'auto repeat(8, 1fr)',
            gap: 0.5,
            fontSize: '0.75rem',
          }}
        >
          {/* Header */}
          <Box sx={{ fontWeight: 700, textAlign: 'center', p: 0.5 }}>×</Box>
          {ALL_NUMBERS.map((n) => (
            <Box
              key={n}
              sx={{ fontWeight: 700, textAlign: 'center', p: 0.5 }}
            >
              {n}
            </Box>
          ))}

          {/* Rows */}
          {ALL_NUMBERS.map((row) => (
            <React.Fragment key={row}>
              <Box sx={{ fontWeight: 700, textAlign: 'center', p: 0.5 }}>
                {row}
              </Box>
              {ALL_NUMBERS.map((col) => {
                const exData = getExerciseData(data, row, col);
                const mastery = getMasteryLevel(exData);
                const bg =
                  mastery >= 80
                    ? '#00c853'
                    : mastery >= 60
                    ? '#69f0ae'
                    : mastery >= 40
                    ? '#fff176'
                    : mastery >= 20
                    ? '#ffab91'
                    : exData.lastSeen
                    ? '#ef9a9a'
                    : '#e0e0e0';
                return (
                  <Box
                    key={col}
                    sx={{
                      textAlign: 'center',
                      p: 0.5,
                      borderRadius: 1,
                      bgcolor: bg,
                      color:
                        mastery >= 60 ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.6)',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    }}
                  >
                    {row * col}
                  </Box>
                );
              })}
            </React.Fragment>
          ))}
        </Box>
      </Paper>

      {/* Exercise table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Exercise</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Box</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>✓</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>✗</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Streak</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {exerciseList.map((ex) => (
              <TableRow key={ex.key}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  {ex.a} × {ex.b} = {ex.a * ex.b}
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
          Back to Home
        </Button>
      </Box>

      {/* Reset confirmation dialog */}
      <Dialog open={confirmReset} onClose={() => setConfirmReset(false)}>
        <DialogTitle>Reset All Statistics?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete all your training progress and
            statistics. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
          <Button onClick={handleReset} color="error" variant="contained">
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
