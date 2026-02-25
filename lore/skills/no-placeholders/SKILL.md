---
name: no-placeholders
description: This skill should be used when the user asks to "scan for stubs", "fix placeholders", "remove mock code", "implement real code", "no more for now", "no more TODO implementations", when conducting code reviews to identify incomplete implementations, or when about to claim a feature is "complete". Also use when encountering any code containing dummy/mock/simulated/stub patterns or when writing plans that might include deferred implementation tasks.
---

# No Placeholders: Zero Tolerance for Incomplete Code

## The Rule

Every function, method, variable, and code path written MUST be a real, working implementation. No exceptions. No stubs. No mocks. No "for now" shortcuts. No deferred implementation.

When writing code, there are exactly two acceptable outcomes:
1. **Implement it fully** — real logic, real data access, real error handling
2. **Tell the user it cannot be implemented** — explain why, what is blocking it, what they need to provide

"I'll implement it for real later" is not a real option.

## Forbidden Patterns

### In Source Code

**Explicit stub markers** — replace with real implementation:
```
// TODO: implement          # TODO: implement
unimplemented!()            // Rust
todo!()                     // Rust
raise NotImplementedError   // Python
throw new Error('Not implemented')    // JS/TS
throw new NotImplementedException     // C#/Java
```

**Placeholder return values** — must return real data:
```
return null;          return None
return [];            return {}
return "placeholder"  return "mock"
```

**Stub comments** — remove these by implementing real logic:
```
// for now               // placeholder
// dummy data            // mock response
// simulated             // hardcoded for now
// in a real implementation...
// in a production environment...
// this would normally fetch from...
// returns mock data
```

**Stub variable names** — rename and implement:
```
const dummyData = ...    let mockResponse = ...
var fakeValue = ...      dummy_result = ...
```

### In Text Responses

These phrases are forbidden when describing written code:

| Forbidden | Why |
|-----------|-----|
| "for now, I'll..." | Signals deferred real work |
| "in a real implementation..." | Admits this is fake |
| "in a production environment..." | Defers to hypothetical |
| "I've mocked/simulated..." | Admits not real |
| "returns mock/dummy/fake data" | Admits fake data |
| "simplified version" | Admits incomplete |
| "you would need to implement..." | Pushes work back to user |
| "hardcoded for now" | Admits placeholder |
| "not fully implemented" | Admits incomplete |
| "partial implementation" | Admits incomplete |

## When Something Genuinely Cannot Be Implemented

Legitimate blocking cases exist:
- Missing credentials, API keys, or environment variables
- External service requiring setup not available in context
- Hardware-specific code requiring physical devices
- Third-party APIs requiring the user's account details

**The correct approach:**
1. Tell the user exactly what is missing — "This requires `OPENAI_API_KEY` in environment"
2. Write the skeleton with clear interface (inputs, outputs, types)
3. Make the integration point throw a clear, actionable error if unconfigured
4. Never pretend the code works

See `references/fix-patterns.md` for the acceptable pattern.

## Scanning for Placeholders

Use Grep to find all instances in a project. The key searches:

```bash
# Language-native stubs (highest priority)
grep -rn "unimplemented!()\|todo!()\|NotImplementedError\|NotImplementedException" .

# Explicit TODO/FIXME in source
grep -rn "TODO\|FIXME\|HACK" --include="*.ts" --include="*.js" --include="*.py" --include="*.rs" .

# Stub labels in comments/names
grep -rni "placeholder\|dummy\|mock\|stub\|fake" --include="*.ts" --include="*.js" --include="*.py" .

# Deceptive phrases
grep -rni "for now\|in a real\|in a production\|hardcoded\|returns mock" --include="*.ts" --include="*.py" .
```

All results should exclude: `node_modules`, `.git`, `target`, `dist`, `build`, `__pycache__`.
Test files (`*.test.*`, `*_spec.*`) are exempt — test doubles are legitimate.

See `references/scan-commands.md` for the complete set of commands with all file extensions and exclusions.

## Fixing Each Pattern Type

The fix for every placeholder type is the same: implement the real logic. Do not delete the comment and leave an empty function — implement what the comment described.

See `references/fix-patterns.md` for before/after code examples in TypeScript, Python, and Rust.

## Integration with Other Workflows

### Writing Plans (`/writing-plans`)
- Plans must not contain tasks phrased as "mock X for now" or "stub Y temporarily"
- Every planned task must include a real implementation strategy
- "TBD" implementation details are not acceptable in plans

### Verify Before Documenting (`/verify-before-documenting`)
- Scan for placeholder patterns before documenting any feature as complete
- Never document a stubbed function as "implemented"
- Any function containing TODO/stub/mock must be documented as "NOT IMPLEMENTED"

## The Standard

Code status is binary:
- ✅ **Done** — real implementation, works as intended, no stubs
- ❌ **Not done** — which is fine to say clearly

There is no ✅-ish. No "mostly done". No "good enough for now".

## Additional Resources

- **`references/fix-patterns.md`** — Before/after code examples for every stub type (TypeScript, Python, Rust)
- **`references/scan-commands.md`** — Complete grep command suite for all languages with exclusion filters