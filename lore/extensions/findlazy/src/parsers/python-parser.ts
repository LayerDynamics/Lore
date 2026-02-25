import { parse, walk, type Module } from "@kriss-u/py-ast";
import type { PatternMatch } from "./pattern-matcher.ts";

export interface PythonASTNode {
  type: string;
  lineno?: number;
  "col_offset"?: number;
  "end_lineno"?: number;
  "end_col_offset"?: number;
  [key: string]: unknown;
}

export interface DeceptivePattern {
  type:
    | "unused-import"
    | "empty-function"
    | "pass-only"
    | "none-return"
    | "not-implemented"
    | "empty-class";
  description: string;
  line: number;
  column: number;
  text: string;
  context?: string;
}

/**
 * Parse Python code and detect deceptive/lazy patterns
 */
export class PythonParser {
  private ast: Module | null = null;
  private sourceLines: string[] = [];

  /**
   * Parse Python source code into AST
   */
  parse(code: string, filename: string = "temp.py"): Module {
    this.ast = parse(code, { filename });
    this.sourceLines = code.split("\n");
    return this.ast;
  }

  /**
   * Detect all deceptive patterns in Python code
   */
  detectDeceptivePatterns(code: string, filename: string = "temp.py"): DeceptivePattern[] {
    this.parse(code, filename);
    const patterns: DeceptivePattern[] = [];

    if (!this.ast) return patterns;

    // Check each top-level statement
    for (const node of this.ast.body) {
      const nodeTyped = node as unknown as PythonASTNode;

      // Check functions
      if (nodeTyped.type === "FunctionDef" || nodeTyped.type === "AsyncFunctionDef") {
        patterns.push(...this.checkFunction(nodeTyped));
      }

      // Check classes
      if (nodeTyped.type === "ClassDef") {
        patterns.push(...this.checkClass(nodeTyped));
      }
    }

    return patterns;
  }

