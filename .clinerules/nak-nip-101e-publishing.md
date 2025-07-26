# NAK NIP-101e Publishing Rule

## Brief overview
This rule establishes standardized NAK commands for publishing NIP-101e compliant workout events (33401, 33402, 1301) with proper tag formatting, ensuring compatibility with our parsing services and Nostr ecosystem standards.

## Core Principles

### **1. Single Array Tags (CRITICAL)**
- **✅ REQUIRED**: Use semicolon syntax for array tags: `--tag 'format=weight;reps;rpe;set_type'`
- **❌ FORBIDDEN**: Multiple separate tags: `--tag format=weight --tag format=reps`
- **Why**: Our NIP-101e spec requires single array tags for efficient parsing

### **2. Test Credentials**
- **Test nsec**: `8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24`
- **Test pubkey**: `55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21`
- **Test npub**: `npub125f8lj0pcq7xk3v68w4h9ldenhh3v3x97gumm5yl8e0mgq0dnvssjptd2l`

### **3. Relay Configuration**
- **Primary**: `wss://nos.lol`
- **Backup**: `wss://relay.damus.io`
- **Backup**: `wss://relay.primal.net`

## Event Publishing Templates

### **Kind 33401: Exercise Template**

#### **Template Command**
```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33401 \
  --tag 'd=EXERCISE_ID' \
  --tag 'title=Exercise Name' \
  --tag 'format=weight;reps;rpe;set_type' \
  --tag 'format_units=UNIT1;UNIT2;UNIT3;UNIT4' \
  --tag 'equipment=EQUIPMENT_TYPE' \
  --tag 'difficulty=DIFFICULTY_LEVEL' \
  --tag 't=MUSCLE_GROUP' \
  --tag 't=MOVEMENT_PATTERN' \
  --tag 't=fitness' \
  --content 'Exercise description and instructions' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net
```

#### **Example: Push-up Exercise**
```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33401 \
  --tag 'd=push-up' \
  --tag 'title=Push-up' \
  --tag 'format=weight;reps;rpe;set_type' \
  --tag 'format_units=bodyweight;count;0-10;enum' \
  --tag 'equipment=bodyweight' \
  --tag 'difficulty=beginner' \
  --tag 't=chest' \
  --tag 't=push' \
  --tag 't=fitness' \
  --content 'Classic bodyweight exercise targeting chest, shoulders, and triceps. Perfect for building upper body strength.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net
```

#### **Expected JSON Output**
```json
{
  "kind": 33401,
  "tags": [
    ["d", "push-up"],
    ["title", "Push-up"],
    ["format", "weight", "reps", "rpe", "set_type"],
    ["format_units", "bodyweight", "count", "0-10", "enum"],
    ["equipment", "bodyweight"],
    ["difficulty", "beginner"],
    ["t", "chest"],
    ["t", "push"],
    ["t", "fitness"]
  ],
  "content": "Classic bodyweight exercise targeting chest, shoulders, and triceps. Perfect for building upper body strength."
}
```

### **Kind 33402: Workout Template**

#### **Template Command**
```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33402 \
  --tag 'd=TEMPLATE_ID' \
  --tag 'title=Template Name' \
  --tag 'type=WORKOUT_TYPE' \
  --tag 'exercise=33401:PUBKEY:EXERCISE_ID;;WEIGHT;REPS;RPE;SET_TYPE;SET_NUMBER' \
  --tag 'rounds=NUMBER' \
  --tag 'duration=SECONDS' \
  --tag 't=fitness' \
  --content 'Workout template description' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net
```

