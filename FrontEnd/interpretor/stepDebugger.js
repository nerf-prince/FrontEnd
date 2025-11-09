/**
 * Step-by-step debugger for pseudocode
 * Allows line-by-line execution and variable tracking
 * Executes ONE instruction at a time, including loop iterations
 */

import { lexer } from './lexer.js';
import { parser } from './parser.js';

export class StepDebugger {
    constructor(sourceCode) {
        this.sourceCode = sourceCode;
        this.tokens = lexer(sourceCode);
        this.ast = parser(this.tokens);
        this.variables = new Map();
        this.outputBuffer = [];
        this.isFinished = false;
        this.error = null;
        
        // Execution context stack for loops and conditionals
        this.executionStack = [];
        this.programCounter = 0;
        this.currentLineNumber = 0; // Track current line being executed
        this.pendingInput = null; // Track if we're waiting for input
        
        // Build flat instruction list
        if (this.ast && this.ast.children) {
            this.instructions = this.ast.children;
        } else {
            this.instructions = [];
        }
        
        // Map instructions to line numbers (simple approximation)
        this.buildLineMap();
    }
    
    buildLineMap() {
        // Simple line mapping: count non-empty lines and map to instructions
        const lines = this.sourceCode.split('\n');
        this.sourceLines = lines.map((line, idx) => ({
            lineNumber: idx + 1,
            content: line.trim()
        })).filter(l => l.content.length > 0 && !l.content.startsWith('//'));
    }
    
    updateCurrentLine(instructionNode) {
        // Try to match instruction to source line
        // This is approximate - we count statements from top to bottom
        if (!instructionNode) return;
        
        // For main program instructions, use programCounter
        if (this.executionStack.length === 0) {
            if (this.programCounter > 0 && this.programCounter <= this.sourceLines.length) {
                this.currentLineNumber = this.sourceLines[this.programCounter - 1].lineNumber;
            }
        } else {
            // For nested instructions (inside loops/ifs), we need to find the line
            // For now, just keep the current line or increment slightly
            this.currentLineNumber = Math.min(this.currentLineNumber + 1, this.sourceLines.length);
        }
    }

    step() {
        if (this.isFinished) {
            return {
                finished: true,
                variables: this.getVariablesSnapshot(),
                output: this.outputBuffer.join(''),
                currentLineNumber: this.currentLineNumber,
                error: this.error
            };
        }

        try {
            // Check if we have a context (loop) to continue
            if (this.executionStack.length > 0) {
                const context = this.executionStack[this.executionStack.length - 1];
                
                if (context.type === 'FOR') {
                    return this.stepForLoop(context);
                } else if (context.type === 'WHILE') {
                    return this.stepWhileLoop(context);
                } else if (context.type === 'DO-WHILE') {
                    return this.stepDoWhileLoop(context);
                } else if (context.type === 'IF') {
                    return this.stepIfBlock(context);
                }
            }
            
            // No active context, execute next instruction from main program
            if (this.programCounter >= this.instructions.length) {
                this.isFinished = true;
                return {
                    finished: true,
                    variables: this.getVariablesSnapshot(),
                    output: this.outputBuffer.join(''),
                    currentLineNumber: this.currentLineNumber,
                    error: null
                };
            }
            
            const instruction = this.instructions[this.programCounter];
            this.programCounter++;
            
            return this.executeInstruction(instruction);
            
        } catch (error) {
            this.error = error.message;
            this.isFinished = true;
            return {
                finished: true,
                variables: this.getVariablesSnapshot(),
                output: this.outputBuffer.join(''),
                currentLineNumber: this.currentLineNumber,
                error: error.message
            };
        }
    }

