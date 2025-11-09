import type { SubjectOneAnswer } from "./SubjectOneAnswer"
import type { SubjectTwoAnswer } from "./SubjectTwoAnswer"
import type { SubjectThreeAnswer } from "./SubjectThreeAnswer"

// Top-level structure matching the example JSON
interface UserAnswer {
    _id?: { $oid: string }
    UserId?: string
    TestId?: string
    Sub1?: SubjectOneAnswer
    Sub2?: SubjectTwoAnswer
    Sub3?: SubjectThreeAnswer
}

export type { UserAnswer }