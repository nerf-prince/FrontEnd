import Header from './Header'
import type { SubjectData } from './interfaces/SubjectData'


interface TestDetailPageProps {
  subject: SubjectData
  submission?: any
  onNavigateBack: () => void
  onNavigateToLanding?: () => void
  onStartTest?: (subject: SubjectData) => void
}


function TestDetailPage({ subject, submission, onNavigateBack, onNavigateToLanding, onStartTest }: TestDetailPageProps) {
  const handleStartTest = () => {
    if (onStartTest) onStartTest(subject)
    else console.warn('onStartTest handler not provided')
  }

  const handlePracticeTest = () => {
    // TODO: Implement practice test functionality
    console.log('Practice test clicked')
  }

  const renderExercise = (exerciseData: any, exerciseKey: string, exerciseIndex: number, submissionForSubject?: any) => {
    // small helpers to support different JSON casings (Score vs score, UserAnswer vs userAnswer)
    const getScoreFrom = (obj: any) => {
      if (!obj) return undefined
      return obj.Score ?? obj.score ?? undefined
    }

    const getUserAnswerFrom = (obj: any) => {
      if (!obj) return undefined
      return obj.UserAnswer ?? obj.userAnswer ?? undefined
    }

    const getCorrectAnswerFrom = (obj: any) => {
      if (!obj) return undefined
      return obj.Answer ?? obj.answer ?? undefined
    }
    const getFeedbackFrom = (obj: any) => {
      if (!obj) return undefined
      return obj.Feedback ?? obj.feedback ?? obj.Comment ?? obj.comment ?? undefined
    }
    // Handle Sub1 exercises with options
    if (exerciseData.options) {
      const options = exerciseData.options.split('$')
      // submissionForSubject should be the array of submitted Ex objects for Sub1
      const submittedEx = submissionForSubject ? submissionForSubject[exerciseIndex] : null

      return (
        <div key={exerciseKey} className="mb-6">
          <p className="text-base text-gray-700 mb-2">{exerciseData.sentence}</p>
          <div className="ml-4 space-y-2">
            {options.map((option: string, idx: number) => {
              const letter = String.fromCharCode(97 + idx)
              const userAns = getUserAnswerFrom(submittedEx)
              const correctAns = getCorrectAnswerFrom(submittedEx)
              const score = getScoreFrom(submittedEx)
              const isUserSelected = userAns === letter
              const isCorrect = correctAns === letter

              // priority: correct answer should be green; if user selected wrong answer show red
              let classes = 'text-sm px-2 py-1 rounded'
              if (isCorrect) {
                classes += ' bg-green-100 text-green-800 font-semibold'
              } else if (isUserSelected && score === 0) {
                classes += ' bg-red-100 text-red-700'
              } else if (isUserSelected && score === 5) {
                classes += ' bg-green-100 text-green-800 font-semibold'
              } else {
                classes += ' text-gray-600'
              }

              return (
                <div key={idx} className={`flex items-start gap-3 ${classes}`}>
                  <span className="font-bold">{letter}.</span>
                  <span className="flex-1">{option}</span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    // Handle Sub2 exercises with subpoints (a, b, c, d)
    if (exerciseData.a || exerciseData.b || exerciseData.c || exerciseData.d) {
      // For submission data, submissionForSubject is expected to be an object like { Ex1: {...}, Ex2: {...} }
      const ExKey = `Ex${exerciseIndex + 1}`
      const submittedThis = submissionForSubject ? submissionForSubject[ExKey] : undefined

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
            {['a', 'b', 'c', 'd'].map(part => (
              exerciseData[part] ? (
                <div key={part} className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{exerciseData[part].sentence}</p>
                  {/* show part score if available (do NOT show answer key) */}
                  {(() => {
                    const partScore = submittedThis && submittedThis[part] ? getScoreFrom(submittedThis[part]) : undefined
                    const partFeedback = submittedThis && submittedThis[part] ? getFeedbackFrom(submittedThis[part]) : undefined
                    const badgeClasses = typeof partScore === 'number' ? (partScore === 5 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700') : 'bg-gray-100 text-gray-700'
                    return (
                      <div className="ml-4 flex flex-col items-end gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${badgeClasses}`}>
                          {typeof partScore === 'number' ? `Scor: ${partScore}` : 'Scor: -'}
                        </span>
                        <div className="w-56 max-w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1">
                          {partFeedback ?? 'Fără feedback'}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              ) : null
            ))}
          </div>
        </div>
      )
    }

    // Handle simple exercises with just sentence
    // For simple exercises (no subparts) we can show the score (if available) next to the sentence
    const ExKey = `Ex${exerciseIndex + 1}`
    const submittedThis = submissionForSubject ? submissionForSubject[ExKey] : undefined
  const scoreDisplay = getScoreFrom(submittedThis)

    return (
      <div key={exerciseKey} className="mb-6">
        <div className="flex items-start justify-between">
          <p className="text-base text-gray-700">{exerciseData.sentence}</p>
          <div className="ml-4 flex flex-col items-end gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${typeof scoreDisplay === 'number' ? (scoreDisplay === 5 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700') : 'bg-gray-100 text-gray-700'}`}>
              {typeof scoreDisplay === 'number' ? `Scor: ${scoreDisplay}` : 'Scor: -'}
            </span>
            <div className="w-56 max-w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1">
              {getFeedbackFrom(submittedThis) ?? 'Fără feedback'}
            </div>
          </div>
        </div>
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

            // pick submission data for this subject (handle API PascalCase and local camelCase)
            let submissionForSubject = undefined
            if ((submission as any)) {
              const s = submission as any
              if (subjectKey === 'sub1') {
                // Sub1 uses an array under Sub1.Ex in the API sample
                submissionForSubject = s.Sub1?.Ex || s.sub1?.ex || s.Sub1 || s.sub1
              } else if (subjectKey === 'sub2') {
                // Sub2 uses Ex1/Ex2/Ex3 keys (PascalCase from API) or sub2.ex1 (camelCase)
                submissionForSubject = s.Sub2 || s.sub2
              } else if (subjectKey === 'sub3') {
                submissionForSubject = s.Sub3 || s.sub3
              }
            }

            return (
              <div key={`ex-${index}`} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{exerciseTitle}</h3>
                {renderExercise(exerciseData, `ex-${index}`, index, submissionForSubject)}
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



