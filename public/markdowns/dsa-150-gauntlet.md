# 🔥 THE 150 DSA GAUNTLET — MASTER IT THE STRIVER WAY

> **Source of truth:** takeUforward (Striver) — A2Z DSA Course + SDE Sheet
> **Vibe:** No solution-watching before you've fought the problem for 30 min. No skipping "easy" topics. No fake mastery — if you can't explain the approach out loud, you don't know it yet.

---

## 🗺️ ROADMAP AT A GLANCE

| Phase | Topic | ~Problems | Core Skill Unlocked |
|---|---|---|---|
| 0 | Setup + Rules of Engagement | — | How to actually use a sheet without fooling yourself |
| 1 | Arrays — Easy | 12 | Pattern recognition, two-pointer basics |
| 2 | Arrays — Medium/Hard | 13 | Kadane's, sorting tricks, in-place math |
| 3 | Binary Search | 10 | Search space reduction (on answers, not just arrays) |
| 4 | Strings | 8 | Hashing, frequency maps, string-to-string ops |
| 5 | Linked List | 12 | Pointer manipulation, fast-slow pointer |
| 6 | Recursion & Backtracking | 10 | State-space exploration, pruning |
| 7 | Bit Manipulation | 6 | XOR tricks, bitmask thinking |
| 8 | Stack & Queue | 10 | Monotonic stack, LIFO/FIFO modeling |
| 9 | Sliding Window & Two Pointers | 7 | Variable-size window shrink/expand |
| 10 | Heaps | 6 | Priority-based greedy selection |
| 11 | Greedy | 7 | Local-optimal-implies-global-optimal proofs |
| 12 | Binary Trees | 13 | Recursion on tree shape, traversal variants |
| 13 | Binary Search Trees | 7 | Ordered-tree property exploitation |
| 14 | Graphs | 16 | BFS/DFS, Union-Find, shortest paths, MST |
| 15 | Dynamic Programming | 18 | Recurrence → memo → tabulation → space-opt |
| 16 | Tries | 4 | Prefix-tree thinking |
| 17 | Final Boss — Mixed Mock Interviews | 5 | Performing under time pressure |

**Total: ~150 problems.** This is deliberately the *curated* core, not the full 450+ A2Z sheet. Clear this gauntlet and you're interview-ready for SDE-1/SDE-2 rounds at most product companies. If you finish early and want more depth, the A2Z sheet (linked at the bottom) is your superset.

---

## 🧠 WHAT THIS ACTUALLY TRAINS — IN 60 SECONDS

Interviews don't test "do you know algorithms." They test **pattern recognition under pressure**: given a new problem, can you map it to a family you've drilled before (two-pointer, sliding window, binary-search-on-answer, DP on subsequences, graph traversal) fast enough to talk through an approach in 5–10 minutes?

That means the goal of these 150 problems is NOT "I solved 150 problems." It's: **by problem 8 in a topic, you should be able to predict the technique before reading the constraints.** If you're not there, you re-do the topic, you don't move on.

Three non-negotiable rules:
- **Timebox first, peek second.** 25–35 min real attempt (use a timer) before you look at any hint. If you solve it in 5 min, that topic is too easy for you — skip ahead.
- **Re-derive, don't memorize.** Close the editorial, open a blank file, write the solution again from scratch the next day. If you can't, you didn't learn it, you copied it.
- **Talk while you code.** Say your approach out loud (or type it as comments) before writing logic. This is the actual interview skill — solving silently doesn't transfer.

---

## 🏗️ THE PROJECT: A TRACKED, TIMESTAMPED PROBLEM LOG

You're not just solving problems — you're building a **public proof-of-work repo** that you can point an interviewer (or yourself, 2am before an interview) to.

```
dsa-gauntlet/
├── README.md                  # progress tracker table (phase, solved/total, last revision date)
├── 01-arrays-easy/
│   ├── notes.md                # one-liner pattern + gotchas per problem
│   └── <problem-slug>.cpp/py   # your solution, with a comment block: approach + TC/SC
├── 02-arrays-hard/
├── 03-binary-search/
├── ... (one folder per phase)
└── revision-log.md             # date + problem + "could I redo it cold? Y/N"
```

