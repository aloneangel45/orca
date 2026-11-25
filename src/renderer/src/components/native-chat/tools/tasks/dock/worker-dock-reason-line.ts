const HEADING = /^#{1,6}\s+/
const BLOCK_MARKER = /^(?:>\s*)*(?:[-*+]\s+|\d+[.)]\s+)?/

function plainInline(line: string): string {
  return line
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(^|\W)[*_](\S(?:.*?\S)?)[*_](?=\W|$)/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim()
}

/** A failed worker's final message cut to one plain sentence: the first prose line (a heading only
 *  when nothing else says why), never the whole report. */
export function workerDockReasonLine(text: string): string {
  let heading = ''
  let fenced = false
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (line.startsWith('```') || line.startsWith('~~~')) {
      fenced = !fenced
      continue
    }
    if (fenced || !line) {
      continue
    }
    if (HEADING.test(line)) {
      heading ||= plainInline(line.replace(HEADING, ''))
      continue
    }
    const plain = plainInline(line.replace(BLOCK_MARKER, ''))
    if (plain) {
      return /^(.+?[.!?])(?:\s|$)/.exec(plain)?.[1] ?? plain
    }
  }
  return heading
}
