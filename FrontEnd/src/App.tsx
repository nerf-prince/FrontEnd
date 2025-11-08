import { useState } from 'react'
import LandingPage from './LandingPage'
import LoginPage from './LoginPage'
import TestDetailPage from './TestDetailPage'

type Page = 'landing' | 'login' | 'testDetail'

interface SubjectData {
  _id?: { $oid: string }
  AnScolar: string
  Sesiune: string
  [key: string]: any
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing')
  const [selectedSubject, setSelectedSubject] = useState<SubjectData | null>(null)

  const navigateToLogin = () => {
    setCurrentPage('login')
  }

  const navigateToLanding = () => {
    setCurrentPage('landing')
    setSelectedSubject(null)
  }

  const navigateToTestDetail = (subject: SubjectData) => {
    setSelectedSubject(subject)
    setCurrentPage('testDetail')
  }

  return (
    <>
      {currentPage === 'landing' && (
        <LandingPage
          onNavigateToLogin={navigateToLogin}
          onNavigateToTestDetail={navigateToTestDetail}
        />
      )}
      {currentPage === 'login' && (
        <LoginPage onNavigateBack={navigateToLanding} />
      )}
      {currentPage === 'testDetail' && selectedSubject && (
        <TestDetailPage
          subject={selectedSubject}
          onNavigateBack={navigateToLanding}
        />
      )}
    </>
  )
}

export default App
