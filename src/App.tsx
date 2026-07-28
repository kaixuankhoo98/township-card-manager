import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { LoginPage } from './pages/LoginPage'
import { MembersPage } from './pages/MembersPage'
import { MemberPage } from './pages/MemberPage'
import { HistoryPage } from './pages/HistoryPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/members" element={<MembersPage />} />
        <Route path="/members/:name" element={<MemberPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/" element={<Navigate to="/members" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/members" replace />} />
    </Routes>
  )
}

export default App
