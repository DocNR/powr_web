---
title: NDK Tag Deduplication Research Findings
description: Complete analysis of NDK's mergeTags() function and its impact on workout event publishing
status: verified
last_updated: 2025-06-29
last_verified: 2025-06-29
related_code: 
  - /src/lib/services/workoutAnalytics.ts
  - /src/lib/actors/globalNDKActor.ts
  - /src/lib/machines/workout/actors/publishWorkoutActor.ts
category: research
formatting_rules:
  - "Document research findings with evidence and source code references"
  - "Include test plans and validation strategies"
  - "Provide actionable recommendations based on findings"
  - "Reference specific NDK source code locations"
---

# NDK Tag Deduplication Research Findings

## Executive Summary

**CONFIRMED**: NDK automatically deduplicates identical tags during event creation using the `mergeTags()` function in `ndk-core/src/events/content-tagger.ts`. This explains why our workout events lose duplicate exercise tags when sets have identical rep/weight/RPE combinations.

## Research Methodology

### Tools Used
- **repo-explorer MCP**: Searched NDK source code for deduplication logic
- **Console Log Analysis**: Examined real workout publishing behavior
- **Source Code Review**: Analyzed NDK's `mergeTags()` implementation

### Key Evidence Sources
1. **NDK Source Code**: `ndk-core/src/events/content-tagger.ts`, line 23
2. **Console Logs**: `/Users/deltawhiskey/Downloads/console-export-2025-6-29_12-15-23.txt`
3. **Live Testing**: Real workout publishing with identical sets

## Critical Findings

### 1. NDK's `mergeTags()` Function Confirmed

**Location**: `ndk-core/src/events/content-tagger.ts`
**Function**: `export function mergeTags(tags1: NDKTag[], tags2: NDKTag[]): NDKTag[]`
**Documentation**: `@returns A merged array of unique NDKTag.`

**Key Implementation Details**:
```typescript
export function mergeTags(tags1: NDKTag[], tags2: NDKTag[]): NDKTag[] {
    const tagMap = new Map<string, NDKTag>();
    // Function to generate a key for the hashmap
    // ... deduplication logic using Map
}
```

**Usage in NDKEvent**: Line 283 - `this.tags = mergeTags(this.tags, tags);`

### 2. Deduplication Mechanism

**How It Works**:
- Creates a JavaScript `Map<string, NDKTag>` for deduplication
- Generates keys from tag array content
- Identical tag arrays create identical keys
- Map overwrites previous entries with same key
- **Result**: Only the last occurrence of identical tags survives

### 3. Real-World Impact Confirmed

**Console Log Evidence** (2025-06-29 12:15:23):
```javascript
// Generated 10 exercise tags
[WorkoutAnalytics] Total exercise tags added: 10

// But identical sets were deduplicated:
// Bodyweight Squats: 2 identical sets → 1 surviving tag
"0: [exercise, 33401:...bodyweight-squats, , 0, 15, 7, normal]"
"1: [exercise, 33401:...bodyweight-squats, , 0, 15, 7, normal]"  // IDENTICAL

// Calf Raises: 4 identical sets → 1 surviving tag  
"6: [exercise, 33401:...calf-raises, , 0, 20, 7, normal]"
"7: [exercise, 33401:...calf-raises, , 0, 20, 7, normal]"  // IDENTICAL
"8: [exercise, 33401:...calf-raises, , 0, 20, 7, normal]"  // IDENTICAL
"9: [exercise, 33401:...calf-raises, , 0, 20, 7, normal]"  // IDENTICAL
```

**Published Result**: Only 4 unique exercise tags instead of 10 total sets.

## Root Cause Analysis

### The Real Problem
**NOT**: NDK deduplicating different tags
**ACTUAL**: Our auto-generated workout data creates identical sets per exercise

### Why Deduplication Occurs
1. **Auto-generation logic** creates identical performance values per exercise
2. **Same exercise reference** + **same performance data** = **identical tags**
3. **NDK's Map-based deduplication** removes identical entries
4. **Only last set per exercise survives** publishing

### Production Risk
**Critical Issue**: Real users performing identical sets back-to-back would lose workout data.

**Example Scenario**:
```javascript
// User performs 3 identical push-up sets
Set 1: 10 reps, bodyweight, RPE 7, normal
Set 2: 10 reps, bodyweight, RPE 7, normal  // LOST
Set 3: 10 reps, bodyweight, RPE 7, normal  // LOST
// Result: Only 1 set recorded instead of 3
```

## Testing Plan: Unique Rep/Weight/RPE Validation

### Hypothesis
**Test**: Can unique rep/weight/RPE combinations bypass NDK's `mergeTags()` deduplication without modifying NIP-101e structure?

