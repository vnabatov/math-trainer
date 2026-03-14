import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#7c4dff',
      light: '#b47cff',
      dark: '#3f1dcb',
    },
    secondary: {
      main: '#ff6d00',
      light: '#ff9e40',
      dark: '#c43e00',
    },
    success: {
      main: '#00c853',
      light: '#5efc82',
      dark: '#009624',
    },
    error: {
      main: '#ff1744',
      light: '#ff616f',
      dark: '#c4001d',
    },
    background: {
      default: '#f5f0ff',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Nunito", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 16,
    h2: {
      fontWeight: 800,
      fontSize: '3.5rem',
    },
    h3: {
      fontWeight: 800,
      fontSize: '2.5rem',
    },
    h4: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h5: {
      fontWeight: 700,
      fontSize: '1.6rem',
    },
    h6: {
      fontWeight: 700,
      fontSize: '1.35rem',
    },
    body1: {
      fontSize: '1.1rem',
    },
    body2: {
      fontSize: '1rem',
    },
    caption: {
      fontSize: '0.95rem',
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
      fontSize: '1.15rem',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '14px 28px',
          fontSize: '1.2rem',
        },
        sizeLarge: {
          padding: '16px 36px',
          fontSize: '1.4rem',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          height: 52,
          fontSize: '1.3rem',
          fontWeight: 600,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '1.1rem',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '1.05rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 4px 20px rgba(124, 77, 255, 0.1)',
        },
      },
    },
  },
});

export default theme;
