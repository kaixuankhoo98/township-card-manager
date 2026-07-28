import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { LoginPage } from './pages/LoginPage'
import { CatalogPage } from './pages/CatalogPage'
import { MyCollectionPage } from './pages/MyCollectionPage'
import { SendCardPage } from './pages/SendCardPage'
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
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/my-collection" element={<MyCollectionPage />} />
        <Route path="/send" element={<SendCardPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/" element={<Navigate to="/catalog" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/catalog" replace />} />
    </Routes>
  )
}

export default App
