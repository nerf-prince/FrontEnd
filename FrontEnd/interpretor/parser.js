import { Token } from './lexer.js'

class Node {
    constructor(type, value = null, children = []) {
        this.type = type
        this.value = value
        this.children = children
    }
    addChild(node) {
        this.children.push(node)
    }
    setChildren(children) {
        this.children = children
    }
    setValue(value) {
        this.value = value
    }
    setType(type) {
        this.type = type
    }
}

class ifNode{
    constructor(condition, thenBlock, elseBlock = null) {
        this.condition = condition
        this.thenBlock = thenBlock
        this.elseBlock = elseBlock
    }
}

class whileNode {
    constructor(condition, block) {
        this.condition = condition
        this.block = block
    }
}

class forNode {
    constructor(init, condition, increment, block) {
        this.init = init
        this.condition = condition
        this.increment = increment
        this.block = block
    }
}

function eatNewlines(tokens) {
    while (tokens.length > 0 && tokens[0].type === 'NEWLINE') {
        tokens.shift()
    }
}

export function parser(tokens) {
    let instructions = []

    while ( tokens.length > 0 && tokens[0].type !== 'EOF' ) {
        let currToken = tokens.shift()
        switch ( currToken.type ) {
            case 'KEYWORD':
                if ( currToken.value === 'citeste' ) {
                    let vars = []
                    while ( tokens.length > 0 && (tokens[0].type !== 'NEWLINE' && tokens[0].type !== 'EOF') ) {
                        vars.push(tokens.shift())
                    }
                    for ( let i = 0; i < vars.length; i++ ) {
                        if ( vars[i].type === 'IDENTIFIER') {
                            instructions.push(new Node('INPUT', vars[i].value))
                        }
                        else if ( vars[i].type === 'COMMA' ) {
                            continue
                        }
                        else {
                            throw new Error('Variabila invalida')
                        }
                    }
                }
                else if ( currToken.value === 'scrie' ) {
                    let vars = []
                    while ( tokens.length > 0 && (tokens[0].type !== 'NEWLINE' && tokens[0].type !== 'EOF' && tokens[0].type !== 'RBRACE') ) {
                        vars.push(tokens.shift())
                    }
                    for ( let i = 0; i < vars.length; i++ ) {
                        if ( vars[i].type === 'IDENTIFIER' && ( i === vars.length - 1 || vars[i + 1].type === 'COMMA' ) ) {
                            instructions.push(new Node('OUTPUT', vars[i].value))
                        }
                        else if ( vars[i].type === 'STRING' ) {
                            instructions.push(new Node('OUTPUTSTR', vars[i].value))
                        }
                        else if (vars[i].type === 'COMMA') {
                            continue
                        }
                        else {
                            let expression = []
                            let valid_expression = false
                            while (i < vars.length && vars[i].type !== 'COMMA' && vars[i].type !== 'NEWLINE' && vars[i].type !== 'EOF' && vars[i].type !== 'RBRACE' && vars[i].type !== 'LBRACE' && vars[i].type !== 'KEYWORD') {
                                if (vars[i].value === '=') {
                                    valid_expression = true
                                    expression.push(new Token('OPERATOR', 'egal'))
                                    i ++
                                    continue
                                }
                                // Consider any token with a value as potentially valid
                                if (vars[i].type === 'OPERATOR' || vars[i].type === 'NUMBER' || 
                                    vars[i].type === 'IDENTIFIER' || vars[i].type === 'LPAREN' || 
                                    vars[i].type === 'RPAREN' || vars[i].type === 'LBRACKET' || 
                                    vars[i].type === 'RBRACKET') {
                                    valid_expression = true
                                }
                                expression.push(vars[i])
                                i ++
                            }
                            i--; // Adjust for loop increment
                            if (valid_expression || expression.length === 1) {
                                let postfixExpression = shuntingYard(expression)
                                instructions.push(new Node('OUTPUTEXP', postfixExpression))
                            }
                            else {
                                throw new Error('Expresie invalida la scriere')
                            }
                        }
                    }
                    instructions.push(new Node('NEWLINE'));
                }
                else if ( currToken.value === 'daca' ) {
                    let {condition, thenBlock, elseBlock} = parseDaca(tokens)
                    let thenNode = null, elseNode = null
                    if ( thenBlock ) {
                        thenBlock.push(new Token('EOF', null))
                        thenNode = parser(thenBlock)
                    }
                    if ( elseBlock ) {
                        elseBlock.push(new Token('EOF', null))
                        elseNode = parser(elseBlock)
                    }
                    let postFixCondition = shuntingYard(condition)
                   // console.log(postFixCondition)
                    let IFNode = new ifNode(postFixCondition, thenNode, elseNode)
                    instructions.push(new Node('IF', IFNode))
                }
                else if ( currToken.value === 'cat timp' ) {
                    // Cazul in care avem un while
                    let {condition, thenBlock} = parseCatTimp(tokens)

                    let thenNode = null
                    if ( thenBlock ) {
                        thenBlock.push(new Token('EOF', null))
                        thenNode = parser(thenBlock)
                    }
                    let postFixCondition = shuntingYard(condition)

                    let WHILENode = new whileNode(postFixCondition, thenNode)
                    instructions.push(new Node('WHILE', WHILENode))
                }
                else if ( currToken.value === 'pentru' ) {
                    // Cazul in care avem un for
                    let {condition, thenBlock} = parsePentru(tokens)

                    // Parsam conditia 
                    let init = [], cond = [], inc = []
                    while (condition.length > 0 && condition[0].type !== 'COMMA' && condition[0].type !== 'NEWLINE') {
                        init.push(condition.shift())
                    }
                    condition.shift() // Sari peste ,
                    while (condition.length > 0 && condition[0].type !== 'COMMA' && condition[0].type !== 'NEWLINE') {
                        cond.push(condition.shift())
                    }
                    condition.shift() // Sari peste ,
                    while (condition.length > 0) {
                        inc.push(condition.shift())
                    }

                    // Mai intai gasim variabila la care se refera for-ul
                    let varName = null
                    for ( let tk of init ) {
                        if (tk.type === 'IDENTIFIER') {
                            varName = tk.value
                            break
                        }
                    }
                    // Gasim expresia de initializare
                    let initExp = []
                    for ( let i = 0; i < init.length; i++ ) {
                        if ( init[i].type === 'ASSIGN' ) {
                            i ++
                            while ( i < init.length && init[i].type !== 'COMMA' ) {
                                initExp.push(init[i])
                                i ++
                            }
                            break
                        }
                    }

                    let tipFor = 'crescator'

                    // Acum parsam incrementarea si o "aranjam" daca nu exista sau daca are un singur element
                    if (inc.length === 0) {
                        // Daca nu avem incrementare, atunci incrementarea este cu 1
                        let newInc = []
                        newInc.push(new Token('IDENTIFIER', varName))
                        newInc.push(new Token('ASSIGN', '='))
                        newInc.push(new Token('IDENTIFIER', varName))
                        newInc.push(new Token('OPERATOR', '+'))
                        newInc.push(new Token('NUMBER', '1'))
                        inc = newInc
                    }
                    else if (inc.length === 1) {
                        // Daca avem doar un element, il aduna la variabila
                        if ( inc[0].type === 'NUMBER' && parseFloat(inc[0].value) < 0 ) {
                            tipFor = 'descrescator'
                        }
                        let newInc = []
                        newInc.push(new Token('IDENTIFIER', varName))
                        newInc.push(new Token('ASSIGN', '='))
                        newInc.push(new Token('IDENTIFIER', varName))
                        newInc.push(new Token('OPERATOR', '+'))
                        newInc.push(inc[0])
                        inc = newInc
                    }


                    // Parsam si "aranjam" conditia, daca are un singur element
                    if ( cond.length === 1 ) {
                        let newCond = []
                        newCond.push(new Token('IDENTIFIER', varName))
                        if ( tipFor === 'crescator' ) {
                            newCond.push(new Token('OPERATOR', '<='))
                        }
                        else {
                            newCond.push(new Token('OPERATOR', '>='))
                        }
                        newCond.push(cond[0])
                        cond = newCond
                    }

                    init.push(new Token('EOF', null))
                    cond.push(new Token('EOF', null))
                    inc.push(new Token('EOF', null))
                    thenBlock.push(new Token('EOF', null))
                    const initNode = new Node('ASSIGNMENT', varName, shuntingYard(initExp))
                    const postFixCondition = shuntingYard(cond)
                    const incNode = parser(inc)
                    const thenNode = parser(thenBlock)
                    const FORNode = new forNode(initNode, postFixCondition, incNode, thenNode)
                    instructions.push(new Node('FOR', FORNode))
                }
                else if ( currToken.value === 'repeta' ) {
                    // Cazul in care avem un do-while
                    let {condition, thenBlock} = parseRepeta(tokens)

                    let thenNode = null
                    if ( thenBlock ) {
                        thenBlock.push(new Token('EOF', null))
                        thenNode = parser(thenBlock)
                    }
                    let postFixCondition = shuntingYard(condition)

                    let DO_WHILENode = new whileNode(postFixCondition, thenNode)
                    instructions.push(new Node('DO-WHILE', DO_WHILENode))
                }
            case 'IDENTIFIER':
                let varName = currToken.value
                if (tokens.length > 0 && tokens[0].type === 'ASSIGN') {
                    tokens.shift()

                    let expression = []
                    while (tokens.length > 0 && tokens[0].type !== 'NEWLINE') {
                        expression.push(tokens.shift())
                    }

                    // Transformam expresia din forma infixata in forma postfixata
                    let postfixExpression = shuntingYard(expression)

                    // Cream nodul de atribuire si il adaugam in lista
                    instructions.push(new Node("ASSIGNMENT", varName, postfixExpression))
                }
                else if (tokens.length > 0 && tokens[0].type === 'LBRACKET') {
                    tokens.shift(); // remove '['
                    let sizeExpr = [];
                    while (tokens.length > 0 && tokens[0].type !== 'RBRACKET') {
                        sizeExpr.push(tokens.shift());
                    }
                    tokens.shift(); // remove ']'
                    if (tokens.length > 0 && tokens[0].type === 'ASSIGN') {
                        tokens.shift(); // remove '='
                        if (tokens.length > 0 && tokens[0].type === 'LBRACE') {
                            tokens.shift(); // remove '{'
                            let elements = [];
                            let currentElement = [];
                            while (tokens.length > 0 && tokens[0].type !== 'RBRACE') {
                                if (tokens[0].type === 'COMMA') {
                                    elements.push(shuntingYard(currentElement));
                                    currentElement = [];
                                    tokens.shift(); // remove comma
                                } else {
                                    currentElement.push(tokens.shift());
                                }
                            }
                            if (currentElement.length > 0) {
                                elements.push(shuntingYard(currentElement));
                            }
                            tokens.shift(); // remove '}'
                            instructions.push(new Node("VECTOR_INIT", varName, { size: shuntingYard(sizeExpr), elements }));
                        } else {
                            throw new Error("Expected '{' for vector initialization");
                        }
                    } else {
                        instructions.push(new Node("VECTOR_ALLOC", varName, shuntingYard(sizeExpr)));
                    }
                }
                else if (tokens.length > 0 && tokens[0].type === 'ASSIGN') {
                    tokens.shift();
                    let expression = [];
                    while (tokens.length > 0 && tokens[0].type !== 'NEWLINE') {
                        expression.push(tokens.shift());
                    }
                    let postfixExpression = shuntingYard(expression);
                    instructions.push(new Node("ASSIGNMENT", varName, postfixExpression));
                }
            default:
                break
        }
    }

    const program = new Node('PROGRAM', null, instructions)
    console.dir(program, { depth: null })
    if (program.children.length === 0 && tokens.length > 0) {
        throw new Error("Programul nu contine instructiuni")
    }
    return program
}

