# Nostr Event Verification Rule

## Brief overview
This rule establishes standardized NAK and websocat commands for verifying Nostr events published by the POWR Workout PWA, ensuring proper event structure, tagging, and network accessibility.

## Core Verification Principles

### 1. **Always Verify After Publishing**
- **REQUIRED**: Verify all published events using NAK commands
- **REQUIRED**: Test both individual event retrieval and filtered queries
- **REQUIRED**: Validate event structure and tag compliance
- **REQUIRED**: Confirm dependency chains for collections and templates

### 2. **Use Proven Command Patterns**
- **websocat**: For direct event ID queries (most reliable)
- **nak**: For filtered queries by author, kind, and tags
- **jq**: For parsing and analyzing results

## Verified Command Patterns

### Pattern 1: Individual Event Verification (websocat)
```bash
# Retrieve specific event by ID - MOST RELIABLE METHOD
echo '["REQ","test",{"ids":["EVENT_ID_HERE"]}]' | websocat wss://nos.lol

# Example: Verify Standard Pushup exercise
echo '["REQ","test",{"ids":["c4dd2576f0f638825a2984497c678b55a0d4c72fc65110c75550a2ce8bdeb4de"]}]' | websocat wss://nos.lol
```

**Expected Response Format:**
```json
["EVENT","test",{
  "content":"Exercise description",
  "created_at":1750876312,
  "id":"c4dd2576f0f638825a2984497c678b55a0d4c72fc65110c75550a2ce8bdeb4de",
  "kind":33401,
  "pubkey":"55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21",
  "sig":"...",
  "tags":[["d","pushup-standard"],["title","Standard Pushup"],...]}]
["EOSE","test"]
```

### Pattern 2: Event Count Verification (nak + jq)
```bash
# Count events by kind for verification
nak req -a YOUR_PUBKEY --tag t=fitness wss://nos.lol | jq -s 'group_by(.kind) | map({kind: .[0].kind, count: length})'

# Example result for Phase 1 content:
# [
#   { "kind": 33401, "count": 12 },  // Exercise Templates
#   { "kind": 33402, "count": 3 },   // Workout Templates  
#   { "kind": 30003, "count": 2 }    // Collections
# ]
```

### Pattern 3: Workout Template Verification
```bash
# Verify workout template with exercise references
nak req -k 33402 -a YOUR_PUBKEY --tag d=TEMPLATE_D_TAG wss://nos.lol

# Example: Verify push workout template
nak req -k 33402 -a 55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21 --tag d=push-workout-bodyweight wss://nos.lol

# Extract exercise references
nak req -k 33402 -a YOUR_PUBKEY --tag d=TEMPLATE_D_TAG wss://nos.lol | jq '.tags[] | select(.[0] == "exercise")'
```

**Expected Exercise Tag Format:**
```json
[
  "exercise",
  "33401:pubkey:exercise-d-tag",
  "sets",
  "reps", 
  "weight"
]
```

### Pattern 4: Collection Verification
```bash
# Verify collection with content references
nak req -k 30003 -a YOUR_PUBKEY --tag d=COLLECTION_D_TAG wss://nos.lol

# Example: Verify exercise library collection
nak req -k 30003 -a 55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21 --tag d=exercise-library wss://nos.lol

# Extract content references
nak req -k 30003 -a YOUR_PUBKEY --tag d=COLLECTION_D_TAG wss://nos.lol | jq '.tags[] | select(.[0] == "a")'
```

**Expected Collection Reference Format:**
```json
[
  "a",
  "33401:pubkey:exercise-d-tag"  // For exercise references
]
[
  "a", 
  "33402:pubkey:template-d-tag"  // For template references
]
```

### Pattern 5: Bulk Event Verification
```bash
# Get all fitness events for an author
nak req -a YOUR_PUBKEY --tag t=fitness wss://nos.lol

# Count total events
nak req -a YOUR_PUBKEY --tag t=fitness wss://nos.lol | jq length

# Get events by specific kind
nak req -k 33401 -a YOUR_PUBKEY wss://nos.lol  # All exercise templates
nak req -k 33402 -a YOUR_PUBKEY wss://nos.lol  # All workout templates
nak req -k 30003 -a YOUR_PUBKEY wss://nos.lol  # All collections
```

