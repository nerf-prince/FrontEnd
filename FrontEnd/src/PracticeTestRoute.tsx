import { useEffect, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { loadSubjectById } from './utils/subjectLoader'
import PracticeTestPage from './PracticeTestPage'
import type { SubjectData } from './interfaces/SubjectData'

function PracticeTestRoute() {
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

  return (
    <PracticeTestPage
      subject={subject}
      onNavigateBack={() => navigate(`/test/${subjectId}`)}
      onSubmit={(answers: any) => {
        console.log('Practice test answers submitted:', answers)
        // Navigate back to test details after submission
        navigate(`/test/${subjectId}`)
      }}
    />
  )
}

export default PracticeTestRoute

