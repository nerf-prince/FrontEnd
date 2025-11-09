import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from './Header'
import { loadSubjectById } from './utils/subjectLoader'
import type { SubjectData } from './interfaces/SubjectData'

interface TestResultsPageProps {
  submittedAnswers?: any
}

function TestResultsPage({ submittedAnswers }: TestResultsPageProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [subject, setSubject] = useState<SubjectData | null>(null)
  const [answers, setAnswers] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load subject
        const loadedSubject = await loadSubjectById(id || '')
        if (loadedSubject) {
          setSubject(loadedSubject)
        }
        
        // Get answers from prop or localStorage
        if (submittedAnswers) {
          setAnswers(submittedAnswers)
        } else {
          const savedAnswers = localStorage.getItem(`test-results-${id}`)
          if (savedAnswers) {
            setAnswers(JSON.parse(savedAnswers))
          }
        }
      } catch (error) {
        console.error('Error loading test results:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, submittedAnswers])

  const calculateScore = () => {
    if (!answers) return { total: 0, obtained: 0 }
    
    let total = 0
    let obtained = 0

    // Calculate Sub1 score
    if (answers.Sub1?.Ex) {
      answers.Sub1.Ex.forEach((ex: any) => {
        total += ex.Points || 0
        obtained += ex.Score || 0
      })
    }

    // Calculate Sub2 score
    if (answers.Sub2?.Ex) {
      answers.Sub2.Ex.forEach((ex: any) => {
        total += ex.Points || 0
        obtained += ex.Score || 0
      })
    }

    // Calculate Sub3 score
    if (answers.Sub3?.Ex) {
      answers.Sub3.Ex.forEach((ex: any) => {
        total += ex.Points || 0
        obtained += ex.Score || 0
      })
    }

    return { total, obtained }
  }

  const renderSub1Results = () => {
    if (!answers?.Sub1?.Ex || !subject?.sub1) return null

    const exercises = answers.Sub1.Ex
    const subjectData = subject.sub1

    return (
      <div className="space-y-4">
        {exercises.map((ex: any, idx: number) => {
          const exerciseData = Array.isArray(subjectData.ex) 
            ? subjectData.ex[idx] 
            : (subjectData as any)[`ex${idx + 1}`]
          
          const isCorrect = ex.UserAnswer === ex.Answer
          const options = exerciseData?.options ? String(exerciseData.options).split('$') : []

          return (
            <div key={idx} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold">Exercițiul {idx + 1}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {ex.Score || 0} / {ex.Points || 0} puncte
                </span>
              </div>

              {exerciseData?.sentence && (
                <p className="text-gray-700 mb-3">{exerciseData.sentence}</p>
              )}

              <div className="space-y-2 ml-4">
                {options.map((opt: string, optIdx: number) => {
                  const letter = String.fromCharCode(97 + optIdx)
                  const isUserAnswer = ex.UserAnswer === letter
                  const isCorrectAnswer = ex.Answer === letter

                  let className = 'flex items-center gap-3 text-sm px-3 py-2 rounded'
                  if (isCorrectAnswer) {
                    className += ' bg-green-100 text-green-800 font-semibold'
                  } else if (isUserAnswer && !isCorrectAnswer) {
                    className += ' bg-red-100 text-red-700'
                  } else {
                    className += ' text-gray-600'
                  }

                  return (
                    <div key={optIdx} className={className}>
                      <span className="font-bold">{letter}.</span>
                      <span className="flex-1">{opt}</span>
                      {isCorrectAnswer && <span>✓</span>}
                      {isUserAnswer && !isCorrectAnswer && <span>✗</span>}
                    </div>
                  )
                })}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
                <p><strong>Răspunsul tău:</strong> {ex.UserAnswer || '-'}</p>
                <p><strong>Răspuns corect:</strong> {ex.Answer}</p>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderSub2Results = () => {
    if (!answers?.Sub2?.Ex) return null

    const exercises = answers.Sub2.Ex

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800 text-sm">
            ✨ Subiectul 2 a fost evaluat cu inteligență artificială
          </p>
        </div>

        {exercises.map((ex: any, idx: number) => {
          const score = ex.Score || 0
          const maxScore = 10
          const isCorrect = score === maxScore
          const isPartial = score > 0 && score < maxScore

          return (
            <div 
              key={idx}
              className={`bg-white rounded-lg p-5 shadow-sm border-2 ${
                isCorrect ? 'border-green-400' : isPartial ? 'border-yellow-400' : 'border-red-400'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold">Exercițiul {idx + 1}</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                  isCorrect ? 'bg-green-100 text-green-800' : 
                  isPartial ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {score}/{maxScore} puncte
                </div>
              </div>

              <div className="mt-3 space-y-2 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-semibold text-gray-700">Răspunsul tău:</p>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{ex.UserAnswer || '-'}</p>
                </div>
                
                <div className="bg-blue-50 p-3 rounded">
                  <p className="font-semibold text-blue-700">Barem (Răspuns corect):</p>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{ex.Answer || 'N/A'}</p>
                </div>

                {ex.AIEvaluated && (
                  <div className="bg-purple-50 p-3 rounded text-center">
                    <p className="text-purple-700 text-xs">
                      🤖 Evaluat automat cu inteligență artificială
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderSub3Results = () => {
    if (!answers?.Sub3?.Ex) return null

    const exercises = answers.Sub3.Ex

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800 text-sm">
            ✨ Subiectul 3 a fost evaluat cu inteligență artificială
          </p>
        </div>

        {exercises.map((ex: any, idx: number) => {
          const score = ex.Score || 0
          const maxScore = 15
          const isCorrect = score === maxScore
          const isPartial = score > 0 && score < maxScore

          return (
            <div 
              key={idx}
              className={`bg-white rounded-lg p-5 shadow-sm border-2 ${
                isCorrect ? 'border-green-400' : isPartial ? 'border-yellow-400' : 'border-red-400'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold">Exercițiul {idx + 1}</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                  isCorrect ? 'bg-green-100 text-green-800' : 
                  isPartial ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {score}/{maxScore} puncte
                </div>
              </div>

              <div className="mt-3 space-y-2 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-semibold text-gray-700">Răspunsul tău:</p>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{ex.UserAnswer || '-'}</p>
                </div>
                
                <div className="bg-blue-50 p-3 rounded">
                  <p className="font-semibold text-blue-700">Barem (Răspuns corect):</p>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{ex.Answer || 'N/A'}</p>
                </div>

                {ex.AIEvaluated && (
                  <div className="bg-purple-50 p-3 rounded text-center">
                    <p className="text-purple-700 text-xs">
                      🤖 Evaluat automat cu inteligență artificială
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header showLoginButton={false} />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  const score = calculateScore()
  const percentage = score.total > 0 ? (score.obtained / score.total) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header showLoginButton={false} onNavigateToLanding={() => navigate('/')} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Înapoi la pagina principală
        </button>

        {/* Score Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Rezultate Test
          </h1>
          
          {subject && (
            <p className="text-center text-gray-600 mb-6">
              {subject.anScolar} - {subject.sesiune}
            </p>
          )}

          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600">
                {score.obtained}
              </div>
              <div className="text-sm text-gray-600 mt-1">Puncte obținute</div>
            </div>
            <div className="text-4xl text-gray-400">/</div>
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-700">
                {score.total}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total puncte</div>
            </div>
          </div>

          <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                percentage >= 50 ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-center mt-2 text-sm text-gray-600">
            {percentage.toFixed(1)}% din punctaj
          </p>
        </div>

        {/* Detailed Results */}
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Subiectul 1</h2>
            {renderSub1Results()}
          </section>

          {answers?.Sub2 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Subiectul 2</h2>
              {renderSub2Results()}
            </section>
          )}

          {answers?.Sub3 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Subiectul 3</h2>
              {renderSub3Results()}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default TestResultsPage