`README.md` progress table template:
```markdown
| Phase | Topic | Solved | Total | Last Revised |
|---|---|---|---|---|
| 1 | Arrays Easy | 0 | 12 | — |
| 2 | Arrays Med/Hard | 0 | 13 | — |
...
```

**Why bother with this when LeetCode already tracks "solved"?** Because LeetCode's checkmark doesn't prove you can re-derive it cold a week later. `revision-log.md` does. Spaced repetition is the entire game here — solving something once and never touching it again is how people "complete" a sheet and still freeze in interviews.

Pick **one language** (C++, Java, or Python) and stick to it for the whole gauntlet — don't burn cycles context-switching syntax.

---

## PHASE 0 — SETUP + RULES OF ENGAGEMENT

### 🎯 Concept: A sheet doesn't teach you anything by existing. Your *process* does.

Before touching problem 1:
1. Subscribe to **takeUforward** (channel name, real name Raj Vikramaditya) — every topic below has a corresponding concept video on that channel. Watch the concept video for a topic ONLY when you start that phase, not all upfront — you'll forget it by the time you need it.
2. Bookmark Striver's **A2Z DSA Sheet** and **SDE Sheet** (links in references) — they're the canonical source for problem links + video walkthroughs per problem. This gauntlet is the curated subset; click through to the matching entry on the sheet whenever you want the official video.
3. Pick your judge: LeetCode for company-tagged problems, GeeksforGeeks for the classic sheet-linked versions. Don't fragment across five platforms.
4. Set up the repo structure above. Commit after every solved problem, even failed attempts (the failed attempt + final fix is a more honest signal of growth than only committing successes).

### 📐 The 3-pass system (use this for EVERY phase below)
- **Pass 1 (Learn):** Solve every problem in the phase, peeking at hints/editorial if stuck after 30 min. Goal: exposure to every pattern in the topic.
- **Pass 2 (Drill, ~1 week later):** Re-solve the ones you peeked at, cold, no notes. Goal: convert "I followed an explanation" into "I can generate this."
- **Pass 3 (Interview-sim, before your actual interviews):** Pick 3 random problems from the phase, solve out loud to a friend/rubber duck/empty room, 20 min each, no IDE autocomplete.

---

## PHASE 1 — ARRAYS (EASY)
### 🎯 Concept: Most "easy array" problems are testing whether you reach for brute force or for O(n) in one pass.

**Core trick:** Before coding, ask "can I solve this with one pointer doing a single left-to-right pass, tracking a running value?" 80% of this phase says yes.

**Solve these:**
- [ ] Find the largest element in an array
- [ ] Find second largest and second smallest element
- [ ] Check if an array is sorted (and rotated-sorted)
- [ ] Remove duplicates from a sorted array (in-place, two-pointer)
- [ ] Left rotate an array by one place / by D places
- [ ] Move all zeros to the end of the array
- [ ] Linear search in an array
- [ ] Union of two sorted arrays
- [ ] Find the missing number in an array of 1..N
- [ ] Maximum consecutive ones in a binary array
- [ ] Find the number that appears once (rest appear twice) — XOR trick
- [ ] Longest subarray with sum K (positives only, then generalize to +/- with prefix sum + hashmap)

**Gotcha to internalize here:** "In-place" usually means two-pointer, not extra array + copy back. If your solution uses `O(n)` extra space for an "in-place" ask, you missed the point of the problem.

---

## PHASE 2 — ARRAYS (MEDIUM / HARD)
### 🎯 Concept: This is where prefix sums, Kadane's, and sorting-as-a-subroutine start carrying real weight.

**Solve these:**
- [ ] Two Sum (hashmap, then revisit after Binary Search phase for the sorted-array two-pointer variant)
- [ ] Sort an array of 0s, 1s, 2s — Dutch National Flag algorithm
- [ ] Majority Element (> n/2 times) — Moore's Voting Algorithm
- [ ] Maximum Subarray Sum — Kadane's Algorithm
- [ ] Best Time to Buy and Sell Stock (single transaction)
- [ ] Rearrange array elements by sign (alternating positive/negative)
- [ ] Next Permutation
- [ ] Leaders in an array (elements with nothing greater to their right)
- [ ] Longest Consecutive Sequence (unsorted array, O(n) using a set)
- [ ] Set Matrix Zeroes (in-place, O(1) extra space using first row/col as markers)
- [ ] Rotate Matrix by 90 degrees (in-place: transpose then reverse rows)
- [ ] Spiral Traversal of a Matrix
- [ ] 3Sum / 4Sum (sorted array + two-pointer, avoid duplicate triplets/quadruplets)