function shuntingYard(tokens) {

    function precedence(op) {
        if (op === 'not') return 6
        if (op === '*' || op === '/' || op === '%') return 5
        if (op === '+' || op === '-') return 4
        if (op === '>' || op === '<' || op === '>=' || op === '<=') return 3
        if (op === 'si') return 2
        if (op === 'sau') return 1
        if (op === 'egal' || op === 'diferit') return 0

        return -1
    }

    let output = []
    let stack = []

    while (tokens.length > 0) {
        let token = tokens.shift()

        if (token.type === 'NUMBER' || token.type === 'IDENTIFIER' || token.type === 'STRING') {
            output.push(token)
        }
        else if (token.type === 'OPERATOR') {
            while (stack.length > 0 && stack[stack.length - 1].type === 'OPERATOR') {
                let op1 = token.value
                let op2 = stack[stack.length - 1].value

                if (precedence(op1) <= precedence(op2)) {
                    output.push(stack.pop())
                } else {
                    break
                }
            }
            stack.push(token)
        }
        else if (token.type === 'LSQUAREBRACE' || token.type === 'LBRACKET') {
            stack.push(token)
        }
        else if (token.type === 'RSQUAREBRACE' || token.type === 'RBRACKET') {
            while (stack.length > 0 && 
                   stack[stack.length - 1].type !== 'LSQUAREBRACE' && 
                   stack[stack.length - 1].type !== 'LBRACKET') {
                output.push(stack.pop())
            }
            if (stack.length > 0) {
                stack.pop() // Remove the left bracket
                // Add an 'index' operator to the output
                output.push(new Token('OPERATOR', 'index'))
            } else {
                throw new Error("Unmatched right square bracket")
            }
        }
        else if (token.type === 'LPAREN') {
            stack.push(token)
        }
        else if (token.type === 'RPAREN') {
            while (stack.length > 0 && stack[stack.length - 1].type !== 'LPAREN') {
                output.push(stack.pop())
            }
            stack.pop()
        }
    }

    while (stack.length > 0) {
        output.push(stack.pop())
    }

    return output
}

