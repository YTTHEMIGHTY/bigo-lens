// ─── BigO Lens — Algorithmic Pattern Detection ───────────────
//
// Detects recognized algorithmic patterns (two-pointer, sliding window,
// binary search, BFS, DFS, DP, etc.) by analyzing variable names,
// control flow structures, and data structure usage.

import * as ts from 'typescript';
import { PatternKind } from './types';

interface AnalysisInfo {
  maxLoopDepth: number;
  recursion: {
    isSelfRecursive: boolean;
    recursiveCallCount: number;
    hasMemoization: boolean;
    isDividing: boolean;
  };
  allocations: {
    hasArray: boolean;
    hasMap: boolean;
    hasSet: boolean;
    hasMatrix: boolean;
    hasObject: boolean;
    hasLinkedStructure: boolean;
  };
  hasSortCall: boolean;
  paramNames: string[];
}

// ─── Pattern Detection Rules ─────────────────────────────────

interface PatternRule {
  name: PatternKind;
  detect: (source: string, analysis: AnalysisInfo, node: ts.Node, sf: ts.SourceFile) => boolean;
}

const PATTERN_RULES: PatternRule[] = [
  {
    name: 'two-pointer',
    detect: (source, analysis) => {
      const hasPointerVars =
        (source.includes('left') && source.includes('right')) ||
        (source.includes('lo') && source.includes('hi')) ||
        (source.includes('start') && source.includes('end') && source.includes('while'));
      const hasConvergence =
        source.includes('left++') || source.includes('left += ') ||
        source.includes('right--') || source.includes('right -= ') ||
        source.includes('lo++') || source.includes('hi--');
      return hasPointerVars && hasConvergence && analysis.maxLoopDepth >= 1;
    },
  },
  {
    name: 'sliding-window',
    detect: (source, analysis) => {
      const hasWindowVars =
        (source.includes('windowStart') || source.includes('windowEnd')) ||
        (source.includes('start') && source.includes('end') && source.includes('maxLen')) ||
        (source.includes('left') && source.includes('right') && (source.includes('expand') || source.includes('shrink') || source.includes('maxLen') || source.includes('minLen')));
      const hasWindowLogic =
        source.includes('window') ||
        (source.includes('- start') || source.includes('- left')) ||
        source.includes('substring') ||
        source.includes('subarray');
      return (hasWindowVars || hasWindowLogic) && analysis.maxLoopDepth >= 1;
    },
  },
  {
    name: 'binary-search',
    detect: (source, analysis) => {
      const hasMid = source.includes('mid') || source.includes('middle');
      const hasHalving = source.includes('/ 2') || source.includes('>> 1') || source.includes('Math.floor');
      const hasBounds =
        (source.includes('left') && source.includes('right')) ||
        (source.includes('lo') && source.includes('hi')) ||
        (source.includes('low') && source.includes('high'));
      return hasMid && hasHalving && hasBounds;
    },
  },
  {
    name: 'bfs',
    detect: (source, analysis) => {
      const hasQueue =
        source.includes('queue') || source.includes('Queue') ||
        (source.includes('shift()') && source.includes('push('));
      const hasVisited = source.includes('visited') || source.includes('seen');
      const hasNeighbor = source.includes('neighbor') || source.includes('adjacent') || source.includes('child');
      return hasQueue && (hasVisited || hasNeighbor);
    },
  },
  {
    name: 'dfs',
    detect: (source, analysis) => {
      const hasStack = source.includes('stack') || source.includes('Stack');
      const hasVisited = source.includes('visited') || source.includes('seen');
      const isRecursiveWithVisited = analysis.recursion.isSelfRecursive && hasVisited;
      return (hasStack || isRecursiveWithVisited) && (hasVisited || source.includes('neighbor'));
    },
  },
  {
    name: 'dynamic-programming',
    detect: (source, analysis) => {
      const hasDpTable =
        /\bdp\b/.test(source) ||
        source.includes('memo') ||
        source.includes('tabulation') ||
        source.includes('cache');
      const hasOverlappingSubproblems =
        analysis.recursion.hasMemoization ||
        (analysis.allocations.hasArray && source.includes('dp['));
      return hasDpTable && hasOverlappingSubproblems;
    },
  },
  {
    name: 'divide-and-conquer',
    detect: (source, analysis) => {
      return (
        analysis.recursion.isSelfRecursive &&
        analysis.recursion.isDividing &&
        analysis.recursion.recursiveCallCount >= 2 &&
        !analysis.recursion.hasMemoization
      );
    },
  },
  {
    name: 'greedy',
    detect: (source) => {
      const hasGreedyKeywords =
        source.includes('greedy') ||
        (source.includes('Math.max') && source.includes('Math.min')) ||
        source.includes('maxArea') ||
        source.includes('maxProfit') ||
        source.includes('minCost');
      const hasSortAndIterate =
        source.includes('.sort(') &&
        (source.includes('for') || source.includes('while'));
      return hasGreedyKeywords || hasSortAndIterate;
    },
  },
  {
    name: 'backtracking',
    detect: (source, analysis) => {
      const hasBacktrack =
        source.includes('backtrack') ||
        source.includes('permut') ||
        source.includes('combinat');
      const hasUndoStep =
        source.includes('.pop()') && source.includes('.push(') && analysis.recursion.isSelfRecursive;
      return hasBacktrack || hasUndoStep;
    },
  },
  {
    name: 'hash-map',
    detect: (source, analysis) => {
      return (
        (analysis.allocations.hasMap || analysis.allocations.hasSet || source.includes('{}')) &&
        analysis.maxLoopDepth >= 1 &&
        (source.includes('.has(') || source.includes('.get(') || source.includes('.set(') || source.includes('[') && source.includes(']'))
      );
    },
  },
  {
    name: 'sorting',
    detect: (_source, analysis) => {
      return analysis.hasSortCall;
    },
  },
  {
    name: 'stack',
    detect: (source) => {
      const hasStack = source.includes('stack') || source.includes('Stack');
      const hasStackOps = source.includes('.push(') && source.includes('.pop()');
      return hasStack && hasStackOps;
    },
  },
  {
    name: 'heap',
    detect: (source) => {
      return (
        source.includes('heap') ||
        source.includes('Heap') ||
        source.includes('PriorityQueue') ||
        source.includes('priority')
      );
    },
  },
];

