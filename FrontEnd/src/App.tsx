import { useState } from 'react'
import LandingPage from './LandingPage'
import LoginPage from './LoginPage'

type Page = 'landing' | 'login'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing')

  const navigateToLogin = () => {
    setCurrentPage('login')
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
        <LoginPage onNavigateBack={navigateToLanding} />
      )}
    </>
  )
}

export default App
