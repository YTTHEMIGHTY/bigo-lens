# BigO Lens Architecture

BigO Lens is built as an offline-first VS Code extension leveraging **Static AST Analysis** via the TypeScript Compiler API.

## Core Design Principles

1. **Zero AI / Fully Offline**: Security is paramount. Complexity analysis happens 100% locally on the user's machine without transmitting code to external servers.
2. **Abstract Syntax Tree (AST) Driven**: Complexity is determined by statically evaluating code structure (loops, recursion, allocations) rather than dynamic execution mapping.
3. **Performance First**: The extension should not block the main VS Code UI thread. We utilize aggressive debouncing and an in-memory document cache to ensure minimal CPU load.

## System Components

### 1. The Analyzer Engine (`src/core/analyzer.ts`)
This is the core brain of the extension. It uses `ts.createSourceFile` to parse the active document into an Abstract Syntax Tree (AST).
*   **Time Complexity Detection**: It walks the AST looking for `ForStatement`, `WhileStatement`, `DoStatement`, and recursive function calls, calculating their nesting depth.
*   **Space Complexity Detection**: It analyzes `NewExpression` calls for known allocations like `Set`, `Map`, `Array`, and tracks recursive call stack depth.
*   **Memoization Detection**: Identifies dynamic programming by checking if memoization maps are passed into recursive functions and checked using `.has()`/`.get()`.

### 2. Pattern Matching (`src/core/patterns.ts`)
Heuristic-based pattern recognition flags algorithmic techniques like "Sliding Window", "Two Pointers", or "Binary Search" based on variable declarations and loop configurations (e.g., detecting `let left = 0, right = arr.length`).

### 3. LeetCode Database (`src/core/leetcode.ts`)
A static, non-networked dictionary mapping common coding problem signatures (e.g., `twoSum(nums, target)`) to their optimal known complexities, used to provide comparative hints.

### 4. VS Code Providers (`src/providers/`)
*   **InlayHintsProvider**: Native inline labels (e.g., `⏱ O(n)`) rendered directly into the editor viewport.
*   **HoverProvider**: Markdown-formatted tooltips showing deep-dive complexity analysis tables.
*   **CodeLensProvider**: Clickable tags hovering above function declarations.
*   **DiagnosticsProvider**: Linter-style warning squiggles applied when the complexity exceeds the user's configured threshold (default `O(n^2)`).

## Event Lifecycle

1. User types in `.ts`/`.js` file.
2. `onDidChangeTextDocument` fires in VS Code.
3. Extension debounces for `300ms`.
4. Extracted text is hashed (djb2) to see if underlying AST actually changed.
5. `analyzeFile()` runs.
6. Diagnostic collection updates red squigglies.
7. Event triggers UI providers (CodeLens, Hover, InlayHints) to re-render.
