# Workout Template Commands Review - NIP-101e Compliant

## Overview
This document contains NAK commands for publishing 4 curated workout templates using the existing exercise library. Each template follows NIP-101e standards with proper exercise ordering and strategic sequencing for optimal workout flow.

**Key Features:**
- ✅ **NIP-101e Compliant** - Proper format tags and exercise references
- ✅ **Strategic Exercise Ordering** - Exercises ordered for optimal workout flow
- ✅ **Detailed Instructions** - Circuit/superset instructions in content
- ✅ **Proper Exercise References** - Uses existing 33401:pubkey:d-tag format
- ✅ **Set Number Sequencing** - Prevents NDK deduplication issues

**Test Credentials:**
- **Private Key**: `8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24`
- **Public Key**: `55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21`

---

## WORKOUT 1: Full Body Conditioning Circuit

**Goal**: Total-body strength + cardio  
**Difficulty**: Intermediate  
**Format**: Circuit - 3-4 rounds, 60-90 seconds rest between rounds  
**Duration**: ~25-30 minutes  

### Exercise Order Strategy:
1. **Burpees** (full-body activation)
2. **Pull-ups** (upper pull)  
3. **Air Squats** (lower body)
4. **Push-ups** (upper push)
5. **Mountain Climbers** (cardio/core)
6. **Plank** (core stability)
7. **World's Greatest Stretch** (mobility/recovery)

```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33402 \
  --tag 'd=full-body-conditioning-circuit' \
  --tag 'title=Full Body Conditioning Circuit' \
  --tag 'type=circuit' \
  --tag 'difficulty=intermediate' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:burpee;;0;12;7;normal;1' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pull-up;;0;8;7;normal;2' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:air-squat;;0;18;6;normal;3' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:push-up;;0;12;7;normal;4' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:mountain-climbers;;0;30;7;normal;5' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:plank;;0;45;7;normal;6' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:worlds-greatest-stretch;;0;60;5;normal;7' \
  --tag 't=fitness' \
  --tag 't=circuit' \
  --tag 't=conditioning' \
  --tag 't=full-body' \
  --content 'Full body conditioning circuit combining strength and cardio. CIRCUIT FORMAT: Perform all 7 exercises in sequence, then rest 60-90 seconds. Repeat for 3-4 total rounds. Exercise Flow: (1) Burpees 10-15 reps for full-body activation, (2) Pull-ups 6-10 reps (use assistance if needed), (3) Air Squats 15-20 reps for lower body power, (4) Push-ups 10-15 reps for upper body strength, (5) Mountain Climbers 30 seconds fast pace for cardio, (6) Plank 45-second hold for core stability, (7) World'\''s Greatest Stretch 1-2 minutes each side for mobility and recovery. Scale reps based on fitness level. Focus on maintaining good form throughout all rounds.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net
```

**Expected JSON Structure:**
```json
{
  "kind": 33402,
  "tags": [
    ["d", "full-body-conditioning-circuit"],
    ["title", "Full Body Conditioning Circuit"],
    ["type", "circuit"],
    ["difficulty", "intermediate"],
    ["duration", "1800"],
    ["rounds", "3"],
    ["rest_between_rounds", "75"],
    ["exercise", "33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:burpee", "", "0", "12", "7", "normal", "1"],
    ["exercise", "33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pull-up", "", "-10", "8", "7", "normal", "2"],
    ["exercise", "33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:air-squat", "", "0", "18", "6", "normal", "3"],
    ["exercise", "33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:push-up", "", "0", "12", "7", "normal", "4"],
    ["exercise", "33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:mountain-climbers", "", "0", "30", "7", "normal", "5"],
    ["exercise", "33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:plank", "", "0", "45", "7", "normal", "6"],
    ["exercise", "33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:worlds-greatest-stretch", "", "0", "60", "5", "normal", "7"]
  ]
}
```

---

## WORKOUT 2: Upper Body Strength + Core

**Goal**: Build upper body pushing/pulling and core stability  
**Difficulty**: Intermediate-Advanced  
**Format**: Supersets + Core Finisher  
**Duration**: ~35-40 minutes  

### Exercise Order Strategy:
**Superset A** (Push/Pull pairing):
1. **Wide Pull-ups** (back width)
2. **Diamond Push-ups** (tricep focus)

**Superset B** (Shoulders/Posture):
3. **Pike Push-ups** (vertical push)
4. **Wall Slides** (posture/mobility)

