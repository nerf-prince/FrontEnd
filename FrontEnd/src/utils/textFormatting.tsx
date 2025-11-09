import type { ReactElement } from 'react';

/**
 * Utility function to format text with newline characters (\n) into React elements
 * Each line will be rendered as a separate element with proper line breaks
 */
export const formatTextWithLineBreaks = (text: string | undefined | null): ReactElement | null => {
  if (!text) return null;

  const lines = text.split('\\n');

  return (
    <>
      {lines.map((line, index) => (
        <span key={index}>
          {line}
          {index < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
};

