# @kriss-u/py-ast - Python AST Parser for FindLazy

**Version:** 1.0.0+
**Package Type:** JSR Package
**Language:** TypeScript
**Purpose in FindLazy:** Parse Python source code into Abstract Syntax Trees for detecting lazy, incomplete, and deceptive code patterns

---

## Overview

`@kriss-u/py-ast` is a comprehensive TypeScript-based Python source code parser that generates Abstract Syntax Trees (AST) following Python's ASDL (Abstract Syntax Description Language) grammar specification. This package enables FindLazy to analyze Python code structure without requiring a Python runtime, making it ideal for our Deno-based CLI tool.

The library provides complete parsing, unparsing, and AST traversal infrastructure similar to ESPrima for JavaScript, with bidirectional Python code ↔ AST conversion capabilities.

## Why This Package for FindLazy?

### Key Advantages

1. **No Python Runtime Required** - Runs entirely in TypeScript/Deno, eliminating the need to shell out to Python interpreters
2. **TypeScript Native** - Full TypeScript type definitions for all AST nodes, ensuring type safety in our codebase
3. **Bidirectional Conversion** - Can parse Python to AST and unparse AST back to Python, useful for suggesting fixes
4. **ESPrima-Style API** - Familiar API for JavaScript/TypeScript developers
5. **JSON Serializable** - AST nodes can be serialized for caching and reporting
6. **Complete Python 3 Support** - Handles modern Python syntax including async/await, comprehensions, and context managers

### Use Cases in FindLazy

- **Structural Analysis** - Detect empty functions, classes with only `pass` statements
- **Import Analysis** - Find unused imports that suggest incomplete implementations
- **Pattern Detection** - Identify functions returning only `None` or raising `NotImplementedError`
- **AST-Based Matching** - Deep structural pattern matching beyond regex capabilities
- **Code Context** - Extract surrounding code context for better reporting

---

## Installation

```bash
# Using Deno
deno add jsr:@kriss-u/py-ast

# Using npm (for reference)
npm install py-ast
```

**In Deno.json:**

```json
{
  "imports": {
    "@kriss-u/py-ast": "jsr:@kriss-u/py-ast@^1.0.0"
  }
}
```

---

## Core API Reference

### `parse(source: string, options?: ParseOptions): Module`

Parses Python source code into an AST.

**Parameters:**

- `source` - Python source code as a string
- `options` (optional):
  - `filename` - Source filename for error messages (default: `"<unknown>"`)
  - `comments` - Include comment nodes in AST (default: `false`)

**Returns:** `Module` - Root AST node representing the entire Python module

**Example:**

```typescript
import { parse } from "@kriss-u/py-ast";

const code = `
def calculate(x):
    return None  # Lazy implementation!
`;

const ast = parse(code, { filename: "example.py" });
```

**FindLazy Usage:**

```typescript
// Detect empty function implementations
function detectEmptyFunctions(pythonCode: string) {
  const ast = parse(pythonCode);

  for (const node of ast.body) {
    if (node.type === "FunctionDef") {
      if (node.body.length === 1 && node.body[0].type === "Pass") {
        // Found function with only 'pass' - lazy implementation!
      }
    }
  }
}
```

### `unparse(node: AST, options?: UnparseOptions): string`

Converts an AST node back to Python source code.

**Parameters:**

- `node` - Any AST node
- `options` (optional):
  - `indent` - Indentation string (default: `"    "`)

**Returns:** `string` - Python source code

**Example:**

```typescript
import { parse, unparse } from "@kriss-u/py-ast";

const ast = parse("x = 42");
const code = unparse(ast); // "x = 42"
```

**FindLazy Usage:**

```typescript
// Generate fixed code suggestions
function suggestFix(ast: Module): string {
  // Modify AST to fix the issue
  // ...
  return unparse(ast);
}
```

### `walk(node: AST): Generator<AST>`

Performs depth-first traversal of all AST nodes.

**Parameters:**

- `node` - Root AST node to traverse

**Yields:** Each AST node in depth-first order

**Example:**

```typescript
import { parse, walk } from "@kriss-u/py-ast";

const ast = parse("def foo(): return None");

for (const node of walk(ast)) {
  console.log(node.type); // "Module", "FunctionDef", "Return", etc.
}
```

