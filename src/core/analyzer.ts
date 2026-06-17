// ─── BigO Lens — AST Complexity Analyzer ──────────────────────
//
// Performs static analysis on TypeScript/JavaScript source code
// using the TypeScript Compiler API to estimate Big-O time & space
// complexity. Fully offline — no AI, no API keys.

import * as ts from 'typescript';
import {
  ComplexityClass,
  ComplexityResult,
  FileAnalysis,
  COMPLEXITY_WEIGHT,
  OptimizationHint,
} from './types';
import { detectPatterns } from './patterns';
import { resolveLeetCode } from './leetcode';

// ─── Internal Analysis State ─────────────────────────────────

interface LoopInfo {
  depth: number;
  kind: 'for' | 'while' | 'do-while' | 'for-in' | 'for-of';
  /** true if the loop looks like it halves the search space */
  isHalving: boolean;
}

interface RecursionInfo {
  isSelfRecursive: boolean;
  recursiveCallCount: number;
  hasMemoization: boolean;
  /** true if each call reduces input by half */
  isDividing: boolean;
}

interface AllocationInfo {
  hasArray: boolean;
  hasMap: boolean;
  hasSet: boolean;
  hasMatrix: boolean;
  hasObject: boolean;
  hasLinkedStructure: boolean;
}

interface FunctionAnalysis {
  name: string;
  startLine: number;
  endLine: number;
  maxLoopDepth: number;
  loops: LoopInfo[];
  recursion: RecursionInfo;
  allocations: AllocationInfo;
  hasSortCall: boolean;
  hasSlice: boolean;
  hasConcat: boolean;
  hasSplice: boolean;
  explanations: string[];
  paramCount: number;
  paramNames: string[];
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Analyze all functions in a source file and return complexity results.
 */
export function analyzeFile(sourceCode: string, filePath: string): FileAnalysis {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') || filePath.endsWith('.jsx')
      ? ts.ScriptKind.TSX
      : ts.ScriptKind.TS
  );

  const functions = findFunctions(sourceFile);
  const results: ComplexityResult[] = [];

  for (const fn of functions) {
    const analysis = analyzeFunctionNode(fn.node, fn.name, sourceFile);
    const time = computeTimeComplexity(analysis);
    const space = computeSpaceComplexity(analysis);
    const patterns = detectPatterns(sourceCode, analysis, fn.node, sourceFile);
    const optimizations = generateOptimizations(analysis, time);
    const leetcode = resolveLeetCode(fn.name);

    results.push({
      functionName: fn.name,
      startLine: sourceFile.getLineAndCharacterOfPosition(fn.node.getStart(sourceFile)).line + 1,
      endLine: sourceFile.getLineAndCharacterOfPosition(fn.node.getEnd()).line + 1,
      time,
      space,
      confidence: computeConfidence(analysis),
      explanation: analysis.explanations,
      patterns,
      optimizations,
      leetcode: leetcode || undefined,
    });
  }

  return {
    filePath,
    functions: results,
    analyzedAt: Date.now(),
  };
}

/**
 * Analyze a single function from source code (convenience wrapper).
 */
export function analyzeFunction(sourceCode: string, functionName?: string): ComplexityResult | null {
  const result = analyzeFile(sourceCode, 'inline.ts');
  if (functionName) {
    return result.functions.find(f => f.functionName === functionName) || null;
  }
  return result.functions[0] || null;
}

// ─── Function Discovery ─────────────────────────────────────

interface FoundFunction {
  name: string;
  node: ts.Node;
}

