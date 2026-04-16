# BigO Lens Development Rules

These rules apply to any AI agent modifying the BigO Lens VS Code extension.

1. **AST Focus**: This extension relies exclusively on the TypeScript Compiler API (`ts`). Never add runtime code injection, standard `eval`, or external network calls to process code. The extension must remain fully offline.
2. **Performance Budget**: Any additions to the recursive AST walker (`walkNode` in `src/core/analyzer.ts`) must be strictly evaluated for performance. Do not introduce O(n^2) graph traversals over the AST nodes.
3. **Graceful Degradation**: Always assume the user's TypeScript or JavaScript code might be syntactically invalid or incomplete. Wrap AST traversal and AST property lookups in safe checks (e.g., `ts.isFunctionDeclaration(node)`). Fail gracefully instead of crashing the language server.
4. **VS Code API usage**: Follow standard VS Code Extension guidelines. Keep the UI implementations (Providers) entirely separate from the logical parsing (Core). Use `vscode.workspace.getConfiguration` to read user settings rather than hardcoding values.
5. **Testing**: Any new logic or pattern rule added to the analyzer must be accompanied by a matching unit test in `__tests__/analyzer.test.ts`. Use Jest for all assertions.
