# Changelog

All notable changes to **BigO Lens** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-04-17

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

## [1.1.0] - 2026-04-17

### ✨ Features
- **Complexity Analyzer Overhaul**: Massive AST upgrades to robustly detect O(N) hidden time complexities triggered by all major ES6 standard methods (e.g. `.map`, `.filter`, `indexOf`, `split`, `includes`).
- **Comprehensive Datatype Recognition**: Allocations for buffers and structured sets (`WeakMap`, `WeakSet`, `TypedArrays`, `Buffer.alloc`) now trigger accurate spatial footprint mappings (O(N) space).
- **Scope-Aware DFS Hoisting**: Nested helper functions (i.e. local `dfs` implementations wrapped within parent algorithmic signatures) are now deeply traced, ensuring parent scope appropriately inherits DFS complexity traits.
- **Tree and Graph Inference**: The AST now identifies topological object properties (`.left`, `.right`) mapping properly to algorithmic graph/tree scaling factors.
- **Enhanced Release Automation**: The automated `scripts/release.js` logic completely integrates with the global scope, immediately extracting unreleased states and permanently updating root `CHANGELOG.md` upon releases (avoiding desync issues).
- Added `.github` issue and pull request structural templates standardized perfectly for BigO Lens.

### 🐞 Bug Fixes
- Fixed the previous gap where arrays dynamically grown via `.push()` and `.unshift()` were bypassed as `O(1)` local primitives instead of allocated linearly `O(n)`.
- Replaced misdirected repository parameters inside `.github/ISSUE_TEMPLATE` markdown wrappers targeting legacy origins.

## [1.0.0] - 2026-04-17

### Added
- 🎉 **Initial release**
- Inline Big-O time & space complexity annotations via InlayHints
- Color-coded severity: 🟢 Good · 🟡 Moderate · 🟠 Warning · 🔴 Critical
- CodeLens with complexity summary above every function
- Hover tooltips with detailed analysis breakdown
- Warning diagnostics for high-complexity code (configurable threshold)
- Algorithmic pattern detection (two-pointer, sliding window, binary search, BFS/DFS, DP, greedy, backtracking, hash-map, sorting, stack, heap)
- Optimization hint suggestions for suboptimal code
- LeetCode problem linking with optimal complexity comparison (100+ problems)
- Complexity report export command (markdown)
- Support for TypeScript, JavaScript, TSX, JSX
- Pure AST analysis — no AI, no API keys, fully offline
- In-memory content-hash cache for performance
- Configurable settings for all features
