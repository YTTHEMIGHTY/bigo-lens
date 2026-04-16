// ─── BigO Lens — Analyzer Unit Tests ─────────────────────────

import { analyzeFunction, analyzeFile } from '../src/core/analyzer';

describe('BigO Lens Analyzer', () => {

  // ── Time Complexity Tests ──────────────────────────────────

  describe('Time Complexity', () => {

    test('O(1) — constant time, no loops or recursion', () => {
      const code = `
        function add(a: number, b: number): number {
          return a + b;
        }
      `;
      const result = analyzeFunction(code, 'add');
      expect(result).not.toBeNull();
      expect(result!.time).toBe('O(1)');
    });

    test('O(n) — single for loop', () => {
      const code = `
        function sum(arr: number[]): number {
          let total = 0;
          for (let i = 0; i < arr.length; i++) {
            total += arr[i];
          }
          return total;
        }
      `;
      const result = analyzeFunction(code, 'sum');
      expect(result).not.toBeNull();
      expect(result!.time).toBe('O(n)');
    });

    test('O(n) — for...of loop', () => {
      const code = `
        function sum(arr: number[]): number {
          let total = 0;
          for (const num of arr) {
            total += num;
          }
          return total;
        }
      `;
      const result = analyzeFunction(code, 'sum');
      expect(result).not.toBeNull();
      expect(result!.time).toBe('O(n)');
    });

    test('O(n) — forEach loop', () => {
      const code = `
        function printAll(arr: string[]): void {
          arr.forEach(item => console.log(item));
        }
      `;
      const result = analyzeFunction(code, 'printAll');
      expect(result).not.toBeNull();
      expect(result!.time).toBe('O(n)');
    });

    test('O(n²) — nested loops', () => {
      const code = `
        function bubbleSort(arr: number[]): number[] {
          for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr.length - i; j++) {
              if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
              }
            }
          }
          return arr;
        }
      `;
      const result = analyzeFunction(code, 'bubbleSort');
      expect(result).not.toBeNull();
      expect(result!.time).toBe('O(n^2)');
    });

    test('O(n log n) — sort call', () => {
      const code = `
        function sortArray(arr: number[]): number[] {
          return arr.sort((a, b) => a - b);
        }
      `;
      const result = analyzeFunction(code, 'sortArray');
      expect(result).not.toBeNull();
      expect(result!.time).toBe('O(n log n)');
    });

    test('O(n) — two-pointer pattern (containerWithMostWater)', () => {
      const code = `
        function containerWithMostWater_11(height: number[]): number {
          let left = 0;
          let right = height.length - 1;
          let maxArea = 0;
          while (left < right) {
            const width = right - left;
            const currentHeight = Math.min(height[left], height[right]);
            maxArea = Math.max(maxArea, width * currentHeight);
            if (height[left] < height[right]) {
              left++;
            } else {
              right--;
            }
          }
          return maxArea;
        }
      `;
      const result = analyzeFunction(code, 'containerWithMostWater_11');
      expect(result).not.toBeNull();
      expect(result!.time).toBe('O(n)');
    });

    test('O(log n) — binary search', () => {
      const code = `
        function binarySearch(arr: number[], target: number): number {
          let left = 0;
          let right = arr.length - 1;
          while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (arr[mid] === target) return mid;
            if (arr[mid] < target) left = mid + 1;
            else right = mid - 1;
          }
          return -1;
        }
      `;
      const result = analyzeFunction(code, 'binarySearch');
      expect(result).not.toBeNull();
      expect(result!.time).toBe('O(log n)');
    });

    test('O(2^n) — recursive fibonacci without memo', () => {
      const code = `
        function fib(n: number): number {
          if (n <= 1) return n;
          return fib(n - 1) + fib(n - 2);
        }
      `;
      const result = analyzeFunction(code, 'fib');
      expect(result).not.toBeNull();
      expect(result!.time).toBe('O(2^n)');
    });

    test('O(n) — recursive with memoization', () => {
      const code = `
        function fib(n: number, memo: Map<number, number> = new Map()): number {
          if (n <= 1) return n;
          if (memo.has(n)) return memo.get(n)!;
          const result = fib(n - 1, memo) + fib(n - 2, memo);
          memo.set(n, result);
          return result;
        }
      `;
      const result = analyzeFunction(code, 'fib');
      expect(result).not.toBeNull();
      expect(result!.time).toBe('O(n)');
    });
  });

  // ── Space Complexity Tests ─────────────────────────────────

  describe('Space Complexity', () => {

    test('O(1) — no extra allocations', () => {
      const code = `
        function max(a: number, b: number): number {
          return a > b ? a : b;
        }
      `;
      const result = analyzeFunction(code, 'max');
      expect(result).not.toBeNull();
      expect(result!.space).toBe('O(1)');
    });

    test('O(n) — Map allocation', () => {
      const code = `
        function twoSum(nums: number[], target: number): number[] {
          const map = new Map<number, number>();
          for (let i = 0; i < nums.length; i++) {
            const complement = target - nums[i];
            if (map.has(complement)) return [map.get(complement)!, i];
            map.set(nums[i], i);
          }
          return [];
        }
      `;
      const result = analyzeFunction(code, 'twoSum');
      expect(result).not.toBeNull();
      expect(result!.space).toBe('O(n)');
    });

    test('O(n) — Set allocation', () => {
      const code = `
        function hasDuplicate(arr: number[]): boolean {
          const seen = new Set<number>();
          for (const num of arr) {
            if (seen.has(num)) return true;
            seen.add(num);
          }
          return false;
        }
      `;
      const result = analyzeFunction(code, 'hasDuplicate');
      expect(result).not.toBeNull();
      expect(result!.space).toBe('O(n)');
    });
  });

  // ── Pattern Detection Tests ────────────────────────────────

  describe('Pattern Detection', () => {

    test('Detects two-pointer pattern', () => {
      const code = `
        function twoSumSorted(nums: number[], target: number): number[] {
          let left = 0;
          let right = nums.length - 1;
          while (left < right) {
            const sum = nums[left] + nums[right];
            if (sum === target) return [left, right];
            if (sum < target) left++;
            else right--;
          }
          return [];
        }
      `;
      const result = analyzeFunction(code, 'twoSumSorted');
      expect(result).not.toBeNull();
      expect(result!.patterns).toContain('two-pointer');
    });

    test('Detects binary-search pattern', () => {
      const code = `
        function search(arr: number[], target: number): number {
          let left = 0;
          let right = arr.length - 1;
          while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (arr[mid] === target) return mid;
            if (arr[mid] < target) left = mid + 1;
            else right = mid - 1;
          }
          return -1;
        }
      `;
      const result = analyzeFunction(code, 'search');
      expect(result).not.toBeNull();
      expect(result!.patterns).toContain('binary-search');
    });

    test('Detects hash-map pattern', () => {
      const code = `
        function twoSum_1(nums: number[], target: number): number[] {
          const map = new Map<number, number>();
          for (let i = 0; i < nums.length; i++) {
            const c = target - nums[i];
            if (map.has(c)) return [map.get(c)!, i];
            map.set(nums[i], i);
          }
          return [];
        }
      `;
      const result = analyzeFunction(code, 'twoSum_1');
      expect(result).not.toBeNull();
      expect(result!.patterns).toContain('hash-map');
    });
  });

  // ── LeetCode Integration Tests ────────────────────────────

  describe('LeetCode Integration', () => {

    test('Detects LeetCode problem from function name', () => {
      const code = `
        function containerWithMostWater_11(height: number[]): number {
          return 0;
        }
      `;
      const result = analyzeFunction(code, 'containerWithMostWater_11');
      expect(result).not.toBeNull();
      expect(result!.leetcode).not.toBeNull();
      expect(result!.leetcode!.number).toBe(11);
      expect(result!.leetcode!.name).toBe('Container With Most Water');
      expect(result!.leetcode!.optimalTime).toBe('O(n)');
      expect(result!.leetcode!.optimalSpace).toBe('O(1)');
    });

    test('No LeetCode info for non-matching name', () => {
      const code = `
        function myHelper(x: number): number {
          return x * 2;
        }
      `;
      const result = analyzeFunction(code, 'myHelper');
      expect(result).not.toBeNull();
      expect(result!.leetcode).toBeUndefined();
    });
  });

  // ── File-Level Analysis ────────────────────────────────────

  describe('File Analysis', () => {

    test('Analyzes multiple functions in a file', () => {
      const code = `
        function add(a: number, b: number): number {
          return a + b;
        }

        function sum(arr: number[]): number {
          let total = 0;
          for (const n of arr) total += n;
          return total;
        }

        function nested(matrix: number[][]): number {
          let sum = 0;
          for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[i].length; j++) {
              sum += matrix[i][j];
            }
          }
          return sum;
        }
      `;
      const result = analyzeFile(code, 'test.ts');
      expect(result.functions).toHaveLength(3);
      expect(result.functions[0].time).toBe('O(1)');
      expect(result.functions[1].time).toBe('O(n)');
      expect(result.functions[2].time).toBe('O(n^2)');
    });

    test('Handles arrow functions', () => {
      const code = `
        const double = (arr: number[]): number[] => {
          return arr.map(x => x * 2);
        };
      `;
      const result = analyzeFile(code, 'test.ts');
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].functionName).toBe('double');
      expect(result.functions[0].time).toBe('O(n)');
    });
  });
});
