import { useState, useRef } from 'react'
import Header from './Header'
import CodeEditor from './components/CodeEditor'
// @ts-ignore
import { interpretor } from '../interpretor/interpretor.js'
// @ts-ignore
import { StepDebugger } from '../interpretor/stepDebugger.js'

// Add CSS for debugger highlighting
const debuggerStyles = `
  .debugger-line-highlight {
    background-color: rgba(255, 235, 59, 0.3) !important;
  }
  .debugger-line-glyph {
    background-color: #ffeb3b;
    width: 5px !important;
    margin-left: 3px;
  }
`;

interface InterpretorPageProps {
  onNavigateBack?: () => void
}

function InterpretorPage({ onNavigateBack }: InterpretorPageProps) {
  const [code, setCode] = useState<string>('')
  const [output, setOutput] = useState<string>('')
  const [fontSize, setFontSize] = useState<string>('14')
  const [editorTheme, setEditorTheme] = useState<string>('dark')
  const [wordWrap, setWordWrap] = useState<boolean>(false)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  
  // Debugger state
  const [debugMode, setDebugMode] = useState<boolean>(false)
  const [variables, setVariables] = useState<Record<string, any>>({})
  const [currentLineNumber, setCurrentLineNumber] = useState<number>(0)
  const [needsInput, setNeedsInput] = useState<boolean>(false)
  const [inputVariable, setInputVariable] = useState<string>('')
  const [inputValue, setInputValue] = useState<string>('')
  const debuggerRef = useRef<any>(null)
  const editorRef = useRef<any>(null)

  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
  }

  const handleRunCode = async () => {
    setIsRunning(true)
    setOutput('')
    setDebugMode(false)
    
    let outputBuffer: string[] = []
    
    const outputToConsole = (text: string, addNewline: boolean = false) => {
      if (addNewline) {
        outputBuffer.push(text + '\n')
      } else {
        outputBuffer.push(text)
      }
      setOutput(outputBuffer.join(''))
    }

    try {
      const maxIterations = 100000
      const isAIassisted = false
      
      await interpretor(code, outputToConsole, maxIterations, isAIassisted)
      
      if (outputBuffer.length === 0) {
        setOutput('// Program executat cu succes (fără output)')
      }
    } catch (error: any) {
      setOutput(`// Eroare:\n${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleStartDebug = () => {
    try {
      debuggerRef.current = new StepDebugger(code)
      setDebugMode(true)
      setVariables({})
      setCurrentLineNumber(0)
      setOutput('// Debug mode: Click "Step In" to execute line by line')
    } catch (error: any) {
      setOutput(`// Eroare la inițializare debugger:\n// ${error.message}`)
    }
  }

  const handleStepIn = () => {
    if (!debuggerRef.current) return

    const result = debuggerRef.current.step()
    
    setVariables(result.variables)
    setOutput(result.output || '// No output yet...')
    setCurrentLineNumber(result.currentLineNumber || 0)
    
    // Check if we need input
    if (result.needsInput) {
      setNeedsInput(true)
      setInputVariable(result.inputVariable || '')
      setInputValue('')
      return
    }
    
    // Highlight current line in editor
    if (editorRef.current && result.currentLineNumber) {
      highlightLine(result.currentLineNumber)
    }
    
    if (result.finished) {
      setDebugMode(false)
      clearHighlight()
      if (result.error) {
        setOutput(prev => prev + `\n\n// Eroare: ${result.error}`)
      } else {
        setOutput(prev => prev + '\n\n// Program terminat')
      }
    }
  }
  
  const handleProvideInput = () => {
    if (!debuggerRef.current || !inputVariable) return
    
    debuggerRef.current.provideInput(inputVariable, inputValue)
    
    // Update state
    setNeedsInput(false)
    setInputVariable('')
    setInputValue('')
    
    // Continue execution - call step again to show the result
    const result = debuggerRef.current.step()
    setVariables(result.variables)
    setOutput(result.output || '// No output yet...')
    setCurrentLineNumber(result.currentLineNumber || 0)
    
    if (editorRef.current && result.currentLineNumber) {
      highlightLine(result.currentLineNumber)
    }
    
    if (result.finished) {
      setDebugMode(false)
      clearHighlight()
      if (result.error) {
        setOutput(prev => prev + `\n\n// Eroare: ${result.error}`)
      } else {
        setOutput(prev => prev + '\n\n// Program terminat')
      }
    }
  }
  
  const highlightLine = (lineNumber: number) => {
    if (!editorRef.current) return
    
    const editor = editorRef.current.getEditor()
    const monaco = editorRef.current.getMonaco()
    if (!editor || !monaco) return
    
    const decorations = editor.deltaDecorations(
      editor.debugDecorations || [],
      [
        {
          range: new monaco.Range(lineNumber, 1, lineNumber, 1),
          options: {
            isWholeLine: true,
            className: 'debugger-line-highlight',
            glyphMarginClassName: 'debugger-line-glyph'
          }
        }
      ]
    )
    
    // Store decorations to clear later
    editor.debugDecorations = decorations
    
    // Scroll to line
    editor.revealLineInCenter(lineNumber)
  }
  
  const clearHighlight = () => {
    if (!editorRef.current) return
    
    const editor = editorRef.current.getEditor()
    if (!editor || !editor.debugDecorations) return
    
    editor.deltaDecorations(editor.debugDecorations, [])
    editor.debugDecorations = []
  }

  const handleResetDebug = () => {
    if (debuggerRef.current) {
      debuggerRef.current.reset()
    }
    clearHighlight()
    setDebugMode(false)
    setVariables({})
    setCurrentLineNumber(0)
    setOutput('')
    setNeedsInput(false)
    setInputVariable('')
    setInputValue('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <style>{debuggerStyles}</style>
      <Header showLoginButton={false} onNavigateToLanding={onNavigateBack} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        {onNavigateBack && (
          <button
            onClick={onNavigateBack}
            className="mb-4 flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Înapoi la pagina principală
          </button>
        )}

        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Interpretor Pseudocod
        </h1>

        {/* Settings Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <label htmlFor="fontSize" className="text-sm font-medium text-gray-700">
                  Font Size:
                </label>
                <select
                  id="fontSize"
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="12">12px</option>
                  <option value="14">14px</option>
                  <option value="16">16px</option>
                  <option value="18">18px</option>
                  <option value="20">20px</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="theme" className="text-sm font-medium text-gray-700">
                  Theme:
                </label>
                <select
                  id="theme"
                  value={editorTheme}
                  onChange={(e) => setEditorTheme(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={wordWrap}
                    onChange={(e) => setWordWrap(e.target.checked)}
                    className="mr-2"
                  />
                  Word Wrap
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              {!debugMode ? (
                <>
                  <button
                    onClick={handleRunCode}
                    disabled={isRunning}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isRunning ? 'Se execută...' : 'Rulează codul'}
                  </button>
                  <button
                    onClick={handleStartDebug}
                    disabled={isRunning}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Debug Mode
                  </button>
                </>
              ) : (
                <>
                  {needsInput ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        Citește {inputVariable}:
                      </span>
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleProvideInput()
                          }
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-32"
                        placeholder="Valoare..."
                        autoFocus
                      />
                      <button
                        onClick={handleProvideInput}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handleStepIn}
                        className="px-6 py-2 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
                      >
                        Step In {currentLineNumber > 0 && `(Line ${currentLineNumber})`}
                      </button>
                      <button
                        onClick={handleResetDebug}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                      >
                        Reset
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Editor Section */}
        <div className={`gap-6 mb-6 ${debugMode ? 'grid grid-cols-1 lg:grid-cols-[200px_1fr_1fr]' : 'grid grid-cols-1 lg:grid-cols-2'}`}>
          {/* Variables Panel (Debug Mode) - First column, narrow */}
          {debugMode && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-indigo-600 text-white px-3 py-2 font-semibold text-sm">
                Variabile
              </div>
              <div className="p-3 h-[50vh] overflow-auto">
                {Object.keys(variables).length === 0 ? (
                  <p className="text-gray-500 text-sm">Nicio variabilă...</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(variables).map(([name, varInfo]: [string, any]) => (
                      <div key={name} className="bg-gray-50 p-2 rounded border border-gray-200">
                        <div className="font-mono font-semibold text-blue-700 text-sm mb-1">{name}</div>
                        <div className="font-mono text-sm bg-white px-2 py-1 rounded border border-gray-300 break-all">
                          {typeof varInfo.value === 'string' ? `"${varInfo.value}"` : String(varInfo.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pseudocode Editor */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-blue-600 text-white px-4 py-3 font-semibold">
              Editor Pseudocod
            </div>
            <div className="p-4">
              <CodeEditor
                ref={editorRef}
                onCodeChange={handleCodeChange}
                fontSize={fontSize}
                editorTheme={editorTheme}
                wordWrap={wordWrap}
                code={code}
              />
            </div>
          </div>

          {/* Output */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-green-600 text-white px-4 py-3 font-semibold">
              Output
            </div>
            <div className="p-4">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg h-[50vh] overflow-auto text-sm whitespace-pre-wrap font-mono">
                {output || '// Output-ul programului va apărea aici după rulare...'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InterpretorPage
