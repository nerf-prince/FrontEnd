import type { SubjectOneAnswer } from "./SubjectOneAnswer" 
import type { SubjectTwoAnswer } from "./SubjectTwoAnswer" 
import type { SubjectThreeAnswer } from "./SubjectThreeAnswer" 

interface UserAnswer {
    Sub1?: SubjectOneAnswer
    Sub2?: SubjectTwoAnswer
    Sub3?: SubjectThreeAnswer

}
export type { UserAnswer }