const KEYWORDS = [
    'citeste',
    'scrie',
    'daca',
    'atunci',
    'altfel',
    'cat timp',
    'pentru',
    'executa',
    'repeta',
    'pana cand',
    'EOF',
]

const LOGICAL_OPERATORS = [
    'si',
    'sau',
    'not',
    'egal',
    'diferit',
]

export class Token {
    constructor(type, value) {
        this.type = type
        this.value = value
    }
}

function isAlpha(ch) {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')
}

function isDigit(ch) {
    return ch >= '0' && ch <= '9'
}

export function lexer(sourceCode) {
    const tokens = []
    
    const src = sourceCode.split('')
    while ( src.length > 0 ) { 
        let ch = src.shift()
        if ( ch === '\n' || ch === ';' ) {
            tokens.push(new Token('NEWLINE', ch))
        }
        else if ( ch === '+' || (ch === '-' && (tokens[tokens.length - 1]?.type == 'NUMBER' || tokens[tokens.length - 1]?.type == 'IDENTIFIER' || tokens[tokens.length - 1]?.type == 'RSQUAREBRACE')) || ch === '*' || (ch === '/' && src[0] !== '/') || ch === '%' ) {
            tokens.push(new Token('OPERATOR', ch))
        }
        else if ( ch === '=' && src[0] !== '=' ) {
            tokens.push(new Token('ASSIGN', ch))
        }
        else if (ch === '<' || ch === '>') {
            if ( ch === '<' && src[0] === '-') {
                tokens.push(new Token('ASSIGN', '='))
                src.shift()
                continue
            }
            if (src[0] === '=') {
                tokens.push(new Token('OPERATOR', ch + src.shift()));
            } else {
                tokens.push(new Token('OPERATOR', ch));
            }
        }
        else if ( ch === ',' ) {
            tokens.push(new Token('COMMA', ch))
        }
        else if ( ch === '(' ) {
            tokens.push(new Token('LPAREN', ch))
        }
        else if ( ch === ')' ) {
            tokens.push(new Token('RPAREN', ch))
        }
        else if ( ch === '{' ){
            tokens.push(new Token('LBRACE', ch))
        }
        else if ( ch === '}' ){
            tokens.push(new Token('RBRACE', ch))
        }
        else if ( ch === '[' ){
            tokens.push(new Token('LBRACKET', ch))
        }
        else if ( ch === ']' ){
            tokens.push(new Token('RBRACKET', ch))
        }
        else if ( ch === '!' ){
            tokens.push(new Token('OPERATOR', 'not'))
        }
        else {
            // Handle multi-character tokens
            if ( ch === '&' && src[0] === '&' ) {
                tokens.push(new Token('OPERATOR', 'si'))
                src.shift()
            }
            else if ( ch === '|' && src[0] === '|' ) {
                tokens.push(new Token('OPERATOR', 'sau'))
                src.shift()
            }
            else if ( ch === '!' && src[0] === '=' ) {
                tokens.push(new Token('OPERATOR', 'not') )
                src.shift()
            }
            else if ( ch === '=' && src[0] === '=' ) {
                tokens.push(new Token('OPERATOR', 'egal') )
                src.shift()
            }
            else if ( ch === ' ' || ch === '\t' || ch === '\r' ) {
                continue
            }
            else if ( ch === '/' && src[0] === '/' ) {
                while ( src.length > 0 && src[0] !== '\n') {
                    src.shift()
                }
            }
            else if ( isDigit(ch) || ch === '-') {
                let num = ch
                while ( isDigit(src[0]) || src[0] === '.' ) {
                    num += src.shift()
                }
                if ( num === '-' ) {
                    tokens.push(new Token('NUMBER', '-1'))
                    tokens.push(new Token('OPERATOR', '*'))
                }
                else
                    tokens.push(new Token('NUMBER', num))
            }
            else if ( isAlpha(ch) ) {
                let id = ch
                while ( isAlpha(src[0]) || isDigit(src[0]) || src[0] === '_' ) {
                    id += src.shift()
                }

                //Cazul in care avem 'cat' => s-ar putea sa fie 'cat timp'
                if (id === 'cat' && src[0] === ' ' && src[1] === 't' && src[2] === 'i' && src[3] === 'm' && src[4] === 'p') {
                    id += ' timp'
                    src.shift()
                    src.shift()
                    src.shift()
                    src.shift()
                    src.shift()
                }

                //Cazul in care avem 'pana' => s-ar putea sa fie 'pana cand'
                if (id === 'pana' && src[0] === ' ' && src[1] === 'c' && src[2] === 'a' && src[3] === 'n' && src[4] === 'd') {
                    id += ' cand'
                    src.shift()
                    src.shift()
                    src.shift()
                    src.shift()
                    src.shift()
                }

                if ( KEYWORDS.includes(id) ) {
                    tokens.push(new Token('KEYWORD', id))
                }
                else if ( LOGICAL_OPERATORS.includes(id) ) {
                    tokens.push(new Token('OPERATOR', id))
                }
                else {
                    tokens.push(new Token('IDENTIFIER', id))
                }
            }
            else if ( ch === '"') {
                let str = ''
                while (src.length > 0 && src[0] !== '"') {
                    str += src.shift()
                }
                if (src.length === 0) {
                    throw new Error("Unclosed string literal")
                }
                src.shift()
                tokens.push(new Token('STRING', str))
            }
            else {
                throw new Error(`Invalid character: ${ch}, ASCII: ${ch.charCodeAt(0)}`)
            }
        }
    }
    tokens.push(new Token('EOF', null))
    return tokens
}

