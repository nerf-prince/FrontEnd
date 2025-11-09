interface SubjectThreeExercise {
    Sentence?: string
    Answer?: string
    UserAnswer?: string
    Score: number
}

interface SubjectThreeAnswer {
    Ex1?: SubjectThreeExercise
    Ex2?: SubjectThreeExercise
    Ex3?: SubjectThreeExercise
}

export type { SubjectThreeAnswer, SubjectThreeExercise }
