import type { SubjectOneAnswer } from "./SubjectOneAnswer" 
import type { SubjectTwoAnswer } from "./SubjectTwoAnswer" 
import type { SubjectThreeAnswer } from "./SubjectThreeAnswer" 

interface UserAnswer {
    sub1?: SubjectOneAnswer
    sub2?: SubjectTwoAnswer
    sub3?: SubjectThreeAnswer
}

export type { UserAnswer }