// ─── Public API ──────────────────────────────────────────────

export function detectPatterns(
  source: string,
  analysis: AnalysisInfo,
  node: ts.Node,
  sourceFile: ts.SourceFile
): PatternKind[] {
  const detected: PatternKind[] = [];

  for (const rule of PATTERN_RULES) {
    try {
      if (rule.detect(source, analysis, node, sourceFile)) {
        detected.push(rule.name);
      }
    } catch {
      // Skip failed pattern detection — don't break analysis
    }
  }

  // Fallback: if no pattern detected and there are nested loops, mark as brute-force
  if (detected.length === 0 && analysis.maxLoopDepth >= 2) {
    detected.push('brute-force');
  }

  return detected.length > 0 ? detected : ['unknown'];
}

/** Human-readable label for a pattern kind */
export function getPatternLabel(kind: PatternKind): string {
  const labels: Record<PatternKind, string> = {
    'two-pointer': '🎯 Two Pointer',
    'sliding-window': '🪟 Sliding Window',
    'binary-search': '🔍 Binary Search',
    'bfs': '🌊 Breadth-First Search',
    'dfs': '🌲 Depth-First Search',
    'dynamic-programming': '📊 Dynamic Programming',
    'divide-and-conquer': '✂️ Divide & Conquer',
    'greedy': '💰 Greedy',
    'backtracking': '↩️ Backtracking',
    'hash-map': '#️⃣ Hash Map',
    'sorting': '📶 Sorting',
    'stack': '📚 Stack',
    'heap': '⛰️ Heap / Priority Queue',
    'linked-list': '🔗 Linked List',
    'brute-force': '💪 Brute Force',
    'unknown': '❓ Unknown Pattern',
  };
  return labels[kind];
}
