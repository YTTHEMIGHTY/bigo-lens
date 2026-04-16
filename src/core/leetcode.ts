// ─── BigO Lens — LeetCode Problem Resolver ───────────────────
//
// Maps function names matching the pattern `<name>_<number>` to
// LeetCode problem metadata with known optimal complexities.

import { LeetCodeInfo, ComplexityClass } from './types';

// ─── Known LeetCode Problems (top 100) ──────────────────────
// Sourced from commonly-known problem data. This is a static map
// bundled with the extension for offline use.

interface ProblemEntry {
  name: string;
  optimalTime: ComplexityClass;
  optimalSpace: ComplexityClass;
}

const LEETCODE_PROBLEMS: Record<number, ProblemEntry> = {
  1: { name: 'Two Sum', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  2: { name: 'Add Two Numbers', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  3: { name: 'Longest Substring Without Repeating Characters', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  4: { name: 'Median of Two Sorted Arrays', optimalTime: 'O(log n)', optimalSpace: 'O(1)' },
  5: { name: 'Longest Palindromic Substring', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  7: { name: 'Reverse Integer', optimalTime: 'O(log n)', optimalSpace: 'O(1)' },
  9: { name: 'Palindrome Number', optimalTime: 'O(log n)', optimalSpace: 'O(1)' },
  11: { name: 'Container With Most Water', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  13: { name: 'Roman to Integer', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  14: { name: 'Longest Common Prefix', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  15: { name: 'Three Sum', optimalTime: 'O(n^2)', optimalSpace: 'O(1)' },
  17: { name: 'Letter Combinations of a Phone Number', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  19: { name: 'Remove Nth Node From End of List', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  20: { name: 'Valid Parentheses', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  21: { name: 'Merge Two Sorted Lists', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  22: { name: 'Generate Parentheses', optimalTime: 'O(2^n)', optimalSpace: 'O(n)' },
  23: { name: 'Merge k Sorted Lists', optimalTime: 'O(n log n)', optimalSpace: 'O(n)' },
  26: { name: 'Remove Duplicates from Sorted Array', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  33: { name: 'Search in Rotated Sorted Array', optimalTime: 'O(log n)', optimalSpace: 'O(1)' },
  34: { name: 'Find First and Last Position', optimalTime: 'O(log n)', optimalSpace: 'O(1)' },
  36: { name: 'Valid Sudoku', optimalTime: 'O(1)', optimalSpace: 'O(1)' },
  39: { name: 'Combination Sum', optimalTime: 'O(2^n)', optimalSpace: 'O(n)' },
  42: { name: 'Trapping Rain Water', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  46: { name: 'Permutations', optimalTime: 'O(n!)', optimalSpace: 'O(n)' },
  48: { name: 'Rotate Image', optimalTime: 'O(n^2)', optimalSpace: 'O(1)' },
  49: { name: 'Group Anagrams', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  53: { name: 'Maximum Subarray', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  54: { name: 'Spiral Matrix', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  55: { name: 'Jump Game', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  56: { name: 'Merge Intervals', optimalTime: 'O(n log n)', optimalSpace: 'O(n)' },
  62: { name: 'Unique Paths', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  70: { name: 'Climbing Stairs', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  73: { name: 'Set Matrix Zeroes', optimalTime: 'O(n^2)', optimalSpace: 'O(1)' },
  74: { name: 'Search a 2D Matrix', optimalTime: 'O(log n)', optimalSpace: 'O(1)' },
  76: { name: 'Minimum Window Substring', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  78: { name: 'Subsets', optimalTime: 'O(2^n)', optimalSpace: 'O(n)' },
  79: { name: 'Word Search', optimalTime: 'O(n^2)', optimalSpace: 'O(n)' },
  91: { name: 'Decode Ways', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  98: { name: 'Validate Binary Search Tree', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  100: { name: 'Same Tree', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  102: { name: 'Binary Tree Level Order Traversal', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  104: { name: 'Maximum Depth of Binary Tree', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  105: { name: 'Construct BT from Preorder and Inorder', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  121: { name: 'Best Time to Buy and Sell Stock', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  124: { name: 'Binary Tree Maximum Path Sum', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  125: { name: 'Valid Palindrome', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  128: { name: 'Longest Consecutive Sequence', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  130: { name: 'Surrounded Regions', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  131: { name: 'Palindrome Partitioning', optimalTime: 'O(2^n)', optimalSpace: 'O(n)' },
  133: { name: 'Clone Graph', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  139: { name: 'Word Break', optimalTime: 'O(n^2)', optimalSpace: 'O(n)' },
  141: { name: 'Linked List Cycle', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  143: { name: 'Reorder List', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  146: { name: 'LRU Cache', optimalTime: 'O(1)', optimalSpace: 'O(n)' },
  152: { name: 'Maximum Product Subarray', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  153: { name: 'Find Minimum in Rotated Sorted Array', optimalTime: 'O(log n)', optimalSpace: 'O(1)' },
  155: { name: 'Min Stack', optimalTime: 'O(1)', optimalSpace: 'O(n)' },
  167: { name: 'Two Sum II', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  190: { name: 'Reverse Bits', optimalTime: 'O(1)', optimalSpace: 'O(1)' },
  191: { name: 'Number of 1 Bits', optimalTime: 'O(1)', optimalSpace: 'O(1)' },
  198: { name: 'House Robber', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  200: { name: 'Number of Islands', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  206: { name: 'Reverse Linked List', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  207: { name: 'Course Schedule', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  208: { name: 'Implement Trie', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  211: { name: 'Design Add and Search Words', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  212: { name: 'Word Search II', optimalTime: 'O(n^2)', optimalSpace: 'O(n)' },
  213: { name: 'House Robber II', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  217: { name: 'Contains Duplicate', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  226: { name: 'Invert Binary Tree', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  230: { name: 'Kth Smallest Element in BST', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  235: { name: 'Lowest Common Ancestor of BST', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  236: { name: 'Lowest Common Ancestor of BT', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  238: { name: 'Product of Array Except Self', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  239: { name: 'Sliding Window Maximum', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  242: { name: 'Valid Anagram', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  261: { name: 'Graph Valid Tree', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  268: { name: 'Missing Number', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  269: { name: 'Alien Dictionary', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  271: { name: 'Encode and Decode Strings', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  295: { name: 'Find Median from Data Stream', optimalTime: 'O(log n)', optimalSpace: 'O(n)' },
  297: { name: 'Serialize and Deserialize BT', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  300: { name: 'Longest Increasing Subsequence', optimalTime: 'O(n log n)', optimalSpace: 'O(n)' },
  322: { name: 'Coin Change', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  323: { name: 'Number of Connected Components', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  338: { name: 'Counting Bits', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  347: { name: 'Top K Frequent Elements', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  371: { name: 'Sum of Two Integers', optimalTime: 'O(1)', optimalSpace: 'O(1)' },
  417: { name: 'Pacific Atlantic Water Flow', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  424: { name: 'Longest Repeating Character Replacement', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
  435: { name: 'Non-overlapping Intervals', optimalTime: 'O(n log n)', optimalSpace: 'O(1)' },
  572: { name: 'Subtree of Another Tree', optimalTime: 'O(n)', optimalSpace: 'O(n)' },
  647: { name: 'Palindromic Substrings', optimalTime: 'O(n^2)', optimalSpace: 'O(1)' },
  703: { name: 'Kth Largest Element in a Stream', optimalTime: 'O(log n)', optimalSpace: 'O(n)' },
  746: { name: 'Min Cost Climbing Stairs', optimalTime: 'O(n)', optimalSpace: 'O(1)' },
};

// ─── Public API ──────────────────────────────────────────────

/**
 * Parse a function name like `containerWithMostWater_11` or `twoSum_1`
 * and return LeetCode problem metadata.
 */
export function resolveLeetCode(functionName: string): LeetCodeInfo | null {
  const match = functionName.match(/_(\d+)$/);
  if (!match) return null;

  const problemNumber = parseInt(match[1], 10);
  const entry = LEETCODE_PROBLEMS[problemNumber];

  if (!entry) {
    // We know the number but don't have the problem data
    return {
      number: problemNumber,
      name: humanize(functionName.replace(/_\d+$/, '')),
      url: `https://leetcode.com/problems/${toKebab(functionName.replace(/_\d+$/, ''))}/`,
    };
  }

  return {
    number: problemNumber,
    name: entry.name,
    url: `https://leetcode.com/problems/${toKebab(entry.name)}/`,
    optimalTime: entry.optimalTime,
    optimalSpace: entry.optimalSpace,
  };
}

// ─── Helpers ─────────────────────────────────────────────────

function humanize(camelCase: string): string {
  return camelCase
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
}

function toKebab(name: string): string {
  return name
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')
    .replace(/ /g, '-');
}