#### **Example: POWR Test Push Workout (Multiple Sets)**
```bash
nak event --sec eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222 --kind 33402 \
  --tag 'd=push-workout-bodyweight' \
  --tag 'title=POWR Test Push Workout' \
  --tag 'type=strength' \
  --tag 'exercise=33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:pushup-standard;;0;10;7;normal;1' \
  --tag 'exercise=33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:pushup-standard;;0;10;7;normal;2' \
  --tag 'exercise=33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:pushup-standard;;0;10;7;normal;3' \
  --tag 'exercise=33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:pike-pushup;;0;8;7;normal;1' \
  --tag 'exercise=33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:pike-pushup;;0;8;7;normal;2' \
  --tag 'exercise=33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:pike-pushup;;0;8;7;normal;3' \
  --tag 'exercise=33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:tricep-dips;;0;12;7;normal;1' \
  --tag 'exercise=33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:tricep-dips;;0;12;7;normal;2' \
  --tag 'exercise=33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:tricep-dips;;0;12;7;normal;3' \
  --tag 'exercise=33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:wall-handstand;;0;5;7;normal;1' \
  --tag 'exercise=33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:wall-handstand;;0;5;7;normal;2' \
  --tag 'exercise=33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:wall-handstand;;0;5;7;normal;3' \
  --tag 'duration=1800' \
  --tag 'difficulty=intermediate' \
  --tag 't=fitness' \
  --tag 'client=workout-pwa' \
  --content 'Upper body push exercises for strength building - corrected NIP-101e format with set numbers' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net
```

#### **Expected JSON Output**
```json
{
  "kind": 33402,
  "tags": [
    ["d", "push-workout-bodyweight"],
    ["title", "POWR Test Push Workout"],
    ["type", "strength"],
    ["exercise", "33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:pushup-standard", "", "0", "10", "7", "normal", "1"],
    ["exercise", "33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:pushup-standard", "", "0", "10", "7", "normal", "2"],
    ["exercise", "33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:pushup-standard", "", "0", "10", "7", "normal", "3"],
    ["exercise", "33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:pike-pushup", "", "0", "8", "7", "normal", "1"],
    ["exercise", "33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:pike-pushup", "", "0", "8", "7", "normal", "2"],
    ["exercise", "33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:pike-pushup", "", "0", "8", "7", "normal", "3"],
    ["exercise", "33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:tricep-dips", "", "0", "12", "7", "normal", "1"],
    ["exercise", "33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:tricep-dips", "", "0", "12", "7", "normal", "2"],
    ["exercise", "33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:tricep-dips", "", "0", "12", "7", "normal", "3"],
    ["exercise", "33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:wall-handstand", "", "0", "5", "7", "normal", "1"],
    ["exercise", "33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:wall-handstand", "", "0", "5", "7", "normal", "2"],
    ["exercise", "33401:eec6ab59082540837d4e23bd37b5c92bc74fe720c1139194ab6a60a4ab666222:wall-handstand", "", "0", "5", "7", "normal", "3"],
    ["duration", "1800"],
    ["difficulty", "intermediate"],
    ["t", "fitness"],
    ["client", "workout-pwa"]
  ],
  "content": "Upper body push exercises for strength building - corrected NIP-101e format with set numbers"
}
```

**Key Learning: Set Numbers in Both Templates and Records**
- **Templates (33402)**: Set numbers indicate exercise grouping and prevent deduplication
- **Records (1301)**: Set numbers track chronological order and provide unique identification
- **Deduplication Prevention**: Critical for preserving multiple identical sets in both event types
- The example shows: 3 sets of pushups (numbered 1,2,3), 3 sets of pike pushups (numbered 1,2,3), etc.
- Each exercise has its own set numbering sequence
- Total: 12 individual sets across 4 different exercises, each uniquely identified

### **Kind 1301: Workout Record**

#### **Template Command**
```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 1301 \
  --tag 'd=WORKOUT_ID' \
  --tag 'title=Workout Name' \
  --tag 'type=WORKOUT_TYPE' \
  --tag 'start=UNIX_TIMESTAMP' \
  --tag 'end=UNIX_TIMESTAMP' \
  --tag 'completed=true' \
  --tag 'template=33402:PUBKEY:TEMPLATE_ID;' \
  --tag 'exercise=33401:PUBKEY:EXERCISE_ID;;WEIGHT;REPS;RPE;SET_TYPE;SET_NUMBER' \
  --tag 't=fitness' \
  --content 'Workout completion summary' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net
```

