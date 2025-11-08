import Header from './Header'
import SubjectsList from './SubjectsList'

interface SubjectData {
  _id?: { $oid: string }
  AnScolar: string
  Sesiune: string
  [key: string]: any
}

interface LandingPageProps {
  onNavigateToLogin: () => void
  onNavigateToTestDetail: (subject: SubjectData) => void
}

function LandingPage({ onNavigateToLogin, onNavigateToTestDetail }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header showLoginButton onNavigateToLogin={onNavigateToLogin} />
      
      <SubjectsList onNavigateToTestDetail={onNavigateToTestDetail} />

    </div>
  )
}

export default LandingPage

