// ─── BigO Lens — InlayHints Provider ─────────────────────────
//
// Shows inline ⏱ O(n) 📦 O(1) annotations after function signatures.

import * as vscode from 'vscode';
import { analyzeFile } from '../core/analyzer';
import { analysisCache } from '../core/cache';
import { getPatternLabel } from '../core/patterns';
import { getConfig, isSupportedDocument } from '../config';
import { getSeverity } from '../core/types';

export class BigOInlayHintsProvider implements vscode.InlayHintsProvider {

  private readonly _onDidChangeInlayHints = new vscode.EventEmitter<void>();
  readonly onDidChangeInlayHints = this._onDidChangeInlayHints.event;

  refresh(): void {
    this._onDidChangeInlayHints.fire();
  }

  provideInlayHints(
    document: vscode.TextDocument,
    _range: vscode.Range,
    _token: vscode.CancellationToken
  ): vscode.InlayHint[] {
    const config = getConfig();
    if (!config.enabled || !config.showInlayHints || !isSupportedDocument(document)) {
      return [];
    }

    const content = document.getText();
    const filePath = document.uri.fsPath;

    // Check cache first
    let analysis = analysisCache.get(filePath, content);
    if (!analysis) {
      analysis = analyzeFile(content, filePath);
      analysisCache.set(filePath, content, analysis);
    }

    const hints: vscode.InlayHint[] = [];

    for (const fn of analysis.functions) {
      const line = fn.startLine - 1; // 0-based
      if (line < 0 || line >= document.lineCount) continue;

      const lineText = document.lineAt(line).text;

      // Find the end of function signature (after closing paren or before opening brace)
      let insertCol = lineText.length;
      const braceIdx = lineText.indexOf('{');
      const arrowIdx = lineText.indexOf('=>');
      if (braceIdx !== -1) {
        insertCol = braceIdx;
      } else if (arrowIdx !== -1) {
        insertCol = arrowIdx;
      }

      const position = new vscode.Position(line, insertCol);
      const severity = getSeverity(fn.time);

      // ── Time complexity hint ──
      const timeIcon = severity === 'good' ? '🟢' : severity === 'moderate' ? '🟡' : severity === 'warning' ? '🟠' : '🔴';
      const timeHint = new vscode.InlayHint(
        position,
        ` ${timeIcon} ⏱ ${fn.time}`,
        vscode.InlayHintKind.Type
      );
      timeHint.paddingLeft = true;
      timeHint.tooltip = new vscode.MarkdownString(this.buildTimeTooltip(fn));
      hints.push(timeHint);

      // ── Space complexity hint ──
      const spaceHint = new vscode.InlayHint(
        position,
        ` 📦 ${fn.space}`,
        vscode.InlayHintKind.Type
      );
      spaceHint.tooltip = new vscode.MarkdownString(this.buildSpaceTooltip(fn));
      hints.push(spaceHint);

      // ── Pattern label hint ──
      if (config.showPatternLabels && fn.patterns.length > 0 && fn.patterns[0] !== 'unknown') {
        const patternLabel = fn.patterns.map(p => getPatternLabel(p)).join(' · ');
        const patternHint = new vscode.InlayHint(
          position,
          ` ${patternLabel}`,
          vscode.InlayHintKind.Type
        );
        patternHint.tooltip = `Detected algorithmic pattern(s)`;
        hints.push(patternHint);
      }

      // ── LeetCode link hint ──
      if (config.showLeetCodeLink && fn.leetcode) {
        const lcText = ` 🔗 LC #${fn.leetcode.number}`;
        const lcHint = new vscode.InlayHint(
          position,
          lcText,
          vscode.InlayHintKind.Type
        );
        const lcTooltip = new vscode.MarkdownString();
        lcTooltip.isTrusted = true;
        lcTooltip.appendMarkdown(`**[${fn.leetcode.name}](${fn.leetcode.url})**\n\n`);
        if (fn.leetcode.optimalTime) {
          lcTooltip.appendMarkdown(`Optimal Time: \`${fn.leetcode.optimalTime}\`\n\n`);
        }
        if (fn.leetcode.optimalSpace) {
          lcTooltip.appendMarkdown(`Optimal Space: \`${fn.leetcode.optimalSpace}\`\n\n`);
        }

        // Compare user's solution with optimal
        if (fn.leetcode.optimalTime && fn.time !== fn.leetcode.optimalTime) {
          lcTooltip.appendMarkdown(`⚠️ Your time complexity \`${fn.time}\` differs from optimal \`${fn.leetcode.optimalTime}\`\n\n`);
        }
        if (fn.leetcode.optimalTime && fn.time === fn.leetcode.optimalTime) {
          lcTooltip.appendMarkdown(`✅ Your time complexity matches the optimal solution!\n\n`);
        }

        lcHint.tooltip = lcTooltip;
        hints.push(lcHint);
      }
    }

    return hints;
  }

  private buildTimeTooltip(fn: import('../core/types').ComplexityResult): string {
    const lines: string[] = [
      `### ⏱ Time Complexity: \`${fn.time}\``,
      '',
      '**Analysis breakdown:**',
    ];

    for (const exp of fn.explanation) {
      lines.push(`- ${exp}`);
    }

    lines.push('', `Confidence: ${Math.round(fn.confidence * 100)}%`);

    if (fn.optimizations.length > 0) {
      lines.push('', '---', '', '### 💡 Optimization Hints');
      for (const opt of fn.optimizations) {
        lines.push(`- **${opt.technique}**: ${opt.message}`);
        lines.push(`  - Current: \`${opt.currentComplexity}\` → Suggested: \`${opt.suggestedComplexity}\``);
      }
    }

    return lines.join('\n');
  }

  private buildSpaceTooltip(fn: import('../core/types').ComplexityResult): string {
    const spaceExplanations = fn.explanation.filter(e =>
      e.toLowerCase().includes('space') ||
      e.toLowerCase().includes('alloc') ||
      e.toLowerCase().includes('map') ||
      e.toLowerCase().includes('set') ||
      e.toLowerCase().includes('array') ||
      e.toLowerCase().includes('memo') ||
      e.toLowerCase().includes('dp') ||
      e.toLowerCase().includes('matrix') ||
      e.toLowerCase().includes('copy')
    );

    const lines = [
      `### 📦 Space Complexity: \`${fn.space}\``,
      '',
    ];

    if (spaceExplanations.length > 0) {
      lines.push('**Analysis breakdown:**');
      for (const exp of spaceExplanations) {
        lines.push(`- ${exp}`);
      }
    } else if (fn.space === 'O(1)') {
      lines.push('No additional data structures allocated — constant space.');
    }

    return lines.join('\n');
  }
}
