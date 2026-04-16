// ─── BigO Lens — Hover Provider ──────────────────────────────
//
// Shows detailed complexity breakdown when hovering over a function.

import * as vscode from 'vscode';
import { analyzeFile } from '../core/analyzer';
import { analysisCache } from '../core/cache';
import { getPatternLabel } from '../core/patterns';
import { getConfig, isSupportedDocument } from '../config';
import { getSeverity, COMPLEXITY_WEIGHT, ComplexityResult } from '../core/types';

export class BigOHoverProvider implements vscode.HoverProvider {

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.Hover | null {
    const config = getConfig();
    if (!config.enabled || !isSupportedDocument(document)) return null;

    const content = document.getText();
    const filePath = document.uri.fsPath;

    let analysis = analysisCache.get(filePath, content);
    if (!analysis) {
      analysis = analyzeFile(content, filePath);
      analysisCache.set(filePath, content, analysis);
    }

    // Find the function at the hover position
    const line = position.line + 1; // 1-based
    const fn = analysis.functions.find(f => line >= f.startLine && line <= f.endLine);
    if (!fn) return null;

    // Only show hover on the function declaration line itself
    if (line !== fn.startLine) return null;

    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.supportHtml = true;

    md.appendMarkdown(this.buildFullReport(fn, config));

    return new vscode.Hover(md);
  }

  private buildFullReport(fn: ComplexityResult, config: import('../config').BigOLensConfig): string {
    const severity = getSeverity(fn.time);
    const severityIcon = severity === 'good' ? '🟢' : severity === 'moderate' ? '🟡' : severity === 'warning' ? '🟠' : '🔴';

    const sections: string[] = [];

    // ── Header ──
    sections.push(`## ${severityIcon} BigO Lens — \`${fn.functionName}\``);
    sections.push('');

    // ── Complexity Table ──
    sections.push('| Metric | Complexity |');
    sections.push('|--------|------------|');
    sections.push(`| ⏱ **Time** | \`${fn.time}\` |`);
    sections.push(`| 📦 **Space** | \`${fn.space}\` |`);
    sections.push(`| 📊 **Confidence** | ${Math.round(fn.confidence * 100)}% |`);
    sections.push('');

    // ── Patterns ──
    if (config.showPatternLabels && fn.patterns.length > 0 && fn.patterns[0] !== 'unknown') {
      sections.push('### 🏷️ Detected Patterns');
      for (const p of fn.patterns) {
        sections.push(`- ${getPatternLabel(p)}`);
      }
      sections.push('');
    }

    // ── Analysis Breakdown ──
    if (fn.explanation.length > 0) {
      sections.push('### 🔬 Analysis Breakdown');
      for (const exp of fn.explanation) {
        sections.push(`- ${exp}`);
      }
      sections.push('');
    }

    // ── Optimization Hints ──
    if (config.showOptimizationHints && fn.optimizations.length > 0) {
      sections.push('### 💡 Optimization Suggestions');
      for (const opt of fn.optimizations) {
        sections.push(`- **${opt.technique}** — ${opt.message}`);
        sections.push(`  - \`${opt.currentComplexity}\` → \`${opt.suggestedComplexity}\``);
      }
      sections.push('');
    }

    // ── LeetCode ──
    if (config.showLeetCodeLink && fn.leetcode) {
      sections.push('### 🔗 LeetCode');
      sections.push(`**[#${fn.leetcode.number} — ${fn.leetcode.name}](${fn.leetcode.url})**`);
      sections.push('');
      if (fn.leetcode.optimalTime) {
        const timeMatch = fn.time === fn.leetcode.optimalTime;
        sections.push(`- Optimal Time: \`${fn.leetcode.optimalTime}\` ${timeMatch ? '✅ Match!' : `⚠️ Yours: \`${fn.time}\``}`);
      }
      if (fn.leetcode.optimalSpace) {
        const spaceMatch = fn.space === fn.leetcode.optimalSpace;
        sections.push(`- Optimal Space: \`${fn.leetcode.optimalSpace}\` ${spaceMatch ? '✅ Match!' : `⚠️ Yours: \`${fn.space}\``}`);
      }
      sections.push('');
    }

    return sections.join('\n');
  }
}