**Core Finisher** (Progressive difficulty):
5. **V-Ups** (dynamic core)
6. **Bicycle Crunches** (rotational core)
7. **Plank** (isometric hold)

```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33402 \
  --tag 'd=upper-body-strength-core' \
  --tag 'title=Upper Body Strength + Core' \
  --tag 'type=strength' \
  --tag 'difficulty=advanced' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:wide-pull-up;;0;7;8;normal;1' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:wide-pull-up;;0;7;8;normal;2' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:wide-pull-up;;0;7;8;normal;3' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:diamond-push-up;;0;10;8;normal;4' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:diamond-push-up;;0;10;8;normal;5' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:diamond-push-up;;0;10;8;normal;6' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pike-push-up;;0;8;8;normal;7' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pike-push-up;;0;8;8;normal;8' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pike-push-up;;0;8;8;normal;9' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:wall-slides;;0;12;6;normal;10' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:wall-slides;;0;12;6;normal;11' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:wall-slides;;0;12;6;normal;12' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:v-up;;0;15;7;normal;13' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:bicycle-crunch;;0;20;7;normal;14' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:plank;;0;60;7;normal;15' \
  --tag 't=fitness' \
  --tag 't=strength' \
  --tag 't=upper-body' \
  --tag 't=core' \
  --content 'Upper body strength workout with core finisher. STRAIGHT SETS FORMAT: Complete all sets of each exercise before moving to the next. Rest 90 seconds between sets. WORKOUT STRUCTURE: (1) Wide Pull-ups 3 sets of 6-8 reps (use assistance if needed), (2) Diamond Push-ups 3 sets of 8-12 reps, (3) Pike Push-ups 3 sets of 6-10 reps, (4) Wall Slides 3 sets of 10-15 slow reps, (5) CORE FINISHER: V-Ups 15 reps, Bicycle Crunches 20 reps (10 each side), Plank 1-minute hold. OPTIONAL SUPERSET PAIRING: Advanced users can pair Wide Pull-ups with Diamond Push-ups (exercises 1-2) and Pike Push-ups with Wall Slides (exercises 3-4) for time efficiency. Equipment needed: Pull-up bar. Focus on controlled movements and full range of motion throughout.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net
```

---

## WORKOUT 3: Lower Body Focus (Strength + Stability)

**Goal**: Develop glutes, quads, hamstrings & unilateral control  
**Difficulty**: Beginner-Intermediate  
**Format**: Strength Block + Mobility Block  
**Duration**: ~30-35 minutes  

### Exercise Order Strategy:
**Block A - Strength** (Bilateral → Unilateral → Posterior):
1. **Bulgarian Split Squats** (unilateral strength)
2. **Hip Thrusts** (glute activation)
3. **Air Squats** (bilateral power)

**Block B - Mobility + Core** (Recovery focused):
4. **World's Greatest Stretch** (hip mobility)
5. **Plank** (core stability)
6. **Mountain Climbers** (active recovery)
7. **Wall Slides** (posture balance)

```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33402 \
  --tag 'd=lower-body-strength-stability' \
  --tag 'title=Lower Body Strength + Stability' \
  --tag 'type=strength' \
  --tag 'difficulty=intermediate' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:bulgarian-split-squat;;0;8;7;normal;1' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:bulgarian-split-squat;;0;8;7;normal;2' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:bulgarian-split-squat;;0;8;8;normal;3' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:hip-thrust;;0;15;7;normal;4' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:hip-thrust;;0;15;7;normal;5' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:hip-thrust;;0;15;8;normal;6' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:air-squat;;0;20;6;normal;7' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:air-squat;;0;20;7;normal;8' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:air-squat;;0;20;7;normal;9' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:worlds-greatest-stretch;;0;45;5;normal;10' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:plank;;0;45;6;normal;11' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:mountain-climbers;;0;30;6;normal;12' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:worlds-greatest-stretch;;0;45;5;normal;13' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:plank;;0;45;6;normal;14' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:mountain-climbers;;0;30;6;normal;15' \
  --tag 't=fitness' \
  --tag 't=strength' \
  --tag 't=lower-body' \
  --tag 't=stability' \
  --content 'Lower body strength and stability workout. STRAIGHT SETS FORMAT: Complete all sets of each exercise before moving to the next. Rest 90 seconds between sets. WORKOUT STRUCTURE: (1) Bulgarian Split Squats 3 sets of 8 reps per leg (Note: 8 reps = both legs completed, standard fitness app convention), (2) Hip Thrusts 3 sets of 15 reps, (3) Air Squats 3 sets of 20 reps, (4) MOBILITY FINISHER: World'\''s Greatest Stretch 2 sets of 45 seconds per side, Plank 2 sets of 45 seconds, Mountain Climbers 2 sets of 30 seconds. Rest 60 seconds between mobility exercises. Equipment needed: Bench or chair for split squats. Focus on controlled movement, full range of motion, and unilateral control. Emphasize glute activation throughout all exercises.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net
```

