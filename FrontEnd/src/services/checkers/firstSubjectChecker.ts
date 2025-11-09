import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'dummy-key-for-development',
  dangerouslyAllowBrowser: true
});

// Helper function to evaluate Sub2/Sub3 using AI
async function evaluateWithAI(
  exerciseData: any,
  userAnswer: string,
  maxPoints: number
): Promise<{ score: number; feedback: string }> {
  try {
    const prompt = `Ești un evaluator pentru bacalaureatul la informatică. Evaluează următorul răspuns:

ENUNȚ: ${exerciseData.Sentence || 'N/A'}
${exerciseData.Code ? `\nCOD:\n${exerciseData.Code}\n` : ''}

RĂSPUNS CORECT: ${exerciseData.Answer || 'N/A'}

RĂSPUNS ELEV: ${userAnswer}

PUNCTAJ MAXIM: ${maxPoints} puncte

Evaluează răspunsul elevului comparativ cu răspunsul corect. 
- Dacă răspunsul este complet corect sau foarte aproape: acordă punctajul maxim
- Dacă răspunsul este parțial corect: acordă punctaj proporțional (de ex. 50-80%)
- Dacă răspunsul este greșit sau complet diferit: acordă 0 puncte

Răspunde EXACT în formatul JSON:
{
  "score": <număr_puncte>,
  "feedback": "<explicație_scurtă_în_română>"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Ești un evaluator obiectiv. Răspunde DOAR cu JSON valid, fără text suplimentar."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 300
    });

    const responseText = completion.choices[0]?.message?.content || '{"score": 0, "feedback": "Eroare la evaluare"}';
    
    // Parse JSON response
    try {
      const result = JSON.parse(responseText);
      return {
        score: Math.min(Math.max(0, result.score), maxPoints), // Ensure score is within bounds
        feedback: result.feedback || 'N/A'
      };
    } catch {
      // If JSON parsing fails, try to extract score from text
      console.warn('Failed to parse AI response, defaulting to 0');
      return { score: 0, feedback: 'Eroare la parsarea răspunsului AI' };
    }
  } catch (error) {
    console.error('Error evaluating with AI:', error);
    return { score: 0, feedback: 'Eroare la evaluarea cu AI' };
  }
}

export async function firstSubjectChecker(userAnswer: any) {
    // Sub1: Each correct answer = 6 points
    if (userAnswer.Sub1?.Ex) {
        for (const ex of userAnswer.Sub1.Ex) {
            ex.Points = 6  // Set max points for each exercise
            if (ex.UserAnswer == ex.Answer) {
                ex.Score = 6
            } else {
                ex.Score = 0
            }
        }
    }

    // Sub2: Use AI for evaluation
    if (userAnswer.Sub2?.Ex) {
        for (const ex of userAnswer.Sub2.Ex) {
            ex.Points = 10  // Set max points for each exercise
            if (ex.UserAnswer && ex.UserAnswer.trim() !== '') {
                const evaluation = await evaluateWithAI(ex, ex.UserAnswer, 10);
                ex.Score = evaluation.score;
                ex.AIFeedback = evaluation.feedback;
            } else {
                ex.Score = 0;
                ex.AIFeedback = 'Răspuns lipsă';
            }
        }
    }

    // Sub3: Use AI for evaluation
    if (userAnswer.Sub3?.Ex) {
        for (const ex of userAnswer.Sub3.Ex) {
            ex.Points = 15  // Set max points for each exercise
            if (ex.UserAnswer && ex.UserAnswer.trim() !== '') {
                const evaluation = await evaluateWithAI(ex, ex.UserAnswer, 15);
                ex.Score = evaluation.score;
                ex.AIFeedback = evaluation.feedback;
            } else {
                ex.Score = 0;
                ex.AIFeedback = 'Răspuns lipsă';
            }
        }
    }

    return userAnswer;
}