function parseDaca(tokens) {
    let condition = [];
    let thenBlock = [];
    let elseBlock = [];

    eatNewlines(tokens);
    // Citim condiția până la token-ul "atunci" sau până la o acoladă
    while (tokens.length > 0 && tokens[0].value !== 'atunci' && tokens[0].type !== 'LBRACE') {
        if (tokens[0].value === '=') {
            tokens.shift(); // Sărim peste '='
            condition.push(new Token('OPERATOR', 'egal'));
        } else {
            condition.push(tokens.shift());
        }
    }

    // Partea "atunci"
    if (tokens[0] && tokens[0].value === 'atunci') {
        tokens.shift(); // Sărim peste "atunci"
        eatNewlines(tokens);
        if (tokens[0] && tokens[0].value !== '{') {
            // Fără acolade → o singură instrucțiune (posibil imbricată)
            thenBlock = parseSingleStatement(tokens);
        } else if (tokens[0] && tokens[0].value === '{') {
            tokens.shift(); // Sărim peste '{'
            thenBlock = parseBracedBlock(tokens);
        }
    }

    eatNewlines(tokens);
    // Partea "altfel", dacă există
    if (tokens[0] && tokens[0].value === 'altfel') {
        tokens.shift(); // Sărim peste "altfel"
        eatNewlines(tokens);
        if (tokens[0] && tokens[0].value !== '{') {
            elseBlock = parseSingleStatement(tokens);
        } else if (tokens[0] && tokens[0].value === '{') {
            tokens.shift(); // Sărim peste '{'
            elseBlock = parseBracedBlock(tokens);
        }
    }
    // // console.log("Then bloc gasit!")
    // for ( let tk of thenBlock ) {
    //     console.log(tk.value)
    // }
    // // console.log("Else bloc gasit!")
    // for ( let tk of elseBlock ) {
    //     console.log(tk.value)
    // }
    if (condition.length === 0 || thenBlock.length === 0 || (condition.length === 0 && thenBlock.length === 0 && elseBlock.length !== 0)) {
        throw new Error('Sintaxa pentru "daca" este invalida')
    }

    return { condition, thenBlock, elseBlock };
}

