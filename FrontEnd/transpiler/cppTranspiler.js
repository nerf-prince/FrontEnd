/**
 * Transpiler pentru conversia pseudocodului în C++
 * Îmbunătățit cu detectare mai bună a tipurilor și gestionare a erorilor
 */

export function generateCPP(ast) {
    if (!ast) return '// Eroare în transpilare: AST invalid';

    let code = '';
    let variables = new Map(); // Track variable name → type mapping

    // Colectăm variabilele înainte de a genera headerele
    if (ast && ast.children) {
        collectVariables(ast, variables);
    }
    
    // Verificăm dacă există variabile de tip string, vector și double
    const hasStringVariables = Array.from(variables.values()).includes('string');
    const hasVectorVariables = Array.from(variables.values()).includes('vector');
    const hasDoubleVariables = Array.from(variables.values()).includes('double');

    // Adăugăm header-ele necesare
    code += '#include <iostream>\n';
    if (hasStringVariables) {
        code += '#include <string>\n';
    }
    if (hasVectorVariables) {
        code += '#include <vector>\n';
    }
    code += '\nusing namespace std;\n\n';
    code += 'int main() {\n';
    
    // Generăm declarațiile de variabile grupate pe tipuri
    if (variables.size > 0) {
        const stringVars = [];
        const intVars = [];
        const doubleVars = [];
        const vectorVars = [];
        
        for (const [variable, type] of variables.entries()) {
            if (type === 'string') {
                stringVars.push(variable);
            } else if (type === 'double') {
                doubleVars.push(variable);
            } else if (type === 'vector') {
                vectorVars.push(variable);
            } else {
                intVars.push(variable);
            }
        }
        
        // Declare string variables
        if (stringVars.length > 0) {
            for (const variable of stringVars) {
                code += `    string ${variable};\n`;
            }
        }
        
        // Declare int variables
        if (intVars.length > 0) {
            for (const variable of intVars) {
                code += `    int ${variable};\n`;
            }
        }
        
        // Declare double variables
        if (doubleVars.length > 0) {
            for (const variable of doubleVars) {
                code += `    double ${variable};\n`;
            }
        }
        
        // Vector variables are declared inline with their size
        
        code += '\n';
    }
    
    // Parcurgem nodurile AST și grupăm nodurile de output
    if (ast && ast.children) {
        for (let i = 0; i < ast.children.length; i++) {
            const node = ast.children[i];
            if (isOutputNode(node)) {
                let outputs = [];
                // Grupați nodurile consecutive de output
                while (i < ast.children.length && isOutputNode(ast.children[i])) {
                    outputs.push(ast.children[i]);
                    i++;
                }
                // Dacă există un NEWLINE imediat după grup, sarim peste el
                if (i < ast.children.length && ast.children[i].type === 'NEWLINE') {
                    i++;
                }
                code += transpileOutputGroup(outputs, 1);
                i--; // Ajustăm pentru ciclul for
            } else if (node.type === 'NEWLINE') {
                code += getIndentation(1) + "cout << endl;\n";
            } else {
                code += transpileNode(node, 1, variables);
            }
        }
    }
    
    code += '    return 0;\n';
    code += '}\n';
    
    return code;
}

function isOutputNode(node) {
    return node.type === 'OUTPUT' || node.type === 'OUTPUTSTR' || node.type === 'OUTPUTEXP';
}

function transpileOutputGroup(nodes, indentLevel) {
    const indent = getIndentation(indentLevel);
    const parts = [];
    // Parcurgem nodurile de output și le transformăm corespunzător
    for (const node of nodes) {
        if (node.type === 'OUTPUT') {
            parts.push(node.value);
        } else if (node.type === 'OUTPUTSTR') {
            parts.push(`"${node.value}"`);
        } else if (node.type === 'OUTPUTEXP') {
            if (node.children && node.children.length > 0) {
                parts.push(transpileExpression(node.children));
            } else if (node.value) {
                if (Array.isArray(node.value)) {
                    parts.push(transpileExpression(node.value));
                } else {
                    parts.push(node.value);
                }
            }
        }
    }
    return `${indent}cout << ${parts.join(' << ')} << endl;\n`;
}

