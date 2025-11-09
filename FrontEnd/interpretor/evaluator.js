export function evaluateNode(node, variables, outputToConsole, MAX_ITERATIONS) {
    if (!node) return
    if (node.type === 'PROGRAM') {
        for (let childNode of node.children) {
            evaluateNode(childNode, variables, outputToConsole, MAX_ITERATIONS) 
        }
    } 
    else if (node.type === 'INPUT') {
        let varName = node.value
        let value = prompt(`Introdu valoarea pentru variabila "${varName}": `)
        if (isNaN(value)) {
            throw new Error(`Valoarea introdusa pentru variabila "${varName}" nu este un numar valid!`)
        }
        variables[varName] = parseFloat(value)
    } 
    else if (node.type === 'OUTPUT') {
        if (variables[node.value] === undefined) {
            throw new Error(`Variabila "${node.value}" nu a fost definita!`)
        }
        outputToConsole(variables[node.value].toString(), false) // Don't add newline
    } 
    else if (node.type === 'OUTPUTEXP') {
        let value = evaluatePostfixExpression(node.value, variables)
        value = value.toString()
        outputToConsole(value, false) // Don't add newline
    }
    else if (node.type === 'OUTPUTSTR') {
        outputToConsole(node.value, false) // Don't add newline
    }
    else if (node.type === 'NEWLINE') {
        outputToConsole('', true) // Force a newline
    }
    else if (node.type === 'ASSIGNMENT') {
        variables[node.value] = evaluatePostfixExpression(node.children, variables)
    }
    else if (node.type === 'IF') {
        let IFNode = node.value
        let condition = evaluatePostfixExpression(IFNode.condition, variables)
        if (condition) {
            evaluateNode(IFNode.thenBlock, variables, outputToConsole, MAX_ITERATIONS)
        } else if (IFNode.elseBlock) {
            evaluateNode(IFNode.elseBlock, variables, outputToConsole, MAX_ITERATIONS)
        }
    }
    else if (node.type === 'WHILE') {
        let WHILENode = node.value
        let condition = evaluatePostfixExpression(WHILENode.condition, variables)
        let count = 0
        while (condition) {
            evaluateNode(WHILENode.block, variables, outputToConsole, MAX_ITERATIONS)
            condition = evaluatePostfixExpression(WHILENode.condition, variables)
            count ++
            if ( count > MAX_ITERATIONS) {
                throw new Error ('Bucla infinita!')
            }
        }
    }
    else if (node.type === 'FOR') {
        let FORNode = node.value
        let INITNode = FORNode.init
        let STEPNode = FORNode.increment
        variables[INITNode.value] = evaluatePostfixExpression(INITNode.children, variables)
        let count = 0
        while (evaluatePostfixExpression(FORNode.condition, variables)) {
            evaluateNode(FORNode.block, variables, outputToConsole, MAX_ITERATIONS);
            evaluateNode(STEPNode, variables, outputToConsole, MAX_ITERATIONS);
            count ++
            if ( count > MAX_ITERATIONS) {
                throw new Error ('Bucla infinita!')
            }
        }
    }
    else if (node.type === 'DO-WHILE') {
        let DO_WHILENode = node.value
        let count = 0
        do {
            evaluateNode(DO_WHILENode.block, variables, outputToConsole, MAX_ITERATIONS)
            count ++
            if ( count > MAX_ITERATIONS) {
                throw new Error ('Bucla infinita')
            }
        } while (!evaluatePostfixExpression(DO_WHILENode.condition, variables))
    }
    else if (node.type === 'VECTOR_ALLOC') {
        let size = evaluatePostfixExpression(node.children, variables);
        variables[node.value] = new Array(size).fill(0);
    }
    else if (node.type === 'VECTOR_INIT') {
        let size = evaluatePostfixExpression(node.children.size, variables);
        let vector = new Array(size).fill(0);
        for (let i = 0; i < node.children.elements.length && i < size; i++) {
            vector[i] = evaluatePostfixExpression(node.children.elements[i], variables);
        }
        variables[node.value] = vector;
    }
}

