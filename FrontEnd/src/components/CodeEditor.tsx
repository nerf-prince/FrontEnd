import { Editor } from "@monaco-editor/react"
import { useState, useEffect, useRef } from "react"

interface CodeEditorProps {
  onCodeChange: (code: string) => void
  fontSize: string
  editorTheme: string
  wordWrap: boolean
  code: string
  readOnly?: boolean
  language?: string
}

const CodeEditor = ({ onCodeChange, fontSize, editorTheme, wordWrap, code, readOnly = false, language = "pseudocode" }: CodeEditorProps) => {
  const editorRef = useRef<any>(null)
  const [monacoInstance, setMonacoInstance] = useState<any>(null)

  function handleEditorMount(editor: any, monacoInstance: any) {
    editorRef.current = editor
    setMonacoInstance(monacoInstance)
    editor.focus()

    // Înregistrează limbajul personalizat
    monacoInstance.languages.register({ id: "pseudocode" })

    const keywords = ["citeste", "scrie", "daca", "atunci", "altfel", "cat timp", "pentru", "executa", "repeta", "pana cand"]
    const operators = ["sau", "si", "egal", "diferit", "not"]

    const regkw = new RegExp(`\\b(${keywords.join("|")})\\b`)
    const regop = new RegExp(`\\b(${operators.join("|")})\\b`)
    
    // Setează regulile de tokenizare (highlighting) pentru pseudocode
    monacoInstance.languages.setMonarchTokensProvider("pseudocode", {
      keywords,
      tokenizer: {
        root: [
          [regkw, "keyword"],
          [regop, "operator"],
          [/[a-zA-Z_]\w*/, "identifier"],
          [/\d+/, "number"],
          [/".*?"/, "string"],
          [/[+\-*=<>!]+/, "operator"],
          [/\/\//, { token: "comment", next: "@comment" }],
          [/\//, "operator"],
        ],

        comment: [
          [/.*/, "comment", "@pop"],
        ],
      },
    })

    // Configurarea limbajului (comentarii, paranteze etc.)
    monacoInstance.languages.setLanguageConfiguration("pseudocode", {
      comments: { lineComment: "//" },
      brackets: [
        ["{", "}"],
        ["[", "]"],
        ["(", ")"],
      ],
    })

    // Configurare completare automată
    const autoComplete = ["citeste", "scrie", "daca", "atunci", "altfel", "sau", "si", "egal", "diferit", "not", "cat timp", "pentru", "executa", "repeta", "pana cand"]
    monacoInstance.languages.registerCompletionItemProvider("pseudocode", {
      provideCompletionItems: () => ({
        suggestions: autoComplete.map((kw) => ({
          label: kw,
          kind: monacoInstance.languages.CompletionItemKind.Keyword,
          insertText: kw,
        })),
      }),
    })

    // Definirea temei personalizate
    monacoInstance.editor.defineTheme("pseudocode-dark-theme", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "569cd6" },
        { token: "identifier", foreground: "9cdcfe" },
        { token: "number", foreground: "b5cea8" },
        { token: "string", foreground: "ce9178" },
        { token: "operator", foreground: "e8e4c9" },
        { token: "comment", foreground: "608b4e" },
      ],
      colors: {},
    })

    monacoInstance.editor.defineTheme("pseudocode-light-theme", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "0000FF" },
        { token: "identifier", foreground: "000000" },
        { token: "number", foreground: "098658" },
        { token: "string", foreground: "A31515" },
        { token: "operator", foreground: "000000" },
        { token: "comment", foreground: "008000" },
      ],
      colors: {
        "editor.background": "#FFFFFF",
      },
    })

    if (editorTheme === "light") {
      monacoInstance.editor.setTheme("pseudocode-light-theme")
    } else if (editorTheme === "dark") {
      monacoInstance.editor.setTheme("pseudocode-dark-theme")
    }

    // Trigger initial code change to populate the C++ view
    const initialCode = code || localStorage.getItem("code") || "// Scrie pseudocod aici"
    onCodeChange(initialCode)
  }

  const handleEditorChange = (value: string | undefined) => {
    const newValue = value || ''
    onCodeChange(newValue)
    localStorage.setItem("code", newValue)
  }

  useEffect(() => {
    if (editorRef.current && monacoInstance) {
      const editor = editorRef.current
      editor.updateOptions({
        fontSize: parseInt(fontSize, 10),
        wordWrap: wordWrap ? "on" : "off",
      })
      monacoInstance.editor.setTheme(editorTheme === "light" ? "pseudocode-light-theme" : "pseudocode-dark-theme")
    }
  }, [fontSize, editorTheme, wordWrap, monacoInstance])

  return (
    <div className="relative">
      <Editor
        className="h-[50vh]"
        theme="pseudocode-theme"
        defaultLanguage={language}
        language={language}
        value={code}
        defaultValue={localStorage.getItem("code") || "// Scrie pseudocod aici"}
        onMount={language === "pseudocode" ? handleEditorMount : undefined}
        onChange={readOnly ? undefined : handleEditorChange}
        options={{
          automaticLayout: true,
          padding: { top: 20 },
          wordWrap: wordWrap ? "on" : "off",
          fontSize: parseInt(fontSize, 10),
          readOnly: readOnly,
        }}
      />
    </div>
  )
}

export default CodeEditor
