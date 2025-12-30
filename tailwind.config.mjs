/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // 夕方の街並みテーマカラー
        skyline: {
          dark: '#1a0533',
          purple: '#4a3a6a',
          orange: '#ff6b35',
          gold: '#ffb347',
          sun: '#ff7b00',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
