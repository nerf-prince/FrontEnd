interface SubjectData {
  _id?: { $oid: string }
  AnScolar: string
  Sesiune: string
  Sub1?: any
  Sub2?: any
  Sub3?: any
  [key: string]: any
}




export type { SubjectData }