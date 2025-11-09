import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from './Header'
import CodeEditor from './components/CodeEditor'
import { loadSubjectById } from './utils/subjectLoader'
import type { SubjectData } from './interfaces/SubjectData'
// @ts-ignore
import { interpretor } from '../interpretor/interpretor.js'
// @ts-ignore
import { lexer } from '../interpretor/lexer.js'
// @ts-ignore
import { parser } from '../interpretor/parser.js'
// @ts-ignore
import { generateCPP } from '../transpiler/cppTranspiler.js'
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

function InterpretorWithSubject() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [subject, setSubject] = useState<SubjectData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [code, setCode] = useState<string>('')
  const [fontSize, setFontSize] = useState<string>('14')
  const [editorTheme, setEditorTheme] = useState<string>('dark')
  const [wordWrap, setWordWrap] = useState<boolean>(false)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [output, setOutput] = useState<string>('')
  const [cppCode, setCppCode] = useState<string>('// Codul C++ va apărea aici după transpilare...')
  
  // Debugger state
  const [debugMode, setDebugMode] = useState<boolean>(false)
  const [variables, setVariables] = useState<Record<string, any>>({})
  const [currentLineNumber, setCurrentLineNumber] = useState<number>(0)
  const debuggerRef = useRef<any>(null)
  const editorRef = useRef<any>(null)

  useEffect(() => {
    const loadSubject = async () => {
      try {
        setLoading(true)
        const loadedSubject = await loadSubjectById(id || '')
        if (loadedSubject) {
          setSubject(loadedSubject)
          
          // Extract code from Sub2 Ex1
          const sub2Ex1Code = loadedSubject.Sub2?.Ex1?.Code || loadedSubject.Sub2?.Ex?.[0]?.Code || ''
          setCode(sub2Ex1Code)
          
          // Transpile initial code to C++
          if (sub2Ex1Code) {
            try {
              const tokens = lexer(sub2Ex1Code)
              const ast = parser(tokens)
              const cpp = generateCPP(ast)
              setCppCode(cpp)
            } catch (error: any) {
              setCppCode(`// Eroare la transpilare:\n// ${error.message}`)
            }
          }
        } else {
          navigate('/')
        }
      } catch (error) {
        console.error('Error loading subject:', error)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    loadSubject()
  }, [id, navigate])

  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
    // Auto-transpile to C++ when code changes
    try {
      const tokens = lexer(newCode)
      const ast = parser(tokens)
      const cpp = generateCPP(ast)
      setCppCode(cpp)
    } catch (error: any) {
      setCppCode(`// Eroare la transpilare:\n// ${error.message}`)
    }
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
  }

  const renderRequirements = () => {
    if (!subject?.Sub2) return null

    const sub2 = subject.Sub2
    const ex1 = sub2.Ex1 || (sub2.Ex && sub2.Ex[0])

    if (!ex1) return null

    return (
      <div className="space-y-3">
        {/* Subpoints only */}
        {ex1.a && (
          <div>
            <p className="font-semibold text-gray-900">a) {ex1.a.Sentence}</p>
          </div>
        )}
        {ex1.b && (
          <div>
            <p className="font-semibold text-gray-900">b) {ex1.b.Sentence}</p>
          </div>
        )}
        {ex1.c && (
          <div>
            <p className="font-semibold text-gray-900">c) {ex1.c.Sentence}</p>
          </div>
        )}
        {ex1.d && (
          <div>
            <p className="font-semibold text-gray-900">d) {ex1.d.Sentence}</p>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header showLoginButton={false} onNavigateToLanding={() => navigate('/')} />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <style>{debuggerStyles}</style>
      <Header showLoginButton={false} onNavigateToLanding={() => navigate('/')} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Interpretor Pseudocod - Subiect 2, Ex 1
          </h1>
          <p className="text-gray-600">
            {subject?.AnScolar} - {subject?.Sesiune}
          </p>
        </div>

        {/* Requirements Panel - Top */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="bg-purple-600 text-white px-4 py-3 font-semibold">
            Cerințe Problemă
          </div>
          <div className="p-4">
            {renderRequirements()}
          </div>
        </div>

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
            </div>
          </div>
        </div>

        {/* Editors Row */}
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

          {/* Pseudocode Editor - Second column */}
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

          {/* C++ Transpiled Code (Read-only) - Third column */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-orange-600 text-white px-4 py-3 font-semibold">
              Cod C++
            </div>
            <div className="p-4">
              <CodeEditor
                onCodeChange={() => {}}
                fontSize={fontSize}
                editorTheme={editorTheme}
                wordWrap={wordWrap}
                code={cppCode}
                readOnly={true}
                language="cpp"
              />
            </div>
          </div>
        </div>

        {/* Console Output - Full Width */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-green-600 text-white px-4 py-3 font-semibold">
            Consolă Output
          </div>
          <div className="p-4">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg h-[30vh] overflow-auto text-sm whitespace-pre-wrap font-mono">
              {output || '// Output-ul programului va apărea aici după rulare...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InterpretorWithSubject