### Test Scenarios

#### Scenario 1: Progressive Rep Decrease
```javascript
// Test tags with decreasing reps
["exercise", "33401:pubkey:pushups", "", "0", "12", "6", "normal"]  // Set 1
["exercise", "33401:pubkey:pushups", "", "0", "10", "7", "normal"]  // Set 2  
["exercise", "33401:pubkey:pushups", "", "0", "8", "8", "normal"]   // Set 3

// Expected: All 3 tags survive (different rep/RPE combinations)
```

#### Scenario 2: Progressive Weight Increase
```javascript
// Test tags with increasing weight
["exercise", "33401:pubkey:squats", "", "60", "10", "7", "normal"]  // Set 1
["exercise", "33401:pubkey:squats", "", "65", "8", "8", "normal"]   // Set 2
["exercise", "33401:pubkey:squats", "", "70", "6", "9", "normal"]   // Set 3

// Expected: All 3 tags survive (different weight/rep/RPE combinations)
```

#### Scenario 3: RPE Progression Only
```javascript
// Test tags with only RPE changes
["exercise", "33401:pubkey:planks", "", "0", "60", "6", "normal"]   // Set 1
["exercise", "33401:pubkey:planks", "", "0", "60", "7", "normal"]   // Set 2
["exercise", "33401:pubkey:planks", "", "0", "60", "8", "normal"]   // Set 3

// Expected: All 3 tags survive (different RPE values)
```

#### Scenario 4: Set Type Variation
```javascript
// Test tags with different set types
["exercise", "33401:pubkey:pushups", "", "0", "10", "6", "warmup"]  // Set 1
["exercise", "33401:pubkey:pushups", "", "0", "10", "7", "normal"]  // Set 2
["exercise", "33401:pubkey:pushups", "", "0", "10", "9", "failure"] // Set 3

// Expected: All 3 tags survive (different set types)
```

### Implementation Strategy

#### Phase 1: Modify Auto-Generation Logic
**File**: `src/lib/machines/workout/activeWorkoutMachine.ts`

**Current Logic** (Creates Identical Sets):
```typescript
// All sets for an exercise have identical values
const setData = {
  reps: exercise.targetReps,     // Same for all sets
  weight: exercise.targetWeight, // Same for all sets  
  rpe: 7,                       // Same for all sets
  setType: "normal"             // Same for all sets
};
```

**Test Logic** (Creates Progressive Sets):
```typescript
const generateProgressiveSet = (exercise: Exercise, setNumber: number, totalSets: number) => {
  // Progressive difficulty: easier start, harder finish
  const progressionFactor = (setNumber - 1) / (totalSets - 1);
  
  return {
    reps: Math.max(1, exercise.targetReps - Math.floor(progressionFactor * 4)), // Decreasing reps
    weight: exercise.targetWeight + Math.floor(progressionFactor * 10),         // Increasing weight
    rpe: Math.min(10, 6 + Math.floor(progressionFactor * 4)),                  // Increasing RPE
    setType: setNumber === 1 ? "warmup" : 
             setNumber === totalSets ? "failure" : "normal"                    // Varied set types
  };
};
```

#### Phase 2: Validation Testing
**File**: `src/components/test/NDKDeduplicationTest.tsx`

```typescript
const NDKDeduplicationTest = () => {
  const testScenarios = [
    {
      name: "Progressive Reps",
      sets: [
        { reps: 12, weight: 0, rpe: 6, setType: "normal" },
        { reps: 10, weight: 0, rpe: 7, setType: "normal" },
        { reps: 8, weight: 0, rpe: 8, setType: "normal" }
      ]
    },
    {
      name: "Progressive Weight", 
      sets: [
        { reps: 10, weight: 60, rpe: 7, setType: "normal" },
        { reps: 8, weight: 65, rpe: 8, setType: "normal" },
        { reps: 6, weight: 70, rpe: 9, setType: "normal" }
      ]
    },
    {
      name: "Identical Sets (Control)",
      sets: [
        { reps: 10, weight: 0, rpe: 7, setType: "normal" },
        { reps: 10, weight: 0, rpe: 7, setType: "normal" },
        { reps: 10, weight: 0, rpe: 7, setType: "normal" }
      ]
    }
  ];

  // Test each scenario and verify tag survival
};
```

### Success Criteria

#### Test Passes If:
- ✅ **Progressive scenarios**: All 3 tags survive publishing
- ✅ **Control scenario**: Only 1 tag survives (confirms deduplication)
- ✅ **NAK verification**: Published events contain expected tag counts
- ✅ **No NIP-101e changes**: Standard structure maintained

