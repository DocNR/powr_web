# Test Workout Template with NIP-92 Media Content

## Test Workout: "POWR Bodyweight Basics"

This is a test workout template (Kind 33402) that demonstrates NIP-92 media attachments with POWR custom fields.

### Workout Structure
- **Duration**: 20 minutes
- **Difficulty**: Beginner
- **Type**: Circuit
- **Equipment**: None (bodyweight only)

### Exercises (3 exercises, 2 rounds each)
1. **Push-ups** - 3 sets of 8-12 reps
2. **Bodyweight Squats** - 3 sets of 10-15 reps  
3. **Plank Hold** - 3 sets of 30 seconds

## NAK Command for Test Workout Template (Kind 33402)

```bash
# Test Workout Template with NIP-92 Media Attachments
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33402 \
  --tag 'd=powr-bodyweight-basics-test' \
  --tag 'title=POWR Bodyweight Basics' \
  --tag 'type=circuit' \
  --tag 'duration=1200' \
  --tag 'difficulty=beginner' \
  --tag 'rounds=2' \
  \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pushup-standard;;0;10;6;normal;1' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pushup-standard;;0;10;6;normal;2' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pushup-standard;;0;10;6;normal;3' \
  \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:bodyweight-squat;;0;12;6;normal;1' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:bodyweight-squat;;0;12;6;normal;2' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:bodyweight-squat;;0;12;6;normal;3' \
  \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:plank-hold;;0;30;6;normal;1' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:plank-hold;;0;30;6;normal;2' \
  --tag 'exercise=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:plank-hold;;0;30;6;normal;3' \
  \
  --tag 'imeta=url https://www.youtube.com/watch?v=IODxDxX7oi4 m video/mp4 purpose demonstration context workout alt Bodyweight workout demonstration' \
  --tag 'imeta=url https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b m image/jpeg purpose cover context workout alt Bodyweight workout cover image' \
  --tag 'imeta=url https://images.unsplash.com/photo-1544367567-0f2fcb009e0b m image/jpeg purpose thumbnail context workout alt Workout thumbnail' \
  \
  --tag 't=fitness' \
  --tag 't=bodyweight' \
  --tag 't=beginner' \
  --tag 'client=powr-pwa' \
  --content 'A beginner-friendly bodyweight circuit focusing on fundamental movement patterns. Perfect for building strength and endurance with no equipment needed. Features push-ups for upper body, squats for lower body, and planks for core stability.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net
```

## Expected JSON Structure

```json
{
  "kind": 33402,
  "content": "A beginner-friendly bodyweight circuit focusing on fundamental movement patterns. Perfect for building strength and endurance with no equipment needed. Features push-ups for upper body, squats for lower body, and planks for core stability.",
  "tags": [
    ["d", "powr-bodyweight-basics-test"],
    ["title", "POWR Bodyweight Basics"],
    ["type", "circuit"],
    ["duration", "1200"],
    ["difficulty", "beginner"],
    ["rounds", "2"],
    
    ["exercise", "33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pushup-standard", "", "0", "10", "6", "normal", "1"],
    ["exercise", "33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pushup-standard", "", "0", "10", "6", "normal", "2"],
    ["exercise", "33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pushup-standard", "", "0", "10", "6", "normal", "3"],
    
    ["exercise", "33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:bodyweight-squat", "", "0", "12", "6", "normal", "1"],
    ["exercise", "33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:bodyweight-squat", "", "0", "12", "6", "normal", "2"],
    ["exercise", "33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:bodyweight-squat", "", "0", "12", "6", "normal", "3"],
    
    ["exercise", "33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:plank-hold", "", "0", "30", "6", "normal", "1"],
    ["exercise", "33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:plank-hold", "", "0", "30", "6", "normal", "2"],
    ["exercise", "33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:plank-hold", "", "0", "30", "6", "normal", "3"],
    
    ["imeta", "url https://www.youtube.com/watch?v=IODxDxX7oi4 m video/mp4 purpose demonstration context workout alt Bodyweight workout demonstration"],
    ["imeta", "url https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b m image/jpeg purpose cover context workout alt Bodyweight workout cover image"],
    ["imeta", "url https://images.unsplash.com/photo-1544367567-0f2fcb009e0b m image/jpeg purpose thumbnail context workout alt Workout thumbnail"],
    
    ["t", "fitness"],
    ["t", "bodyweight"],
    ["t", "beginner"],
    ["client", "powr-pwa"]
  ],
  "created_at": 1724896426,
  "pubkey": "55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21"
}
```

## NIP-92 Media Attachments Breakdown

### 1. Demonstration Video (YouTube)
- **URL**: `https://www.youtube.com/watch?v=IODxDxX7oi4`
- **MIME Type**: `video/mp4`
- **Purpose**: `demonstration` (instructional content)
- **Context**: `workout` (workout-level media)
- **Alt Text**: "Bodyweight workout demonstration"

### 2. Cover Image (Unsplash)
- **URL**: `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b`
- **MIME Type**: `image/jpeg`
- **Purpose**: `cover` (primary visual representation)
- **Context**: `workout` (workout-level media)
- **Alt Text**: "Bodyweight workout cover image"

### 3. Thumbnail Image (Unsplash)
- **URL**: `https://images.unsplash.com/photo-1544367567-0f2fcb009e0b`
- **MIME Type**: `image/jpeg`
- **Purpose**: `thumbnail` (preview image)
- **Context**: `workout` (workout-level media)
- **Alt Text**: "Workout thumbnail"

## Verification Commands

After publishing (with your approval), verify with:

```bash
# Verify the test workout template
nak req -k 33402 -a 55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21 --tag d=powr-bodyweight-basics-test wss://nos.lol | jq

# Check imeta tags specifically
nak req -k 33402 -a 55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21 --tag d=powr-bodyweight-basics-test wss://nos.lol | jq '.tags[] | select(.[0] == "imeta")'

# Verify exercise references
nak req -k 33402 -a 55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21 --tag d=powr-bodyweight-basics-test wss://nos.lol | jq '.tags[] | select(.[0] == "exercise")'
```

## Notes

1. **Exercise References**: The workout references exercise templates that would need to exist first (pushup-standard, bodyweight-squat, plank-hold)
2. **Media URLs**: Using real Unsplash images and YouTube video for testing
3. **POWR Custom Fields**: Demonstrates purpose/context system for media organization
4. **NIP-101e Compliance**: Follows proper tag structure with set numbers for deduplication prevention
5. **Test Credentials**: Uses test pubkey for safe testing

This test workout validates our NIP-92 + NIP-101e integration before building the full exercise publishing system.
