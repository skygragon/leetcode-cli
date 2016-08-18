# leetcode-cli
A cli tool to enjoy leetcode!

## Install

From source code:

    $ git clone http://github.com/skygragon/leetcode-cli
    $ cd leetcode-cli/
    $ sudo npm install -g .

## Quick Start

### List all problems

    $ lc list
    
    [385] Mini Parser                                                  Medium (26.5%)
    [384] Shuffle an Array                                             Medium (45.7%)
    [383] Ransom Note                                                  Easy   (44.5%)
    [382] Linked List Random Node                                      Medium (46.6%)
    ......
    [  4] Median of Two Sorted Arrays                                  Hard   (19.6%)
    [  3] Longest Substring Without Repeating Characters               Medium (22.9%)
    [  2] Add Two Numbers                                              Medium (24.5%)
    [  1] Two Sum                                                      Easy   (25.6%)
    
### Show one problem

    $ lc show 1             // can use index
    $ lc show "Two Sum"     // or use problem name
    $ lc show two-sum       // or use URI path
    
    [1] Two Sum
    
    https://leetcode.com/problems/two-sum/
    
    * Easy (25.6%)
    * Total Accepted: 274880
    * Total Submissions: 1074257
    
    Given an array of integers, return indices of the two numbers such that they add up to a specific target.
    
    You may assume that each input would have exactly one solution.
    
    Example:
    
    Given nums = [2, 7, 11, 15], target = 9,
    
    Because nums[0] + nums[1] = 2 + 7 = 9,
    return [0, 1].
    
    UPDATE (2016/2/13):
    The return format had been changed to zero-based indices. Please read the above updated description carefully.
    