function parseCatTimp(tokens) {
    let condition = [];
    let thenBlock = [];

    eatNewlines(tokens);
    // Citim condiția până la token-ul "executa" sau o acoladă
    while (tokens.length > 0 && tokens[0].value !== 'executa' && tokens[0].type !== 'LBRACE') {
        if ( tokens[0].value === '=' ) {
            tokens.shift() // Sari peste =
            condition.push(new Token('OPERATOR', 'egal'))
        }
        condition.push(tokens.shift());
    }
    if (tokens[0] && tokens[0].value === 'executa') {
        tokens.shift(); // Sărim peste "executa"
        eatNewlines(tokens);
        if (tokens[0] && tokens[0].value !== '{') {
            thenBlock = parseSingleStatement(tokens);
        } else if (tokens[0] && tokens[0].value === '{') {
            tokens.shift(); // S��rim peste '{'
            thenBlock = parseBracedBlock(tokens);
        }
    }
    if (condition.length === 0 || thenBlock.length === 0) {
        throw new Error('Sintaxa pentru "cat timp" este invalida')
    }
    return { condition, thenBlock };
}

function parsePentru (tokens) {
    let found_condition = false, found_then = false
    let condition = []
    let thenBlock = []
    eatNewlines(tokens)
    while (tokens.length > 0 && tokens[0].value !== 'executa' && tokens[0].type !== 'LBRACE') {
        condition.push(tokens.shift())
    }
    found_condition = condition.length > 0

    if (tokens.length > 0 && tokens[0].value === 'executa') {
        tokens.shift() //Sari peste executa
        eatNewlines(tokens)
        // E posibil sa fie un for scris pe o linie: pentru <conditie> executa <instr1>
        if (tokens.length > 0 && tokens[0].value !== '{') {
            eatNewlines(tokens)
            // Daca nu avem acolade, atunci avem doar o singura instructiune
            thenBlock = parseSingleStatement(tokens)
            found_then = thenBlock.length > 0
        }
    }
    
    if (tokens.length > 0 && tokens[0].type === 'LBRACE') {
        tokens.shift() //Sari peste {
        eatNewlines(tokens)
        thenBlock = parseBracedBlock(tokens)
        found_then = true
    }
    
    if (!found_condition) {
        throw new Error('Sintaxa pentru "pentru": lipsește condiția')
    }
    
    if (!found_then) {
        throw new Error('Sintaxa pentru "pentru": lipsește blocul de instrucțiuni după "executa"')
    }
    
    return {condition, thenBlock}
}

