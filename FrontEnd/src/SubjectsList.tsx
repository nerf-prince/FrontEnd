import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSubjectId } from './utils/subjectLoader'

interface SubjectData {
  _id?: { $oid: string }
  AnScolar: string
  Sesiune: string
  [key: string]: any
}

function SubjectsList() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [filteredSubjects, setFilteredSubjects] = useState<SubjectData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedYear, setSelectedYear] = useState<string>('Toate')
  const [selectedSession, setSelectedSession] = useState<string>('Toate')

  const handleSubjectClick = (subject: SubjectData) => {
    const id = getSubjectId(subject)
    navigate(`/test/${id}`)
  }

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
          setFilteredSubjects(data)
        } else {
          // Dacă e obiect singular, wrapa-l într-un array
          setSubjects([data])
          setFilteredSubjects([data])
        }
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
    }

    fetchSubjects()
  }, [])

  // Filtrare când se schimbă dropdown-urile
  useEffect(() => {
    let filtered = subjects

    if (selectedYear !== 'Toate') {
      filtered = filtered.filter(subject => subject.AnScolar === selectedYear)
    }

    if (selectedSession !== 'Toate') {
      filtered = filtered.filter(subject => subject.Sesiune === selectedSession)
    }

    setFilteredSubjects(filtered)
  }, [selectedYear, selectedSession, subjects])

  // Extrage ani unici din subjects
  const uniqueYears = ['Toate', ...Array.from(new Set(subjects.map(s => s.AnScolar)))]
  const sessions = ['Toate', 'Toamna', 'Vara', 'Sesiune Speciala', 'Model']

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

      {/* Filtre (an + sesiune) */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Dropdown An Școlar */}
        <div className="flex-1">
          <label htmlFor="year-filter" className="block text-sm font-medium text-gray-700 mb-2">
            An Școlar
          </label>
          <select
            id="year-filter"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 cursor-pointer"
          >
            {uniqueYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown Sesiune */}
        <div className="flex-1">
          <label htmlFor="session-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Sesiune
          </label>
          <select
            id="session-filter"
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 cursor-pointer"
          >
            {sessions.map((session) => (
              <option key={session} value={session}>
                {session}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rezultate filtrate */}
      {filteredSubjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nu există subiecte pentru filtrele selectate.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => (
          <div
            key={subject._id?.$oid || subject.AnScolar + subject.Sesiune}
            className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 cursor-pointer hover:scale-[1.01] transform transition-all duration-300"
          >
            <div className="mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block">
                BAC
              </div>
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
                onClick={() => handleSubjectClick(subject)}
                className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Vezi subiectul →
              </button>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  )
}

export default SubjectsList
