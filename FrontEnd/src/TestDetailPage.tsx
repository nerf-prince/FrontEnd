import Header from './Header'
import type { SubjectData } from './interfaces/SubjectData'


interface TestDetailPageProps {
  subject: SubjectData
  onNavigateBack: () => void
  onNavigateToLanding?: () => void
  onStartTest?: (subject: SubjectData) => void
}


function TestDetailPage({ subject, onNavigateBack, onNavigateToLanding, onStartTest }: TestDetailPageProps) {
  const handleStartTest = () => {
    if (onStartTest) onStartTest(subject)
    else console.warn('onStartTest handler not provided')
  }

  const handlePracticeTest = () => {
    // TODO: Implement practice test functionality
    console.log('Practice test clicked')
  }

  const renderExercise = (exerciseData: any, exerciseKey: string) => {
    // Handle Sub1 exercises with options
    if (exerciseData.options) {
      const options = exerciseData.options.split('$')
      return (
        <div key={exerciseKey} className="mb-6">
          <p className="text-base text-gray-700 mb-2">{exerciseData.sentence}</p>
          <div className="ml-4 space-y-1">
            {options.map((option: string, idx: number) => (
              <p key={idx} className="text-sm text-gray-600">
                <b>{String.fromCharCode(97 + idx)}.</b> {option}
              </p>
            ))}
          </div>
        </div>
      )
    }

    // Handle Sub2 exercises with subpoints (a, b, c, d)
    if (exerciseData.a || exerciseData.b || exerciseData.c || exerciseData.d) {
      return (
        <div key={exerciseKey} className="mb-6">
          {exerciseData.sentence && (
            <p className="text-base text-gray-700 mb-3">{exerciseData.sentence}</p>
          )}
          {exerciseData.code && (
            <pre className="bg-gray-100 p-4 rounded-lg mb-3 text-sm overflow-x-auto">
              <code>{exerciseData.code}</code>
            </pre>
          )}
          <div className="ml-4 space-y-2">
            {exerciseData.a && (
              <p className="text-sm text-gray-600">{exerciseData.a.sentence}</p>
            )}
            {exerciseData.b && (
              <p className="text-sm text-gray-600">{exerciseData.b.sentence}</p>
            )}
            {exerciseData.c && (
              <p className="text-sm text-gray-600">{exerciseData.c.sentence}</p>
            )}
            {exerciseData.d && (
              <p className="text-sm text-gray-600">{exerciseData.d.sentence}</p>
            )}
          </div>
        </div>
      )
    }

    // Handle simple exercises with just sentence
    return (
      <div key={exerciseKey} className="mb-6">
        <p className="text-base text-gray-700">{exerciseData.sentence}</p>
      </div>
    )
  }

  const renderSubject = (subjectKey: string) => {
    const subjectData = (subject as any)[subjectKey]
    if (!subjectData || typeof subjectData !== 'object') return null

    // Check if the subject uses the new array structure (ex array) or old structure (ex1, ex2, etc.)
    const exercises = subjectData.ex && Array.isArray(subjectData.ex)
      ? subjectData.ex
      : Object.keys(subjectData).filter(key => key.startsWith('ex')).map(key => subjectData[key])

    if (!exercises || exercises.length === 0) return null

    // Convert sub1, sub2, sub3 to "Subiectul 1", "Subiectul 2", "Subiectul 3"
    const subjectNumber = subjectKey.replace('sub', '')
    const subjectTitle = `Subiectul ${subjectNumber}`

    return (
      <div key={subjectKey} className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{subjectTitle}</h2>
        <div className="space-y-4">
          {exercises.map((exerciseData: any, index: number) => {
            // Exercise number is index + 1
            const exerciseNumber = index + 1
            const exerciseTitle = `Exercițiul ${exerciseNumber}`

            return (
              <div key={`ex-${index}`} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{exerciseTitle}</h3>
                {renderExercise(exerciseData, `ex-${index}`)}
              </div>
            )
          })}
        </div>
      </div>
    )
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header showLoginButton={false} onNavigateToLanding={onNavigateToLanding} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={onNavigateBack}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Înapoi la listă
        </button>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Bacul din anul școlar {subject.anScolar}, sesiunea de {subject.sesiune}
        </h1>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <button
            onClick={handleStartTest}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transform transition-all duration-300"
          >
            Start Test
          </button>
          <button
            onClick={handlePracticeTest}
            className="flex-1 bg-white text-blue-600 font-semibold py-4 px-6 rounded-xl border-2 border-blue-600 hover:bg-blue-50 transform transition-all duration-300"
          >
            Exersează pe test
          </button>
        </div>

        {/* Subjects and exercises */}
        <div className="space-y-8">
          {['sub1', 'sub2', 'sub3'].map(subKey => renderSubject(subKey))}
        </div>
      </div>
    </div>
  )
}



export default TestDetailPage