**Gotcha:** Kadane's algorithm is the gateway drug to half of DP. Don't just memorize the loop — understand *why* resetting the running sum to 0 when it goes negative is correct. You'll need that "discard negative prefix" instinct again in DP phase.

---

## PHASE 3 — BINARY SEARCH
### 🎯 Concept: Binary search isn't "search a sorted array." It's "the answer space is monotonic — exploit that."

**Core trick:** Whenever you see "minimize the maximum" or "maximize the minimum" in a problem statement, that's binary-search-on-the-answer, not on the array.

**Solve these:**
- [ ] Binary Search (iterative + recursive) on a sorted array
- [ ] Lower Bound and Upper Bound
- [ ] Search Insert Position
- [ ] Floor and Ceil of a number in a sorted array
- [ ] First and Last Occurrence of an element in a sorted array
- [ ] Search in a Rotated Sorted Array (I — distinct, II — with duplicates)
- [ ] Find Minimum in a Rotated Sorted Array / how many times it's rotated
- [ ] Single Element in a Sorted Array (every other element appears twice)
- [ ] Find Peak Element
- [ ] Square Root of a number using Binary Search
- [ ] Koko Eating Bananas (binary search on answer)
- [ ] Minimum Days to Make M Bouquets (binary search on answer)
- [ ] Capacity to Ship Packages within D Days (binary search on answer)
- [ ] Aggressive Cows / Allocate Minimum Number of Pages (binary search on answer, maximize-the-minimum)
- [ ] Median of Two Sorted Arrays (the classic hard one — partition-based binary search)

**Gotcha:** If your binary search loop has an off-by-one bug, it's almost always in the `low <= high` vs `low < high` choice combined with how you update `low`/`high`. Pick ONE template (inclusive bounds) and use it every single time so you stop re-deriving boundary conditions under pressure.

---

## PHASE 4 — STRINGS
### 🎯 Concept: String problems are array problems wearing a costume, plus hashing.

**Solve these:**
- [ ] Remove Outermost Parentheses
- [ ] Reverse Words in a String (in-place style)
- [ ] Largest Odd Number in a String
- [ ] Longest Common Prefix (of an array of strings)
- [ ] Isomorphic Strings
- [ ] Check if two strings are rotations / anagrams of each other
- [ ] Sort characters of a string by frequency
- [ ] Roman Numeral to Integer and Integer to Roman

**Gotcha:** For frequency-based string problems, default to a 26-length array (or hashmap for Unicode) before reaching for sorting — it's almost always faster and it's the answer interviewers expect for "only lowercase letters" constraints.

---

## PHASE 5 — LINKED LIST
### 🎯 Concept: Every hard linked-list problem is "dummy node + careful pointer reassignment" or "fast-slow pointer." That's it. Two tricks, infinite variations.