function findFunctions(sourceFile: ts.SourceFile): FoundFunction[] {
  const functions: FoundFunction[] = [];

  function visit(node: ts.Node) {
    // function declaration: function foo() {}
    if (ts.isFunctionDeclaration(node) && node.name) {
      functions.push({ name: node.name.text, node });
    }
    // arrow / function expression assigned to const: const foo = () => {}
    else if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (
          ts.isIdentifier(decl.name) &&
          decl.initializer &&
          (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))
        ) {
          functions.push({ name: decl.name.text, node: decl.initializer });
        }
      }
    }
    // method declaration inside class
    else if (ts.isMethodDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
      functions.push({ name: node.name.text, node });
    }
    // export default function
    else if (ts.isExportAssignment(node) && node.expression) {
      if (ts.isFunctionExpression(node.expression) || ts.isArrowFunction(node.expression)) {
        const name = ts.isFunctionExpression(node.expression) && node.expression.name
          ? node.expression.name.text
          : 'default';
        functions.push({ name, node: node.expression });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return functions;
}

// ─── Function Analysis ───────────────────────────────────────

function analyzeFunctionNode(
  node: ts.Node,
  functionName: string,
  sourceFile: ts.SourceFile
): FunctionAnalysis {
  const analysis: FunctionAnalysis = {
    name: functionName,
    startLine: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
    endLine: sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1,
    maxLoopDepth: 0,
    loops: [],
    recursion: {
      isSelfRecursive: false,
      recursiveCallCount: 0,
      hasMemoization: false,
      isDividing: false,
    },
    allocations: {
      hasArray: false,
      hasMap: false,
      hasSet: false,
      hasMatrix: false,
      hasObject: false,
      hasLinkedStructure: false,
    },
    hasSortCall: false,
    hasSlice: false,
    hasConcat: false,
    hasSplice: false,
    explanations: [],
    paramCount: 0,
    paramNames: [],
  };

  // Extract parameters
  if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node)) {
    const params = (node as ts.FunctionDeclaration).parameters;
    if (params) {
      analysis.paramCount = params.length;
      analysis.paramNames = params.map(p => ts.isIdentifier(p.name) ? p.name.text : '?');
    }
  }

  // Walk the AST
  const localFunctions = new Set<string>();
  walkNode(node, 0, analysis, functionName, sourceFile, localFunctions);

  return analysis;
}

