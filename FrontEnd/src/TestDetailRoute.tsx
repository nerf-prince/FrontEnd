import { useEffect, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { loadSubjectById } from './utils/subjectLoader'
import TestDetailPage from './TestDetailPage'

interface SubjectData {
  id: string
  anScolar: string
  sesiune: string
  [key: string]: any
}

function TestDetailRoute() {
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

  return (
    <TestDetailPage
      subject={subject}
      onNavigateBack={() => navigate('/')}
      onNavigateToLanding={() => navigate('/')}
      onStartTest={(subject) => {
        const subjectId = subject.id || `${subject.anScolar}-${subject.sesiune}`
        navigate(`/start/${subjectId}`)
      }}
    />
  )
}

export default TestDetailRoute