    executeInstruction(node) {
        if (!node) {
            return this.createStepResult();
        }
        
        this.updateCurrentLine(node);

        switch (node.type) {
            case 'ASSIGNMENT':
                this.executeAssignment(node);
                break;
            case 'INPUT':
                this.executeInput(node);
                break;
            case 'OUTPUT':
                this.executeOutput(node);
                break;
            case 'OUTPUTSTR':
                this.executeOutputStr(node);
                break;
            case 'OUTPUTEXP':
                this.executeOutputExp(node);
                break;
            case 'IF':
                return this.startIfBlock(node);
            case 'WHILE':
                return this.startWhileLoop(node);
            case 'FOR':
                return this.startForLoop(node);
            case 'DO-WHILE':
                return this.startDoWhileLoop(node);
            default:
                break;
        }
        
        return this.createStepResult();
    }

    createStepResult() {
        return {
            finished: false,
            variables: this.getVariablesSnapshot(),
            output: this.outputBuffer.join(''),
            currentLine: this.programCounter,
            currentLineNumber: this.currentLineNumber,
            totalLines: this.instructions.length,
            needsInput: this.pendingInput !== null,
            inputVariable: this.pendingInput,
            error: null
        };
    }

    // FOR LOOP HANDLING
    startForLoop(node) {
        const forNode = node.value;
        if (!forNode) return this.createStepResult();

        // Initialize loop variable
        if (forNode.init) {
            this.executeAssignment(forNode.init);
        }

        // Check initial condition
        const condition = forNode.condition ? this.evaluateExpression(forNode.condition) : false;
        
        if (!condition) {
            // Don't enter loop at all
            return this.createStepResult();
        }

        // Create loop context
        const context = {
            type: 'FOR',
            node: forNode,
            bodyIndex: 0,
            needsIncrement: false,
            instructions: forNode.block?.children || []
        };

        this.executionStack.push(context);
        
        // Mark that we're at the FOR line for highlighting
        this.currentLineNumber = this.getForLoopLineNumber();
        return this.createStepResult();
    }

    stepForLoop(context) {
        const forNode = context.node;
        
        // If we need to do increment and check condition
        if (context.needsIncrement) {
            context.needsIncrement = false;
            
            // Execute increment
            if (forNode.increment) {
                const incrementInstruction = forNode.increment.children && forNode.increment.children.length > 0
                    ? forNode.increment.children[0]
                    : null;
                
                if (incrementInstruction && incrementInstruction.type === 'ASSIGNMENT') {
                    this.executeAssignment(incrementInstruction);
                }
            }
            
            // Check condition after increment (in same step)
            const condition = forNode.condition ? this.evaluateExpression(forNode.condition) : false;
            
            if (!condition) {
                // Exit loop - pop context and check if program is done
                this.executionStack.pop();
                
                // Check if we've finished all instructions
                if (this.executionStack.length === 0 && this.programCounter >= this.instructions.length) {
                    this.isFinished = true;
                    return {
                        finished: true,
                        variables: this.getVariablesSnapshot(),
                        output: this.outputBuffer.join(''),
                        currentLineNumber: this.currentLineNumber,
                        error: null
                    };
                }
                
                return this.createStepResult();
            }
            
            // Continue with next iteration - reset body index
            context.bodyIndex = 0;
            
            // Mark that we're at the FOR line for highlighting
            this.currentLineNumber = this.getForLoopLineNumber();
            return this.createStepResult();
        }
        
        // Execute body instruction
        if (context.bodyIndex < context.instructions.length) {
            const instruction = context.instructions[context.bodyIndex];
            context.bodyIndex++;
            return this.executeInstruction(instruction);
        }
        
        // Body finished, mark that we need increment next step
        context.needsIncrement = true;
        return this.createStepResult();
    }
    
    getForLoopLineNumber() {
        // Try to find the line with "pentru" keyword
        for (let i = 0; i < this.sourceLines.length; i++) {
            if (this.sourceLines[i].content.includes('pentru')) {
                return this.sourceLines[i].lineNumber;
            }
        }
        return this.currentLineNumber;
    }