## NIP-101e Multiple Sets and Deduplication Prevention

### **Critical Update: Set Numbers Required**

Based on testing with NDK (Nostr Development Kit), we discovered that **both 33402 templates and 1301 records require set_number parameters** to prevent unintended deduplication of identical exercise tags.

#### **The Deduplication Problem**
NDK automatically deduplicates events with identical tags. For workout events, this means:
- Multiple sets with identical parameters (same weight, reps, RPE, set_type) get deduplicated
- "3 sets of 10 push-ups" becomes "1 set of 10 push-ups" 
- Workout structure and volume are lost

#### **The Solution: Set Numbers**
Adding unique set_number parameters prevents deduplication while enabling advanced features:
- **Templates**: Set numbers indicate exercise grouping (same number = superset/circuit pairing)
- **Records**: Set numbers provide chronological tracking and unique identification
- **Analytics**: Enable set-by-set performance analysis and progression tracking

#### **Implementation Examples**

**Strength Training (Sequential Sets):**
```bash
--tag 'exercise=33401:pubkey:squats;;100;10;7;normal;1'
--tag 'exercise=33401:pubkey:squats;;100;10;7;normal;2'
--tag 'exercise=33401:pubkey:squats;;100;10;7;normal;3'
```

**Superset Training (Paired Exercises):**
```bash
--tag 'exercise=33401:pubkey:bench;;80;8;7;normal;1'
--tag 'exercise=33401:pubkey:rows;;70;8;7;normal;1'    # Same set number = superset pair
--tag 'exercise=33401:pubkey:bench;;80;8;7;normal;2'
--tag 'exercise=33401:pubkey:rows;;70;8;7;normal;2'    # Same set number = superset pair
```

**Circuit Training (Round-Based):**
```bash
--tag 'exercise=33401:pubkey:pushups;;0;10;7;normal;1'
--tag 'exercise=33401:pubkey:squats;;0;15;7;normal;1'
--tag 'exercise=33401:pubkey:pullups;;0;5;8;normal;1'
--tag 'exercise=33401:pubkey:pushups;;0;10;7;normal;2'  # Round 2
--tag 'exercise=33401:pubkey:squats;;0;15;7;normal;2'
--tag 'exercise=33401:pubkey:pullups;;0;5;8;normal;2'
```

## Tag Format Standards

### **Required Array Tags (Extensible Schema)**
- **format**: Exercise parameter schema `["format", "weight", "reps", "rpe", "set_type"]`
  - **Extensible**: Can include additional parameters like `"duration"`, `"distance"`, `"tempo"`, etc.
  - **Order matters**: Parameters in exercise references must match this order
- **format_units**: Parameter validation units `["format_units", "kg", "count", "0-10", "enum"]`
  - **Extensible**: Units correspond to format parameters in same order
  - **Examples**: `"bodyweight"`, `"kg"`, `"lbs"` for weight; `"seconds"`, `"minutes"` for duration
  - **1301 Dependency**: Workout records (1301) must use format/format_units from referenced 33401 exercises

### **Exercise Reference Format**
- **Template**: `33401:pubkey:exercise-d-tag`
- **With Parameters**: `33401:pubkey:exercise-d-tag;;weight;reps;rpe;set_type;set_number`
- **With Set Number**: `33401:pubkey:exercise-d-tag;;weight;reps;rpe;set_type;set_number`

### **Template Reference Format**
- **Basic**: `33402:pubkey:template-d-tag`
- **With Relay**: `33402:pubkey:template-d-tag;relay-url`

## NIP-101e Parameter Order and Dependencies

### **Parameter Order Consistency (CRITICAL)**
Parameters must appear in the **same order** as defined in the exercise's `format` tag, with set_number added as the final parameter:

