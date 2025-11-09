import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'dummy-key-for-development',
  dangerouslyAllowBrowser: true // Note: In production, you should use a backend proxy
});

export interface ExerciseContext {
  subject: string; // Sub1, Sub2, Sub3
  exerciseNumber: number;
  exerciseData: any;
  userAnswer?: string | Record<string, string>;
  subpoint?: string; // a, b, c, d
}

export async function generateExplanation(context: ExerciseContext): Promise<string> {
  try {
    const { subject, exerciseNumber, exerciseData, userAnswer, subpoint } = context;

    // Build the prompt based on context
    let prompt = `Ești un profesor de informatică pentru bacalaureat care explică rezolvările exercițiilor.\n\n`;

    // Add exercise context
    if (subject === 'Sub1') {
      prompt += `Subiectul I - Exercițiul ${exerciseNumber}\n`;
      prompt += `Întrebare: ${exerciseData.Sentence}\n`;
      if (exerciseData.Options) {
        const options = exerciseData.Options.split('$');
        prompt += `Opțiuni:\n`;
        options.forEach((opt: string, idx: number) => {
          const letter = String.fromCharCode(97 + idx);
          prompt += `${letter}) ${opt}\n`;
        });
      }
      if (userAnswer) {
        prompt += `\nRăspuns dat: ${userAnswer}\n`;
        prompt += `Răspuns corect: ${exerciseData.Answer}\n\n`;
        if (userAnswer === exerciseData.Answer) {
          prompt += `Explică de ce răspunsul "${userAnswer}" este corect și care este raționamentul.`;
        } else {
          prompt += `Explică de ce răspunsul corect este "${exerciseData.Answer}" și nu "${userAnswer}". Arată diferența dintre cele două răspunsuri și logica corectă.`;
        }
      } else {
        prompt += `\nNu există răspuns încă.\n`;
        prompt += `Răspuns corect: ${exerciseData.Answer}\n\n`;
        prompt += `Explică de ce răspunsul "${exerciseData.Answer}" este corect și cum se rezolvă acest tip de problemă.`;
      }
    } else if (subject === 'Sub2' || subject === 'Sub3') {
      prompt += `${subject === 'Sub2' ? 'Subiectul II' : 'Subiectul III'} - Exercițiul ${exerciseNumber}\n`;

      if (exerciseData.Sentence) {
        prompt += `Enunț: ${exerciseData.Sentence}\n`;
      }

      if (exerciseData.Code) {
        prompt += `\nCod:\n\`\`\`\n${exerciseData.Code}\n\`\`\`\n`;
      }

      if (subpoint) {
        const subpointData = exerciseData[subpoint];
        if (subpointData) {
          prompt += `\nSubpunctul ${subpoint}): ${subpointData.Sentence}\n`;
          prompt += `Răspuns corect: ${subpointData.Answer}\n`;

          if (userAnswer) {
            prompt += `\nRăspuns dat: ${userAnswer}\n\n`;
            prompt += `Compară cu răspunsul corect și explică diferențele sau confirmă corectitudinea. Oferă o scurtă justificare.`;
          } else {
            prompt += `\nNu există răspuns încă.\n\n`;
            prompt += `Explică cum se rezolvă acest subpunct și care este logica din spatele răspunsului corect.`;
          }
        }
      } else {
        // Whole exercise explanation
        if (exerciseData.Answer) {
          prompt += `\nRăspuns corect: ${exerciseData.Answer}\n`;
        }

        if (userAnswer) {
          prompt += `\nRăspuns dat: ${userAnswer}\n\n`;
          prompt += `Compară cu răspunsul corect și explică diferențele sau confirmă corectitudinea. Oferă o scurtă justificare.`;
        } else {
          prompt += `\nNu există răspuns încă.\n\n`;
          prompt += `Explică cum se rezolvă acest exercițiu și care este logica din spatele soluției corecte.`;
        }
      }
    }

    prompt += `\n\nRăspunde concis dar clar, în 4-5 propoziții. Oferă răspunsul corect și o scurtă explicație obiectivă. Nu folosi expresii precum "ai greșit" sau "ai ales corect", ci prezintă informația în mod neutru.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Ești un asistent de informatică. Răspunde concis și obiectiv, în 4-5 propoziții. Prezintă informația în mod neutru, fără să te adresezi direct utilizatorului."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 250
    });

    return completion.choices[0]?.message?.content || 'Nu s-a putut genera o explicație.';
  } catch (error) {
    console.error('Error generating explanation:', error);
    return 'Eroare la generarea explicației. Vă rugăm încercați din nou.';
  }
}

export async function generatePseudocodeInterpreter(context: ExerciseContext): Promise<string> {
  try {
    const { exerciseData, userAnswer } = context;

    let prompt = `Ești un interpreter de pseudocod pentru bacalaureatul la informatică.\n\n`;

    if (exerciseData.Code) {
      prompt += `Cod sursă:\n\`\`\`\n${exerciseData.Code}\n\`\`\`\n\n`;
    }

    if (exerciseData.d?.Sentence) {
      prompt += `Cerință: ${exerciseData.d.Sentence}\n`;
    }

    if (userAnswer) {
      prompt += `\nRăspuns dat:\n${userAnswer}\n\n`;
      prompt += `Analizează răspunsul și explică dacă este corect. Oferă o scurtă explicație despre cum funcționează interpretorul de pseudocod în acest context.`;
    } else {
      prompt += `\nNu există răspuns încă.\n\n`;
      prompt += `Explică cum funcționează interpretorul de pseudocod și cum se abordează acest exercițiu.`;
    }

    prompt += `\n\nRăspunde concis dar clar, în 4-5 propoziții. Oferă răspunsul corect și o scurtă explicație obiectivă. Nu folosi expresii precum "ai greșit" sau "ai ales corect", ci prezintă informația în mod neutru.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Ești un asistent de informatică. Răspunde concis și obiectiv, în 4-5 propoziții. Prezintă informația în mod neutru, fără să te adresezi direct utilizatorului."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 250
    });

    return completion.choices[0]?.message?.content || 'Nu s-a putut genera explicația pentru interpreter.';
  } catch (error) {
    console.error('Error generating pseudocode explanation:', error);
    return 'Eroare la generarea explicației. Vă rugăm încercați din nou.';
  }
}

