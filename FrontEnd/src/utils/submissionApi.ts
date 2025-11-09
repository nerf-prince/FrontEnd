// API functions for submitting test answers

const API_BASE_URL = 'https://backend.nerfprince.soare.io/api'

interface SubmissionResponse {
  success: boolean
  message?: string
  data?: any
}

/**
 * Submit test answers to the API
 * @param answers - User answers in the format expected by the API (includes UserId and TestId)
 */
export async function submitTestAnswers(
  answers: any
): Promise<SubmissionResponse> {
  try {
    console.log('Submitting test answers:', answers)

    const response = await fetch(`${API_BASE_URL}/submission`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(answers)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Submission failed:', response.status, errorText)
      throw new Error(`Submission failed: ${response.status}`)
    }

    const data = await response.json()
    console.log('Submission successful:', data)

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Error submitting test answers:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Transform answers from internal format (camelCase) to API format (PascalCase)
 * This converts the form state to the format expected by the API
 */
export function transformAnswersToApiFormat(
  subject: any,
  formState: any,
  userId: string = ''
): any {
  const result: any = {
    UserId: userId,
    TestId: subject.id
  }

  // Transform Sub1 (multiple choice questions)
  if (subject.sub1 && formState.sub1) {
    result.Sub1 = {
      Ex: subject.sub1.ex.map((ex: any, idx: number) => {
        const exKey = `ex${idx + 1}`
        const userAnswer = formState.sub1[exKey] || ''

        return {
          Sentence: ex.sentence,
          QuestionNumber: ex.questionNumber,
          Answer: ex.answer,
          Options: ex.options,
          UserAnswer: userAnswer,
          Score: 0
        }
      })
    }
  }

  // Transform Sub2
  if (subject.sub2 && formState.sub2) {
    result.Sub2 = {}

    Object.keys(subject.sub2).forEach(exKey => {
      if (exKey.startsWith('ex')) {
        const ex = subject.sub2[exKey]
        const ExKey = exKey.charAt(0).toUpperCase() + exKey.slice(1) // ex1 -> Ex1

        result.Sub2[ExKey] = {
          Sentence: ex.sentence,
          Answer: ex.answer || '',
        }

        if (ex.code) {
          result.Sub2[ExKey].Code = ex.code
        }

        // Handle subpoints
        const hasParts = ex.a || ex.b || ex.c || ex.d

        if (hasParts) {
          ['a', 'b', 'c', 'd'].forEach(part => {
            if (ex[part]) {
              result.Sub2[ExKey][part] = {
                Sentence: ex[part].sentence,
                Answer: ex[part].answer,
                UserAnswer: formState.sub2?.[exKey]?.[part] || '',
                Score: 0
              }
            }
          })
        } else {
          result.Sub2[ExKey].UserAnswer = formState.sub2?.[exKey] || ''
          result.Sub2[ExKey].Score = 0
        }
      }
    })
  }

  // Transform Sub3
  if (subject.sub3 && formState.sub3) {
    result.Sub3 = {}

    Object.keys(subject.sub3).forEach(exKey => {
      if (exKey.startsWith('ex')) {
        const ex = subject.sub3[exKey]
        const ExKey = exKey.charAt(0).toUpperCase() + exKey.slice(1) // ex1 -> Ex1

        result.Sub3[ExKey] = {
          Sentence: ex.sentence,
          Answer: ex.answer,
          UserAnswer: formState.sub3?.[exKey] || '',
          Score: 0
        }
      }
    })
  }

  return result
}

