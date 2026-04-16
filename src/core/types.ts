// ─── BigO Lens — Shared Types ─────────────────────────────────

/** Represents a Big-O complexity class */
export type ComplexityClass =
  | 'O(1)'
  | 'O(log n)'
  | 'O(n)'
  | 'O(n log n)'
  | 'O(n^2)'
  | 'O(n^3)'
  | 'O(2^n)'
  | 'O(n!)'
  | 'O(?)';

/** Numeric weight for comparing complexity classes */
export const COMPLEXITY_WEIGHT: Record<ComplexityClass, number> = {
  'O(1)': 0,
  'O(log n)': 1,
  'O(n)': 2,
  'O(n log n)': 3,
  'O(n^2)': 4,
  'O(n^3)': 5,
  'O(2^n)': 6,
  'O(n!)': 7,
  'O(?)': -1,
};

/** Severity rating based on complexity */
export type Severity = 'good' | 'moderate' | 'warning' | 'critical';

export function getSeverity(complexity: ComplexityClass): Severity {
  const w = COMPLEXITY_WEIGHT[complexity];
  if (w <= 1) return 'good';       // O(1), O(log n)
  if (w <= 3) return 'moderate';   // O(n), O(n log n)
  if (w <= 5) return 'warning';    // O(n^2), O(n^3)
  return 'critical';               // O(2^n), O(n!)
}

/** Detected algorithmic pattern */
export type PatternKind =
  | 'two-pointer'
  | 'sliding-window'
  | 'binary-search'
  | 'bfs'
  | 'dfs'
  | 'dynamic-programming'
  | 'divide-and-conquer'
  | 'greedy'
  | 'backtracking'
  | 'hash-map'
  | 'sorting'
  | 'stack'
  | 'heap'
  | 'linked-list'
  | 'brute-force'
  | 'unknown';

/** Full analysis result for a single function */
export interface ComplexityResult {
  /** Function name */
  functionName: string;
  /** Line number where the function starts (1-based) */
  startLine: number;
  /** Line number where the function ends (1-based) */
  endLine: number;
  /** Time complexity */
  time: ComplexityClass;
  /** Space complexity */
  space: ComplexityClass;
  /** Confidence score 0-1 */
  confidence: number;
  /** Human-readable explanation of the analysis */
  explanation: string[];
  /** Detected algorithmic patterns */
  patterns: PatternKind[];
  /** Optimization suggestions (if applicable) */
  optimizations: OptimizationHint[];
  /** LeetCode problem info (if function name matches) */
  leetcode?: LeetCodeInfo;
}

/** A single optimization suggestion */
export interface OptimizationHint {
  message: string;
  currentComplexity: ComplexityClass;
  suggestedComplexity: ComplexityClass;
  technique: string;
}

/** LeetCode problem metadata */
export interface LeetCodeInfo {
  number: number;
  name: string;
  url: string;
  optimalTime?: ComplexityClass;
  optimalSpace?: ComplexityClass;
}

/** Result for an entire file */
export interface FileAnalysis {
  filePath: string;
  functions: ComplexityResult[];
  analyzedAt: number;
}