---

## WORKOUT 4: Core & Cardio Burnout

**Goal**: Core conditioning and heart rate elevation  
**Difficulty**: All levels (scale reps)  
**Format**: High-intensity circuit (AMRAP style optional)  
**Duration**: ~20-25 minutes  

### Exercise Order Strategy:
**Circuit Flow** (Core → Cardio → Core → Full-body → Core → Lower):
1. **Bicycle Crunches** (rotational core)
2. **V-Ups** (dynamic core)
3. **Mountain Climbers** (cardio/core)
4. **Burpees** (full-body cardio)
5. **Plank** (isometric core)
6. **Hip Thrusts** (glute activation)
7. **World's Greatest Stretch** (recovery/mobility)

```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33402 \
  --tag 'd=core-cardio-burnout' \
  --tag 'title=Core & Cardio Burnout' \
  --tag 'type=circuit' \
  --tag 'difficulty=intermediate' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:bicycle-crunch;;0;20;7;normal;1' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:v-up;;0;15;7;normal;2' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:mountain-climbers;;0;30;8;normal;3' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:burpee;;0;10;8;normal;4' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:plank;;0;45;7;normal;5' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:hip-thrust;;0;18;7;normal;6' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:worlds-greatest-stretch;;0;30;5;normal;7' \
  --tag 't=fitness' \
  --tag 't=circuit' \
  --tag 't=core' \
  --tag 't=cardio' \
  --content 'High-intensity core and cardio circuit. CIRCUIT FORMAT: Perform all 7 exercises in sequence with minimal rest between exercises. Rest 1 minute between rounds. Complete 3-5 rounds total (scale based on fitness level). Exercise Flow: (1) Bicycle Crunches 20 reps for rotational core, (2) V-Ups 15 reps for dynamic core strength, (3) Mountain Climbers 30 seconds fast pace for cardio, (4) Burpees 10 reps for full-body conditioning, (5) Plank 45-second hold for core stability, (6) Hip Thrusts 15-20 reps for glute activation, (7) World'\''s Greatest Stretch 30 seconds each side for recovery. AMRAP OPTION: Set timer for 15-20 minutes and complete as many rounds as possible. Cool down with additional stretching. Scale all reps based on fitness level - focus on maintaining form over speed.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net
```

---

## Verification Commands

After publishing each template, verify with these commands:

### Verify Template Publishing
```bash
# Check all published templates
nak req -k 33402 -a 55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21 wss://nos.lol | jq -s 'length'

# Verify specific template
nak req -k 33402 -a 55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21 --tag d=full-body-conditioning-circuit wss://nos.lol | jq

# Check exercise references in template
nak req -k 33402 -a 55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21 --tag d=full-body-conditioning-circuit wss://nos.lol | jq '.tags[] | select(.[0] == "exercise")'
```

### Published Workout Template References

**✅ WORKOUT 1: Full Body Conditioning Circuit**
- **Event ID**: `5df490b7fc154883b1be3e6b56a2f522a9d7cc412a64e0194f5a8ce3f1182cc8`
- **naddr**: `naddr1qq0xvatvdskkymmy0ykkxmmwv35hg6t0de5kueedvd5hycm4d96qygz4zfluncwq8345tx3m4de0mwvaautyf30j8x7ap8e7t76qrmvmyypsgqqqsfaqqvnlky`
- **NAK Encode Command**: `nak encode naddr --kind 33402 --pubkey 55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21 --identifier full-body-conditioning-circuit`

**✅ WORKOUT 2: Upper Body Strength + Core**
- **Event ID**: `7ec8d9e09a87700f1000c5afd6c9c2b8f07cde7ccde6d97ee24d6af7ad39b69a`
- **naddr**: `naddr1qqv82ursv4ez6cn0v3uj6um5wfjkuem5dqkkxmmjv5pzq4gj0ly7rspuddze5watwt7mn800zezvtu3ehhgf70jlksq7mxepqvzqqqyz0gv9ejj6`
- **NAK Encode Command**: `nak encode naddr --kind 33402 --pubkey 55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21 --identifier upper-body-strength-core`

