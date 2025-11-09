// Represents the Sub1 structure where exercises are stored under an `Ex` array.
interface SubjectOneAnswerItem {
    Sentence?: string
    QuestionNumber?: number
    // Correct answer (a|b|c|d) as provided by the test data
    Answer?: string
    // Options joined by '$', e.g. "Opt1$Opt2$Opt3$Opt4"
    Options?: string
    // The user's answer (free text or one of 'a'|'b'|'c'|'d')
    UserAnswer?: string
    // Numeric score for this exercise
    Score: number
}

interface SubjectOneAnswer {
    Ex: SubjectOneAnswerItem[]
}

export type { SubjectOneAnswer, SubjectOneAnswerItem }