function walkNode(
  node: ts.Node,
  currentLoopDepth: number,
  analysis: FunctionAnalysis,
  functionName: string,
  sourceFile: ts.SourceFile,
  localFunctions: Set<string>
): void {
  // Capture locally nested functions for inner DFS hoisting
  if (ts.isFunctionDeclaration(node) && node.name) {
    localFunctions.add(node.name.text);
  } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) {
    localFunctions.add(node.name.text);
  }

  // ── Loop detection ──────────────────────────────────────
  if (ts.isForStatement(node)) {
    const newDepth = currentLoopDepth + 1;
    const isHalving = detectHalvingLoop(node);
    analysis.loops.push({ depth: newDepth, kind: 'for', isHalving });
    analysis.maxLoopDepth = Math.max(analysis.maxLoopDepth, newDepth);
    if (isHalving) {
      analysis.explanations.push(`Halving loop detected at line ${getLine(node, sourceFile)} → O(log n)`);
    } else {
      analysis.explanations.push(`for loop at depth ${newDepth} (line ${getLine(node, sourceFile)})`);
    }
    ts.forEachChild(node, child => walkNode(child, newDepth, analysis, functionName, sourceFile, localFunctions));
    return;
  }

  if (ts.isWhileStatement(node) || ts.isDoStatement(node)) {
    const newDepth = currentLoopDepth + 1;
    const kind = ts.isWhileStatement(node) ? 'while' : 'do-while';
    const isHalving = detectHalvingWhile(node);
    analysis.loops.push({ depth: newDepth, kind, isHalving });
    analysis.maxLoopDepth = Math.max(analysis.maxLoopDepth, newDepth);
    if (isHalving) {
      analysis.explanations.push(`Halving ${kind} loop at line ${getLine(node, sourceFile)} → O(log n)`);
    } else {
      analysis.explanations.push(`${kind} loop at depth ${newDepth} (line ${getLine(node, sourceFile)})`);
    }
    ts.forEachChild(node, child => walkNode(child, newDepth, analysis, functionName, sourceFile, localFunctions));
    return;
  }

  if (ts.isForInStatement(node)) {
    const newDepth = currentLoopDepth + 1;
    analysis.loops.push({ depth: newDepth, kind: 'for-in', isHalving: false });
    analysis.maxLoopDepth = Math.max(analysis.maxLoopDepth, newDepth);
    analysis.explanations.push(`for...in loop at depth ${newDepth} (line ${getLine(node, sourceFile)})`);
    ts.forEachChild(node, child => walkNode(child, newDepth, analysis, functionName, sourceFile, localFunctions));
    return;
  }

  if (ts.isForOfStatement(node)) {
    const newDepth = currentLoopDepth + 1;
    analysis.loops.push({ depth: newDepth, kind: 'for-of', isHalving: false });
    analysis.maxLoopDepth = Math.max(analysis.maxLoopDepth, newDepth);
    analysis.explanations.push(`for...of loop at depth ${newDepth} (line ${getLine(node, sourceFile)})`);
    ts.forEachChild(node, child => walkNode(child, newDepth, analysis, functionName, sourceFile, localFunctions));
    return;
  }

  // ── Higher-order iteration methods (forEach, map, filter, reduce, etc.) ──
  if (ts.isCallExpression(node)) {
    const methodName = getCallMethodName(node);

    const iterationMethods = [
      'forEach', 'map', 'filter', 'reduce', 'reduceRight', 'find', 'some', 'every', 'flatMap', 'findIndex',
      'indexOf', 'lastIndexOf', 'includes', 'join',
      'substring', 'replace', 'replaceAll', 'match', 'matchAll', 'search', 'split', 'trim', 'trimStart', 'trimEnd',
      'padStart', 'padEnd', 'startsWith', 'endsWith'
    ];

    if (methodName && iterationMethods.includes(methodName)) {
      const newDepth = currentLoopDepth + 1;
      analysis.loops.push({ depth: newDepth, kind: 'for-of', isHalving: false });
      analysis.maxLoopDepth = Math.max(analysis.maxLoopDepth, newDepth);
      analysis.explanations.push(`.${methodName}() iteration at depth ${newDepth} (line ${getLine(node, sourceFile)})`);
      ts.forEachChild(node, child => walkNode(child, newDepth, analysis, functionName, sourceFile, localFunctions));
      return;
    }

    // ── Sort detection ──
    if (methodName === 'sort') {
      analysis.hasSortCall = true;
      analysis.explanations.push(`.sort() call at line ${getLine(node, sourceFile)} → O(n log n)`);
    }

    // ── Slice/concat/splice (creates copies → space) ──
    if (methodName === 'slice') {
      analysis.hasSlice = true;
      analysis.explanations.push(`.slice() creates array copy (line ${getLine(node, sourceFile)})`);
    }
    if (methodName === 'concat') {
      analysis.hasConcat = true;
      analysis.explanations.push(`.concat() creates new array (line ${getLine(node, sourceFile)})`);
    }
    if (methodName === 'splice') {
      analysis.hasSplice = true;
    }
    if (methodName === 'push' || methodName === 'unshift') {
      analysis.allocations.hasArray = true;
      analysis.explanations.push(`.${methodName}() adds elements to array (line ${getLine(node, sourceFile)}) → O(n) space`);
    }

    // ── Full library O(N) allocators ──
    const callNameFull = node.expression.getText(sourceFile);
    if (
      ['Object.keys', 'Object.values', 'Object.entries', 'Object.assign', 'Object.fromEntries', 'Array.from', 'Buffer.alloc'].includes(callNameFull)
    ) {
      const newDepth = currentLoopDepth + 1;
      analysis.loops.push({ depth: newDepth, kind: 'for-of', isHalving: false });
      analysis.allocations.hasArray = true;
      analysis.maxLoopDepth = Math.max(analysis.maxLoopDepth, newDepth);
      analysis.explanations.push(`${callNameFull}() iteration/allocation at depth ${newDepth} (line ${getLine(node, sourceFile)})`);
      ts.forEachChild(node, child => walkNode(child, currentLoopDepth, analysis, functionName, sourceFile, localFunctions));
      return;
    }

    // ── Self-recursion detection ──
    const callName = getCallName(node);
    if (callName === functionName || (callName && localFunctions.has(callName))) {
      analysis.recursion.isSelfRecursive = true;
      analysis.recursion.recursiveCallCount++;

      // Check if arguments divide the input  
      const args = node.arguments;
      if (args.length > 0) {
        const argText = args[0].getText(sourceFile);
        if (
          argText.includes('/ 2') ||
          argText.includes('>> 1') ||
          argText.includes('Math.floor') ||
          argText.includes('mid')
        ) {
          analysis.recursion.isDividing = true;
        }
      }

      analysis.explanations.push(`Recursive call to ${functionName} (line ${getLine(node, sourceFile)})`);
    }
  }

  // ── Allocation detection ──
  if (ts.isNewExpression(node)) {
    const exprText = node.expression.getText(sourceFile);
    if (exprText === 'Map' || exprText === 'WeakMap') {
      analysis.allocations.hasMap = true;
      analysis.explanations.push(`new ${exprText}() allocation (line ${getLine(node, sourceFile)}) → O(n) space`);
    } else if (exprText === 'Set' || exprText === 'WeakSet') {
      analysis.allocations.hasSet = true;
      analysis.explanations.push(`new ${exprText}() allocation (line ${getLine(node, sourceFile)}) → O(n) space`);
    } else if (exprText === 'Array' || exprText.includes('Array') || exprText === 'Object') {
      analysis.allocations.hasArray = true;
      analysis.explanations.push(`new ${exprText}() allocation (line ${getLine(node, sourceFile)}) → O(n) space`);
    }
  }

  // ── Graph / Tree Traversal Pointer Detection ──
  if (ts.isPropertyAccessExpression(node)) {
    const propName = node.name.text;
    if (propName === 'left' || propName === 'right') {
       if (analysis.recursion.isSelfRecursive) {
         analysis.recursion.isDividing = true; // Maps standard DFS traversal bounds over recursive height
       }
    }
  }

  // Array literal with spread or large initial content
  if (ts.isArrayLiteralExpression(node) && ts.isVariableDeclaration(node.parent)) {
    if (node.elements.length > 0 || node.getText(sourceFile).includes('...')) {
      analysis.allocations.hasArray = true;
    }
  }

  // ── Memoization detection (Map/Object used for caching) ──
  if (ts.isVariableDeclaration(node) && node.initializer) {
    const initText = node.initializer.getText(sourceFile);
    const nameText = ts.isIdentifier(node.name) ? node.name.text : '';
    if (
      (initText.includes('new Map') || initText === '{}' || initText.includes('new Object')) &&
      (nameText.toLowerCase().includes('memo') ||
        nameText.toLowerCase().includes('cache') ||
        nameText.toLowerCase().includes('dp') ||
        nameText.toLowerCase().includes('visited'))
    ) {
      analysis.recursion.hasMemoization = true;
      analysis.explanations.push(`Memoization detected: "${nameText}" (line ${getLine(node, sourceFile)})`);
    }
  }

  // ── Memoization via function parameter (e.g. memo: Map<> = new Map()) ──
  if (ts.isParameter(node)) {
    const paramName = ts.isIdentifier(node.name) ? node.name.text : '';
    const hasDefault = node.initializer ? node.initializer.getText(sourceFile) : '';
    const typeText = node.type ? node.type.getText(sourceFile) : '';
    if (
      (paramName.toLowerCase().includes('memo') ||
        paramName.toLowerCase().includes('cache') ||
        paramName.toLowerCase().includes('dp')) &&
      (hasDefault.includes('new Map') || hasDefault.includes('new Set') ||
        hasDefault === '{}' || typeText.includes('Map') || typeText.includes('Record'))
    ) {
      analysis.recursion.hasMemoization = true;
      analysis.allocations.hasMap = true;
      analysis.explanations.push(`Memoization via parameter: "${paramName}" (line ${getLine(node, sourceFile)})`);
    }
  }

  // ── Memoization via .has() / .get() on memo-named variables ──
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
    const objName = node.expression.expression.getText(sourceFile).toLowerCase();
    const method = node.expression.name.text;
    if (
      (objName.includes('memo') || objName.includes('cache') || objName.includes('dp')) &&
      (method === 'has' || method === 'get')
    ) {
      analysis.recursion.hasMemoization = true;
    }
  }

  // ── dp array / matrix detection ──
  if (ts.isVariableDeclaration(node) && node.initializer) {
    const initText = node.initializer.getText(sourceFile);
    const nameText = ts.isIdentifier(node.name) ? node.name.text : '';
    if (
      nameText.toLowerCase() === 'dp' ||
      nameText.toLowerCase().includes('table') ||
      nameText.toLowerCase().includes('grid')
    ) {
      // Check if it's a 2D array (Array.from or nested arrays)
      if (initText.includes('Array.from') && initText.includes('Array')) {
        analysis.allocations.hasMatrix = true;
        analysis.explanations.push(`2D DP table detected: "${nameText}" → O(n²) space`);
      } else {
        analysis.allocations.hasArray = true;
        analysis.explanations.push(`DP array detected: "${nameText}" → O(n) space`);
      }
    }
  }

  // Recurse into children
  ts.forEachChild(node, child => walkNode(child, currentLoopDepth, analysis, functionName, sourceFile, localFunctions));
}