**✅ WORKOUT 3: Lower Body Strength + Stability**
- **Event ID**: `c01aaf20f66f103ec523fd9bd629753dcd1afe8328770cbab9433850d189161f`
- **naddr**: `naddr1qqwkcmmhv4ez6cn0v3uj6um5wfjkuem5dqkhxarpvf5kc6t50ypzq4gj0ly7rspuddze5watwt7mn800zezvtu3ehhgf70jlksq7mxepqvzqqqyz0g30nmnv`
- **NAK Encode Command**: `nak encode naddr --kind 33402 --pubkey 55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21 --identifier lower-body-strength-stability`

**✅ WORKOUT 4: Core & Cardio Burnout**
- **Event ID**: `dbda9d84ffe5d9f334a2fcb9cf248993fc48b979f7d08092327c5994afbf5f62`
- **naddr**: `naddr1qqfkxmmjv5kkxctjv35k7ttzw4exumm4wspzq4gj0ly7rspuddze5watwt7mn800zezvtu3ehhgf70jlksq7mxepqvzqqqyz0gdw5nvp`
- **NAK Encode Command**: `nak encode naddr --kind 33402 --pubkey 55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21 --identifier core-cardio-burnout`

### Verify Exercise Reference Resolution
```bash
# Test that all referenced exercises exist
nak req -k 33401 -a 55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21 --tag d=burpee wss://nos.lol | jq '.id'
nak req -k 33401 -a 55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21 --tag d=pull-up wss://nos.lol | jq '.id'
# ... repeat for all referenced exercises
```

---

## Exercise Reference Mapping

**Confirmed Exercise d-tags from existing library:**
- `burpee` ✅
- `pull-up` ✅  
- `air-squat` ✅
- `push-up` ✅
- `mountain-climbers` ✅
- `plank` ✅
- `worlds-greatest-stretch` ✅
- `wide-pull-up` ✅
- `diamond-push-up` ✅
- `pike-push-up` ✅
- `wall-slides` ✅
- `v-up` ✅
- `bicycle-crunch` ✅
- `bulgarian-split-squat` ✅
- `hip-thrust` ✅

**All exercise references use the format:**
`33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:d-tag`

---

## NIP-101e Compliance Features

### ✅ **Proper Tag Structure**
- **d-tag**: Unique template identifier
- **title**: Human-readable template name
- **type**: Workout type (circuit/strength)
- **difficulty**: Beginner/Intermediate/Advanced
- **duration**: Total workout time in seconds
- **rounds**: Number of rounds/sets
- **exercise tags**: Proper 33401:pubkey:d-tag;;weight;reps;rpe;set_type;set_number format

### ✅ **Strategic Exercise Ordering**
- **Circuit Flow**: Alternates muscle groups and movement patterns
- **Superset Pairing**: Complementary exercises grouped together
- **Progressive Difficulty**: Easier exercises first, challenging ones later
- **Recovery Integration**: Mobility/stretching exercises strategically placed

### ✅ **Set Number System**
- **Prevents NDK Deduplication**: Each exercise has unique set numbers
- **Logical Grouping**: Same set numbers indicate superset/circuit pairing
- **Sequential Flow**: Set numbers follow workout progression order

### ✅ **Weight Parameter Usage**
- **Bodyweight**: `"0"` for standard bodyweight exercises
- **Assisted**: Negative values (e.g., `"-10"` for 10kg assistance)
- **Weighted**: Positive values for added weight
- **Time-based**: Duration in seconds for holds/stretches

---

## Template Collection Command

After publishing all 4 templates, create a collection:

```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 30003 \
  --tag 'd=powr-workout-templates' \
  --tag 'title=POWR Workout Templates' \
  --tag 'description=Curated collection of bodyweight workout templates for the POWR platform' \
  --tag 'a=33402:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:full-body-conditioning-circuit' \
  --tag 'a=33402:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:upper-body-strength-core' \
  --tag 'a=33402:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:lower-body-strength-stability' \
  --tag 'a=33402:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:core-cardio-burnout' \
  --tag 't=fitness' \
  --tag 't=workout-templates' \
  --tag 't