## Verification Workflows

### Workflow 1: Post-Publishing Verification
After publishing new content, run this verification sequence:

```bash
# 1. Count verification - ensure expected numbers
nak req -a YOUR_PUBKEY --tag t=fitness wss://nos.lol | jq -s 'group_by(.kind) | map({kind: .[0].kind, count: length})'

# 2. Spot check individual events
echo '["REQ","test",{"ids":["SPECIFIC_EVENT_ID"]}]' | websocat wss://nos.lol

# 3. Verify dependency chains
nak req -k 33402 -a YOUR_PUBKEY wss://nos.lol | jq '.tags[] | select(.[0] == "exercise")' | head -5
nak req -k 30003 -a YOUR_PUBKEY wss://nos.lol | jq '.tags[] | select(.[0] == "a")' | head -5
```

### Workflow 2: Dependency Chain Validation
Verify that collections properly reference templates and exercises:

```bash
# 1. Get collection references
COLLECTION_REFS=$(nak req -k 30003 -a YOUR_PUBKEY --tag d=COLLECTION_D_TAG wss://nos.lol | jq -r '.tags[] | select(.[0] == "a") | .[1]')

# 2. Verify each reference exists
for ref in $COLLECTION_REFS; do
  kind=$(echo $ref | cut -d: -f1)
  pubkey=$(echo $ref | cut -d: -f2) 
  dtag=$(echo $ref | cut -d: -f3)
  echo "Checking $kind:$dtag"
  nak req -k $kind -a $pubkey --tag d=$dtag wss://nos.lol | jq -r '.id // "NOT FOUND"'
done
```

### Workflow 3: NIP-101e Compliance Check
Verify fitness events follow NIP-101e standards:

```bash
# Check exercise templates (Kind 33401)
nak req -k 33401 -a YOUR_PUBKEY wss://nos.lol | jq '.tags[] | select(.[0] == "d" or .[0] == "title" or .[0] == "equipment")'

# Check workout templates (Kind 33402) 
nak req -k 33402 -a YOUR_PUBKEY wss://nos.lol | jq '.tags[] | select(.[0] == "exercise")' | head -3

# Verify required tags exist
nak req -k 33401 -a YOUR_PUBKEY --tag d=EXERCISE_D_TAG wss://nos.lol | jq 'if (.tags | map(.[0]) | contains(["d", "title"])) then "✅ VALID" else "❌ MISSING REQUIRED TAGS" end'
```

## Error Patterns and Troubleshooting

### Common NAK Command Issues

#### ❌ **Invalid Flag Errors**
```bash
# WRONG: These flags don't exist
nak req --ids EVENT_ID wss://nos.lol     # ❌ --ids flag doesn't exist
nak req -f '{"ids":["..."]}' wss://nos.lol  # ❌ -f flag doesn't exist
```

#### ✅ **Correct Alternatives**
```bash
# CORRECT: Use websocat for event ID queries
echo '["REQ","test",{"ids":["EVENT_ID"]}]' | websocat wss://nos.lol

# CORRECT: Use nak for filtered queries
nak req -a PUBKEY --tag d=D_TAG wss://nos.lol
```

#### ❌ **jq Parsing Errors**
```bash
# WRONG: Missing -s flag for array input
nak req -a PUBKEY wss://nos.lol | jq 'group_by(.kind)'  # ❌ Fails on multiple events

# CORRECT: Use -s flag to read entire input as array
nak req -a PUBKEY wss://nos.lol | jq -s 'group_by(.kind) | map({kind: .[0].kind, count: length})'
```

### Event Not Found Troubleshooting

