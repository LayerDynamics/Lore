// Main module exports
export * from "./core/mod.ts";
export {
  PatternMatcher,
  TypeScriptParser,
  PythonParser,
  matchKeywords,
} from "./parsers/mod.ts";
export type {
  PatternMatch,
  TypeScriptDeceptivePattern,
  PythonDeceptivePattern,
  PatternDefinition as MatcherPatternDefinition,
} from "./parsers/mod.ts";
export * from "./scanners/mod.ts";
export * from "./interface/mod.ts";
