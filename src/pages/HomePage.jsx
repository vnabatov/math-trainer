import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import BarChartRounded from '@mui/icons-material/BarChartRounded';
import { loadData, saveData, saveSelectedNumbers } from '../utils/storage';

const ALL_NUMBERS = [2, 3, 4, 5, 6, 7, 8, 9];

export default function HomePage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([2, 3, 4, 5]);

  useEffect(() => {
    const data = loadData();
    if (data.selectedNumbers && data.selectedNumbers.length > 0) {
      setSelected(data.selectedNumbers);
    }
  }, []);

  const toggleNumber = (num) => {
    setSelected((prev) => {
      const next = prev.includes(num)
        ? prev.filter((n) => n !== num)
        : [...prev, num].sort();
      return next;
    });
  };

  const handleStart = () => {
    const data = loadData();
    const updated = saveSelectedNumbers(data, selected);
    saveData(updated);
    navigate('/train');
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        maxWidth: 600,
        mx: 'auto',
        width: '100%',
      }}
    >
      <Typography
        variant="h3"
        sx={{
          mb: 1,
          background: 'linear-gradient(135deg, #7c4dff 0%, #ff6d00 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
        }}
      >
        Math Trainer
      </Typography>

      <Typography
        variant="h6"
        color="text.secondary"
        sx={{ mb: 4, textAlign: 'center', fontWeight: 600 }}
      >
        Learn the multiplication table!
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          width: '100%',
          bgcolor: 'white',
          border: '2px solid',
          borderColor: 'primary.light',
          mb: 4,
        }}
      >
        <Typography
          variant="h6"
          sx={{ mb: 2, textAlign: 'center', color: 'primary.main' }}
        >
          Select numbers to practice
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            justifyContent: 'center',
          }}
        >
          {ALL_NUMBERS.map((num) => (
            <Chip
              key={num}
              label={num}
              onClick={() => toggleNumber(num)}
              color={selected.includes(num) ? 'primary' : 'default'}
              variant={selected.includes(num) ? 'filled' : 'outlined'}
              sx={{
                minWidth: 64,
                fontSize: '1.3rem',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                transform: selected.includes(num) ? 'scale(1.08)' : 'scale(1)',
                boxShadow: selected.includes(num)
                  ? '0 4px 12px rgba(124, 77, 255, 0.3)'
                  : 'none',
              }}
            />
          ))}
        </Box>
      </Paper>

      <Stack spacing={2} sx={{ width: '100%', maxWidth: 320 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<PlayArrowRounded />}
          onClick={handleStart}
          disabled={selected.length === 0}
          sx={{
            py: 2,
            fontSize: '1.3rem',
            background: 'linear-gradient(135deg, #7c4dff 0%, #651fff 100%)',
            boxShadow: '0 6px 20px rgba(124, 77, 255, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #651fff 0%, #6200ea 100%)',
              boxShadow: '0 8px 24px rgba(124, 77, 255, 0.5)',
            },
          }}
        >
          Start Training
        </Button>

        <Button
          variant="outlined"
          size="large"
          startIcon={<BarChartRounded />}
          onClick={() => navigate('/stats')}
          sx={{ py: 1.5 }}
        >
          View Statistics
        </Button>
      </Stack>
    </Box>
  );
}
