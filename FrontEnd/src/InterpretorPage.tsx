import { useState } from 'react'
import Header from './Header'
import CodeEditor from './components/CodeEditor'
// @ts-ignore
import { interpretor } from '../interpretor/interpretor.js'

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

  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
  }

  const handleRunCode = async () => {
    setIsRunning(true)
    setOutput('') // Clear previous output
    
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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

            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Se execută...' : 'Rulează codul'}
            </button>
          </div>
        </div>

        {/* Editor Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pseudocode Editor */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-blue-600 text-white px-4 py-3 font-semibold">
              Editor Pseudocod
            </div>
            <div className="p-4">
              <CodeEditor
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