    // WHILE LOOP HANDLING
    startWhileLoop(node) {
        const whileNode = node.value;
        if (!whileNode) return this.createStepResult();

        const context = {
            type: 'WHILE',
            node: whileNode,
            bodyIndex: 0,
            instructions: whileNode.block?.children || []
        };

        this.executionStack.push(context);
        return this.createStepResult();
    }

    stepWhileLoop(context) {
        const whileNode = context.node;
        
        // Check condition first
        const condition = whileNode.condition ? this.evaluateExpression(whileNode.condition) : false;
        
        if (!condition) {
            // Exit loop
            this.executionStack.pop();
            
            // Check if program finished
            if (this.executionStack.length === 0 && this.programCounter >= this.instructions.length) {
                this.isFinished = true;
                return {
                    finished: true,
                    variables: this.getVariablesSnapshot(),
                    output: this.outputBuffer.join(''),
                    currentLineNumber: this.currentLineNumber,
                    error: null
                };
            }
            
            return this.createStepResult();
        }
        
        // Execute body instruction
        if (context.bodyIndex < context.instructions.length) {
            const instruction = context.instructions[context.bodyIndex];
            context.bodyIndex++;
            return this.executeInstruction(instruction);
        }
        
        // Body finished, loop back
        context.bodyIndex = 0;
        return this.createStepResult();
    }

    // DO-WHILE LOOP HANDLING
    startDoWhileLoop(node) {
        const doWhileNode = node.value;
        if (!doWhileNode) return this.createStepResult();

        const context = {
            type: 'DO-WHILE',
            node: doWhileNode,
            bodyIndex: 0,
            instructions: doWhileNode.block?.children || [],
            firstIteration: true
        };

        this.executionStack.push(context);
        return this.createStepResult();
    }

    stepDoWhileLoop(context) {
        const doWhileNode = context.node;
        
        // Execute body instruction
        if (context.bodyIndex < context.instructions.length) {
            const instruction = context.instructions[context.bodyIndex];
            context.bodyIndex++;
            return this.executeInstruction(instruction);
        }
        
        // Body finished, check condition
        const condition = doWhileNode.condition ? this.evaluateExpression(doWhileNode.condition) : false;
        
        if (condition) {
            // Continue loop
            context.bodyIndex = 0;
            return this.createStepResult();
        } else {
            // Exit loop
            this.executionStack.pop();
            
            // Check if program finished
            if (this.executionStack.length === 0 && this.programCounter >= this.instructions.length) {
                this.isFinished = true;
                return {
                    finished: true,
                    variables: this.getVariablesSnapshot(),
                    output: this.outputBuffer.join(''),
                    currentLineNumber: this.currentLineNumber,
                    error: null
                };
            }
            
            return this.createStepResult();
        }
    }

    // IF BLOCK HANDLING
    startIfBlock(node) {
        const ifNode = node.value;
        if (!ifNode) return this.createStepResult();

        const condition = ifNode.condition ? this.evaluateExpression(ifNode.condition) : false;
        
        const instructions = condition 
            ? (ifNode.thenBlock?.children || [])
            : (ifNode.elseBlock?.children || []);

        if (instructions.length === 0) {
            return this.createStepResult();
        }

        const context = {
            type: 'IF',
            instructions: instructions,
            bodyIndex: 0
        };

        this.executionStack.push(context);
        return this.createStepResult();
    }

    stepIfBlock(context) {
        if (context.bodyIndex < context.instructions.length) {
            const instruction = context.instructions[context.bodyIndex];
            context.bodyIndex++;
            return this.executeInstruction(instruction);
        }
        
        // Block finished
        this.executionStack.pop();
        
        // Check if program finished
        if (this.executionStack.length === 0 && this.programCounter >= this.instructions.length) {
            this.isFinished = true;
            return {
                finished: true,
                variables: this.getVariablesSnapshot(),
                output: this.outputBuffer.join(''),
                currentLineNumber: this.currentLineNumber,
                error: null
            };
        }
        
        return this.createStepResult();
    }

