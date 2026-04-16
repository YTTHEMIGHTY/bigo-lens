// Welcome to the BigO Lens Demo!
// Open this file in VS Code to see BigO Lens in action.
// Try hovering over the function names or looking at the CodeLens above them!

// 1. O(n^2) - Nested Loops & Array allocation
export function bubbleSort(arr: number[]): number[] {
  const result = [...arr];
  for (let i = 0; i < result.length; i++) {
    for (let j = 0; j < result.length - i - 1; j++) {
      if (result[j] > result[j + 1]) {
        const temp = result[j];
        result[j] = result[j + 1];
        result[j + 1] = temp;
      }
    }
  }
  return result;
}

// 2. O(n) Time, O(n) Space - Hash Map Pattern & Leetcode Two Sum
export function twoSum_1(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// 3. O(log n) Time, O(1) Space - Binary Search (Variables halve)
export function binarySearch(arr: number[], target: number): number {
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

// 4. O(2^n) Time, O(n) Space - Exponential Recursion
export function fibonacciRecursive_509(n: number): number {
  if (n <= 1) return n;
  return fibonacciRecursive_509(n - 1) + fibonacciRecursive_509(n - 2);
}

// 5. O(n) Time, O(n) Space - Recursion WITH Memoization (Dynamic Programming)
export function fibonacciMemoized(n: number, memo = new Map<number, number>()): number {
  if (memo.has(n)) return memo.get(n)!;
  if (n <= 1) return n;

  const result = fibonacciMemoized(n - 1, memo) + fibonacciMemoized(n - 2, memo);
  memo.set(n, result);
  return result;
}

// 6. Sliding Window Pattern 
export function maxSlidingWindow(nums: number[], k: number): number[] {
  const result: number[] = [];
  let left = 0;
  let sum = 0;
  
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    if (right - left + 1 === k) {
      result.push(sum);
      sum -= nums[left];
      left++;
    }
  }
  return result;
}
