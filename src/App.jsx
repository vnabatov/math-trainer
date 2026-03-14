import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Box from '@mui/material/Box';
import HomePage from './pages/HomePage';
import TrainingPage from './pages/TrainingPage';
import StatsPage from './pages/StatsPage';

export default function App() {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/train" element={<TrainingPage />} />
        <Route path="/stats" element={<StatsPage />} />
      </Routes>
    </Box>
  );
}
