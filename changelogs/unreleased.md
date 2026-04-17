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
