const URL = 'https://api.openai.com/v1/chat/completions'

import { parser } from './parser.js'
import { evaluateNode } from './evaluator.js'
import { lexer } from './lexer.js'
export async function interpretor(sourceCode, outputToConsole, maxIterations, isAIassisted) {
    // Create a custom output function that handles newlines appropriately
    let buffer = '';
    const handleOutput = (text, addNewline = false) => {
        if (addNewline) {
            // When a newline is requested, output the buffer and then clear it
            outputToConsole(buffer, true);
            buffer = '';
        } else {
            // Add text to the buffer
            buffer += text;
        }
    };
    
    try {
        let tokens = lexer(sourceCode);
        let ast = parser(tokens);
        let variables = {};
        evaluateNode(ast, variables, handleOutput, maxIterations);
        // If there's anything left in the buffer at the end, output it
        if (buffer.length > 0) {
            outputToConsole(buffer, true);
        }
        return 0;
    } catch (err) {
        if (isAIassisted) {
            const refactoredCode = await refactorAllCode(sourceCode);
            sourceCode = refactoredCode;
            try {
                // Clear the output before running refactored code
                buffer = '';
                outputToConsole(""); // Clear the output

                let tokens = lexer(sourceCode);
                let ast = parser(tokens);
                let variables = {};
                evaluateNode(ast, variables, handleOutput, maxIterations);
                
                // Output any remaining buffer content
                if (buffer.length > 0) {
                    outputToConsole(buffer, true);
                }
                
                return sourceCode;
            } catch (err) {
                throw new Error(`${err.message} \n Refactored code: ${refactoredCode}`);
            }
        }
        else {
            throw err
        }
    }
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;


const refactorAllCode = async (code) => {
    const prompt = `Esti un asistent AI care are scopul de a asista elevii de liceu in interpretarea pseudocodului.
    Trebuie să reformatezi codul doar în cazul în care există erori de sintaxă. Nu modifica logica, nu înlocui expresii cu alternative „mai bune” sau „mai clare”. Dacă o expresie este validă și respectă sintaxa, păstreaz-o exact așa cum este.
    si interpretabil de catre un 'interpretor de pseudocod' scris in JavaScript.
    ---
    Iti voi furniza cateva exemple de coduri corecte si interpretabile, iar apoi iti voi da codul scris de utilizator.
    Trebuie doar sa raspunzi cu codul refacut, fara alte explicatii sau comentarii.

    Dacă un bloc de cod este indentat (cu spații sau tab-uri), atunci consideră că toate liniile indentate fac parte din acel bloc și înlocuiește-le cu un bloc delimitat de acolade. Astfel eviți interpretările greșite.
    ---
    EXEMPLE:

    1. Instrucțiunea de atribuire
    Variabilele pot fi atribuite cu un număr întreg sau rațional prin "=" sau "<-".

    a = 5
    b <- 3.14
    2. Instrucțiunea de citire
    Variabilele pot fi citite de la tastatură folosind instrucțiunea 'citeste'.

    citeste a, b, c
    citeste n
    3. Instrucțiunea de afișare
    Variabilele sau textul pot fi afișate în consolă folosind instrucțiunea 'scrie'. Pentru a trece pe rând nou se folosește '\n'.

    scrie "Hello, World!"
    scrie "a = ", a
    scrie x
    4. Expresii matematice
    Expresiile matematice pot fi evaluate folosind operatorii +, -, *, /, %, [], unde [] reprezintă partea întreagă.

    x = [x / 10]
    a <- 3 * (2 - 5)
    scrie x % 2
    5. Expresii booleene
    Expresiile booleene pot fi evaluate folosind operatorii <, >, <=, >=, = (==), !=, &&, ||, !. De asemenea, pot fi utilizate și cuvintele cheie 'si', 'sau', 'egal', 'diferit', 'not'.

    scrie 2 < 3
    n <- not 0 si 1
    scrie x != y
    6. Structuri de control
    Structurile de control pot fi utilizate pentru a controla fluxul programului.

    daca x < 0 atunci
        scrie "Negativ"
    altfel
        scrie "Pozitiv"
    Dacă structura conține mai multe instrucțiuni, acestea trebuie cuprinse între acolade și se poate omite cuvântul 'atunci'.

    daca x < 0 atunci {
        scrie "Negativ"
        x = -x
    }
    Instrucțiunea poate fi scrisă și mai compact.

    daca x % 2 = 0 atunci scrie x, " e par"
    altfel scrie x, " e impar"
    7. Structuri repetitive
    Pentru repetarea mai multor instrucțiuni, acestea trebuie cuprinse între acolade și se poate omite cuvântul 'executa'.

    Pentru:

    pentru i = 1, 10 executa scrie i, " "
    pentru i = 5, -5, -1 {
        scrie i
    }
    pentru i = 0, i < n, i = i + 2 executa
        x = x + 1
    Cât timp:

    cat timp n diferit 0 executa {
        cnt = cnt + 1
        n = [n / 10]
    }
    // Mai compact:
    cat timp n != 0 executa cnt = cnt + 1; n = [n / 10]
    scrie cnt
    Repetă până când:

    repeta
        x = x - 1
    pana cand x egal 5
    // Mai compact:
    repeta scrie x, " "; x = x - 1 pana cand x = 0
    ---
    Codul utilizatorului:
    ${code}
    ---
    Tine cont de urmatoarele:
    1.  Repet inca o data: Returneaza doar codul refacut, fara alte explicatii sau comentarii, fara nimic in plus in afara de codul refacut, gata sa fie interpretat.
    Nu returna codul markdown sau alte formate, doar codul refacut. Adica nu scrie javascript sau nimic de genul acesta. Doar codul refacut.

    2. De asemenea, ai grija ca codul returnat sa fie complet, adica sa nu lipseasca nimic, sa nu fie trunchiat, sa nu aiba erori de sintaxa sau de interpretare. Ai grija ca codul returnat sa fie corect si complet.
    
    3. Structura Daca:
    daca <expresie> atunci {
        <instructiuni>
    } altfel {
        <instructiuni>
    }
    
    4. Structura Cât timp:
    cat timp <expresie> executa {
        <instructiuni>
    }

    5. Structura Repetă până când:
    repeta {
        <instructiuni>
    } pana cand <expresie>

    6. Structura Pentru:
    pentru <variabila> = <expresie>, <expresie>, <expresie> executa {
        <instructiuni>
    }
    `

    const response = await fetch(URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: "gpt-4-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
        }),
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}


