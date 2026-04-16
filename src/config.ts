// ─── BigO Lens — Extension Configuration ─────────────────────

import * as vscode from 'vscode';
import { ComplexityClass, COMPLEXITY_WEIGHT } from './core/types';

export interface BigOLensConfig {
  enabled: boolean;
  showInlayHints: boolean;
  showCodeLens: boolean;
  showDiagnostics: boolean;
  complexityThreshold: ComplexityClass;
  showOptimizationHints: boolean;
  showPatternLabels: boolean;
  showLeetCodeLink: boolean;
}

export function getConfig(): BigOLensConfig {
  const cfg = vscode.workspace.getConfiguration('bigoLens');
  return {
    enabled: cfg.get<boolean>('enabled', true),
    showInlayHints: cfg.get<boolean>('showInlayHints', true),
    showCodeLens: cfg.get<boolean>('showCodeLens', true),
    showDiagnostics: cfg.get<boolean>('showDiagnostics', true),
    complexityThreshold: cfg.get<ComplexityClass>('complexityThreshold', 'O(n^2)'),
    showOptimizationHints: cfg.get<boolean>('showOptimizationHints', true),
    showPatternLabels: cfg.get<boolean>('showPatternLabels', true),
    showLeetCodeLink: cfg.get<boolean>('showLeetCodeLink', true),
  };
}

/** Returns true if the given complexity meets or exceeds the warning threshold */
export function exceedsThreshold(complexity: ComplexityClass, config: BigOLensConfig): boolean {
  const threshold = COMPLEXITY_WEIGHT[config.complexityThreshold];
  const weight = COMPLEXITY_WEIGHT[complexity];
  return weight >= threshold && weight > 0;
}

/** Supported language IDs */
export const SUPPORTED_LANGUAGES = ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'];

/** Check if a document is a supported language */
export function isSupportedDocument(doc: vscode.TextDocument): boolean {
  return SUPPORTED_LANGUAGES.includes(doc.languageId);
}