#### Test Fails If:
- ❌ **Progressive scenarios**: Tags still get deduplicated
- ❌ **Inconsistent behavior**: Some progressive sets survive, others don't
- ❌ **Parsing issues**: Unique tags cause parsing problems

### Verification Commands

```bash
# Count total exercise tags in published event
nak req -k 1301 -a YOUR_PUBKEY --tag d=test-workout-id wss://nos.lol | jq '.tags[] | select(.[0] == "exercise")' | wc -l

# Examine tag uniqueness
nak req -k 1301 -a YOUR_PUBKEY --tag d=test-workout-id wss://nos.lol | jq '.tags[] | select(.[0] == "exercise")'

# Verify tag content differences
nak req -k 1301 -a YOUR_PUBKEY --tag d=test-workout-id wss://nos.lol | jq '.tags[] | select(.[0] == "exercise") | .[3:7]'
```

## CRITICAL DISCOVERY: NDK Key Generation Mechanism

### How NDK Creates Deduplication Keys
**Source**: `ndk-core/src/events/content-tagger.ts`, line 27
```typescript
const generateKey = (tag: NDKTag) => tag.join(",");
```

**Key Insight**: NDK creates deduplication keys by joining ALL tag elements with commas.

### Answer to Your Question: **NO, Timestamps Cannot Be Hidden**

**Your Question**: "Would a timestamp get passed to NDK to show uniqueness without publishing that timestamp in the actual JSON event?"

**Answer**: **NO** - This is impossible because:

1. **NDK uses `tag.join(",")`** to create the deduplication key
2. **ALL elements** in the tag array are included in the key generation
3. **No way to pass "hidden" data** - everything in the tag becomes part of the published event
4. **The deduplication key IS the published tag content** joined with commas

### Deduplication Key Examples

```javascript
// Tag: ["exercise", "33401:pubkey:pushups", "", "0", "10", "7", "normal"]
// Key:  "exercise,33401:pubkey:pushups,,0,10,7,normal"

// Tag: ["exercise", "33401:pubkey:pushups", "", "0", "10", "7", "normal", "1751213653170"]  
// Key:  "exercise,33401:pubkey:pushups,,0,10,7,normal,1751213653170"
//       ↑ Timestamp becomes part of published event AND deduplication key
```

### Why This Matters

**If you add a timestamp for uniqueness**:
- ✅ **Solves deduplication** - each tag gets unique key
- ❌ **Timestamp is published** - becomes part of the Nostr event permanently
- ❌ **Increases event size** - every set gets a timestamp
- ❌ **May break NIP-101e parsers** - unexpected extra field

## Alternative Solutions (If Testing Fails)

### Option 1: Timestamp-Based Uniqueness (Published)
```javascript
["exercise", "33401:pubkey:pushups", "", "0", "10", "7", "normal", "1751213653170"]
// ↑ Timestamp WILL be published in the event - no way to hide it
```

### Option 2: Set Sequence Numbers (Published)
```javascript
["exercise", "33401:pubkey:pushups", "", "0", "10", "7", "normal", "set-1"]
// ↑ Set number WILL be published in the event
```

### Option 3: Bypass mergeTags() (Advanced)
```typescript
// Direct array assignment instead of event.tag()
event.tags.push(exerciseTag);  // Instead of event.tag(exerciseTag)
// ⚠️ This bypasses NDK's intended behavior and may break with updates
```

## Recommendations

### Immediate Actions
1. **Implement progressive set testing** to validate uniqueness hypothesis
2. **Test with real workout scenarios** including identical sets
3. **Verify NAK commands** show expected tag survival
4. **Document results** for NIP-101e compliance decisions

### Long-term Strategy
1. **If progressive sets work**: Implement realistic workout progression
2. **If progressive sets fail**: Add timestamp or set number extensions
3. **Production deployment**: Ensure zero data loss for identical sets
4. **User experience**: Maintain accurate set tracking regardless of performance

## Research Validation

### Confirmed Facts
- ✅ **NDK deduplicates identical tags** using `mergeTags()` function
- ✅ **Deduplication is intentional** and documented behavior
- ✅ **No configuration options** to disable deduplication
- ✅ **Production risk exists** for users with identical sets
- ✅ **Solution requires unique tag content** or NIP-101e extensions

### Next Steps
1. **Execute testing plan** with progressive set variations
2. **Measure tag survival rates** across different scenarios  
3. **Validate NIP-101e compliance** of any modifications
4. **Implement production-ready solution** based on test results

---

**Research Status**: Complete - Ready for validation testing
**Priority**: High - Blocking accurate workout tracking
**Impact**: Critical for production data integrity
