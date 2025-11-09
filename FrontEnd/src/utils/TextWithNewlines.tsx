import React from 'react'
import { parseNewlines } from './subjectLoader'

interface TextWithNewlinesProps {
  text: string | undefined | null
  className?: string
}

/**
 * Component that renders text with \n characters converted to actual line breaks
 */
export function TextWithNewlines({ text, className = '' }: TextWithNewlinesProps) {
  const lines = parseNewlines(text)

  if (lines.length === 0) return null

  return (
    <p className={className}>
      {lines.map((line, index) => (
        <React.Fragment key={index}>
          {line}
          {index < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </p>
  )
}

interface CodeWithNewlinesProps {
  code: string | undefined | null
  className?: string
}

/**
 * Component that renders code with \n characters converted to actual line breaks
 */
export function CodeWithNewlines({ code, className = 'bg-gray-100 p-3 rounded mb-3 text-sm overflow-x-auto' }: CodeWithNewlinesProps) {
  if (!code) return null

  const lines = parseNewlines(code)

  return (
    <pre className={className}>
      <code>
        {lines.map((line, index) => (
          <React.Fragment key={index}>
            {line}
            {index < lines.length - 1 && '\n'}
          </React.Fragment>
        ))}
      </code>
    </pre>
  )
}

