export interface PatternMatch {
  pattern: string;
  line: number;
  column: number;
  matchedText: string;
  context?: string[];
}

export interface PatternDefinition {
  name: string;
  pattern: string | RegExp;
  type: "regex" | "exact" | "keyword";
  caseInsensitive?: boolean;
  severity: "info" | "warning" | "error";
  message: string;
  category: "placeholder" | "mock" | "unused" | "deceptive" | "custom";
  suggestion?: string;
}

/**
 * Pattern matcher for text-based code analysis
 */
export class PatternMatcher {
  private patterns: Map<string, RegExp>;

  constructor() {
    this.patterns = new Map();
  }

  /**
   * Add a pattern to match
   */
  addPattern(name: string, pattern: string | RegExp, flags?: string): void {
    if (typeof pattern === "string") {
      this.patterns.set(name, new RegExp(pattern, flags || "g"));
    } else {
      this.patterns.set(name, pattern);
    }
  }

  /**
   * Match patterns in text content
   */
  matchInContent(content: string, contextLines = 2): PatternMatch[] {
    const matches: PatternMatch[] = [];
    const lines = content.split("\n");

    for (const [name, regex] of this.patterns.entries()) {
      lines.forEach((line, lineIndex) => {
        // Reset lastIndex for global regexes
        regex.lastIndex = 0;

        let match;
        while ((match = regex.exec(line)) !== null) {
          matches.push({
            pattern: name,
            line: lineIndex + 1,
            column: match.index + 1,
            matchedText: match[0],
            context: this.getContext(lines, lineIndex, contextLines),
          });
        }
      });
    }

    return matches;
  }

  /**
   * Match regex pattern in content
   */
  matchRegex(
    content: string,
    pattern: string | RegExp,
    contextLines = 2,
  ): PatternMatch[] {
    const matches: PatternMatch[] = [];
    const lines = content.split("\n");
    const regex = typeof pattern === "string" ? new RegExp(pattern, "gi") : pattern;

    lines.forEach((line, lineIndex) => {
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(line)) !== null) {
        matches.push({
          pattern: typeof pattern === "string" ? pattern : pattern.source,
          line: lineIndex + 1,
          column: match.index + 1,
          matchedText: match[0],
          context: this.getContext(lines, lineIndex, contextLines),
        });
      }
    });

    return matches;
  }

  /**
   * Match exact text pattern
   */
  matchExact(
    content: string,
    pattern: string,
    caseInsensitive = false,
    contextLines = 2,
  ): PatternMatch[] {
    const matches: PatternMatch[] = [];
    const lines = content.split("\n");

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      if (!line) continue;

      const searchText = caseInsensitive ? pattern.toLowerCase() : pattern;
      const searchLine = caseInsensitive ? line.toLowerCase() : line;

      let index = 0;
      while ((index = searchLine.indexOf(searchText, index)) !== -1) {
        matches.push({
          pattern: pattern,
          line: lineNum + 1,
          column: index + 1,
          matchedText: line.substring(index, index + pattern.length),
          context: this.getContext(lines, lineNum, contextLines),
        });
        index += 1;
      }
    }

    return matches;
  }

  /**
   * Get context lines around a match
   */
  private getContext(lines: string[], lineIndex: number, contextSize: number): string[] {
    const start = Math.max(0, lineIndex - contextSize);
    const end = Math.min(lines.length, lineIndex + contextSize + 1);
    return lines.slice(start, end);
  }

  /**
   * Clear all patterns
   */
  clear(): void {
    this.patterns.clear();
  }
}

/**
 * Match keywords/phrases in content (case-insensitive by default)
 */
export function matchKeywords(
  content: string,
  keywords: string[],
  contextLines = 2,
): PatternMatch[] {
  const matches: PatternMatch[] = [];
  const lines = content.split("\n");

  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");

    lines.forEach((line, lineIndex) => {
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(line)) !== null) {
        matches.push({
          pattern: keyword,
          line: lineIndex + 1,
          column: match.index + 1,
          matchedText: match[0],
          context: getContextLines(lines, lineIndex, contextLines),
        });
      }
    });
  }

  return matches;
}

/**
 * Helper to get context lines
 */
function getContextLines(lines: string[], lineIndex: number, contextSize: number): string[] {
  const start = Math.max(0, lineIndex - contextSize);
  const end = Math.min(lines.length, lineIndex + contextSize + 1);
  return lines.slice(start, end);
}