#### Step 1: Verify Event ID
```bash
# Check if event ID is correct (64-char hex)
echo "EVENT_ID" | grep -E '^[a-f0-9]{64}$' && echo "✅ Valid format" || echo "❌ Invalid format"
```

#### Step 2: Try Different Relays
```bash
# Test multiple relays
for relay in "wss://nos.lol" "wss://relay.damus.io" "wss://relay.primal.net"; do
  echo "Testing $relay..."
  echo '["REQ","test",{"ids":["EVENT_ID"]}]' | timeout 10 websocat $relay
done
```

#### Step 3: Check Author/Tag Filters
```bash
# Verify author pubkey format
echo "PUBKEY" | grep -E '^[a-f0-9]{64}$' && echo "✅ Valid pubkey" || echo "❌ Invalid pubkey"

# Check if event exists with broader filter
nak req -a PUBKEY wss://nos.lol | jq 'select(.id == "EVENT_ID")'
```

## Integration with Development Workflow

### When to Apply This Rule

#### **Always Verify After:**
- Publishing new exercise templates (Kind 33401)
- Publishing new workout templates (Kind 33402)  
- Publishing new collections (Kind 30003)
- Major content updates or migrations
- Changing event tagging or structure

#### **Verification Checklist**
- [ ] Event count matches expected numbers
- [ ] Individual events retrievable by ID
- [ ] Required tags present and properly formatted
- [ ] Dependency chains intact (collections → templates → exercises)
- [ ] NIP-101e compliance for fitness events
- [ ] NIP-51 compliance for collections

### Integration with .clinerules

#### **Related Rules**
- **nip-101e-standards.md**: Event structure and tagging requirements
- **post-task-completion-workflow.md**: Include verification in completion workflow
- **research-before-implementation.md**: Use Nostr MCP for protocol research

#### **Update .clinerules/README.md**
Add to problem-based navigation:
```markdown
| "Need to verify published events" / "Check Nostr content" | nostr-event-verification.md |
| "NAK commands failing" / "Event not found" | nostr-event-verification.md |
```

## Command Reference Quick Sheet

### Essential Commands
```bash
# Individual event by ID (most reliable)
echo '["REQ","test",{"ids":["EVENT_ID"]}]' | websocat wss://nos.lol

# Count events by kind
nak req -a PUBKEY --tag t=fitness wss://nos.lol | jq -s 'group_by(.kind) | map({kind: .[0].kind, count: length})'

# Get specific template/exercise
nak req -k KIND -a PUBKEY --tag d=D_TAG wss://nos.lol

# Extract exercise references from template
nak req -k 33402 -a PUBKEY --tag d=TEMPLATE_D_TAG wss://nos.lol | jq '.tags[] | select(.[0] == "exercise")'

# Extract content references from collection  
nak req -k 30003 -a PUBKEY --tag d=COLLECTION_D_TAG wss://nos.lol | jq '.tags[] | select(.[0] == "a")'
```

### Environment Variables
```bash
# Set these for easier command usage
export POWR_PUBKEY="55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21"
export POWR_RELAY="wss://nos.lol"

# Then use in commands
nak req -a $POWR_PUBKEY --tag t=fitness $POWR_RELAY | jq -s 'group_by(.kind) | map({kind: .[0].kind, count: length})'
```

## Success Metrics

### Verification Quality Indicators
- ✅ All published events retrievable by ID
- ✅ Event counts match expected numbers  
- ✅ Dependency chains resolve correctly
- ✅ Required tags present and properly formatted
- ✅ NIP-101e and NIP-51 compliance confirmed

### Command Reliability Indicators  
- ✅ websocat commands work consistently for event ID queries
- ✅ nak commands work reliably for filtered queries
- ✅ jq parsing produces expected output format
- ✅ Error patterns are well-understood and documented

This rule ensures reliable verification of all Nostr content published by the POWR Workout PWA, providing confidence in event structure, network accessibility, and protocol compliance.

---

**Last Updated**: 2025-06-25
**Project**: POWR Workout PWA
**Environment**: Web Browser
**Verified Commands**: websocat, nak, jq
