import { useState, useEffect } from 'react'

interface SubjectData {
  _id?: { $oid: string }
  AnScolar: string
  Sesiune: string
  [key: string]: any
}

interface SubjectsListProps {
  onNavigateToTestDetail: (subject: SubjectData) => void
}

function SubjectsList({ onNavigateToTestDetail }: SubjectsListProps) {
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch('/Mock/ListaSubiecte.json')
        if (!response.ok) {
          throw new Error('Failed to fetch subjects')
        }
        const data = await response.json()
        
        // Verifică dacă data este array sau obiect singular
        if (Array.isArray(data)) {
          setSubjects(data)
        } else {
          // Dacă e obiect singular, wrapa-l într-un array
          setSubjects([data])
        }
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
    }

    fetchSubjects()
  }, [])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <p className="font-medium">Eroare la încărcarea subiectelor</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Subiecte BAC disponibile:</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <div
            key={subject._id?.$oid || subject.AnScolar + subject.Sesiune}
            className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 cursor-pointer hover:scale-[1.01] transform transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                BAC
              </div>
              <svg 
                className="w-5 h-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 5l7 7-7 7" 
                />
              </svg>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 font-medium">An Școlar</p>
                <p className="text-2xl font-bold text-gray-900">{subject.AnScolar}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 font-medium">Sesiune</p>
                <p className="text-lg font-semibold text-blue-600">{subject.Sesiune}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => onNavigateToTestDetail(subject)}
                className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Vezi subiectul →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SubjectsList