function collectVariables(node, variables) {
    if (!node) return;
    if (node.type === 'ASSIGNMENT') {
        const varName = node.value;
        
        // Check if this is a string assignment
        if (node.children && Array.isArray(node.children)) {
            // Detect string type
            const hasStringValue = detectStringExpression(node.children);
            if (hasStringValue) {
                variables.set(varName, 'string');
            } 
            // Detect double/float type (numbers with decimal points)
            else if (detectDoubleExpression(node.children)) {
                variables.set(varName, 'double');
            }
            // Default to int if not already set
            else if (!variables.has(varName)) {
                variables.set(varName, 'int');
            }
        } else {
            if (!variables.has(varName)) {
                variables.set(varName, 'int'); // Default to int
            }
        }
    } 
    else if (node.type === 'INPUT') {
        if (!variables.has(node.value)) {
            variables.set(node.value, 'int'); // Default to int for input vars
        }
    }
    else if (node.type === 'VECTOR_ALLOC' || node.type === 'VECTOR_INIT') {
        // Don't add to variables map - vectors are declared inline
        // variables.set(node.value, 'vector');
    }
    else if (node.type === 'IF') {
        if (node.value && node.value.thenBlock) {
            collectVariablesFromBlock(node.value.thenBlock, variables);
        }
        if (node.value && node.value.elseBlock) {
            collectVariablesFromBlock(node.value.elseBlock, variables);
        }
    } 
    else if (node.type === 'WHILE' || node.type === 'DO-WHILE') {
        if (node.value && node.value.block) {
            collectVariablesFromBlock(node.value.block, variables);
        }
    } 
    else if (node.type === 'FOR') {
        if (node.value && node.value.init) {
            variables.set(node.value.init.value, 'int'); // For loops typically use int
        }
        if (node.value && node.value.block) {
            collectVariablesFromBlock(node.value.block, variables);
        }
    }
    
    // Recursiv pentru copii
    if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
            collectVariables(child, variables);
        }
    }
}

function detectStringExpression(tokens) {
    if (!tokens || !Array.isArray(tokens)) return false;
    
    // Look for any string token in the expression
    for (const token of tokens) {
        if (token.type === 'STRING') {
            return true;
        }
    }
    return false;
}

function detectDoubleExpression(tokens) {
    if (!tokens || !Array.isArray(tokens)) return false;
    
    // Look for any number with decimal point
    for (const token of tokens) {
        if (token.type === 'NUMBER' && token.value && token.value.toString().includes('.')) {
            return true;
        }
    }
    return false;
}

function collectVariablesFromBlock(block, variables) {
    if (block && block.children) {
        for (const child of block.children) {
            collectVariables(child, variables);
        }
    }
}

function getIndentation(level) {
    return '    '.repeat(level);
}

function transpileNode(node, indentLevel, variables) {
    if (!node) return '';
    
    const indent = getIndentation(indentLevel);
    
    switch (node.type) {
        case 'ASSIGNMENT':
            return transpileAssignment(node, indent, variables);
        case 'INPUT':
            return transpileInput(node, indent, variables);
        case 'OUTPUT':
            return transpileOutput(node, indent);
        case 'OUTPUTSTR':
            return transpileOutputStr(node, indent);
        case 'OUTPUTEXP':
            return transpileOutputExp(node, indent);
        case 'IF':
            return transpileIf(node, indentLevel, variables);
        case 'WHILE':
            return transpileWhile(node, indentLevel, variables);
        case 'FOR':
            return transpileFor(node, indentLevel, variables);
        case 'DO-WHILE':
            return transpileDoWhile(node, indentLevel, variables);
        case 'VECTOR_ALLOC':
            return transpileVectorAlloc(node, indentLevel);
        case 'VECTOR_INIT':
            return transpileVectorInit(node, indentLevel);
        default:
            return `${indent}`;
    }
}

