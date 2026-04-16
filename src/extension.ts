// ─── BigO Lens — Extension Entry Point ───────────────────────
//
// 🔍 Inline Big-O time & space complexity annotations.
// Pure AST analysis — no AI, no API keys, fully offline.
//
// Author: Yashvardhan Thanvi
// License: MIT

import * as vscode from 'vscode';
import { BigOInlayHintsProvider } from './providers/inlayHints';
import { BigOHoverProvider } from './providers/hover';
import { BigOCodeLensProvider } from './providers/codeLens';
import { BigODiagnosticsProvider } from './providers/diagnostics';
import { exportComplexityReport } from './commands/report';
import { analyzeFile } from './core/analyzer';
import { analysisCache } from './core/cache';
import { getConfig, SUPPORTED_LANGUAGES, isSupportedDocument } from './config';
import { ComplexityResult } from './core/types';

let inlayHintsProvider: BigOInlayHintsProvider;
let codeLensProvider: BigOCodeLensProvider;
let diagnosticsProvider: BigODiagnosticsProvider;

export function activate(context: vscode.ExtensionContext) {
  console.log('BigO Lens activated');

  // ── Providers ──────────────────────────────────────────
  inlayHintsProvider = new BigOInlayHintsProvider();
  const hoverProvider = new BigOHoverProvider();
  codeLensProvider = new BigOCodeLensProvider();
  diagnosticsProvider = new BigODiagnosticsProvider();

  // ── Selectors ──────────────────────────────────────────
  const selector: vscode.DocumentSelector = SUPPORTED_LANGUAGES.map(lang => ({
    language: lang,
    scheme: 'file',
  }));

  // ── Register providers ─────────────────────────────────
  context.subscriptions.push(
    vscode.languages.registerInlayHintsProvider(selector, inlayHintsProvider),
    vscode.languages.registerHoverProvider(selector, hoverProvider),
    vscode.languages.registerCodeLensProvider(selector, codeLensProvider),
    diagnosticsProvider,
  );

  // ── Register commands ──────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('bigoLens.analyzeFile', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || !isSupportedDocument(editor.document)) {
        vscode.window.showWarningMessage('BigO Lens: Open a TypeScript or JavaScript file.');
        return;
      }

      // Force re-analyze by invalidating cache
      analysisCache.invalidate(editor.document.uri.fsPath);
      refreshAll(editor.document);
      vscode.window.showInformationMessage('BigO Lens: Analysis complete ✅');
    }),

    vscode.commands.registerCommand('bigoLens.exportReport', exportComplexityReport),

    vscode.commands.registerCommand('bigoLens.toggleInlayHints', async () => {
      const config = vscode.workspace.getConfiguration('bigoLens');
      const current = config.get<boolean>('showInlayHints', true);
      await config.update('showInlayHints', !current, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(
        `BigO Lens: Inline annotations ${!current ? 'enabled' : 'disabled'}`
      );
    }),

    vscode.commands.registerCommand('bigoLens.showDetail', (fn: ComplexityResult) => {
      // Show the analysis in an information message with details
      const msg = `${fn.functionName}: Time ${fn.time}, Space ${fn.space}`;
      const patterns = fn.patterns.filter(p => p !== 'unknown').join(', ');
      const detail = patterns ? `${msg} | Patterns: ${patterns}` : msg;
      vscode.window.showInformationMessage(`📐 ${detail}`);
    }),

    vscode.commands.registerCommand('bigoLens.openLeetCode', (url: string) => {
      vscode.env.openExternal(vscode.Uri.parse(url));
    }),
  );

  // ── Event listeners ────────────────────────────────────

  // Analyze on document open
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && isSupportedDocument(editor.document)) {
        diagnosticsProvider.update(editor.document);
      }
    })
  );

  // Analyze on document change (debounced)
  let changeTimer: ReturnType<typeof setTimeout> | undefined;
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      if (!isSupportedDocument(event.document)) return;

      // Invalidate cache on change
      analysisCache.invalidate(event.document.uri.fsPath);

      // Debounce to avoid analyzing on every keystroke
      if (changeTimer) clearTimeout(changeTimer);
      changeTimer = setTimeout(() => {
        refreshAll(event.document);
      }, 500);
    })
  );

  // Clean up diagnostics when document closes
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument(document => {
      diagnosticsProvider.clear(document.uri);
      analysisCache.invalidate(document.uri.fsPath);
    })
  );

  // React to config changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('bigoLens')) {
        // Refresh everything
        analysisCache.clear();
        inlayHintsProvider.refresh();
        codeLensProvider.refresh();

        const editor = vscode.window.activeTextEditor;
        if (editor && isSupportedDocument(editor.document)) {
          diagnosticsProvider.update(editor.document);
        }
      }
    })
  );

  // ── Initial analysis of open editors ───────────────────
  for (const editor of vscode.window.visibleTextEditors) {
    if (isSupportedDocument(editor.document)) {
      diagnosticsProvider.update(editor.document);
    }
  }
}

function refreshAll(document: vscode.TextDocument) {
  inlayHintsProvider.refresh();
  codeLensProvider.refresh();
  diagnosticsProvider.update(document);
}

export function deactivate() {
  analysisCache.clear();
  console.log('BigO Lens deactivated');
}