**FindLazy Usage:**

```typescript
// Find all 'return None' statements
function findNullReturns(pythonCode: string) {
  const ast = parse(pythonCode);
  const findings = [];

  for (const node of walk(ast)) {
    if (node.type === "Return" &&
        node.value?.type === "Constant" &&
        node.value.value === null) {
      findings.push({ line: node.lineno, col: node.col_offset });
    }
  }

  return findings;
}
```

### `dump(node: AST, options?: DumpOptions): string`

Generates a formatted string representation of the AST for debugging.

**Parameters:**

- `node` - AST node to dump
- `options` (optional):
  - `indent` - Indentation level (default: `2`)
  - `annotateFields` - Show field names (default: `true`)

**Returns:** `string` - Formatted AST representation

**Example:**

```typescript
import { parse, dump } from "@kriss-u/py-ast";

const ast = parse("x = 42");
console.log(dump(ast));
// Module(
//   body=[
//     Assign(
//       targets=[Name(id='x', ctx=Store())],
//       value=Constant(value=42)
//     )
//   ]
// )
```

### `literalEval(source: string): any`

Safely evaluates Python literal expressions (similar to Python's `ast.literal_eval`).

**Parameters:**

- `source` - Python literal expression

**Returns:** JavaScript value

**Supports:** strings, bytes, numbers, tuples, lists, dicts, sets, booleans, `None`

**Example:**

```typescript
import { literalEval } from "@kriss-u/py-ast";

literalEval("42");                    // 42
literalEval("[1, 2, 3]");            // [1, 2, 3]
literalEval("{'key': 'value'}");     // { key: "value" }
literalEval("None");                 // null
```

### `NodeVisitor` Class

Base class for traversing AST nodes with custom logic.

**Methods:**

- `visit(node)` - Visit a single node
- `genericVisit(node)` - Default visit behavior

**Example:**

```typescript
import { parse, NodeVisitor } from "@kriss-u/py-ast";

class FunctionFinder extends NodeVisitor {
  functions = [];

  visit_FunctionDef(node) {
    this.functions.push(node.name);
    this.genericVisit(node);
  }
}

const ast = parse("def foo(): pass\ndef bar(): pass");
const finder = new FunctionFinder();
finder.visit(ast);
console.log(finder.functions); // ["foo", "bar"]
```

### `NodeTransformer` Class

Base class for transforming AST nodes.

**Methods:**

- `visit(node)` - Visit and potentially transform a node
- `genericVisit(node)` - Default transformation behavior

**Example:**

```typescript
import { parse, unparse, NodeTransformer } from "@kriss-u/py-ast";

class PassRemover extends NodeTransformer {
  visit_Pass(node) {
    return null; // Remove 'pass' statements
  }
}

const ast = parse("def foo():\n    pass\n    print('hello')");
const transformer = new PassRemover();
const newAst = transformer.visit(ast);
console.log(unparse(newAst));
```

---

## AST Node Types Relevant to FindLazy

### Statement Nodes

**`FunctionDef`** - Function definition

- `name` - Function name
- `args` - Arguments
- `body` - List of statements in body
- `decorator_list` - Decorators
- `returns` - Return type annotation

**Detection Patterns:**

- Empty body (only `pass`)
- Single `return None` statement
- Only raises `NotImplementedError`

**`ClassDef`** - Class definition

- `name` - Class name
- `bases` - Base classes
- `body` - Class body statements

**Detection Patterns:**

- Class with only `pass`
- Class with only docstring and `pass`

**`Pass`** - Pass statement (no operation)

**Detection Pattern:** Indicates placeholder or incomplete implementation

**`Return`** - Return statement

- `value` - Return expression (or `null` for bare `return`)

**Detection Patterns:**

- Always returns `None`
- No actual computation before return

**`Raise`** - Raise exception

- `exc` - Exception expression
- `cause` - Exception cause

**Detection Pattern:** `raise NotImplementedError(...)` indicates incomplete code

### Expression Nodes

**`Constant`** - Literal constant value

- `value` - The constant value
- `kind` - Optional kind annotation

**Detection Pattern:** `None` constants may indicate lazy returns

**`Name`** - Variable name

- `id` - Variable identifier
- `ctx` - Load, Store, or Del context

**`Call`** - Function call

- `func` - Function expression
- `args` - Positional arguments
- `keywords` - Keyword arguments

---

## FindLazy Integration Examples

### Example 1: Detect Empty Functions

```typescript
import { parse, type FunctionDef, type Pass } from "@kriss-u/py-ast";

export function detectEmptyFunctions(code: string): Array<{
  name: string;
  line: number;
  type: "empty" | "pass-only";
}> {
  const ast = parse(code);
  const findings = [];

  for (const node of ast.body) {
    if (node.type === "FunctionDef") {
      const func = node as FunctionDef;

      // Check if body is empty
      if (func.body.length === 0) {
        findings.push({
          name: func.name,
          line: func.lineno,
          type: "empty",
        });
      }

      // Check if body is only 'pass'
      if (func.body.length === 1 && func.body[0].type === "Pass") {
        findings.push({
          name: func.name,
          line: func.lineno,
          type: "pass-only",
        });
      }
    }
  }

  return findings;
}
```

### Example 2: Detect Lazy Returns

```typescript
import { parse, walk, type Return, type Constant } from "@kriss-u/py-ast";

export function detectLazyReturns(code: string) {
  const ast = parse(code);
  const findings = [];

  for (const node of walk(ast)) {
    if (node.type === "Return") {
      const returnNode = node as Return;

      // Check for 'return None'
      if (returnNode.value?.type === "Constant" &&
          (returnNode.value as Constant).value === null) {
        findings.push({
          line: returnNode.lineno,
          column: returnNode.col_offset,
          pattern: "return-none",
        });
      }

      // Check for bare 'return' (implicit None)
      if (!returnNode.value) {
        findings.push({
          line: returnNode.lineno,
          column: returnNode.col_offset,
          pattern: "return-bare",
        });
      }
    }
  }

  return findings;
}
```

### Example 3: Detect Not Implemented Errors

```typescript
import { parse, walk, type Raise, type Call, type Name } from "@kriss-u/py-ast";

export function detectNotImplemented(code: string) {
  const ast = parse(code);
  const findings = [];

  for (const node of walk(ast)) {
    if (node.type === "Raise") {
      const raiseNode = node as Raise;

      // Check if raising NotImplementedError
      if (raiseNode.exc?.type === "Call") {
        const call = raiseNode.exc as Call;
        if (call.func.type === "Name" &&
            (call.func as Name).id === "NotImplementedError") {
          findings.push({
            line: raiseNode.lineno,
            column: raiseNode.col_offset,
            pattern: "not-implemented",
          });
        }
      }
    }
  }

  return findings;
}
```

### Example 4: Detect Unused Imports

```typescript
import { parse, walk, type Import, type ImportFrom, type Name } from "@kriss-u/py-ast";

export function detectUnusedImports(code: string) {
  const ast = parse(code);
  const imports = new Set<string>();
  const usages = new Set<string>();

  // Collect all imported names
  for (const node of ast.body) {
    if (node.type === "Import") {
      for (const alias of (node as Import).names) {
        imports.add(alias.asname || alias.name);
      }
    } else if (node.type === "ImportFrom") {
      for (const alias of (node as ImportFrom).names) {
        imports.add(alias.asname || alias.name);
      }
    }
  }

  // Collect all name usages (excluding imports)
  let inImport = false;
  for (const node of walk(ast)) {
    if (node.type === "Import" || node.type === "ImportFrom") {
      inImport = true;
      continue;
    }
    if (inImport && node.type !== "alias") {
      inImport = false;
    }

    if (!inImport && node.type === "Name") {
      usages.add((node as Name).id);
    }
  }

  // Find imports that are never used
  const unused = [];
  for (const importName of imports) {
    if (!usages.has(importName)) {
      unused.push(importName);
    }
  }

  return unused;
}
```

---

## Performance Considerations

### Parsing Speed

- **Average:** ~1ms for small files (<100 LOC)
- **Typical:** ~10-50ms for medium files (100-1000 LOC)
- **Large files:** ~100-500ms for large files (1000-5000 LOC)

### Memory Usage

- Each AST node is a JavaScript object with TypeScript metadata
- Large Python files (>5000 LOC) may consume 10-50MB of memory for the AST
- Consider implementing AST caching for repeated scans

### Optimization Tips for FindLazy

1. **Cache Parsed ASTs** - Store parsed ASTs for files that haven't changed
2. **Use Streaming** - Process files one at a time rather than loading all ASTs in memory
3. **Early Exit** - Stop traversing once required patterns are found
4. **Selective Parsing** - Use text-based regex for initial filtering before expensive AST parsing

---

## Limitations & Known Issues

### Python Version Support

- Primarily supports Python 3.x syntax
- May not fully support bleeding-edge Python features (3.12+)
- Python 2.x syntax is not guaranteed to work

### Edge Cases

- Very complex comprehensions may have parsing quirks
- Some advanced decorator patterns might not parse perfectly
- Walrus operator (`:=`) support depends on version

### Not Supported

- Python AST compilation to bytecode
- Runtime evaluation of Python code
- Type checking or static analysis beyond structural patterns
- Source code formatting/linting (use dedicated tools)

---

## Comparison with Alternatives

| Feature | @kriss-u/py-ast | python-ast | dt-python-parser |
|---------|-----------------|------------|------------------|
| TypeScript Native | ✅ | ✅ | ✅ |
| Deno Compatible | ✅ | ⚠️ | ⚠️ |
| Bidirectional | ✅ | ❌ | ❌ |
| JSON Serializable | ✅ | ❌ | ✅ |
| Active Development | ✅ | ⚠️ | ✅ |
| JSR Package | ✅ | ❌ | ❌ |

**Why @kriss-u/py-ast for FindLazy:**

- Native JSR package (first-class Deno support)
- Bidirectional conversion for suggesting fixes
- JSON serialization for caching
- Clean TypeScript API

---

## Testing & Validation

### Package Test Coverage

- Tested against **7 complex Python files**
- **7,081+ AST nodes** processed successfully
- Perfect roundtrip conversion (parse → unparse maintains code)

### Validation in FindLazy Context

**Test Files to Use:**

```python
# test_lazy.py - For testing FindLazy detection
def mock_function():
    """This function does nothing."""
    pass

def temporary_implementation():
    return None

class PlaceholderClass:
    pass

async def fake_async():
    # TODO: implement actual async logic
    return None

def not_implemented_yet():
    raise NotImplementedError("Coming soon!")
```

**Expected AST Nodes:**

- 5 `FunctionDef` nodes (all suspicious)
- 2 `Pass` statements
- 3 `Return` statements with `None`
- 1 `Raise` with `NotImplementedError`

---

## Integration Checklist for FindLazy

- [x] Add `@kriss-u/py-ast` to `Deno.json` imports
- [ ] Implement `PythonParser` class wrapping py-ast
- [ ] Create pattern detection functions for Python
- [ ] Add Python-specific patterns to `patterns/python.json`
- [ ] Implement AST-based scanners in `src/scanners/python.ts`
- [ ] Add caching layer for parsed Python ASTs
- [ ] Create test suite with sample Python files
- [ ] Add Python file detection in file walker
- [ ] Document Python-specific findings in reporter
- [ ] Add Python code examples to README

---

## Additional Resources

- **JSR Package:** [jsr.io/@kriss-u/py-ast](https://jsr.io/@kriss-u/py-ast)
- **GitHub Repository:** [github.com/kriss-u/py-ast](https://github.com/kriss-u/py-ast)
- **Python AST Reference:** [docs.python.org/3/library/ast.html](https://docs.python.org/3/library/ast.html)
- **Python ASDL Grammar:** [docs.python.org/3/library/ast.html#abstract-grammar](https://docs.python.org/3/library/ast.html#abstract-grammar)

---

## Credits

**Package Author:** @kriss-u
**Built With:** Claude Sonnet 4 (as noted in package documentation)
**License:** MIT (assumed, verify in package)

---

*This documentation was created specifically for FindLazy's use case of detecting lazy, incomplete, and deceptive code patterns in Python source files.*
