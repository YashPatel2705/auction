// src/App.jsx
// ─── Two routes: /admin and / (viewer) ───────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminPage   from './pages/AdminPage'
import ViewerPage  from './pages/ViewerPage'
import CaptainPage from './pages/CaptainPage'
import RegistrationPage from './pages/RegistrationPage'
import PayPage from './pages/PayPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<ViewerPage />} />
        <Route path="/admin"   element={<AdminPage />} />
        <Route path="/captain" element={<CaptainPage />} />
        <Route path="/registration" element={<RegistrationPage />} />
        <Route path="/pay" element={<PayPage />} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