function transpileAssignment(node, indent, variables) {
    const varName = node.value;
    
    if (!varName) return `${indent}// Eroare: variabilă lipsă în assignment\n`;
    
    if (node.children && node.children.length > 0) {
        // Transpile the expression
        const expression = transpileExpression(node.children);
        
        // If expression is empty, provide a default value
        if (!expression) {
            const type = variables.get(varName) || 'int';
            if (type === 'string') {
                return `${indent}${varName} = "";\n`;
            } else {
                return `${indent}${varName} = 0;\n`;
            }
        }
        
        return `${indent}${varName} = ${expression};\n`;
    }
    
    // No children - initialize with default value based on type
    const type = variables.get(varName) || 'int';
    if (type === 'string') {
        return `${indent}${varName} = "";\n`;
    } else if (type === 'double') {
        return `${indent}${varName} = 0.0;\n`;
    } else {
        return `${indent}${varName} = 0;\n`;
    }
}

function transpileInput(node, indent, variables) {
    return `${indent}cin >> ${node.value};\n`;
}

function transpileOutput(node, indent) {
    return `${indent}cout << ${node.value} << endl;\n`;
}

function transpileOutputStr(node, indent) {
    // Escape special characters in string
    const escapedValue = escapeString(node.value);
    return `${indent}cout << "${escapedValue}" << flush;\n`;
}

