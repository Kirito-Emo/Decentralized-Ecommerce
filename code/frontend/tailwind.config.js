// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi
// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      keyframes: {
        'neon-flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'glow-border': {
          '0%, 100%': { boxShadow: '0 0 6px #0ff, 0 0 12px #0ff' },
          '50%': { boxShadow: '0 0 12px #0ff, 0 0 24px #0ff' },
        },
        'float-smooth': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      },
      animation: {
        'neon-flicker': 'neon-flicker 2s infinite ease-in-out',
        'glow-border': 'glow-border 3s infinite ease-in-out',
        'float-smooth': 'float-smooth 6s ease-in-out infinite',
        'shine': 'shine 1.2s linear infinite'
      },
      boxShadow: {
        neon: '0 0 6px #0ff, 0 0 12px #0ff',
        'neon-md': '0 0 12px #0ff, 0 0 24px #0ff'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};