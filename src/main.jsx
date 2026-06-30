import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SmoothScroll } from './SmoothScroll.jsx'
import { Analytics } from './components/Analytics.jsx'
import { SiteLoader } from './components/SiteLoader.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SmoothScroll>
      <Analytics />
      <SiteLoader>
        <App />
      </SiteLoader>
    </SmoothScroll>
  </StrictMode>,
)
