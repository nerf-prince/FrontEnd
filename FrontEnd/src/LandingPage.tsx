import Header from './Header'
import SubjectsList from './SubjectsList'

interface LandingPageProps {
  onNavigateToLogin: () => void
  onNavigateToInterpretor?: () => void
}

function LandingPage({ onNavigateToLogin, onNavigateToInterpretor }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header 
        showLoginButton 
        showInterpretorButton
        onNavigateToLogin={onNavigateToLogin}
        onNavigateToInterpretor={onNavigateToInterpretor}
      />
      
      <SubjectsList />

    </div>
  )
}

export default LandingPage

