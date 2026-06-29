/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm ivory / institutional paper backgrounds.
        ivory: { 50: '#fdfcf8', 100: '#faf7ef', 200: '#f3ede0', 300: '#e9e0cd' },
        // Deep teal — primary regulatory identity.
        teal: { DEFAULT: '#0d5c5c', dark: '#0a4747', light: '#0f6e6e', soft: '#e3f0ef' },
        // Royal blue — government authority.
        royal: { DEFAULT: '#1d4ed8', dark: '#1e3a8a', light: '#3b82f6', soft: '#e6edfb' },
        // Saffron / Ashoka accent.
        saffron: { DEFAULT: '#ea7317', light: '#f59e0b', deep: '#c2410c', soft: '#fdebd8' },
        // Emerald — compliance / approved.
        compliance: { DEFAULT: '#15803d', light: '#22c55e', soft: '#e4f4ea' },
        // Maroon / gold — statutory / regulatory seals.
        maroon: { DEFAULT: '#7c2d12', light: '#9a3412' },
        gold: { DEFAULT: '#b8860b', light: '#d4a72c', soft: '#f7eecb' },
        // Semantic ink text.
        ink: { DEFAULT: '#1c2733', soft: '#475569', muted: '#64748b' },
        risk: { low: '#15803d', medium: '#d97706', high: '#dc2626', integrity: '#9f1239' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,40,40,0.04), 0 12px 32px -16px rgba(13,92,92,0.22)',
        'card-lg': '0 2px 6px rgba(16,40,40,0.06), 0 24px 60px -28px rgba(13,92,92,0.28)',
        seal: '0 0 0 1px rgba(184,134,11,0.30), 0 10px 30px -12px rgba(124,45,18,0.25)',
        glow: '0 0 0 1px rgba(13,92,92,0.10), 0 14px 40px -18px rgba(13,92,92,0.40)',
      },
      backgroundImage: {
        'gov-aurora':
          'radial-gradient(55% 50% at 12% 0%, rgba(13,92,92,0.10), transparent 60%), radial-gradient(45% 45% at 92% 8%, rgba(29,78,216,0.10), transparent 60%), radial-gradient(50% 50% at 60% 100%, rgba(234,115,23,0.08), transparent 60%)',
        proforma:
          'linear-gradient(rgba(13,92,92,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(13,92,92,0.05) 1px, transparent 1px)',
        ashoka: 'radial-gradient(rgba(13,92,92,0.07) 1px, transparent 1.6px)',
        seal: 'conic-gradient(from 180deg, #b8860b, #d4a72c, #b8860b)',
      },
      backgroundSize: { proforma: '38px 38px', ashoka: '18px 18px' },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-7px)' } },
        scanline: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '12%': { opacity: '1' },
          '88%': { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        marker: { '0%,100%': { transform: 'scale(1)', opacity: '0.85' }, '50%': { transform: 'scale(1.35)', opacity: '0.35' } },
        stagepulse: { '0%,100%': { boxShadow: '0 0 0 0 rgba(13,92,92,0.45)' }, '50%': { boxShadow: '0 0 0 8px rgba(13,92,92,0)' } },
        fillrow: { '0%': { width: '0%' }, '100%': { width: '100%' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        scanline: 'scanline 3.2s ease-in-out infinite',
        marker: 'marker 2.2s ease-in-out infinite',
        stagepulse: 'stagepulse 2.4s ease-in-out infinite',
        fillrow: 'fillrow 1.1s ease-out forwards',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
};
