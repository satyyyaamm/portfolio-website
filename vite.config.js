import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Canonical / Open Graph base when `VITE_SITE_URL` is unset.
 * Override in `.env` if your live URL differs (custom domain, different repo name, etc.).
 */
const FALLBACK_SITE_URL = 'https://satyyyaamm.github.io/my-portfolio'

// [https://vitejs.dev/config/](https://vitejs.dev/config/)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.VITE_SITE_URL || FALLBACK_SITE_URL).trim().replace(/\/$/, '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'html-site-url',
        transformIndexHtml(html) {
          return html.replaceAll('%SITE_URL%', siteUrl)
        },
      },
    ],
  }
})
