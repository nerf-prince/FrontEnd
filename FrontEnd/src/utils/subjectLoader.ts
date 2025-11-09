interface SubjectData {
  id: string
  anScolar: string
  sesiune: string
  [key: string]: any
}

// Use relative path for Vite proxy in dev, or adjust for production
const API_BASE_URL = '/api'
const FALLBACK_JSON = '/Mock/ListaSubiecte.json'

let cachedSubjects: SubjectData[] | null = null

export async function loadAllSubjects(): Promise<SubjectData[]> {
  if (cachedSubjects) return cachedSubjects

  try {
    console.log('Attempting to fetch from API:', `${API_BASE_URL}/exams`)
    const response = await fetch(`${API_BASE_URL}/exams`)

    if (!response.ok) {
      console.warn(`API returned status ${response.status}, trying fallback JSON`)
      throw new Error(`API returned status ${response.status}`)
    }

    const data = await response.json()
    console.log('API data received:', data)

    // Verifică dacă data este array sau obiect singular
    cachedSubjects = Array.isArray(data) ? data : [data]
    return cachedSubjects
  } catch (error) {
    console.warn('API fetch failed, falling back to local JSON:', error)

    // Fallback to local JSON
    try {
      const response = await fetch(FALLBACK_JSON)
      if (!response.ok) {
        throw new Error('Failed to fetch fallback JSON')
      }
      const data = await response.json()
      console.log('Fallback JSON loaded successfully')
      cachedSubjects = Array.isArray(data) ? data : [data]
      return cachedSubjects
    } catch (fallbackError) {
      console.error('Both API and fallback failed:', fallbackError)
      throw new Error('Failed to fetch subjects from both API and local JSON')
    }
  }
}

export async function loadSubjectById(id: string): Promise<SubjectData | null> {
  try {
    console.log('Attempting to fetch subject by ID from API:', id)
    const response = await fetch(`${API_BASE_URL}/exams/${id}`)
    if (!response.ok) {
      console.warn(`API returned status ${response.status} for subject ${id}, trying fallback`)
      throw new Error('Failed to fetch subject from API')
    }
    const data = await response.json()
    console.log('Subject data received from API:', data)
    return data
  } catch (error) {
    console.warn('API fetch failed for subject, falling back to local data:', error)

    // Fallback: load all subjects from local JSON and find the one with matching ID
    try {
      const subjects = await loadAllSubjects()
      const subject = subjects.find(s => {
        const subjectId = s.id || `${s.anScolar}-${s.sesiune}`
        return subjectId === id
      })

      if (subject) {
        console.log('Subject found in fallback data:', subject)
        return subject
      }

      console.error('Subject not found with ID:', id)
      return null
    } catch (fallbackError) {
      console.error('Failed to load subject from fallback:', fallbackError)
      return null
    }
  }
}

export function getSubjectId(subject: SubjectData): string {
  return subject.id || `${subject.anScolar}-${subject.sesiune}`
}

// Clear cache if needed (useful for development)
export function clearCache(): void {
  cachedSubjects = null
}
