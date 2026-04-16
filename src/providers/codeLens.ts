// ─── BigO Lens — CodeLens Provider ───────────────────────────
//
// Shows a clickable "📐 Analyze Complexity" lens above each function.

import * as vscode from 'vscode';
import { analyzeFile } from '../core/analyzer';
import { analysisCache } from '../core/cache';
import { getConfig, isSupportedDocument } from '../config';
import { getSeverity } from '../core/types';

export class BigOCodeLensProvider implements vscode.CodeLensProvider {

  private readonly _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }

  provideCodeLenses(document: vscode.TextDocument, _token: vscode.CancellationToken): vscode.CodeLens[] {
    const config = getConfig();
    if (!config.enabled || !config.showCodeLens || !isSupportedDocument(document)) {
      return [];
    }

    const content = document.getText();
    const filePath = document.uri.fsPath;

    let analysis = analysisCache.get(filePath, content);
    if (!analysis) {
      analysis = analyzeFile(content, filePath);
      analysisCache.set(filePath, content, analysis);
    }

    const lenses: vscode.CodeLens[] = [];

    for (const fn of analysis.functions) {
      const line = fn.startLine - 1; // 0-based
      if (line < 0 || line >= document.lineCount) continue;

      const range = new vscode.Range(line, 0, line, 0);
      const severity = getSeverity(fn.time);
      const icon = severity === 'good' ? '🟢' : severity === 'moderate' ? '🟡' : severity === 'warning' ? '🟠' : '🔴';

      // Main complexity lens
      const summaryParts = [`${icon} Time: ${fn.time}`, `Space: ${fn.space}`];
      
      if (fn.patterns.length > 0 && fn.patterns[0] !== 'unknown') {
        summaryParts.push(`Pattern: ${fn.patterns[0]}`);
      }

      if (fn.leetcode) {
        summaryParts.push(`LC #${fn.leetcode.number}`);
      }

      const lens = new vscode.CodeLens(range, {
        title: `📐 ${summaryParts.join('  ·  ')}`,
        command: 'bigoLens.showDetail',
        arguments: [fn],
        tooltip: 'Click to see detailed complexity analysis',
      });

      lenses.push(lens);

      // Optimization hint lens (if any)
      if (config.showOptimizationHints && fn.optimizations.length > 0) {
        const optLens = new vscode.CodeLens(range, {
          title: `💡 ${fn.optimizations[0].technique}: ${fn.optimizations[0].currentComplexity} → ${fn.optimizations[0].suggestedComplexity}`,
          command: 'bigoLens.showDetail',
          arguments: [fn],
          tooltip: fn.optimizations[0].message,
        });
        lenses.push(optLens);
      }

      // LeetCode comparison lens
      if (config.showLeetCodeLink && fn.leetcode?.optimalTime) {
        const isOptimal = fn.time === fn.leetcode.optimalTime;
        const lcLens = new vscode.CodeLens(range, {
          title: isOptimal
            ? `✅ Matches LeetCode optimal: ${fn.leetcode.optimalTime}`
            : `⚠️ LeetCode optimal: ${fn.leetcode.optimalTime} (yours: ${fn.time})`,
          command: 'bigoLens.openLeetCode',
          arguments: [fn.leetcode.url],
          tooltip: `Open LeetCode #${fn.leetcode.number} — ${fn.leetcode.name}`,
        });
        lenses.push(lcLens);
      }
    }

    return lenses;
  }
}