// ─── Complexity Computation ──────────────────────────────────

function computeTimeComplexity(analysis: FunctionAnalysis): ComplexityClass {
  const factors: ComplexityClass[] = [];

  // Factor 1: Loop depth
  if (analysis.maxLoopDepth > 0) {
    const hasHalvingLoop = analysis.loops.some(l => l.isHalving);
    const maxNonHalvingDepth = analysis.loops
      .filter(l => !l.isHalving)
      .reduce((max, l) => Math.max(max, l.depth), 0);

    if (hasHalvingLoop && maxNonHalvingDepth === 0) {
      factors.push('O(log n)');
    } else if (maxNonHalvingDepth === 1 && hasHalvingLoop) {
      factors.push('O(n log n)');
    } else if (maxNonHalvingDepth === 1) {
      factors.push('O(n)');
    } else if (maxNonHalvingDepth === 2) {
      factors.push('O(n^2)');
    } else if (maxNonHalvingDepth >= 3) {
      factors.push('O(n^3)');
    }
  }

  // Factor 2: Sorting
  if (analysis.hasSortCall) {
    factors.push('O(n log n)');
  }

  // Factor 3: Recursion
  if (analysis.recursion.isSelfRecursive) {
    if (analysis.recursion.hasMemoization) {
      // Memoized recursion: typically O(n) or O(n^2) depending on state
      factors.push('O(n)');
    } else if (analysis.recursion.isDividing && analysis.recursion.recursiveCallCount === 1) {
      // Single recursive call dividing input → O(log n)
      factors.push('O(log n)');
    } else if (analysis.recursion.isDividing && analysis.recursion.recursiveCallCount === 2) {
      // Two recursive calls dividing input → O(n) (merge sort-like)
      factors.push('O(n log n)');
    } else if (analysis.recursion.recursiveCallCount >= 2) {
      // Multiple recursive calls without memoization → exponential
      factors.push('O(2^n)');
    } else {
      // Single recursive call with linear reduction → O(n)
      factors.push('O(n)');
    }
  }

  // Factor 4: String/array copy operations in loops
  if ((analysis.hasSlice || analysis.hasConcat) && analysis.maxLoopDepth >= 1) {
    // These are O(n) each inside a loop, making it effectively one level deeper
    const currentMax = factors.reduce((max, f) => Math.max(max, COMPLEXITY_WEIGHT[f]), 0);
    if (currentMax <= COMPLEXITY_WEIGHT['O(n)']) {
      factors.push('O(n^2)');
    }
  }

  // Return the worst complexity factor
  if (factors.length === 0) return 'O(1)';
  return factors.reduce((worst, f) => COMPLEXITY_WEIGHT[f] > COMPLEXITY_WEIGHT[worst] ? f : worst);
}