**Solve these:**
- [ ] Implement a singly linked list — insertion, deletion, traversal
- [ ] Implement a doubly linked list — insertion, deletion, traversal
- [ ] Find the length of a linked list
- [ ] Reverse a linked list — iterative AND recursive
- [ ] Detect a cycle in a linked list (Floyd's cycle detection)
- [ ] Find the middle of a linked list (fast-slow pointer)
- [ ] Find the starting point of a loop in a linked list
- [ ] Remove the Nth node from the end of a linked list
- [ ] Delete the middle node of a linked list
- [ ] Sort a linked list (merge sort on linked list — no extra array)
- [ ] Find the intersection point of two linked lists (Y-shaped)
- [ ] Add two numbers represented as linked lists
- [ ] Clone a linked list with a random pointer (the hashmap trick, then the O(1)-space interleaving trick)
- [ ] Merge two sorted linked lists
- [ ] Reverse a linked list in groups of size K
- [ ] Check if a linked list is a palindrome

**Gotcha:** Draw the pointers on paper before coding. Every linked-list bug is "I updated `next` before I saved a reference I needed later." A dummy/sentinel node at the head eliminates half the edge cases people fumble (empty list, single node, modifying the head itself).

---

## PHASE 6 — RECURSION & BACKTRACKING
### 🎯 Concept: Backtracking = DFS through a decision tree + undo your choice before trying the next branch.

**Core trick:** Always write the recursion as "make a choice → recurse → undo the choice" explicitly. If you don't see an explicit "undo" step, you're probably building a brute force that double-counts or corrupts shared state.

**Solve these:**
- [ ] Print all subsequences / the power set of an array
- [ ] Combination Sum (I — repetition allowed, II — no repetition, with duplicates in input)
- [ ] Subset Sums (print all subset sums, then count subsets with a given sum)
- [ ] Palindrome Partitioning (partition a string so every substring is a palindrome)
- [ ] Kth Permutation Sequence (math trick, not brute-force generation)
- [ ] Print all permutations of a string/array
- [ ] N-Queens Problem
- [ ] Sudoku Solver
- [ ] M-Coloring Problem (graph coloring via backtracking)
- [ ] Rat in a Maze (all paths)

**Gotcha:** Backtracking solutions are exponential by nature — the skill being tested isn't "make it fast," it's "prune branches early." If you're not adding an early-exit/pruning condition, you're leaving easy interview points on the table.

---

## PHASE 7 — BIT MANIPULATION
### 🎯 Concept: A small, sharp toolkit — XOR for "find the odd one out," shifts for power-of-2 checks, masks for subsets.

**Solve these:**
- [ ] Check if a number is odd or even using bitwise AND
- [ ] Check if a number is a power of 2
- [ ] Count the number of set bits in an integer
- [ ] Find the XOR of all numbers from L to R
- [ ] Find the two numbers that appear an odd number of times in an array (everything else appears even times)
- [ ] Generate the power set of a set using bitmasks (0 to 2^n − 1, check each bit)

**Gotcha:** `x & (x-1)` clears the lowest set bit — this single trick answers half the "count bits" / "is power of 2" family of questions. Internalize it instead of deriving it each time.

---

## PHASE 8 — STACK & QUEUE
### 🎯 Concept: The monotonic stack is the single highest-leverage trick in this whole phase — it turns O(n²) "for each element, scan right/left" into O(n).

**Solve these:**
- [ ] Implement a Stack using an array (and using a linked list)
- [ ] Implement a Queue using an array (and using a linked list)
- [ ] Implement a Stack using a Queue, and a Queue using a Stack
- [ ] Check for Balanced Parentheses
- [ ] Implement a Min Stack (O(1) getMin)
- [ ] Next Greater Element (monotonic stack)
- [ ] Next Smaller Element (monotonic stack)
- [ ] Sort a Stack (using recursion, no extra data structure)
- [ ] Largest Rectangle in a Histogram (monotonic stack, the hard one)
- [ ] Sliding Window Maximum (monotonic deque)

**Gotcha:** A monotonic stack stores *indices*, not values, in 90% of real problems — you usually need the position to compute a width or distance, not just the value itself. Default to storing indices unless you have a specific reason not to.

---

## PHASE 9 — SLIDING WINDOW & TWO POINTERS
### 🎯 Concept: Fixed window vs. variable window are different skills — know which one a problem is asking for before you start coding.

**Solve these:**
- [ ] Longest Substring Without Repeating Characters
- [ ] Max Consecutive Ones III (flip at most K zeros)
- [ ] Longest Repeating Character Replacement
- [ ] Binary Subarrays with a Given Sum
- [ ] Number of Substrings Containing All Three Characters (a, b, c) at least once
- [ ] Longest Substring with At Most K Distinct Characters
- [ ] Minimum Window Substring

**Gotcha:** Variable-size sliding window has a standard shape: expand the right pointer always, shrink the left pointer in a `while` (not `if`) when the window violates the constraint. People bug this out by using `if` instead of `while` and end up with a window that's still invalid.

---

## PHASE 10 — HEAPS
### 🎯 Concept: Anytime you need "the current top-K" or "the running median" while elements stream in, a heap beats re-sorting every time.

**Solve these:**
- [ ] Implement a Min-Heap and a Max-Heap from scratch (not the library one — know what's under the hood)
- [ ] Kth Largest / Kth Smallest element in an array
- [ ] Sort a Nearly Sorted (K-sorted) Array
- [ ] K Closest Points to the Origin
- [ ] Top K Frequent Elements
- [ ] Find the Median from a Data Stream (two-heap technique)

**Gotcha:** "Kth largest" almost always wants a **min-heap of size K**, not a max-heap of everything — people default to the wrong heap and end up with worse complexity than necessary.

---

## PHASE 11 — GREEDY
### 🎯 Concept: Greedy only works when you can prove the local-best choice never blocks a better global solution. Half the interview skill here is articulating *why* greedy works for this specific problem (interviewers will ask).

**Solve these:**
- [ ] Assign Cookies
- [ ] Lemonade Change
- [ ] N Meetings in One Room (max non-overlapping intervals)
- [ ] Jump Game (reachability, greedy on furthest index)
- [ ] Job Sequencing Problem (maximize profit under deadlines)
- [ ] Insert Interval / Merge Overlapping Intervals
- [ ] Minimum Number of Platforms Needed for a Railway Station

**Gotcha:** When a greedy approach "feels right" but you can't justify why a counter-example doesn't exist, that's the signal to check if this is actually a DP problem in disguise (this happens constantly with scheduling/interval problems).

---

## PHASE 12 — BINARY TREES
### 🎯 Concept: Nearly every tree problem is "do something at this node, then recurse left, then recurse right, then combine the results." Get fluent at writing that shape blind.

**Solve these:**
- [ ] Preorder, Inorder, Postorder traversal — recursive AND iterative
- [ ] Level Order Traversal (BFS, level by level)
- [ ] Morris Traversal (O(1) space inorder/preorder — the threaded-tree trick)
- [ ] Maximum Depth / Height of a Binary Tree
- [ ] Check if a Binary Tree is Height-Balanced
- [ ] Diameter of a Binary Tree
- [ ] Maximum Path Sum in a Binary Tree
- [ ] Check if Two Trees are Identical
- [ ] Zig-Zag (Spiral) Level Order Traversal
- [ ] Boundary Traversal / Vertical Order Traversal / Top View / Bottom View
- [ ] Symmetric Tree Check
- [ ] Lowest Common Ancestor (LCA) in a Binary Tree
- [ ] Construct a Binary Tree from Preorder and Inorder Traversal

**Gotcha:** "Combine the results from left and right subtrees" is where most tree bugs live — e.g., diameter is NOT just `height(left) + height(right)` at the root, it's the max of that expression evaluated **at every node**, which is why you carry a global/reference variable instead of trying to return two things awkwardly.

---

## PHASE 13 — BINARY SEARCH TREES
### 🎯 Concept: A BST is a binary tree with one extra superpower — inorder traversal gives you sorted order for free. Every clever BST trick exploits that.

**Solve these:**
- [ ] Search and Insert in a BST
- [ ] Find the Minimum and Maximum element in a BST
- [ ] Find the Ceil and Floor of a value in a BST
- [ ] Delete a Node in a BST
- [ ] Find the Kth Smallest / Kth Largest element in a BST
- [ ] Check if a Binary Tree is a Valid BST
- [ ] Lowest Common Ancestor (LCA) in a BST (use the ordering — no need for the generic tree algorithm)
- [ ] Construct a BST from a Preorder Traversal
- [ ] Inorder Successor / Predecessor in a BST
- [ ] Two Sum in a BST (using a BST Iterator with two pointers)
- [ ] Recover a BST where two nodes were swapped by mistake

**Gotcha:** If you ever catch yourself writing a generic-binary-tree LCA or search algorithm against a BST, stop — you're throwing away the one property (`left < node < right`) that makes the BST version O(log n) instead of O(n).

---

## PHASE 14 — GRAPHS
### 🎯 Concept: Graphs are "BFS/DFS plus bookkeeping." Master the traversal first, then layer on: cycle detection, topological order, shortest path, MST, Union-Find.

**Solve these:**
- [ ] Graph representation — Adjacency List and Adjacency Matrix
- [ ] BFS Traversal of a Graph
- [ ] DFS Traversal of a Graph
- [ ] Number of Provinces (count connected components)
- [ ] Number of Islands (grid BFS/DFS)
- [ ] Flood Fill
- [ ] Rotten Oranges (multi-source BFS)
- [ ] Detect Cycle in an Undirected Graph (BFS and DFS)
- [ ] Detect Cycle in a Directed Graph (DFS with recursion-stack tracking)
- [ ] Topological Sort — both Kahn's Algorithm (BFS) and DFS-based
- [ ] Course Schedule I & II (topological sort application)
- [ ] Check if a Graph is Bipartite
- [ ] Strongly Connected Components — Kosaraju's Algorithm
- [ ] Dijkstra's Algorithm (single-source shortest path, non-negative weights)
- [ ] Bellman-Ford Algorithm (handles negative weights, detects negative cycles)
- [ ] Prim's Algorithm and Kruskal's Algorithm (Minimum Spanning Tree)
- [ ] Disjoint Set / Union-Find (with union by rank/size + path compression)
- [ ] Word Ladder (shortest transformation sequence — BFS on words)
- [ ] Alien Dictionary (topological sort on character ordering)

**Gotcha:** Before writing a single line, ask "is this weighted or unweighted? directed or undirected? do I need shortest path or just reachability/components?" Misreading any one of those four answers gets you reaching for the wrong algorithm entirely (e.g., BFS for shortest path on a *weighted* graph is a classic, silent wrong-answer bug).

---

## PHASE 15 — DYNAMIC PROGRAMMING
### 🎯 Concept: DP is not a separate universe — it's recursion + "have I solved this exact subproblem before?" Every problem below should be solved in this order: brute-force recursion → add memoization → convert to tabulation → optimize space, in that order, every time, until the order becomes automatic.

**Solve these:**
- [ ] Climbing Stairs / Frog Jump (1D DP introduction)
- [ ] House Robber I and II (1D DP with a "skip or take" decision + circular variant)
- [ ] 0/1 Knapsack
- [ ] Subset Sum Problem (does a subset with sum K exist)
- [ ] Partition Equal Subset Sum
- [ ] Minimum Subset Sum Difference
- [ ] Count Subsets with a Given Sum
- [ ] Target Sum (assign +/- signs to hit a target)
- [ ] Coin Change I (minimum coins) and II (number of ways) — unbounded knapsack pattern
- [ ] Rod Cutting Problem
- [ ] Longest Common Subsequence
- [ ] Longest Common Substring
- [ ] Longest Palindromic Subsequence
- [ ] Edit Distance
- [ ] Wildcard Pattern Matching
- [ ] Longest Increasing Subsequence (and the O(n log n) binary-search variant)
- [ ] Matrix Chain Multiplication (interval/partition DP introduction)
- [ ] Minimum Path Sum / Unique Paths in a Grid

**Gotcha:** If you can't write the recursive brute-force version with a clear "what does `f(i, j, ...)` mean in plain English" definition, you are not ready to memoize it. Skipping straight to a tabulation table you half-remember from a video is exactly the "fooling yourself" failure mode this gauntlet exists to prevent.

---

## PHASE 16 — TRIES
### 🎯 Concept: A trie is just a tree where each path from root to a node spells out a prefix. It exists for one job: making prefix-based lookups fast.

**Solve these:**
- [ ] Implement a Trie (insert, search, startsWith) from scratch
- [ ] Implement Trie II (insert, count words equal to / starting with a prefix, erase)
- [ ] Find the Longest String with All Prefixes Present in an Array
- [ ] Maximum XOR of Two Numbers in an Array (binary trie over bit representations)

**Gotcha:** If a problem says "prefix" anywhere in the statement and you're reaching for a hashmap of full strings, stop and ask if a trie gives you the prefix-sharing for free instead.

---

## 💀 PHASE 17 — FINAL BOSS: MIXED MOCK INTERVIEWS

Do all five. No looking up which topic it belongs to beforehand — that's the entire point, you have to recognize the pattern cold, like a real interview.

**Boss 1 — Pattern recognition under disguise**
Pick 3 random unsolved medium-difficulty problems from LeetCode (mix array/string/tree), set a 25-minute timer per problem, and solve with zero hints. Track: did you identify the correct pattern in the first 5 minutes?

**Boss 2 — Explain-out-loud constraint**
Re-solve any 3 DP problems from Phase 15, but you're not allowed to write code until you've stated the recurrence relation out loud (recorded on your phone, or to a friend). Listen back — if your explanation has gaps, your understanding has gaps.

**Boss 3 — The graph speed round**
In one sitting, implement from memory (no notes): BFS, DFS, Dijkstra, and Union-Find with path compression. Time yourself. You should be under 10 minutes each by the end of Phase 14 if you actually drilled it.

**Boss 4 — Full mock interview, end to end**
Find a peer (or use an AI mock-interview session) and do a full 45-minute mock: clarify constraints → state approach → code → test with an example → state time/space complexity → discuss optimizations. This is the skill the other 149 problems were training you for — don't skip it.

**Boss 5 — The "I thought I knew this" audit**
Go back to your `revision-log.md`. Pick the 10 problems you marked "could NOT redo cold." Redo them now. If you still can't, that topic isn't done — loop back to that phase's 3-pass system before you call yourself interview-ready.

---

## 🧪 FINAL CHECKLIST

- [ ] All 16 topic phases at 100% solved (not just "viewed editorial")
- [ ] `revision-log.md` shows at least one cold re-attempt per phase
- [ ] You can state, from memory, the time/space complexity of every algorithm in Phases 10, 14, and 15 (heaps, graphs, DP) without looking it up
- [ ] You can write BFS, DFS, binary search, and the monotonic-stack template blind, in under 5 minutes each
- [ ] You've done at least one full 45-minute mock interview (Boss 4) and gotten feedback on your communication, not just your code
- [ ] You can explain, out loud, why a greedy approach is or isn't valid for a given problem (not just "it worked on the examples")
- [ ] You've revisited your weakest topic (be honest with yourself about which one) for a second full pass

---

## 🧠 MISTAKES YOU WILL MAKE (and should expect to)

| Mistake | Symptom | Fix |
|---|---|---|
| Watching the solution video before attempting | "I understand it" feeling that evaporates in an interview | Timebox 30 min of real struggle first, always |
| Memorizing code instead of the pattern | Can solve the exact LeetCode problem, freezes on a variant | Re-derive from the plain-English subproblem definition |
| Treating "easy" as skippable | Shaky fundamentals surface under pressure later | Solve every easy problem too — speed matters as much as ability |
| Using `if` instead of `while` to shrink a sliding window | Window stays invalid after "shrinking" | Always shrink with `while (violatesConstraint)` |
| Jumping straight to tabulation in DP | Can't adapt when interviewer changes the constraints slightly | Always start from the recursive brute force |
| Generic tree algorithm on a BST | O(n) solution where O(log n) was expected | Exploit the `left < node < right` ordering explicitly |
| BFS for shortest path on a weighted graph | Silently wrong answer, not even a crash | Dijkstra (or Bellman-Ford with negative weights) for weighted shortest path |
| Greedy without a correctness argument | Passes example tests, fails hidden test cases | If you can't argue why a counter-example can't exist, suspect DP instead |
| Coding before clarifying constraints in mocks | Solve the wrong problem fast | Always restate constraints + edge cases before writing code |
| Solving 150 problems, never revisiting any | Forgetting 60% by the time the interview happens | Spaced repetition via `revision-log.md` is not optional |

---

## 📦 SUGGESTED PACE

| Background | Realistic Timeline |
|---|---|
| Comfortable with basic coding, new to DSA | 4–5 months (Phases 0–9 first, then 10–17) |
| Already solved 50–100 random LeetCode problems | 2–3 months |
| Strong fundamentals, need interview-speed polish | 4–6 weeks, skim easy phases, drill 12–15 hard |

Daily target that actually sticks: **2–3 new problems + 1 cold revision problem**, not 10 new problems you'll forget by Friday.

---

## 🔗 REFERENCES — your actual source material

| Resource | What it's for |
|---|---|
| takeUforward (YouTube channel, search "takeUforward") | Concept videos + walkthroughs for every topic and most problems above |
| Striver's A2Z DSA Course Sheet — https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/ | The full 450+ problem superset this gauntlet is curated from, with linked videos per problem |
| Striver's SDE Sheet — https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems/ | The classic ~180-problem interview-focused sheet; closest official match to "the 150" |
| LeetCode | Judge + company-tagged problem variants for extra practice |
| GeeksforGeeks | Alternate problem statements/judges matching most sheet entries |
| NeetCode (YouTube) | Good second explanation source if Striver's explanation doesn't click for a specific problem |

---

> **You don't master DSA by finishing a sheet.**
> **You master it by being able to re-derive every pattern on it, cold, six months from now.**
>
> **Now go solve something.**
