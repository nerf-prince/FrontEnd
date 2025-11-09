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
): Promise<number> {
  try {
    const prompt = `Ești un evaluator strict pentru bacalaureatul la informatică.

ENUNȚ: ${exerciseData.Sentence || 'N/A'}
${exerciseData.Code ? `\nCOD:\n${exerciseData.Code}\n` : ''}

BAREM (Răspuns corect): ${exerciseData.Answer || 'N/A'}

SOLUȚIE ELEV: ${userAnswer}

PUNCTAJ MAXIM: ${maxPoints} puncte

Analizează soluția elevului comparativ cu baremul și acordă un punctaj între 0 și ${maxPoints}.
- Complet corect sau foarte aproape de barem: ${maxPoints} puncte
- Parțial corect (50-80% din cerințe): ${Math.floor(maxPoints * 0.5)}-${Math.floor(maxPoints * 0.8)} puncte
- Greșit sau foarte diferit: 0 puncte

IMPORTANT: Răspunde DOAR cu un singur număr întreg (punctajul), fără niciun alt text, explicație sau JSON.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Ești un evaluator obiectiv. Răspunde DOAR cu un singur număr întreg reprezentând punctajul. Nimic altceva."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 10
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '0';
    
    // Parse the number from response
    const score = parseInt(responseText, 10);
    
    if (isNaN(score)) {
      console.warn('AI returned non-numeric value:', responseText);
      return 0;
    }
    
    // Ensure score is within bounds
    return Math.min(Math.max(0, score), maxPoints);
  } catch (error) {
    console.error('Error evaluating with AI:', error);
    return 0;
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
                const score = await evaluateWithAI(ex, ex.UserAnswer, 10);
                ex.Score = score;
                ex.AIEvaluated = true;
            } else {
                ex.Score = 0;
                ex.AIEvaluated = false;
            }
        }
    }

    // Sub3: Use AI for evaluation
    if (userAnswer.Sub3?.Ex) {
        for (const ex of userAnswer.Sub3.Ex) {
            ex.Points = 15  // Set max points for each exercise
            if (ex.UserAnswer && ex.UserAnswer.trim() !== '') {
                const score = await evaluateWithAI(ex, ex.UserAnswer, 15);
                ex.Score = score;
                ex.AIEvaluated = true;
            } else {
                ex.Score = 0;
                ex.AIEvaluated = false;
            }
        }
    }

    return userAnswer;
}