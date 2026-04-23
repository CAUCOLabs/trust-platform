import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import AppPage from './pages/AppPage'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppPage />
  </StrictMode>
)
