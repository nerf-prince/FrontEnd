import { useEffect, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { loadSubjectById } from './utils/subjectLoader'
import StartTestPage from './StartTestPage'

interface SubjectData {
  id: string
  anScolar: string
  sesiune: string
  [key: string]: any
}

function StartTestRoute() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [subject, setSubject] = useState<SubjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) {
      setError(true)
      setLoading(false)
      return
    }

    loadSubjectById(id)
      .then(data => {
        if (data) {
          setSubject(data)
        } else {
          setError(true)
        }
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !subject) {
    return <Navigate to="/" replace />
  }

  const subjectId = subject.id || `${subject.anScolar}-${subject.sesiune}`

  // Get current user for userId
  const getCurrentUserId = () => {
    const currentUserStr = localStorage.getItem('currentUser')
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr)
        return currentUser.id || ''
      } catch {
        return ''
      }
    }
    return ''
  }

  return (
    <StartTestPage
      subject={subject}
      onNavigateBack={() => navigate(`/test/${subjectId}`)}
      // @ts-ignore
      onNavigateToLanding={() => navigate('/')}
      userId={getCurrentUserId()}
      onSubmit={(answers) => {
        console.log('Submitted answers', answers)
        // Save results to localStorage for the results page
        localStorage.setItem(`test-results-${subjectId}`, JSON.stringify(answers))
        // Navigate to results page
        navigate(`/results/${subjectId}`)
      }}
    />
  )
}

export default StartTestRoute
