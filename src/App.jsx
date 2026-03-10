// src/App.jsx
// ─── Two routes: /admin and / (viewer) ───────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminPage  from './pages/AdminPage'
import ViewerPage from './pages/ViewerPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<ViewerPage />} />
        <Route path="/admin"  element={<AdminPage />} />
        <Route path="*"       element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