#### **33401 Exercise Defines Order**
```json
["format", "weight", "reps", "rpe", "set_type"]
```

#### **33402 Template Uses Same Order + Set Number**
```bash
--tag 'exercise=33401:pubkey:exercise-id;;WEIGHT;REPS;RPE;SET_TYPE;SET_NUMBER'
#                                      ↑     ↑    ↑   ↑        ↑
#                                   position 1,2,3,4,5 match format order + set number
```

#### **1301 Record Uses Same Order + Set Number**
```bash
--tag 'exercise=33401:pubkey:exercise-id;;WEIGHT;REPS;RPE;SET_TYPE;SET_NUMBER'
#                                      ↑     ↑    ↑   ↑        ↑
#                                   position 1,2,3,4 + set number
```

### **Relay Tag Position**
- **33401/33402**: No relay tag in exercise/template references
- **1301**: Relay tag comes **after** template reference, **before** parameters
  ```bash
  --tag 'template=33402:pubkey:template-id;RELAY_URL'
  --tag 'exercise=33401:pubkey:exercise-id;RELAY_URL;WEIGHT;REPS;RPE;SET_TYPE;SET_NUMBER'
  ```

### **Template "Prescription" Concept**
The 33402 workout template **prescribes** specific parameter values for exercises:

#### **Template Prescribes Target Values with Set Numbers**
```bash
# Template prescribes: "Do 3 sets of squats with 100kg, 10 reps, 7 RPE, normal sets"
--tag 'exercise=33401:pubkey:squats;;100;10;7;normal;1'
--tag 'exercise=33401:pubkey:squats;;100;10;7;normal;2'
--tag 'exercise=33401:pubkey:squats;;100;10;7;normal;3'
```

#### **Record Reports Actual Values**
```bash
# Record reports: "I actually did squats with varying performance across 3 sets"
--tag 'exercise=33401:pubkey:squats;;95;8;8;normal;1'   # Set 1: lighter weight, fewer reps
--tag 'exercise=33401:pubkey:squats;;100;10;7;normal;2' # Set 2: as prescribed  
--tag 'exercise=33401:pubkey:squats;;100;8;9;normal;3'  # Set 3: harder RPE, fewer reps
```

#### **Prescription vs Performance**
- **33402 Template**: "Here's what you should do" (prescription with set structure)
- **1301 Record**: "Here's what I actually did" (performance with set tracking)
- **Parameters match format**: Both use same order from 33401 exercise definition
- **Set numbers**: Enable deduplication prevention and workout structure analysis
- **Flexibility**: Actual performance can differ from prescription while maintaining set structure

## Verification Commands

### **Verify Published Event**
```bash
# Method 1: By event ID (if you have it)
echo '["REQ","test",{"ids":["EVENT_ID"]}]' | websocat wss://nos.lol

# Method 2: By kind, author, and d-tag (recommended)
nak req -k KIND -a 55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21 --tag d=D_TAG wss://nos.lol | jq

# Method 3: Count all fitness events
nak req -a 55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21 --tag t=fitness wss://nos.lol | jq -s 'group_by(.kind) | map({kind: .[0].kind, count: length})'
```

### **Verify Tag Format**
```bash
# Check that format tags are single arrays
nak req -k 33401 -a 55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21 --tag d=EXERCISE_D_TAG wss://nos.lol | jq '.tags[] | select(.[0] == "format")'

# Should return: ["format", "weight", "reps", "rpe", "set_type"]
# NOT: ["format", "weight"], ["format", "reps"], etc.
```

## Common Mistakes to Avoid

### **❌ FORBIDDEN Patterns**

#### **Multiple Format Tags**
```bash
# WRONG: Creates separate tags
--tag format=weight --tag format=reps --tag format=rpe --tag format=set_type
```

#### **Comma-Separated Values**
```bash
# WRONG: Creates single string, not array
--tag 'format=weight,reps,rpe,set_type'
```

