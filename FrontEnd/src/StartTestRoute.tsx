import { useEffect, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { loadSubjectById } from './utils/subjectLoader'
import StartTestPage from './StartTestPage'

interface SubjectData {
  _id?: { $oid: string }
  AnScolar: string
  Sesiune: string
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

  const subjectId = subject._id?.$oid || `${subject.AnScolar}-${subject.Sesiune}`

  return (
    <StartTestPage
      subject={subject}
      onNavigateBack={() => navigate(`/test/${subjectId}`)}
      onSubmit={(answers) => {
        console.log('Submitted answers', answers)
        navigate(`/test/${subjectId}`)
      }}
    />
  )
}

export default StartTestRoute
