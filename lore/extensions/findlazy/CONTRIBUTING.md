# Contributing to FindLazy

Thank you for your interest in contributing to FindLazy! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- [Deno](https://deno.land/) v2.0 or higher
- Git

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/yourusername/findlazy.git
   cd findlazy
   ```

3. Install dependencies (Deno handles this automatically on first run):
   ```bash
   deno task dev --help
   ```

### Development Workflow

**Run in development mode:**
```bash
deno task dev scan ./src
```

**Run tests:**
```bash
deno task test
```

**Run tests in watch mode:**
```bash
deno task test:watch
```

**Lint code:**
```bash
deno task lint
```

**Format code:**
```bash
deno task fmt
```

**Check formatting:**
```bash
deno task fmt:check
```

## Project Structure

```
src/
├── interface/      # CLI and MCP interfaces
├── core/          # Core utilities
├── parsers/       # Language parsers
└── scanners/      # Code scanners
```

## Code Style

- Follow the existing code style
- Use TypeScript strict mode
- Run `deno fmt` before committing
- All functions should have explicit return types
- Use meaningful variable and function names
- Add comments for complex logic

## Adding New Language Support

1. Create a parser in `src/parsers/`
2. Create a scanner in `src/scanners/`
3. Add pattern definitions in `patterns/`
4. Update tests
5. Update documentation

## Adding New Detection Patterns

1. Add patterns to appropriate JSON file in `patterns/`
2. Implement detection logic in relevant scanner
3. Add test cases
4. Update documentation

## Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Aim for high test coverage
- Include both unit and integration tests

## Commit Messages

Use conventional commits format:

```
type(scope): subject

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or auxiliary tool changes

Examples:
```
feat(scanner): add Go language support
fix(parser): handle multiline comments correctly
docs(readme): update installation instructions
```

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Submit PR with clear description
6. Wait for review and address feedback

## Code Review

All contributions require code review. Reviewers will check:
- Code quality and style
- Test coverage
- Documentation
- Performance implications
- Security considerations

## Questions?

- Open an issue for bugs or feature requests
- Use discussions for questions
- Join our community chat (if available)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
