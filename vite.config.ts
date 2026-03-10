import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Rep Ledger',
        short_name: 'RepLedger',
        description: 'Workout tracker PWA',
        theme_color: '#c8ff00',
        background_color: '#0e0e0e',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/favicon.ico', type: 'image/x-icon', sizes: '16x16 32x32', purpose: 'any' },
          { src: '/android-chrome-192x192.png', type: 'image/png', sizes: '192x192', purpose: 'any' },
          { src: '/android-chrome-512x512.png', type: 'image/png', sizes: '512x512', purpose: 'any' },
          { src: '/android-chrome-192x192.png', type: 'image/png', sizes: '192x192', purpose: 'maskable' },
          { src: '/android-chrome-512x512.png', type: 'image/png', sizes: '512x512', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
