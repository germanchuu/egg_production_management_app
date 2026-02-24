/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Paleta principal
        primary: {
          DEFAULT: '#0097A7',
          50: '#E0F7FA',
          100: '#B2EBF2',
          200: '#80DEEA',
          300: '#4DD0E1',
          400: '#26C6DA',
          500: '#0097A7',
          600: '#00838F',
          700: '#006064',
          800: '#004D56',
          900: '#003940',
        },
        secondary: {
          DEFAULT: '#8E24AA',
          50: '#F3E5F5',
          100: '#E1BEE7',
          200: '#CE93D8',
          300: '#BA68C8',
          400: '#AB47BC',
          500: '#8E24AA',
          600: '#7B1FA2',
          700: '#6A1B9A',
          800: '#4A148C',
          900: '#38006B',
        },
        accent: {
          DEFAULT: '#FFB300',
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#FFB300',
          600: '#FFA000',
          700: '#FF8F00',
          800: '#FF6F00',
          900: '#E65100',
        },
        // Semantic Colors
        success: {
          DEFAULT: '#66BB6A',
          light: '#81C784',
          dark: '#4CAF50',
        },
        warning: {
          DEFAULT: '#FFA726',
          light: '#FFB74D',
          dark: '#FB8C00',
        },
        error: {
          DEFAULT: '#DC2626',
          light: '#EF5350',
          dark: '#C62828',
        },
        info: {
          DEFAULT: '#0097A7',
          light: '#4DD0E1',
          dark: '#00838F',
        },
        // Grays
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
        // Background
        background: {
          DEFAULT: '#FFFFFF',
          secondary: '#F5F5F5',
          tertiary: '#E0F7FA',
        },
        // Text colors
        textPrimary: {
          DEFAULT: '#212121',
        },
        textSecondary: {
          DEFAULT: '#616161',
        },
        textTertiary: {
          DEFAULT: '#9E9E9E',
        },
        textInverse: {
          DEFAULT: '#FFFFFF',
        },
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
        '4xl': '40px',
        '5xl': '48px',
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        full: '9999px',
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT:
          '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        card: '0 2px 14px rgba(0, 0, 0, 0.18)',
        button: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      opacity: {
        disabled: '0.5',
        hover: '0.9',
        pressed: '0.8',
      },
    },
  },
  plugins: [],
};
