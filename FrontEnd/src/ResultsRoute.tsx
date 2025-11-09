import { useNavigate, useParams } from 'react-router-dom'
import ResultsPage from './ResultsPage'

function ResultsRoute() {
  const navigate = useNavigate()
  const { submissionId } = useParams<{ submissionId: string }>()

  const handleNavigateBack = () => {
    navigate('/')
  }

  if (!submissionId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 via-white to-blue-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">Eroare</h2>
          <p className="text-red-600">ID submisie lipsă</p>
          <button
            onClick={handleNavigateBack}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Înapoi
          </button>
        </div>
      </div>
    )
  }

  return (
    <ResultsPage
      submissionId={submissionId}
      onNavigateBack={handleNavigateBack}
    />
  )
}

export default ResultsRoute

