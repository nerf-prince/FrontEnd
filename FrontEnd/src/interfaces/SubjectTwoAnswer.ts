interface SubQuestionPart {
    Sentence?: string
    Answer?: string
    UserAnswer?: string
    Score: number
}

interface SubjectTwoAnswer {
    Ex1: {
        Code?: string
        Sentence?: string
        a?: SubQuestionPart
        b?: SubQuestionPart
        c?: SubQuestionPart
        d?: SubQuestionPart
    }
    Ex2?: {
        Sentence?: string
        Answer?: string
        UserAnswer?: string
        Score: number
    }
    Ex3?: {
        Sentence?: string
        Answer?: string
        UserAnswer?: string
        Score: number
    }
}

export type { SubjectTwoAnswer, SubQuestionPart }