    executeAssignment(node) {
        const varName = node.value;
        if (node.children && node.children.length > 0) {
            const value = this.evaluateExpression(node.children);
            this.variables.set(varName, value);
        } else {
            this.variables.set(varName, 0);
        }
    }

    executeInput(node) {
        // Mark that we need input for this variable
        this.pendingInput = node.value;
        this.outputBuffer.push(`Citeste ${node.value}: `);
    }
    
    provideInput(varName, value) {
        // Set the variable value from user input
        this.variables.set(varName, parseFloat(value) || 0);
        this.pendingInput = null;
        this.outputBuffer.push(`${value}\n`);
    }

    executeOutput(node) {
        const varName = node.value;
        const value = this.variables.has(varName) ? this.variables.get(varName) : varName;
        this.outputBuffer.push(value.toString() + '\n');
    }

    executeOutputStr(node) {
        this.outputBuffer.push(node.value);
    }

    executeOutputExp(node) {
        if (node.children && node.children.length > 0) {
            const value = this.evaluateExpression(node.children);
            this.outputBuffer.push(value.toString() + '\n');
        } else if (node.value) {
            if (Array.isArray(node.value)) {
                const value = this.evaluateExpression(node.value);
                this.outputBuffer.push(value.toString() + '\n');
            } else {
                this.outputBuffer.push(node.value.toString() + '\n');
            }
        }
    }



    evaluateExpression(tokens) {
        if (!tokens || !Array.isArray(tokens) || tokens.length === 0) return 0;

        if (tokens.length === 1) {
            const token = tokens[0];
            if (token.type === 'NUMBER') {
                return parseFloat(token.value);
            }
            if (token.type === 'IDENTIFIER') {
                return this.variables.get(token.value) || 0;
            }
            if (token.type === 'STRING') {
                return token.value;
            }
        }

        // Postfix evaluation
        const stack = [];
        for (const token of tokens) {
            if (token.type === 'NUMBER') {
                stack.push(parseFloat(token.value));
            } else if (token.type === 'IDENTIFIER') {
                stack.push(this.variables.get(token.value) || 0);
            } else if (token.type === 'STRING') {
                stack.push(token.value);
            } else if (token.type === 'OPERATOR') {
                const operator = this.mapOperator(token.value);
                
                if (operator === '!') {
                    const operand = stack.pop();
                    stack.push(!operand);
                } else {
                    const right = stack.pop();
                    const left = stack.pop();
                    stack.push(this.applyOperator(left, operator, right));
                }
            }
        }

        return stack.length > 0 ? stack[0] : 0;
    }

    mapOperator(operator) {
        const operatorMap = {
            'egal': '==',
            'diferit': '!=',
            'si': '&&',
            'sau': '||',
            'not': '!',
            'mod': '%',
            'div': '/'
        };
        return operatorMap[operator] || operator;
    }

    applyOperator(left, operator, right) {
        switch (operator) {
            case '+': return left + right;
            case '-': return left - right;
            case '*': return left * right;
            case '/': return left / right;
            case '%': return left % right;
            case '==': return left === right;
            case '!=': return left !== right;
            case '<': return left < right;
            case '>': return left > right;
            case '<=': return left <= right;
            case '>=': return left >= right;
            case '&&': return left && right;
            case '||': return left || right;
            default: return 0;
        }
    }

    getVariablesSnapshot() {
        // Return a plain object with detailed info for each variable
        const snapshot = {};
        for (const [key, value] of this.variables.entries()) {
            snapshot[key] = {
                value: value,
                type: typeof value === 'number' ? (Number.isInteger(value) ? 'int' : 'double') : typeof value
            };
        }
        return snapshot;
    }

    reset() {
        this.programCounter = 0;
        this.variables.clear();
        this.outputBuffer = [];
        this.executionStack = [];
        this.isFinished = false;
        this.error = null;
        this.pendingInput = null;
    }
}
