### ✨ Features
- Added **Confidence Score** documentation: explains how the `Confidence %` is calculated from AST structural signals (loop depth, sort calls, HashMap allocations, recursion patterns) and what each confidence range means in practice
- Added **"Why BigO Lens is Different"** section to README: comprehensive comparison against runtime profilers and AI-based tools, including a real-world scenario table and three code examples showing where results diverge and why
- Added **two dedicated screenshots** to README:
  - `resources/breakdown.png` — full hover card showing Time, Space, Confidence %, Detected Patterns, and Analysis Breakdown
  - `resources/inline_hint.png` — inline CodeLens annotation directly on the function signature line
- Fully restructured README for a **tech-first audience**: problem-first framing, engineering-focused feature descriptions, algorithm pattern table, code-level examples
- Added **"Scenario Comparison Table"** in README contrasting BigO Lens vs. runtime profilers vs. AI tools across 10 real-world dimensions

### 🐞 Bug Fixes
- 
