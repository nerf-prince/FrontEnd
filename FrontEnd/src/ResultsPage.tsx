import { useState, useEffect } from 'react'
import Header from './Header'
import { getSubmissionResults, calculateTotalScore } from './utils/submissionApi'

interface ResultsPageProps {
  submissionId: string
  onNavigateBack: () => void
}

function ResultsPage({ submissionId, onNavigateBack }: ResultsPageProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submission, setSubmission] = useState<Record<string, unknown> | null>(null)
  const [totalScore, setTotalScore] = useState<number>(0)

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      setError(null)

      const result = await getSubmissionResults(submissionId)

      if (result.success && result.data) {
        setSubmission(result.data)
        const score = calculateTotalScore(result.data)
        setTotalScore(score)
      } else {
        setError(result.message || 'Nu s-au putut încărca rezultatele')
      }

      setLoading(false)
    }

    if (submissionId) {
      fetchResults()
    }
  }, [submissionId])

  const renderScoreDetails = (data: Record<string, unknown> | null, prefix: string = ''): React.ReactElement[] => {
    if (!data || typeof data !== 'object') return []

    const elements: React.ReactElement[] = []

    for (const key in data) {
      const value = data[key]

      // Skip both 'Score' and 'score' as we handle them at parent level
      if ((key === 'Score' || key === 'score') && typeof value === 'number') {
        continue
      }

      if (typeof value === 'object' && value !== null) {
        const valueObj = value as Record<string, unknown>
        // Check if this object has a score property (case-insensitive)
        const scoreValue = valueObj.score ?? valueObj.Score

        if (typeof scoreValue === 'number') {
          const label = prefix ? `${prefix} - ${key}` : key
          elements.push(
            <div key={label} className="flex justify-between items-center py-2 px-4 bg-gray-50 rounded">
              <span className="font-medium">{label}</span>
              <span className={`font-bold ${scoreValue > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {scoreValue} puncte
              </span>
            </div>
          )

          // Recursively render nested items
          const nested = renderScoreDetails(valueObj, label)
          if (nested) elements.push(...nested)
        } else {
          // No score at this level, recurse deeper
          const nested = renderScoreDetails(valueObj, prefix ? `${prefix} - ${key}` : key)
          if (nested) elements.push(...nested)
        }
      }
    }

    return elements
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 via-white to-blue-50">
        <Header />
        <div className="max-w-4xl mx-auto py-12 px-6">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Se încarcă rezultatele...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 via-white to-blue-50">
        <Header />
        <div className="max-w-4xl mx-auto py-12 px-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Eroare</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={onNavigateBack}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Înapoi
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-white to-blue-50">
      <Header />
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Rezultatele Testului
          </h1>

          {/* Total Score Display */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 mb-8 text-center text-white">
            <p className="text-lg mb-2">Scor Total</p>
            <p className="text-6xl font-bold">{totalScore}</p>
            <p className="text-sm mt-2 opacity-90">puncte</p>
          </div>

          {/* Submission ID */}
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">ID Submisie:</span> {submissionId}
            </p>
            {submission?.TestId && (
              <p className="text-sm text-gray-600">
                <span className="font-semibold">ID Test:</span> {submission.TestId}
              </p>
            )}
            {submission?.UserId && (
              <p className="text-sm text-gray-600">
                <span className="font-semibold">ID Utilizator:</span> {submission.UserId}
              </p>
            )}
          </div>

          {/* Detailed Score Breakdown */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Detalii Punctaj</h2>
            <div className="space-y-2">
              {renderScoreDetails(submission)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <button
              onClick={onNavigateBack}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Înapoi la Lista de Teste
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultsPage

