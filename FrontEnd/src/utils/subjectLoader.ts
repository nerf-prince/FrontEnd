interface SubjectData {
  _id?: { $oid: string }
  AnScolar: string
  Sesiune: string
  [key: string]: any
}

let cachedSubjects: SubjectData[] | null = null

export async function loadAllSubjects(): Promise<SubjectData[]> {
  if (cachedSubjects) return cachedSubjects

  const response = await fetch('/Mock/ListaSubiecte.json')
  if (!response.ok) {
    throw new Error('Failed to fetch subjects')
  }
  const data = await response.json()
  
  // Verifică dacă data este array sau obiect singular
  cachedSubjects = Array.isArray(data) ? data : [data]
  return cachedSubjects
}

export async function loadSubjectById(id: string): Promise<SubjectData | null> {
  const subjects = await loadAllSubjects()
  return subjects.find(s => s._id?.$oid === id) || null
}

export function getSubjectId(subject: SubjectData): string {
  return subject._id?.$oid || `${subject.AnScolar}-${subject.Sesiune}`
}

/**
 * Converts \n characters in text to actual line breaks for rendering
 * Returns an array of text segments that can be rendered with <br/> between them
 */
export function parseNewlines(text: string | undefined | null): string[] {
  if (!text) return []
  return text.split('\n')
}