#### **Missing Semicolons in References**
```bash
# WRONG: Missing semicolons in exercise reference
--tag 'exercise=33401:pubkey:exercise-id:0:10:7:normal:1'
```

### **✅ CORRECT Patterns**

#### **Semicolon Array Syntax**
```bash
# CORRECT: Creates single array tag
--tag 'format=weight;reps;rpe;set_type'
```

#### **Proper Exercise References**
```bash
# CORRECT: Semicolons separate reference from parameters, including set number
--tag 'exercise=33401:pubkey:exercise-id;;0;10;7;normal;1'
```

## Parameter Validation

### **Format Units Reference**
| Parameter | Valid Units | Example Values |
|-----------|-------------|----------------|
| `weight` | `kg`, `lbs`, `bodyweight` | `"60"`, `"0"` (bodyweight) |
| `reps` | `count`, `reps` | `"10"`, `"15"` |
| `rpe` | `0-10`, `1-10`, `rpe` | `"7"`, `"8.5"` |
| `set_type` | `enum`, `type` | `"normal"`, `"warmup"`, `"drop"`, `"failure"` |
| `set_number` | `count`, `number` | `"1"`, `"2"`, `"3"` |
| `duration` | `seconds`, `minutes`, `sec`, `min` | `"30"`, `"1.5"` |
| `distance` | `meters`, `km`, `miles`, `yards`, `m` | `"100"`, `"5.2"` |

### **Equipment Types**
- `bodyweight` - No equipment needed
- `barbell` - Olympic barbell required
- `dumbbell` - Dumbbells required
- `kettlebell` - Kettlebells required
- `machine` - Gym machine required
- `cable` - Cable machine required
- `resistance_band` - Resistance bands required

### **Difficulty Levels**
- `beginner` - New to exercise
- `intermediate` - Some experience
- `advanced` - Experienced athlete
- `expert` - Elite level

## Troubleshooting

### **Event Not Found**
1. **Check Event ID Format**: Must be 64-character hex string
2. **Try Different Relays**: Test multiple relays for availability
3. **Verify Author Pubkey**: Ensure correct pubkey format
4. **Check D-Tag**: Verify d-tag matches exactly

### **Malformed Tags**
1. **Verify Semicolon Syntax**: Use `--tag 'format=value1;value2;value3'`
2. **Check JSON Output**: Use `| jq` to verify tag structure
3. **Test with Simple Event**: Create test event to verify syntax

### **Publishing Failures**
1. **Check Network Connection**: Ensure relay is accessible
2. **Verify Private Key**: Ensure nsec is valid 64-character hex
3. **Test with Different Relay**: Try backup relays
4. **Check Event Size**: Large events may be rejected

## Integration with Existing Rules

### **Related .clinerules**
- **nip-101e-standards.md**: Event structure and validation requirements
- **nostr-event-verification.md**: Verification commands and troubleshooting
- **post-task-completion-workflow.md**: Include verification in completion workflow

### **Workflow Integration**
1. **Publish Event**: Use NAK commands from this rule
2. **Verify Event**: Use verification commands to confirm publishing
3. **Update Documentation**: Follow post-task completion workflow
4. **Test Parsing**: Ensure events work with our parsing services

## Success Metrics

### **Publishing Quality Indicators**
- ✅ All events retrievable by ID within 30 seconds
- ✅ Tag format matches expected JSON structure
- ✅ Events parse correctly in our services
- ✅ No malformed tag errors in parsing logs

### **Command Reliability Indicators**
- ✅ NAK commands execute without errors
- ✅ Verification commands return expected results
- ✅ Events appear in relay queries consistently
- ✅ Tag structure matches NIP-101e specification

This rule ensures reliable, compliant NIP-101e event publishing using NAK while maintaining compatibility with our parsing services and the broader Nostr ecosystem.

---

**Last Updated**: 2025-07-26
**Project**: POWR Workout PWA
**Environment**: Web Browser + NAK CLI
**Test Credentials**: Included for development use