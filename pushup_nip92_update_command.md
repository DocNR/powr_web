# Push-up Exercise NIP-92 Media Update Command

## Overview
This command updates the existing push-up exercise (d="push-up") with NIP-92 media attachments while maintaining the current tag structure.

## NIP-101e Compliance Issue Discovered

**❌ CRITICAL**: The current pushup event uses separate format tags, which are **NOT NIP-101e compliant**.

**✅ CORRECT**: According to `docs/nip-101e-specification.md`, the official spec requires:
```json
["format", "weight", "reps", "rpe", "set_type"],
["format_units", "bodyweight", "count", "0-10", "enum"]
```

**❌ WRONG**: Current event structure with separate tags:
```json
["format", "weight"], ["format", "reps"], ["format", "rpe"], ["format", "set_type"]
```

## Corrected NIP-101e + NIP-92 Compliant Command

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
  --tag 'imeta=url https://youtu.be/WDIpL0pjun0 m video/mp4 purpose demonstration context exercise' \
  --tag 'imeta=url https://img.youtube.com/vi/WDIpL0pjun0/maxresdefault.jpg m image/jpeg purpose thumbnail context exercise' \
  --content 'Classic bodyweight exercise targeting chest, shoulders, and triceps. Perfect for building upper body strength and can be modified for all fitness levels.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net
```

## Expected JSON Output (NIP-101e Compliant)

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
    ["t", "fitness"],
    ["imeta", "url https://youtu.be/WDIpL0pjun0 m video/mp4 purpose demonstration context exercise"],
    ["imeta", "url https://img.youtube.com/vi/WDIpL0pjun0/maxresdefault.jpg m image/jpeg purpose thumbnail context exercise"]
  ],
  "content": "Classic bodyweight exercise targeting chest, shoulders, and triceps. Perfect for building upper body strength and can be modified for all fitness levels."
}
```

## NIP-92 Media Attachments Added

### 1. Demonstration Video (Your Specified Video)
- **URL**: `https://youtu.be/WDIpL0pjun0`
- **MIME Type**: `video/mp4`
- **Purpose**: `demonstration` (instructional content)
- **Context**: `exercise` (exercise-specific media)

### 2. Thumbnail Image
- **URL**: `https://img.youtube.com/vi/WDIpL0pjun0/maxresdefault.jpg`
- **MIME Type**: `image/jpeg`
- **Purpose**: `thumbnail` (preview image)
- **Context**: `exercise` (exercise-specific media)

## POWR Custom Fields Used

Following `.clinerules/nip-92-media-rich-events.md`:
- **purpose**: `demonstration` for instructional video, `thumbnail` for preview image
- **context**: `exercise` for exercise-specific media
- **NIP-92 Compliance**: Space-delimited key/value pairs with required `url` and `m` fields

## Verification Commands

After publishing, verify the event:

```bash
# Verify by d-tag
nak req -k 33401 -a 55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21 --tag d=push-up wss://nos.lol | jq

# Check imeta tags specifically
nak req -k 33401 -a 55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21 --tag d=push-up wss://nos.lol | jq '.tags[] | select(.[0] == "imeta")'
```

## UI Integration

The ExerciseDetailModal already supports NIP-92 media through WorkoutImageHandler:
- Will automatically display the thumbnail image
- Media will be purpose-aware (demonstration video + thumbnail image)
- No additional UI development needed

## Next Steps

1. **Execute Command**: Run the NAK command above
2. **Verify Publishing**: Use verification commands to confirm event is published
3. **Test UI Display**: Check ExerciseDetailModal to see media display
4. **Document Results**: Note any issues or successful media display
5. **Scale Approach**: Apply similar pattern to other exercises if successful

## Key Changes Made

- **✅ NIP-101e Compliance**: Fixed format tags to use single arrays as per official specification
- **✅ Your Video**: Updated to use your specified YouTube video `https://youtu.be/WDIpL0pjun0`
- **✅ Correct d-tag**: Maintains "push-up" from existing event
- **✅ NIP-92 Media**: Adds demonstration video and thumbnail with POWR custom fields
- **✅ Semicolon Syntax**: Uses proper NAK array syntax for format tags

## Important Note

This command will **replace** the existing non-compliant pushup event with a fully NIP-101e compliant version that includes NIP-92 media attachments. The existing event with separate format tags was not following the official specification.
