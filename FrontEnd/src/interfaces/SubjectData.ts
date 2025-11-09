// New API format with camelCase properties
interface SubjectData {
  id: string
  anScolar: string
  sesiune: string
  sub1?: Sub1Data
  sub2?: Sub2Data
  sub3?: Sub3Data
  [key: string]: any // Allow dynamic property access
}

interface Sub1Data {
  ex: Sub1Exercise[]
}

interface Sub1Exercise {
  sentence: string
  questionNumber: number
  answer: string
  options: string // Format: "Option1$Option2$Option3$Option4"
}

interface Sub2Data {
  ex1?: Sub2Exercise
  ex2?: Sub2Exercise
  ex3?: Sub2Exercise
  [key: string]: Sub2Exercise | undefined
}

interface Sub2Exercise {
  sentence: string
  answer?: string
  code?: string
  a?: SubPoint
  b?: SubPoint
  c?: SubPoint
  d?: SubPoint
}

interface SubPoint {
  sentence: string
  answer: string
}

interface Sub3Data {
  ex1?: Sub3Exercise
  ex2?: Sub3Exercise
  ex3?: Sub3Exercise
  [key: string]: Sub3Exercise | undefined
}

interface Sub3Exercise {
  sentence: string
  answer: string
}

export type { SubjectData, Sub1Data, Sub1Exercise, Sub2Data, Sub2Exercise, Sub3Data, Sub3Exercise, SubPoint }
