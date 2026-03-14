import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import BarChartRounded from '@mui/icons-material/BarChartRounded';
import { loadData, saveData, saveSelections, OPERATIONS } from '../utils/storage';

const OP_KEYS = ['multiply', 'add', 'subtract'];

export default function HomePage() {
  const navigate = useNavigate();
  const [operation, setOperation] = useState('multiply');
  const [selections, setSelections] = useState({
    multiply: [2, 3, 4, 5],
    add: [1, 2, 3, 4, 5],
    subtract: [1, 2, 3, 4, 5],
  });

  useEffect(() => {
    const data = loadData();
    if (data.selections) {
      setSelections(data.selections);
    }
    if (data.selectedOperation) {
      setOperation(data.selectedOperation);
    }
  }, []);

  const currentNumbers = OPERATIONS[operation].numbers;
  const selected = selections[operation] || [];

  const toggleNumber = (num) => {
    setSelections((prev) => {
      const current = prev[operation] || [];
      const next = current.includes(num)
        ? current.filter((n) => n !== num)
        : [...current, num].sort((a, b) => a - b);
      return { ...prev, [operation]: next };
    });
  };

  const handleStart = () => {
    const data = loadData();
    const updated = saveSelections(data, operation, selected);
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
        sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}
      >
        Practice math skills!
      </Typography>

      {/* Operation Tabs */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          mb: 3,
          border: '2px solid',
          borderColor: 'primary.light',
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={operation}
          onChange={(_, val) => setOperation(val)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 700,
              fontSize: '1rem',
              py: 1.5,
            },
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

        <Box sx={{ p: 3 }}>
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
            {currentNumbers.map((num) => (
              <Chip
                key={num}
                label={num}
                onClick={() => toggleNumber(num)}
                color={selected.includes(num) ? 'primary' : 'default'}
                variant={selected.includes(num) ? 'filled' : 'outlined'}
                sx={{
                  minWidth: 56,
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

          {operation === 'subtract' && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', textAlign: 'center', mt: 1.5 }}
            >
              Practice subtracting these numbers (e.g. select 3 → "10 − 3 = ?")
            </Typography>
          )}
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
