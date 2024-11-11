// import { defineConfig } from 'vite'
// import vue from '@vitejs/plugin-vue'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [vue()],
// })

// vite.config.js

import path from 'node:path'; // Import the path module
import { defineConfig } from 'vite'; // Import defineConfig from Vite
import vue from '@vitejs/plugin-vue'; // Import the Vue plugin for Vite

import tailwind from 'tailwindcss'; // Import Tailwind CSS
import autoprefixer from 'autoprefixer'; // Import Autoprefixer

export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwind(), autoprefixer()], // Configure PostCSS with Tailwind and Autoprefixer
    },
  },
  plugins: [vue()], // Use the Vue plugin
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Create an alias for the src directory
    },
  },
});