function parseRepeta (tokens) {
    let found_condition = false, found_then = false
    let condition = []
    let thenBlock = []

    let repetas = 1
    while (tokens.length > 0 && repetas > 0 && tokens[0].type !== 'EOF' ) {
        if (tokens[0].value === 'repeta')
            repetas ++
        else if (tokens[0].value === 'pana cand') {
            repetas --
            if (repetas === 0) {
                break
            }
        }
        thenBlock.push(tokens.shift())
    }

    if (tokens[0].value === 'pana cand') {
        tokens.shift() //Sari peste pana cand
        eatNewlines(tokens)
        condition = []
        while (tokens.length > 0 && tokens[0].type !== 'EOF' && tokens[0].value !== '\n') {
            if (tokens[0].value === '=') {
                tokens.shift()
                condition.push(new Token('OPERATOR', 'egal'))
            }
            condition.push(tokens.shift())
        }
        found_condition = true
    }
    if (!found_condition || !found_then) {
        throw new Error('Sintaxa pentru "repeta" este invalida')
    }
    return {condition, thenBlock}
}

function getDaca (tokens) {
    let block = []
    let {condition, thenBlock, elseBlock} = parseDaca(tokens)
    block.push(new Token('KEYWORD', 'daca'))
    block.push(...condition)
    block.push(new Token('KEYWORD', 'atunci'))
    block.push(new Token('LBRACE', '{'))
    block.push(...thenBlock)
    block.push(new Token('RBRACE', '}'))
    if (elseBlock.length > 0) {
        block.push(new Token('KEYWORD', 'altfel'))
        block.push(new Token('LBRACE', '{'))
        block.push(...elseBlock)
        block.push(new Token('RBRACE', '}'))
    }
    return block
}

