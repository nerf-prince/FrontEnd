import { useState } from 'react'
import LandingPage from './LandingPage'
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'

type Page = 'landing' | 'login' | 'register'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing')

  const navigateToLogin = () => {
    setCurrentPage('login')
  }

  const navigateToRegister = () => {
    setCurrentPage('register')
  }

  const navigateToLanding = () => {
    setCurrentPage('landing')
  }

  return (
    <>
      {currentPage === 'landing' && (
        <LandingPage onNavigateToLogin={navigateToLogin} />
      )}
      {currentPage === 'login' && (
        <LoginPage 
          onNavigateBack={navigateToLanding}
          onNavigateToRegister={navigateToRegister}
        />
      )}
      {currentPage === 'register' && (
        <RegisterPage 
          onNavigateBack={navigateToLanding}
          onNavigateToLogin={navigateToLogin}
        />
      )}
    </>
  )
}

export default App