function computeSpaceComplexity(analysis: FunctionAnalysis): ComplexityClass {
  const factors: ComplexityClass[] = [];

  // Allocations
  if (analysis.allocations.hasMatrix) {
    factors.push('O(n^2)');
  }
  if (analysis.allocations.hasMap || analysis.allocations.hasSet || analysis.allocations.hasArray) {
    factors.push('O(n)');
  }
  if (analysis.hasSlice || analysis.hasConcat) {
    factors.push('O(n)');
  }

  // Recursion stack depth
  if (analysis.recursion.isSelfRecursive) {
    if (analysis.recursion.isDividing) {
      factors.push('O(log n)');
    } else {
      factors.push('O(n)');
    }

    // Memoization adds space
    if (analysis.recursion.hasMemoization) {
      factors.push('O(n)');
    }
  }

  if (factors.length === 0) return 'O(1)';
  return factors.reduce((worst, f) => COMPLEXITY_WEIGHT[f] > COMPLEXITY_WEIGHT[worst] ? f : worst);
}

function computeConfidence(analysis: FunctionAnalysis): number {
  let confidence = 0.5; // Base

  // More structural signals → higher confidence
  if (analysis.maxLoopDepth > 0) confidence += 0.15;
  if (analysis.recursion.isSelfRecursive) confidence += 0.1;
  if (analysis.hasSortCall) confidence += 0.15;
  if (analysis.allocations.hasMap || analysis.allocations.hasSet) confidence += 0.1;
  if (analysis.paramCount > 0) confidence += 0.05;

  // Uncertainty reducers
  if (analysis.recursion.isSelfRecursive && !analysis.recursion.hasMemoization && analysis.recursion.recursiveCallCount >= 2) {
    confidence -= 0.1; // Exponential is hard to confirm statically
  }

  return Math.min(Math.max(confidence, 0.1), 1.0);
}

// ─── Optimization Suggestions ────────────────────────────────