function getCatTimp (tokens) {
    let block = []
    let {condition, thenBlock} = parseCatTimp(tokens)
    block.push(new Token('KEYWORD', 'cat timp'))
    block.push(...condition)
    block.push(new Token('KEYWORD', 'executa'))
    block.push(new Token('LBRACE', '{'))
    block.push(...thenBlock)
    block.push(new Token('RBRACE', '}'))
    return block
}

function getPentru (tokens) {
    let block = []
    let {condition, thenBlock} = parsePentru(tokens)
    block.push(new Token('KEYWORD', 'pentru'))
    block.push(...condition)
    block.push(new Token('KEYWORD', 'executa'))
    block.push(new Token('LBRACE', '{'))
    block.push(...thenBlock)
    block.push(new Token('RBRACE', '}'))
    return block
}

function getRepeta (tokens) {
    let block = []
    let {condition, thenBlock} = parseRepeta(tokens)
    block.push(new Token('KEYWORD', 'repeta'))
    block.push(new Token ('LBRACE', '{'))
    block.push(new Token ('NEWLINE', '\n'))
    block.push(...thenBlock)
    block.push(new Token ('NEWLINE', '\n'))
    block.push(new Token ('RBRACE', '}'))
    block.push(new Token('KEYWORD', 'pana cand'))
    block.push(...condition)
    return block
}

function parseBracedBlock(tokens) {
    let block = []
    let brackets = 1 // Am consumat deja '{' inițial, deci începem de la 1

    while (tokens.length > 0 && brackets > 0) {
        const token = tokens.shift() // Luăm următorul token

        if (token.type === 'LBRACE') {
            brackets++ // Bloc imbricat: crește contorul
        } else if (token.type === 'RBRACE') {
            brackets-- // Închide un bloc: scade contorul
        }

        block.push(token) // Adaugă token-ul la bloc (inclusiv '{' imbricate)
    }

    if (brackets !== 0) {
        throw new Error("Acoladă neînchisă!")
    }

    return block // Returnează token-urile dintre {}
}

function parseStatement(tokens) {
    let block = []
    if (tokens.length === 0) return block

    let token = tokens[0]

    if (isBlockKeyword(token.value)) {
        let keyword = tokens.shift() // Consumă cuvântul cheie
        let statement = []

        if (keyword.value === 'pentru') {
            statement = getPentru(tokens)
        }
        else if (keyword.value === 'daca') {
            statement = getDaca(tokens)
        }
        else if (keyword.value === 'cat timp') {
            statement = getCatTimp(tokens)
        }
        else if (keyword.value === 'repeta') {
            statement = getRepeta(tokens)
        }

        block.push(...statement)
    } else {
        // Citim o instrucțiune simplă până la sfârșitul liniei sau până la începutul unei noi structuri
        while (tokens.length > 0 && tokens[0].type !== 'EOF' && tokens[0].value !== '\n' && !isBlockKeyword(tokens[0].value)) {
            block.push(tokens.shift())
        }
    }

    eatNewlines(tokens)
    return block
}

function isBlockKeyword(value) {
    return ['daca', 'cat timp', 'pentru', 'repeta'].includes(value)
}

function parseSingleStatement(tokens) {
    let block = []

    if (tokens.length === 0) return block

    let token = tokens[0]

    if (isBlockKeyword(token.value)) {
        // Dacă e un bloc, îl parsează complet
        return parseStatement(tokens)
    } else {
        // Citim doar prima instrucțiune de pe linie
        while (tokens.length > 0 && tokens[0].type !== 'EOF' && tokens[0].value !== '\n' && !isBlockKeyword(tokens[0].value)) {
            block.push(tokens.shift())
        }
    }

    eatNewlines(tokens)
    return block
}

