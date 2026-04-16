# Changelog

All notable changes to **BigO Lens** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
