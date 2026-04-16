// ─── BigO Lens — Diagnostics Provider ────────────────────────
//
// Shows warning squiggles on functions with complexity exceeding
// the configured threshold.

import * as vscode from 'vscode';
import { analyzeFile } from '../core/analyzer';
import { analysisCache } from '../core/cache';
import { getConfig, exceedsThreshold, isSupportedDocument } from '../config';
import { getSeverity, COMPLEXITY_WEIGHT, ComplexityResult } from '../core/types';

const DIAGNOSTIC_SOURCE = 'BigO Lens';

export class BigODiagnosticsProvider {
  private readonly diagnosticCollection: vscode.DiagnosticCollection;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('bigoLens');
  }

  update(document: vscode.TextDocument): void {
    const config = getConfig();
    if (!config.enabled || !config.showDiagnostics || !isSupportedDocument(document)) {
      this.diagnosticCollection.delete(document.uri);
      return;
    }

    const content = document.getText();
    const filePath = document.uri.fsPath;

    let analysis = analysisCache.get(filePath, content);
    if (!analysis) {
      analysis = analyzeFile(content, filePath);
      analysisCache.set(filePath, content, analysis);
    }

    const diagnostics: vscode.Diagnostic[] = [];

    for (const fn of analysis.functions) {
      if (!exceedsThreshold(fn.time, config)) continue;

      const line = fn.startLine - 1;
      if (line < 0 || line >= document.lineCount) continue;

      const range = document.lineAt(line).range;
      const severity = getSeverity(fn.time);

      const diagSeverity =
        severity === 'critical' ? vscode.DiagnosticSeverity.Error :
        severity === 'warning' ? vscode.DiagnosticSeverity.Warning :
        vscode.DiagnosticSeverity.Information;

      const message = this.buildDiagnosticMessage(fn);
      const diagnostic = new vscode.Diagnostic(range, message, diagSeverity);
      diagnostic.source = DIAGNOSTIC_SOURCE;
      diagnostic.code = fn.time;

      // Add related information for optimization hints
      if (fn.optimizations.length > 0) {
        diagnostic.relatedInformation = fn.optimizations.map(opt =>
          new vscode.DiagnosticRelatedInformation(
            new vscode.Location(document.uri, range),
            `💡 ${opt.technique}: ${opt.message}`
          )
        );
      }

      diagnostics.push(diagnostic);
    }

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  clear(uri?: vscode.Uri): void {
    if (uri) {
      this.diagnosticCollection.delete(uri);
    } else {
      this.diagnosticCollection.clear();
    }
  }

  dispose(): void {
    this.diagnosticCollection.dispose();
  }

  private buildDiagnosticMessage(fn: ComplexityResult): string {
    const parts = [`Time complexity ${fn.time} exceeds threshold.`];

    if (fn.optimizations.length > 0) {
      const opt = fn.optimizations[0];
      parts.push(`Consider: ${opt.technique} (${opt.currentComplexity} → ${opt.suggestedComplexity})`);
    }

    if (fn.leetcode?.optimalTime && fn.time !== fn.leetcode.optimalTime) {
      parts.push(`LeetCode optimal: ${fn.leetcode.optimalTime}`);
    }

    return parts.join(' ');
  }
}
