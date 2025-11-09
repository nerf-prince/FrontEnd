export function firstSubjectChecker(userAnswer: any) {
    for (const ex of userAnswer.Sub1.Ex) {
        if (ex.UserAnswer == ex.Answer) {
            ex.Score = 5
        } else {
            ex.Score = 0
        }
    }
    return userAnswer

}