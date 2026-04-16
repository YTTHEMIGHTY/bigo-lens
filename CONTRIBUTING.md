# Contributing to BigO Lens

Thank you for considering contributing to BigO Lens! This document provides guidelines to make the contribution process smooth and effective.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- [VS Code](https://code.visualstudio.com/) installed
- Git

### Development Setup

1. **Fork & clone** the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/bigo-lens.git
   cd bigo-lens
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the watcher:**
   ```bash
   npm run watch
   ```

4. **Test in VS Code:**
   - Press `F5` to open an Extension Development Host window
   - Open any TypeScript/JavaScript file to see BigO Lens in action

---

## 📁 Project Structure

```
bigo-lens/
├── src/
│   ├── extension.ts              # Entry point (activate/deactivate)
│   ├── config.ts                 # Settings reader
│   ├── core/                     # Analysis engine (no vscode dependency)
│   │   ├── analyzer.ts           # AST complexity analyzer
│   │   ├── patterns.ts           # Algorithmic pattern detection
│   │   ├── leetcode.ts           # LeetCode problem database
│   │   ├── cache.ts              # In-memory content cache
│   │   └── types.ts              # Shared TypeScript types
│   ├── providers/                # VS Code API integration
│   │   ├── inlayHints.ts         # Inline annotations
│   │   ├── hover.ts              # Hover tooltips
│   │   ├── codeLens.ts           # CodeLens above functions
│   │   └── diagnostics.ts        # Warning squiggles
│   └── commands/                 # User-facing commands
│       └── report.ts             # Complexity report generator
├── resources/                    # Extension assets
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript config
└── esbuild.config.mjs            # Build config
```

### Architecture

The codebase is split into two layers:

1. **`src/core/`** — Pure TypeScript analysis logic. No dependency on the `vscode` module. This makes the core independently testable and portable.

2. **`src/providers/` + `src/commands/`** — VS Code integration layer. These consume the core analysis results and present them via VS Code APIs.

---

## 🧪 Testing

```bash
npm test
```

When adding new pattern detection or complexity rules, please add corresponding test cases.

---

## 🔧 Adding New Patterns

To add a new algorithmic pattern:

1. Add the pattern kind to `PatternKind` in `src/core/types.ts`
2. Add a detection rule in `src/core/patterns.ts`
3. Add a label in `getPatternLabel()` in `src/core/patterns.ts`
4. Add test cases

Example pattern rule:
```typescript
{
  name: 'my-pattern',
  detect: (source, analysis, node, sf) => {
    // Return true if the pattern is detected
    return source.includes('someKeyword') && analysis.maxLoopDepth >= 1;
  },
},
```

---

## 📋 Pull Request Guidelines

- **One feature per PR** — Keep PRs focused and reviewable
- **Update CHANGELOG.md** — Add an entry under `[Unreleased]`
- **Follow existing code style** — Consistent naming, comments, and structure
- **Test your changes** — Run `npm test` and test manually via F5
- **Describe your PR** — What, why, and how

---

## 🐛 Reporting Bugs

When filing an issue, please include:
- VS Code version
- BigO Lens version
- The code snippet that triggers the issue
- Expected vs. actual complexity result
- Any error messages from the Output panel (select "BigO Lens" channel)

---

## 💡 Feature Requests

We love ideas! When proposing a feature:
- Describe the use case
- Explain why it would help DSA learners
- If possible, suggest how it could be implemented

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
