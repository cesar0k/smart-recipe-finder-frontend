import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React + router — cached long-term, rarely changes
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Data layer — React Query + axios
          'vendor-data': ['@tanstack/react-query', 'axios'],
          // UI primitives — Radix + lucide icons
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-label',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
          ],
          // i18n — translations + detection
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          // Forms — zod + react-hook-form
          'vendor-forms': ['zod', 'react-hook-form', '@hookform/resolvers'],
          // Motion / animation library — only used in a handful of components,
          // keep separate so initial page bundle stays lean.
          'vendor-motion': ['framer-motion'],
        },
      },
    },
  },
})
