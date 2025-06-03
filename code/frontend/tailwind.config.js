// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

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
        glow: {
          '0%': { boxShadow: '0 0 5px #00fff7' },
          '100%': { boxShadow: '0 0 40px #00fff7' },
        },
        'float-smooth': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        glassFadeIn: {
          '0%': { opacity: '0', filter: 'blur(8px)' },
          '100%': { opacity: '1', filter: 'blur(0)' },
        },
      },
      animation: {
        'neon-flicker': 'neon-flicker 2s infinite ease-in-out',
        'glow-border': 'glow-border 3s infinite ease-in-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float-smooth': 'float-smooth 6s ease-in-out infinite',
        'glass-in': 'glassFadeIn 0.6s cubic-bezier(0.4,0,0.2,1) both',
        'shine': 'shine 1.2s linear infinite'
      },
      boxShadow: {
        'neon-yellow': '0 0 20px #ffb800, 0 0 40px #ffb80066',
        'neon-cyan': '0 0 30px #00fff7, 0 0 10px #00fff7'
      },
      colors: {
        'badge-gold': '#FFD700',
        'badge-silver': '#C0C0C0',
        'badge-bronze': '#cd7f32',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};