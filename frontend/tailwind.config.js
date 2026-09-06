/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0f172a',    // slate-900 (deep navy text)
          dark: '#1e293b',    // slate-800
          slate: '#475569',   // slate-600
          accent: '#2563eb',  // blue-600 (restrained primary accent)
          bg: '#f8fafc',      // slate-50 (clean neutral background)
          card: '#ffffff',    // pure white cards
          success: '#10b981', // emerald-500
          warning: '#f59e0b', // amber-500
          danger: '#ef4444',  // red-500
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