function generateOptimizations(analysis: FunctionAnalysis, currentTime: ComplexityClass): OptimizationHint[] {
  const hints: OptimizationHint[] = [];

  // Nested loops → suggest HashMap
  if (analysis.maxLoopDepth >= 2 && !analysis.allocations.hasMap && !analysis.allocations.hasSet) {
    hints.push({
      message: 'Nested loops detected. Consider using a HashMap/Set for O(1) lookups to flatten one loop level.',
      currentComplexity: currentTime,
      suggestedComplexity: analysis.maxLoopDepth >= 3 ? 'O(n^2)' : 'O(n)',
      technique: 'Hash Map',
    });
  }

  // Nested loops → suggest sorting + two-pointer
  if (analysis.maxLoopDepth >= 2 && !analysis.hasSortCall) {
    hints.push({
      message: 'Consider sorting the input first, then using two pointers for a potential O(n log n) solution.',
      currentComplexity: currentTime,
      suggestedComplexity: 'O(n log n)',
      technique: 'Sort + Two Pointers',
    });
  }

  // Exponential recursion → suggest memoization
  if (analysis.recursion.isSelfRecursive && !analysis.recursion.hasMemoization && analysis.recursion.recursiveCallCount >= 2) {
    hints.push({
      message: 'Exponential recursion detected. Add memoization (Map/Object cache) to reduce to polynomial time.',
      currentComplexity: 'O(2^n)',
      suggestedComplexity: 'O(n)',
      technique: 'Memoization / Dynamic Programming',
    });
  }

  // Sort inside a loop → suggest pre-sorting
  if (analysis.hasSortCall && analysis.maxLoopDepth >= 1) {
    hints.push({
      message: 'Sorting inside a loop is expensive. Consider sorting once before the loop.',
      currentComplexity: currentTime,
      suggestedComplexity: 'O(n log n)',
      technique: 'Pre-sort',
    });
  }

  return hints;
}

// ─── AST Helpers ─────────────────────────────────────────────

function getLine(node: ts.Node, sf: ts.SourceFile): number {
  return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
}

function getCallMethodName(node: ts.CallExpression): string | null {
  if (ts.isPropertyAccessExpression(node.expression)) {
    return node.expression.name.text;
  }
  return null;
}

function getCallName(node: ts.CallExpression): string | null {
  if (ts.isIdentifier(node.expression)) {
    return node.expression.text;
  }
  if (ts.isPropertyAccessExpression(node.expression)) {
    return node.expression.name.text;
  }
  return null;
}

/**
 * Detect if a for-loop halves its iteration variable (binary search pattern).
 * Looks for patterns like: i /= 2, i >>= 1, i = Math.floor(i/2)
 * or mid = (left+right)/2 style
 */
function detectHalvingLoop(node: ts.ForStatement): boolean {
  const incrementor = node.incrementor;
  if (!incrementor) return false;

  const text = incrementor.getText();
  if (
    text.includes('/= 2') ||
    text.includes('>>= 1') ||
    text.includes('*= 2') ||
    text.includes('<<= 1')
  ) {
    return true;
  }

  // Check the condition for typical binary search patterns
  const condition = node.condition;
  if (condition) {
    const condText = condition.getText();
    if (condText.includes('left') && condText.includes('right')) {
      // Likely binary search: look for mid calculation in the body
      const body = node.statement;
      if (body) {
        const bodyText = body.getText();
        if (bodyText.includes('mid') || bodyText.includes('/ 2') || bodyText.includes('>> 1')) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Detect if a while-loop halves its search space.
 */
function detectHalvingWhile(node: ts.WhileStatement | ts.DoStatement): boolean {
  const condition = ts.isWhileStatement(node) ? node.expression : node.expression;
  const condText = condition.getText();

  // Binary search pattern: while (left < right) or while (left <= right)
  if (
    (condText.includes('left') && condText.includes('right')) ||
    (condText.includes('lo') && condText.includes('hi')) ||
    (condText.includes('low') && condText.includes('high')) ||
    (condText.includes('start') && condText.includes('end'))
  ) {
    const bodyText = node.statement.getText();
    if (bodyText.includes('mid') || bodyText.includes('/ 2') || bodyText.includes('>> 1') || bodyText.includes('Math.floor')) {
      return true;
    }
  }

  // Division pattern: while (n > 0) { n /= 2 }
  const bodyText = node.statement.getText();
  if (bodyText.includes('/= 2') || bodyText.includes('>>= 1')) {
    return true;
  }

  return false;
}
