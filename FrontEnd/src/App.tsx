import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import LandingPage from './LandingPage'
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'
import TestDetailRoute from './TestDetailRoute'
import StartTestRoute from './StartTestRoute'

function App() {
  const navigate = useNavigate()

  const navigateToLogin = () => navigate('/login')
  const navigateToRegister = () => navigate('/register')
  const navigateToLanding = () => navigate('/')

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingPage onNavigateToLogin={navigateToLogin} />
        }
      />

      <Route
        path="/login"
        element={
          <LoginPage
            onNavigateBack={navigateToLanding}
            onNavigateToRegister={navigateToRegister}
            onNavigateToLanding={navigateToLanding}
          />
        }
      />

      <Route
        path="/register"
        element={
          <RegisterPage
            onNavigateBack={navigateToLanding}
            onNavigateToLogin={navigateToLogin}
            onNavigateToLanding={navigateToLanding}
          />
        }
      />

      <Route path="/test/:id" element={<TestDetailRoute />} />
      <Route path="/start/:id" element={<StartTestRoute />} />

      {/* Fallback: redirect unknown paths to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