function escapeString(str) {
    if (!str) return '';
    return str
        .replace(/\\/g, '\\\\')  // Escape backslashes
        .replace(/"/g, '\\"')     // Escape quotes
        .replace(/\n/g, '\\n')    // Escape newlines
        .replace(/\t/g, '\\t')    // Escape tabs
        .replace(/\r/g, '\\r');   // Escape carriage returns
}

function transpileOutputExp(node, indent) {
    if (node.children && node.children.length > 0) {
        const expression = transpileExpression(node.children);
        return `${indent}cout << ${expression} << endl;\n`;
    } else if (node.value) {
        // Handle the case when node.value is an array of tokens
        if (Array.isArray(node.value)) {
            if (node.value.length === 1 && node.value[0].type === 'NUMBER') {
                // Single number token
                return `${indent}cout << ${node.value[0].value} << endl;\n`;
            } else if (node.value.length === 1 && node.value[0].type === 'STRING') {
                // Single string token
                return `${indent}cout << "${node.value[0].value}" << endl;\n`;
            } else {
                // Process expression tokens
                const expression = transpileExpression(node.value);
                return `${indent}cout << ${expression} << endl;\n`;
            }
        } else {
            // Direct value (string or number)
            return `${indent}cout << ${node.value} << endl;\n`;
        }
    }
    return `${indent}cout << endl;\n`;
}

function transpileIf(node, indentLevel, variables) {
    const indent = getIndentation(indentLevel);
    const ifNode = node.value;
    
    if (!ifNode) return `${indent}// Eroare: IF node invalid\n`;
    
    // Transpile condition
    const condition = ifNode.condition ? transpileExpression(ifNode.condition) : 'true';
    let code = `${indent}if (${condition}) {\n`;
    
    // Generăm codul pentru blocul then
    if (ifNode.thenBlock && ifNode.thenBlock.children && ifNode.thenBlock.children.length > 0) {
        for (const childNode of ifNode.thenBlock.children) {
            code += transpileNode(childNode, indentLevel + 1, variables);
        }
    } else {
        code += `${getIndentation(indentLevel + 1)}// bloc then gol\n`;
    }
    
    code += `${getIndentation(indentLevel)}}\n`;
    
    // Generăm codul pentru blocul else dacă există
    if (ifNode.elseBlock && ifNode.elseBlock.children && ifNode.elseBlock.children.length > 0) {
        code += `${indent}else {\n`;
        for (const childNode of ifNode.elseBlock.children) {
            code += transpileNode(childNode, indentLevel + 1, variables);
        }
        code += `${getIndentation(indentLevel)}}\n`;
    }
    
    return code;
}

function transpileWhile(node, indentLevel, variables) {
    const indent = getIndentation(indentLevel);
    const whileNode = node.value;
    
    if (!whileNode) return `${indent}// Eroare: WHILE node invalid\n`;
    
    const condition = whileNode.condition ? transpileExpression(whileNode.condition) : 'true';
    let code = `${indent}while (${condition}) {\n`;
    
    // Generăm codul pentru corpul buclei
    if (whileNode.block && whileNode.block.children && whileNode.block.children.length > 0) {
        for (const childNode of whileNode.block.children) {
            code += transpileNode(childNode, indentLevel + 1, variables);
        }
    } else {
        code += `${getIndentation(indentLevel + 1)}// bloc while gol\n`;
    }
    
    code += `${getIndentation(indentLevel)}}\n`;
    
    return code;
}

function transpileDoWhile(node, indentLevel, variables) {
    const indent = getIndentation(indentLevel);
    const doWhileNode = node.value;
    
    if (!doWhileNode) return `${indent}// Eroare: DO-WHILE node invalid\n`;
    
    let code = `${indent}do {\n`;
    
    // Generăm codul pentru corpul buclei
    if (doWhileNode.block && doWhileNode.block.children && doWhileNode.block.children.length > 0) {
        for (const childNode of doWhileNode.block.children) {
            code += transpileNode(childNode, indentLevel + 1, variables);
        }
    } else {
        code += `${getIndentation(indentLevel + 1)}// bloc do-while gol\n`;
    }
    
    const condition = doWhileNode.condition ? transpileExpression(doWhileNode.condition) : 'false';
    code += `${getIndentation(indentLevel)}} while (${condition});\n`;
    
    return code;
}

function transpileFor(node, indentLevel, variables) {
    const indent = getIndentation(indentLevel);
    const forNode = node.value;
    
    if (!forNode) return `${indent}// Eroare: FOR node invalid\n`;
    
    // Variabila de control
    const varName = forNode.init ? forNode.init.value : 'i';
    
    // Inițializare
    let initCode = '';
    if (forNode.init && forNode.init.children) {
        const initValue = transpileExpression(forNode.init.children);
        initCode = `${varName} = ${initValue}`;
    } else {
        initCode = `${varName} = 0`;
    }
    
    // Condiție
    let condition = '';
    if (forNode.condition) {
        condition = transpileExpression(forNode.condition);
    } else {
        condition = `${varName} < 10`; // Default condition
    }
    
    // Incrementare - tratăm cazul când increment este un nod ASSIGNMENT complet
    let increment = '';
    if (forNode.increment) {
        if (forNode.increment.type === 'ASSIGNMENT' && forNode.increment.value && forNode.increment.children) {
            // INCREMENT este un nod de assignment complet
            const incrementVar = forNode.increment.value;
            const incrementExpr = transpileExpression(forNode.increment.children);
            increment = `${incrementVar} = ${incrementExpr}`;
        } else if (forNode.increment.children) {
            // INCREMENT are doar children (expresie)
            const incValue = transpileExpression(forNode.increment.children);
            increment = `${varName} = ${incValue}`;
        } else {
            // Default increment
            increment = `${varName}++`;
        }
    } else {
        // Default increment
        increment = `${varName}++`;
    }
    
    let code = `${indent}for (${initCode}; ${condition}; ${increment}) {\n`;
    
    // Generăm codul pentru corpul buclei
    if (forNode.block && forNode.block.children) {
        for (const childNode of forNode.block.children) {
            code += transpileNode(childNode, indentLevel + 1, variables);
        }
    }
    
    code += `${getIndentation(indentLevel)}}\n`;
    
    return code;
}

function transpileVectorAlloc(node, indentLevel) {
    const indent = getIndentation(indentLevel);
    
    if (!node.value) return `${indent}// Eroare: nume vector lipsă\n`;
    
    const sizeExpr = node.children && node.children.length > 0 
        ? transpileExpression(node.children) 
        : '0';
    
    return `${indent}vector<int> ${node.value}(${sizeExpr});\n`;
}

function transpileVectorInit(node, indentLevel) {
    const indent = getIndentation(indentLevel);
    
    if (!node.value) return `${indent}// Eroare: nume vector lipsă\n`;
    
    if (!node.children || !node.children.elements) {
        return `${indent}vector<int> ${node.value};\n`;
    }
    
    const elements = node.children.elements.map(exprTokens => transpileExpression(exprTokens));
    return `${indent}vector<int> ${node.value} = { ${elements.join(', ')} };\n`;
}

function transpileExpression(tokens) {
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) return '';
    
    // Pentru expresii simple
    if (tokens.length === 1) {
        const token = tokens[0];
        if (token.type === 'NUMBER' || token.type === 'IDENTIFIER') {
            return token.value;
        }
        if (token.type === 'STRING') {
            return '"' + token.value + '"';
        }
    }
    
    // Pentru expresii complexe care folosesc notația postfixată
    const stack = [];
    
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        
        if (token.type === 'NUMBER' || token.type === 'IDENTIFIER') {
            stack.push(token.value);
        } 
        else if (token.type === 'STRING') {
            stack.push('"' + token.value + '"');
        }
        else if (token.type === 'LSQUAREBRACE' || token.type === 'LBRACKET') {
            // Skip brackets as they are handled with the indexing operation
            continue;
        }
        else if (token.type === 'RSQUAREBRACE' || token.type === 'RBRACKET') {
            // Skip brackets as they are handled with the indexing operation
            continue;
        }
        else if (token.type === 'OPERATOR') {
            // Convertim operatorii din pseudocod în operatori C++
            const operator = mapOperator(token.value);
            
            if (operator === '!') {
                // Operatorul unary not
                if (stack.length > 0) {
                    const operand = stack.pop();
                    stack.push(`!(${operand})`);
                }
            } 
            else if (operator === 'int') {
                // Funcția de conversie la int
                if (stack.length > 0) {
                    const operand = stack.pop();
                    stack.push(`(int)(${operand})`);
                }
            } 
            else if (operator === 'index') {
                // Handle array indexing - correctly format as array[index]
                if (stack.length >= 2) {
                    const index = stack.pop();
                    const array = stack.pop();
                    stack.push(`${array}[${index}]`);
                }
            }
            else {
                // Operatori binari
                if (stack.length >= 2) {
                    const right = stack.pop();
                    const left = stack.pop();
                    
                    // Check if we need parentheses for correct precedence
                    const needsParens = shouldAddParentheses(operator);
                    
                    // Special case for string concatenation with + operator
                    const isStringConcat = 
                        (typeof right === 'string' && right.startsWith('"') && right.endsWith('"')) || 
                        (typeof left === 'string' && left.startsWith('"') && left.endsWith('"'));
                    
                    if (operator === '+' && isStringConcat) {
                        stack.push(`${left} + ${right}`);  // String concatenation
                    } else if (needsParens) {
                        stack.push(`(${left} ${operator} ${right})`);
                    } else {
                        stack.push(`${left} ${operator} ${right}`);
                    }
                }
            }
        }
    }
    
    return stack.length > 0 ? stack[0] : '';
}

function shouldAddParentheses(operator) {
    // Add parentheses for comparison and logical operators to ensure correct precedence
    const comparisonOps = ['==', '!=', '<', '>', '<=', '>=', '&&', '||'];
    return comparisonOps.includes(operator);
}

function mapOperator(operator) {
    const operatorMap = {
        'egal': '==',
        'diferit': '!=',
        'si': '&&',
        'sau': '||',
        'not': '!',
        'int': 'int',
        'mod': '%',
        'div': '/'
    };
    
    return operatorMap[operator] || operator;
}

