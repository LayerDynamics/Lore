import ts from "typescript";
import type { PatternMatch } from "./pattern-matcher.ts";

export interface TypeScriptASTNode {
  kind: string;
  text: string;
  line: number;
  column: number;
  children?: TypeScriptASTNode[];
}

export interface DeceptivePattern {
  type: "unused-import" | "empty-function" | "null-return" | "any-cast" | "no-implementation";
  description: string;
  line: number;
  column: number;
  text: string;
}

/**
 * Parse TypeScript/JavaScript code and detect deceptive patterns
 */
export class TypeScriptParser {
  private sourceFile: ts.SourceFile | null = null;

  /**
   * Parse source code into AST
   */
  parse(code: string, filename: string = "temp.ts"): ts.SourceFile {
    this.sourceFile = ts.createSourceFile(
      filename,
      code,
      ts.ScriptTarget.Latest,
      true,
    );
    return this.sourceFile;
  }

  /**
   * Detect deceptive patterns in the AST
   */
  detectDeceptivePatterns(code: string, filename: string = "temp.ts"): DeceptivePattern[] {
    const sourceFile = this.parse(code, filename);
    const patterns: DeceptivePattern[] = [];

    const visit = (node: ts.Node) => {
      // Check for functions that immediately return null/undefined
      if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
        patterns.push(...this.checkEmptyFunction(node, sourceFile));
        patterns.push(...this.checkImmediateNullReturn(node, sourceFile));
      }

      // Check for type assertions abuse (as any)
      if (ts.isAsExpression(node)) {
        patterns.push(...this.checkAnyTypeCast(node, sourceFile));
      }

      // Check for async functions without await
      if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
        if (node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)) {
          patterns.push(...this.checkAsyncWithoutAwait(node, sourceFile));
        }
      }

      // Check for empty try-catch blocks
      if (ts.isTryStatement(node)) {
        patterns.push(...this.checkEmptyTryCatch(node, sourceFile));
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return patterns;
  }

  /**
   * Check for functions with only comments or empty body
   */
  private checkEmptyFunction(
    node: ts.FunctionLikeDeclaration,
    sourceFile: ts.SourceFile,
  ): DeceptivePattern[] {
    const patterns: DeceptivePattern[] = [];

    if (!node.body) return patterns;

    if (ts.isBlock(node.body)) {
      const statements = node.body.statements;
      if (statements.length === 0) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        patterns.push({
          type: "empty-function",
          description: "Function has empty body (no implementation)",
          line: line + 1,
          column: character + 1,
          text: node.getText(sourceFile).substring(0, 100),
        });
      }
    }

    return patterns;
  }

  /**
   * Check for functions that immediately return null/undefined
   */
  private checkImmediateNullReturn(
    node: ts.FunctionLikeDeclaration,
    sourceFile: ts.SourceFile,
  ): DeceptivePattern[] {
    const patterns: DeceptivePattern[] = [];

    if (!node.body || !ts.isBlock(node.body)) return patterns;

    const statements = node.body.statements;
    const firstStatement = statements[0];
    if (statements.length === 1 && firstStatement && ts.isReturnStatement(firstStatement)) {
      const returnStmt = firstStatement;
      const expr = returnStmt.expression;

      if (!expr || expr.kind === ts.SyntaxKind.NullKeyword || expr.kind === ts.SyntaxKind.UndefinedKeyword) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        patterns.push({
          type: "null-return",
          description: "Function only returns null/undefined with no other logic",
          line: line + 1,
          column: character + 1,
          text: node.getText(sourceFile).substring(0, 100),
        });
      }
    }

    return patterns;
  }

  /**
   * Check for 'as any' type casts that hide implementation
   */
  private checkAnyTypeCast(
    node: ts.AsExpression,
    sourceFile: ts.SourceFile,
  ): DeceptivePattern[] {
    const patterns: DeceptivePattern[] = [];

    const type = node.type;
    if (type.kind === ts.SyntaxKind.AnyKeyword) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      patterns.push({
        type: "any-cast",
        description: "Type assertion to 'any' may hide incomplete implementation",
        line: line + 1,
        column: character + 1,
        text: node.getText(sourceFile),
      });
    }

    return patterns;
  }

  /**
   * Check for async functions that don't use await
   */
  private checkAsyncWithoutAwait(
    node: ts.FunctionLikeDeclaration,
    sourceFile: ts.SourceFile,
  ): DeceptivePattern[] {
    const patterns: DeceptivePattern[] = [];

    if (!node.body) return patterns;

    let hasAwait = false;

    const visit = (n: ts.Node) => {
      if (ts.isAwaitExpression(n)) {
        hasAwait = true;
        return;
      }
      ts.forEachChild(n, visit);
    };

    visit(node.body);

    if (!hasAwait) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      const functionName = node.name ? node.name.getText(sourceFile) : "anonymous";
      patterns.push({
        type: "no-implementation",
        description: `Async function '${functionName}' has no await statements`,
        line: line + 1,
        column: character + 1,
        text: node.getText(sourceFile).substring(0, 100),
      });
    }

    return patterns;
  }

  /**
   * Check for empty catch blocks that swallow errors
   */
  private checkEmptyTryCatch(
    node: ts.TryStatement,
    sourceFile: ts.SourceFile,
  ): DeceptivePattern[] {
    const patterns: DeceptivePattern[] = [];

    if (node.catchClause) {
      const catchBlock = node.catchClause.block;
      if (catchBlock.statements.length === 0) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(
          node.catchClause.getStart(),
        );
        patterns.push({
          type: "no-implementation",
          description: "Empty catch block swallows errors without handling",
          line: line + 1,
          column: character + 1,
          text: "catch { }",
        });
      }
    }

    return patterns;
  }

  /**
   * Find unused imports
   */
  findUnusedImports(code: string, filename: string = "temp.ts"): PatternMatch[] {
    const sourceFile = this.parse(code, filename);
    const matches: PatternMatch[] = [];

    // Get all imports
    const imports = new Map<string, { line: number; column: number; text: string }>();
    const usages = new Set<string>();

    const collectImports = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const importClause = node.importClause;
        if (importClause?.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
          importClause.namedBindings.elements.forEach((element) => {
            const name = element.name.getText(sourceFile);
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(element.getStart());
            imports.set(name, {
              line: line + 1,
              column: character + 1,
              text: element.getText(sourceFile),
            });
          });
        }
      }

      ts.forEachChild(node, collectImports);
    };

    const collectUsages = (node: ts.Node) => {
      if (ts.isIdentifier(node)) {
        usages.add(node.getText(sourceFile));
      }
      ts.forEachChild(node, collectUsages);
    };

    collectImports(sourceFile);
    collectUsages(sourceFile);

    // Find imports that are never used
    for (const [name, info] of imports.entries()) {
      // Don't count the import statement itself as a usage
      let usageCount = 0;
      for (const usage of usages) {
        if (usage === name) usageCount++;
      }

      // If only appears once (in the import), it's unused
      if (usageCount <= 1) {
        matches.push({
          pattern: "unused-import",
          line: info.line,
          column: info.column,
          matchedText: info.text,
          context: [],
        });
      }
    }

    return matches;
  }

  /**
   * Get the source file
   */
  getSourceFile(): ts.SourceFile | null {
    return this.sourceFile;
  }
}