function evaluatePostfixExpression(tokens, variables) {
    let stack = []
    let exprTokens = [...tokens]

    for (let i = 0; i < exprTokens.length; i++) {
        let token = exprTokens[i]
        
        if (token.type === 'NUMBER') {
            stack.push(parseFloat(token.value))
        } 
        else if (token.type === 'IDENTIFIER') {
            if (variables[token.value] === undefined) {
                // If this is first use of a variable in array context, initialize it as an empty array
                if (i + 1 < exprTokens.length && 
                    (exprTokens[i+1].type === 'LBRACKET' || 
                     (exprTokens[i+1].type === 'NUMBER' && exprTokens[i+2]?.type === 'OPERATOR' && exprTokens[i+2]?.value === 'index'))) {
                    variables[token.value] = [];
                } else {
                    throw new Error(`Variabila "${token.value}" nu a fost definita!`)
                }
            }
            
            // Push the variable value onto the stack
            stack.push(variables[token.value])
        } 
        else if (token.type === 'STRING') {
            stack.push(token.value)
        }
        else if (token.type === 'LBRACKET') {
            // Skip this token - array indexing is handled with the index operator
            continue
        }
        else if (token.type === 'RBRACKET') {
            // When we reach a closing bracket, we need to handle the indexing operation
            let index = Math.floor(stack.pop())
            let array = stack.pop()
            
            // If we're just reading from the array
            if (i + 1 >= exprTokens.length || exprTokens[i+1].type !== 'ASSIGN') {
                if (Array.isArray(array)) {
                    if (index >= 0 && index < array.length) {
                        stack.push(array[index])
                    } else {
                        // When accessing an undefined array element, initialize it to 0
                        array[index] = 0
                        stack.push(array[index])
                    }
                } else if (typeof array === 'string') {
                    if (index >= 0 && index < array.length) {
                        stack.push(array.charAt(index))
                    } else {
                        throw new Error(`Index ${index} out of bounds for string "${array}"`)
                    }
                } else {
                    throw new Error(`Cannot index into ${typeof array}`)
                }
            } else {
                // If this is part of an assignment, push the array and index back
                // so the assignment can handle it
                stack.push(array)
                stack.push(index)
            }
        }
        else if (token.type === 'OPERATOR') {
            if (token.value === 'not') {
                let op = stack.pop()
                stack.push(op ? 0 : 1)
            }
            else if (token.value === 'int') {
                let op = stack.pop()
                stack.push(Math.floor(op))
            }
            else if (token.value === 'index') {
                let index = Math.floor(stack.pop())
                let value = stack.pop()
                
                if (Array.isArray(value)) {
                    if (index >= 0) {
                        // For arrays, auto-expand if needed
                        if (index >= value.length) {
                            // Initialize missing elements
                            for (let j = value.length; j <= index; j++) {
                                value[j] = 0
                            }
                        }
                        stack.push(value[index])
                    } else {
                        throw new Error(`Negative index ${index} not allowed for arrays`)
                    }
                } else if (typeof value === 'string') {
                    if (index >= 0 && index < value.length) {
                        stack.push(value.charAt(index))
                    } else {
                        throw new Error(`Index ${index} out of bounds for string "${value}"`)
                    }
                } else {
                    // If the variable is not an array yet, make it one
                    if (typeof value === 'number' || value === undefined) {
                        let array = []
                        array[0] = value !== undefined ? value : 0
                        if (index >= 0) {
                            // Initialize missing elements
                            for (let j = 1; j <= index; j++) {
                                array[j] = 0
                            }
                            stack.push(array[index])
                        } else {
                            throw new Error(`Negative index ${index} not allowed for arrays`)
                        }
                    } else {
                        throw new Error(`Cannot index into ${typeof value}`)
                    }
                }
            }
            else if (token.value === '=') {
                // Handle array assignment: a[i] = value
                let value = stack.pop()
                
                if (stack.length >= 2) {
                    let index = stack.pop()
                    let array = stack.pop()
                    
                    if (Array.isArray(array)) {
                        array[index] = value
                        stack.push(value) // Assignment returns the value
                    } else if (typeof array === 'string') {
                        throw new Error("Cannot assign to string index")
                    } else {
                        // Convert to array if it's not one yet
                        let newArray = []
                        newArray[index] = value
                        // Update the original variable with this array
                        // This requires traversing back through tokens to find the variable name
                        let varName = null
                        for (let j = i-3; j >= 0; j--) {
                            if (exprTokens[j].type === 'IDENTIFIER') {
                                varName = exprTokens[j].value
                                break
                            }
                        }
                        if (varName) {
                            variables[varName] = newArray
                        }
                        stack.push(value)
                    }
                } else {
                    // Regular assignment
                    let varName = stack.pop()
                    variables[varName] = value
                    stack.push(value)
                }
            }
            else {
                let op2 = stack.pop()
                let op1 = stack.pop()

                if (token.value === '+') stack.push(op1 + op2)
                else if (token.value === '-') stack.push(op1 - op2)
                else if (token.value === '*') stack.push(op1 * op2)
                else if (token.value === '/') stack.push(op1 / op2)
                else if (token.value === '%') stack.push(op1 % op2)
                else if (token.value === '>') stack.push(op1 > op2 ? 1 : 0)
                else if (token.value === '<') stack.push(op1 < op2 ? 1 : 0)
                else if (token.value === '>=') stack.push(op1 >= op2 ? 1 : 0)
                else if (token.value === '<=') stack.push(op1 <= op2 ? 1 : 0)
                else if (token.value === 'egal') stack.push(op1 === op2 ? 1 : 0)
                else if (token.value === 'diferit') stack.push(op1 !== op2 ? 1 : 0)
                else if (token.value === 'si') stack.push(op1 && op2 ? 1 : 0)
                else if (token.value === 'sau') stack.push(op1 || op2 ? 1 : 0)
            }
        }
    }
    if (stack.length > 1) {
        throw new Error('Expresie invalida')
    }
    return stack.pop()
}

