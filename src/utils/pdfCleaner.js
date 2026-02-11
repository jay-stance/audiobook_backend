/**
 * PDF Text Cleaning Algorithm
 * Removes artifacts from PDF text extraction to produce clean, readable text.
 */

/**
 * Remove page number patterns like "Page 4 of 20", "- 4 -", "4", etc.
 */
function removePageNumbers(text) {
  return text
    // "Page X of Y" patterns
    .replace(/page\s+\d+\s+of\s+\d+/gi, '')
    // "- X -" patterns
    .replace(/\n\s*-\s*\d+\s*-\s*\n/g, '\n')
    // Standalone numbers on their own line (likely page numbers)
    .replace(/\n\s*\d{1,4}\s*\n/g, '\n');
}

/**
 * Reconnect hyphenated words that were split across lines.
 * e.g., "com-\nputer" → "computer"
 */
function reconnectHyphenatedWords(text) {
  return text.replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2');
}

/**
 * Remove repeated headers/footers.
 * Detects lines that appear on many pages (>3 occurrences) and removes them.
 */
function removeRepeatedHeadersFooters(text) {
  const lines = text.split('\n');
  const lineCounts = {};

  // Count occurrences of each trimmed line
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.length > 3 && trimmed.length < 100) {
      lineCounts[trimmed] = (lineCounts[trimmed] || 0) + 1;
    }
  });

  // Remove lines that appear more than 3 times (likely headers/footers)
  return lines
    .filter(line => {
      const trimmed = line.trim();
      return !(lineCounts[trimmed] && lineCounts[trimmed] > 3);
    })
    .join('\n');
}

/**
 * Normalize whitespace: collapse multiple newlines, remove excess spaces.
 */
function normalizeWhitespace(text) {
  return text
    // Collapse multiple spaces into one
    .replace(/[ \t]+/g, ' ')
    // Collapse 3+ newlines into 2 (paragraph break)
    .replace(/\n{3,}/g, '\n\n')
    // Remove leading/trailing whitespace on each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim();
}

/**
 * Remove common PDF artifacts
 */
function removeArtifacts(text) {
  return text
    // Remove form feed characters
    .replace(/\f/g, '\n')
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove excessive special characters
    .replace(/[^\S\n]+/g, ' ')
    // Remove lines that are just symbols
    .replace(/\n[^\w\n]*\n/g, '\n');
}

/**
 * Main cleaning function — runs all cleaning steps in sequence.
 */
export function cleanPDFText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;
  text = removeArtifacts(text);
  text = removePageNumbers(text);
  text = reconnectHyphenatedWords(text);
  text = removeRepeatedHeadersFooters(text);
  text = normalizeWhitespace(text);

  return text;
}

/**
 * Clean text per page.
 */
export function cleanPageText(pageText) {
  if (!pageText || typeof pageText !== 'string') return '';

  let text = pageText;
  text = removeArtifacts(text);
  text = removePageNumbers(text);
  text = reconnectHyphenatedWords(text);
  text = normalizeWhitespace(text);

  return text;
}

export default { cleanPDFText, cleanPageText };
