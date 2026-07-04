import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
          DEFAULT: '#3C50E0',
        },
        neon: {
          blue: '#00d4ff',
          purple: '#a855f7',
          pink: '#ec4899',
          green: '#22c55e',
          gold: '#f59e0b',
        },
        // Palette pilotée par variables CSS : bascule automatiquement
        // entre thème sombre et thème clair (voir globals.css).
        gaming: {
          dark: 'rgb(var(--gaming-dark) / <alpha-value>)',
          darker: 'rgb(var(--gaming-darker) / <alpha-value>)',
          card: 'rgb(var(--gaming-card) / <alpha-value>)',
          border: 'rgb(var(--gaming-border) / <alpha-value>)',
          surface: 'rgb(var(--gaming-surface) / <alpha-value>)',
        },

        // TailAdmin dashboard palette (exact values from their config).
        secondary: '#80CAEE',
        black: { DEFAULT: '#1C2434', 2: '#010101' },
        body: '#64748B',
        bodydark: '#AEB7C0',
        bodydark1: '#DEE4EE',
        bodydark2: '#8A99AF',
        stroke: '#E2E8F0',
        strokedark: '#2E3A47',
        boxdark: '#24303F',
        'boxdark-2': '#1A222C',
        graydark: '#333A48',
        whiten: '#F1F5F9',
        whiter: '#F5F7FD',
        gray: { DEFAULT: '#EFF4FB', 2: '#F7F9FC', 3: '#FAFAFA' },
        'form-strokedark': '#3d4d60',
        'form-input': '#1d2a39',
        meta: {
          1: '#DC3545', 2: '#EFF2F7', 3: '#10B981', 4: '#313D4A', 5: '#259AE6',
          6: '#FFBA00', 7: '#FF6766', 8: '#F0950C', 9: '#E5E7EB', 10: '#0FADCF',
        },
        success: '#219653',
        danger: '#D34053',
        warning: '#FFA70B',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Poppins', 'sans-serif'],
        satoshi: ['Satoshi', 'Inter', 'sans-serif'],
      },
      fontSize: {
        'title-xxl': ['44px', '55px'],
        'title-xl': ['36px', '45px'],
        'title-xl2': ['33px', '45px'],
        'title-lg': ['28px', '35px'],
        'title-md': ['24px', '30px'],
        'title-md2': ['26px', '30px'],
        'title-sm': ['20px', '26px'],
        'title-xsm': ['18px', '24px'],
      },
      boxShadow: {
        default: '0px 8px 13px -3px rgba(0, 0, 0, 0.07)',
        card: '0px 1px 3px rgba(0, 0, 0, 0.12)',
        'card-2': '0px 1px 2px rgba(0, 0, 0, 0.05)',
        1: '0px 1px 3px rgba(0, 0, 0, 0.08)',
        2: '0px 1px 4px rgba(0, 0, 0, 0.12)',
        3: '0px 1px 5px rgba(0, 0, 0, 0.14)',
        4: '0px 4px 10px rgba(0, 0, 0, 0.12)',
        5: '0px 1px 1px rgba(0, 0, 0, 0.15)',
        6: '0px 3px 15px rgba(0, 0, 0, 0.1)',
        neon: '0 0 10px rgba(0, 212, 255, 0.5), 0 0 20px rgba(0, 212, 255, 0.3)',
        'neon-lg': '0 0 20px rgba(0, 212, 255, 0.6), 0 0 40px rgba(0, 212, 255, 0.3)',
        'neon-purple': '0 0 10px rgba(168, 85, 247, 0.5), 0 0 20px rgba(168, 85, 247, 0.3)',
        gaming: '0 4px 30px rgba(0, 0, 0, 0.5)',
      },
      spacing: {
        4.5: '1.125rem', 5.5: '1.375rem', 6.5: '1.625rem', 7.5: '1.875rem',
        8.5: '2.125rem', 9.5: '2.375rem', 10.5: '2.625rem', 11: '2.75rem',
        11.5: '2.875rem', 12.5: '3.125rem', 13: '3.25rem', 13.5: '3.375rem',
        14: '3.5rem', 14.5: '3.625rem', 15: '3.75rem', 15.5: '3.875rem',
        16: '4rem', 16.5: '4.125rem', 17: '4.25rem', 17.5: '4.375rem',
        18: '4.5rem', 18.5: '4.625rem', 19: '4.75rem', 21: '5.25rem',
        22: '5.5rem', 22.5: '5.625rem', 25: '6.25rem', 27.5: '6.875rem',
        29: '7.25rem', 30: '7.5rem', 31: '7.75rem', 34: '8.5rem',
        34.5: '8.625rem', 35: '8.75rem', 39: '9.75rem', 40: '10rem',
        44: '11rem', 45: '11.25rem', 46: '11.5rem', 50: '12.5rem',
        60: '15rem', 65: '16.25rem', 70: '17.5rem', 72.5: '18.125rem',
        90: '22.5rem', 94: '23.5rem', 100: '25rem',
      },
      maxWidth: {
        2.5: '0.625rem', 3: '0.75rem', 4: '1rem', 11: '2.75rem', 13: '3.25rem',
        14: '3.5rem', 15: '3.75rem', 22.5: '5.625rem', 25: '6.25rem',
        30: '7.5rem', 34: '8.5rem', 35: '8.75rem', 40: '10rem', 44: '11rem',
        45: '11.25rem', 60: '15rem', 70: '17.5rem', 90: '22.5rem',
      },
      zIndex: {
        999999: '999999', 99999: '99999', 9999: '9999', 999: '999', 99: '99', 1: '1',
      },
      animation: {
        glow: 'glow 2s ease-in-out infinite alternate',
        float: 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s linear infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.5), 0 0 10px rgba(0, 212, 255, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.8), 0 0 40px rgba(0, 212, 255, 0.4), 0 0 60px rgba(0, 212, 255, 0.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0a0a1a 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
