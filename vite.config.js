import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Canonical / Open Graph base when `VITE_SITE_URL` is unset.
 * Override via env if you use www or a different deploy URL.
 */
const FALLBACK_SITE_URL = 'https://www.buildwithsatyam.in'
const FALLBACK_GA_ID = 'G-RGB7SXQS6T'

// [https://vitejs.dev/config/](https://vitejs.dev/config/)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.VITE_SITE_URL || FALLBACK_SITE_URL).trim().replace(/\/$/, '')
  const gaId = (env.VITE_GA_MEASUREMENT_ID || FALLBACK_GA_ID).trim()

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'html-site-url',
        transformIndexHtml(html) {
          return html
            .replaceAll('%SITE_URL%', siteUrl)
            .replaceAll('%GA_MEASUREMENT_ID%', gaId)
        },
      },
    ],
  }
})
