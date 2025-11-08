import Header from './Header'

interface SubjectData {
  _id?: { $oid: string }
  AnScolar: string
  Sesiune: string
  Sub1?: any
  Sub2?: any
  Sub3?: any
  [key: string]: any
}

interface TestDetailPageProps {
  subject: SubjectData
  onNavigateBack: () => void
  onNavigateToLanding?: () => void
}
function TestDetailPage({ subject, onNavigateBack, onNavigateToLanding }: TestDetailPageProps) {
  const handleStartTest = () => {
    // TODO: Implement start test functionality
    console.log('Start test clicked')
  }

  const handlePracticeTest = () => {
    // TODO: Implement practice test functionality
    console.log('Practice test clicked')
  }

  const renderExercise = (exerciseData: any, exerciseKey: string) => {
    // Handle Sub1 exercises with Options
    if (exerciseData.Options) {
      const options = exerciseData.Options.split('$')
      return (
        <div key={exerciseKey} className="mb-6">
          <p className="text-base text-gray-700 mb-2">{exerciseData.Sentence}</p>
          <div className="ml-4 space-y-1">
            {options.map((option: string, idx: number) => (
              <p key={idx} className="text-sm text-gray-600">
                {String.fromCharCode(97 + idx)}) {option}
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
          {exerciseData.Sentence && (
            <p className="text-base text-gray-700 mb-3">{exerciseData.Sentence}</p>
          )}
          {exerciseData.Code && (
            <pre className="bg-gray-100 p-4 rounded-lg mb-3 text-sm overflow-x-auto">
              <code>{exerciseData.Code}</code>
            </pre>
          )}
          <div className="ml-4 space-y-2">
            {exerciseData.a && (
              <p className="text-sm text-gray-600">{exerciseData.a.Sentence}</p>
            )}
            {exerciseData.b && (
              <p className="text-sm text-gray-600">{exerciseData.b.Sentence}</p>
            )}
            {exerciseData.c && (
              <p className="text-sm text-gray-600">{exerciseData.c.Sentence}</p>
            )}
            {exerciseData.d && (
              <p className="text-sm text-gray-600">{exerciseData.d.Sentence}</p>
            )}
          </div>
        </div>
      )
    }

    // Handle simple exercises with just Sentence
    return (
      <div key={exerciseKey} className="mb-6">
        <p className="text-base text-gray-700">{exerciseData.Sentence}</p>
      </div>
    )
  }

  const renderSubject = (subjectKey: string) => {
    const subjectData = subject[subjectKey]
    if (!subjectData || typeof subjectData !== 'object') return null

    // Check if the subject uses the new array structure (Ex array) or old structure (Ex1, Ex2, etc.)
    const exercises = subjectData.Ex && Array.isArray(subjectData.Ex) 
      ? subjectData.Ex 
      : Object.keys(subjectData).filter(key => key.startsWith('Ex')).map(key => subjectData[key])

    if (!exercises || exercises.length === 0) return null

    // Convert Sub1, Sub2, Sub3 to "Subiectul 1", "Subiectul 2", "Subiectul 3"
    const subjectNumber = subjectKey.replace('Sub', '')
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
          Bacul din anul școlar {subject.AnScolar}, sesiunea de {subject.Sesiune}
        </h1>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <button
            onClick={handleStartTest}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300"
          >
            Start Test
          </button>
          <button
            onClick={handlePracticeTest}
            className="flex-1 bg-white text-blue-600 font-semibold py-4 px-6 rounded-xl border-2 border-blue-600 hover:bg-blue-50 transform hover:scale-[1.02] transition-all duration-300"
          >
            Exersează pe test
          </button>
        </div>

        {/* Subjects and exercises */}
        <div className="space-y-8">
          {['Sub1', 'Sub2', 'Sub3'].map(subKey => renderSubject(subKey))}
        </div>
      </div>
    </div>
  )
}

export default TestDetailPage