  /**
   * Check function for deceptive patterns
   */
  private checkFunction(node: PythonASTNode): DeceptivePattern[] {
    const patterns: DeceptivePattern[] = [];
    const body = node.body as PythonASTNode[] | undefined;
    const name = node.name as string;

    if (!body || body.length === 0) {
      return patterns;
    }

    // Filter out docstrings (first expression statement with string constant)
    const nonDocBody = this.filterDocstrings(body);

    // Check for empty function (no implementation after docstring)
    if (nonDocBody.length === 0) {
      patterns.push({
        type: "empty-function",
        description: `Function '${name}' has no implementation (only docstring)`,
        line: node.lineno || 0,
        column: node["col_offset"] || 0,
        text: this.getNodeText(node),
        context: name,
      });
      return patterns;
    }

    // Check for pass-only function
    if (nonDocBody.length === 1 && nonDocBody[0]?.type === "Pass") {
      patterns.push({
        type: "pass-only",
        description: `Function '${name}' contains only 'pass' statement`,
        line: node.lineno || 0,
        column: node["col_offset"] || 0,
        text: this.getNodeText(node),
        context: name,
      });
      return patterns;
    }

    // Check for immediate None return
    if (nonDocBody.length === 1 && nonDocBody[0]?.type === "Return") {
      const returnStmt = nonDocBody[0];
      const returnValue = returnStmt.value as PythonASTNode | undefined | null;

      // Check if returning None explicitly or implicitly
      if (
        !returnValue ||
        (returnValue?.type === "Constant" && returnValue.value === null)
      ) {
        patterns.push({
          type: "none-return",
          description: `Function '${name}' only returns None with no other logic`,
          line: node.lineno || 0,
          column: node["col_offset"] || 0,
          text: this.getNodeText(node),
          context: name,
        });
      }
    }

    // Check for NotImplementedError
    if (nonDocBody.length === 1 && nonDocBody[0]?.type === "Raise") {
      const raiseStmt = nonDocBody[0];
      const exc = raiseStmt.exc as PythonASTNode | undefined;

      if (exc) {
        // Check for raise NotImplementedError or raise NotImplementedError()
        const isNotImplemented = exc.type === "Name" && exc.id === "NotImplementedError" ||
          exc.type === "Call" &&
            (exc.func as PythonASTNode)?.type === "Name" &&
            (exc.func as PythonASTNode).id === "NotImplementedError";

        if (isNotImplemented) {
          patterns.push({
            type: "not-implemented",
            description: `Function '${name}' raises NotImplementedError (not implemented)`,
            line: node.lineno || 0,
            column: node["col_offset"] || 0,
            text: this.getNodeText(node),
            context: name,
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Check class for deceptive patterns
   */
  private checkClass(node: PythonASTNode): DeceptivePattern[] {
    const patterns: DeceptivePattern[] = [];
    const body = node.body as PythonASTNode[] | undefined;
    const name = node.name as string;

    if (!body || body.length === 0) {
      return patterns;
    }

    // Filter out docstrings
    const nonDocBody = this.filterDocstrings(body);

    // Check for empty class (only docstring)
    if (nonDocBody.length === 0) {
      patterns.push({
        type: "empty-class",
        description: `Class '${name}' has no implementation (only docstring)`,
        line: node.lineno || 0,
        column: node["col_offset"] || 0,
        text: this.getNodeText(node),
        context: name,
      });
      return patterns;
    }

    // Check for class with only pass
    if (nonDocBody.length === 1 && nonDocBody[0]?.type === "Pass") {
      patterns.push({
        type: "pass-only",
        description: `Class '${name}' contains only 'pass' statement`,
        line: node.lineno || 0,
        column: node["col_offset"] || 0,
        text: this.getNodeText(node),
        context: name,
      });
    }

    return patterns;
  }

  /**
   * Filter out docstrings from body statements
   */
  private filterDocstrings(body: PythonASTNode[]): PythonASTNode[] {
    // Docstring is the first statement if it's an Expr with a Constant string
    if (
      body.length > 0 &&
      body[0]?.type === "Expr"
    ) {
      const firstExpr = body[0];
      const value = firstExpr.value as PythonASTNode | undefined;

      if (
        value?.type === "Constant" &&
        typeof value.value === "string"
      ) {
        // First statement is a docstring, skip it
        return body.slice(1);
      }
    }

    return body;
  }

  /**
   * Find unused imports
   */
  findUnusedImports(code: string, filename: string = "temp.py"): PatternMatch[] {
    this.parse(code, filename);
    const matches: PatternMatch[] = [];

    if (!this.ast) return matches;

    const imports = new Map<string, { line: number; column: number; text: string }>();
    const usages = new Set<string>();

    // Collect all imports
    for (const node of this.ast.body) {
      const nodeTyped = node as unknown as PythonASTNode;

      if (nodeTyped.type === "Import") {
        const names = nodeTyped.names as Array<{ name: string; asname?: string }>;
        for (const alias of names) {
          const importedName = alias.asname || alias.name;
          imports.set(importedName, {
            line: nodeTyped.lineno || 0,
            column: nodeTyped["col_offset"] || 0,
            text: importedName,
          });
        }
      } else if (nodeTyped.type === "ImportFrom") {
        const names = nodeTyped.names as Array<{ name: string; asname?: string }>;
        for (const alias of names) {
          const importedName = alias.asname || alias.name;
          imports.set(importedName, {
            line: nodeTyped.lineno || 0,
            column: nodeTyped["col_offset"] || 0,
            text: importedName,
          });
        }
      }
    }

    // Collect all name usages (walk the entire AST)
    if (this.ast) {
      for (const node of walk(this.ast)) {
        const nodeTyped = node as unknown as PythonASTNode;
        if (nodeTyped.type === "Name") {
          usages.add(nodeTyped.id as string);
        }
      }
    }

    // Find imports that are never used (besides the import statement itself)
    for (const [name, info] of imports.entries()) {
      if (!usages.has(name)) {
        matches.push({
          pattern: "unused-import",
          line: info.line,
          column: info.column,
          matchedText: info.text,
          context: this.getContextLines(info.line),
        });
      }
    }

    return matches;
  }

  /**
   * Find all return None statements
   */
  findNoneReturns(code: string, filename: string = "temp.py"): PatternMatch[] {
    this.parse(code, filename);
    const matches: PatternMatch[] = [];

    if (!this.ast) return matches;

    for (const node of walk(this.ast)) {
      const nodeTyped = node as unknown as PythonASTNode;

      if (nodeTyped.type === "Return") {
        const value = nodeTyped.value as PythonASTNode | undefined | null;

        // Check for explicit None or implicit (no value)
        if (!value || (value?.type === "Constant" && value.value === null)) {
          matches.push({
            pattern: "return-none",
            line: nodeTyped.lineno || 0,
            column: nodeTyped["col_offset"] || 0,
            matchedText: "return None",
            context: this.getContextLines(nodeTyped.lineno || 0),
          });
        }
      }
    }

    return matches;
  }

  /**
   * Find all NotImplementedError raises
   */
  findNotImplemented(code: string, filename: string = "temp.py"): PatternMatch[] {
    this.parse(code, filename);
    const matches: PatternMatch[] = [];

    if (!this.ast) return matches;

    for (const node of walk(this.ast)) {
      const nodeTyped = node as unknown as PythonASTNode;

      if (nodeTyped.type === "Raise") {
        const exc = nodeTyped.exc as PythonASTNode | undefined;

        if (exc) {
          const isNotImplemented = exc.type === "Name" && exc.id === "NotImplementedError" ||
            exc.type === "Call" &&
              (exc.func as PythonASTNode)?.type === "Name" &&
              (exc.func as PythonASTNode).id === "NotImplementedError";

          if (isNotImplemented) {
            matches.push({
              pattern: "not-implemented-error",
              line: nodeTyped.lineno || 0,
              column: nodeTyped["col_offset"] || 0,
              matchedText: "raise NotImplementedError",
              context: this.getContextLines(nodeTyped.lineno || 0),
            });
          }
        }
      }
    }

    return matches;
  }

  /**
   * Find all pass statements
   */
  findPassStatements(code: string, filename: string = "temp.py"): PatternMatch[] {
    this.parse(code, filename);
    const matches: PatternMatch[] = [];

    if (!this.ast) return matches;

    for (const node of walk(this.ast)) {
      const nodeTyped = node as unknown as PythonASTNode;

      if (nodeTyped.type === "Pass") {
        matches.push({
          pattern: "pass-statement",
          line: nodeTyped.lineno || 0,
          column: nodeTyped.col_offset || 0,
          matchedText: "pass",
          context: this.getContextLines(nodeTyped.lineno || 0),
        });
      }
    }

    return matches;
  }

  /**
   * Get text representation of a node (first line or function signature)
   */
  private getNodeText(node: PythonASTNode): string {
    const line = node.lineno || 0;
    if (line > 0 && line <= this.sourceLines.length) {
      const text = this.sourceLines[line - 1] || "";
      return text.trim().substring(0, 80);
    }
    return "";
  }

  /**
   * Get context lines around a specific line
   */
  private getContextLines(line: number, contextSize: number = 2): string[] {
    const start = Math.max(0, line - contextSize - 1);
    const end = Math.min(this.sourceLines.length, line + contextSize);
    return this.sourceLines.slice(start, end);
  }

  /**
   * Get the parsed AST
   */
  getAST(): Module | null {
    return this.ast;
  }
}
