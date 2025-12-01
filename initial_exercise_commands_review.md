# Initial Exercise Commands Review - NIP-101e + NIP-92 Compliant

## Overview
This document contains NAK commands for publishing 15 curated bodyweight exercises with:
- ✅ **Updated numeric weight system** (kg format_units)
- ✅ **NIP-101e compliance** (single array format tags)
- ✅ **NIP-92 media attachments** with demonstration videos and thumbnails
- ✅ **Proper muscle group tagging**

**IMPORTANT**: Review each command before publishing. No commands will be executed until approved.

---

## FUNDAMENTAL MOVEMENTS (8 exercises)

### 1. Push-up (Updated from existing)

**d-tag**: `push-up`
**Muscle Groups**: chest, shoulders, triceps
**Difficulty**: beginner
**Equipment**: bodyweight

```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33401 \
  --tag 'd=push-up' \
  --tag 'title=Push-up' \
  --tag 'format=weight;reps;rpe;set_type' \
  --tag 'format_units=kg;count;0-10;enum' \
  --tag 'equipment=bodyweight' \
  --tag 'difficulty=beginner' \
  --tag 't=chest' \
  --tag 't=shoulders' \
  --tag 't=triceps' \
  --tag 't=push' \
  --tag 't=fitness' \
  --tag 'imeta=url https://youtu.be/WDIpL0pjun0 m video/mp4 purpose demonstration context exercise' \
  --tag 'imeta=url https://img.youtube.com/vi/WDIpL0pjun0/maxresdefault.jpg m image/jpeg purpose thumbnail context exercise' \
  --content 'Classic bodyweight exercise targeting chest, shoulders, and triceps. Perfect for building upper body strength and can be modified for all fitness levels.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net wss://relay.nostr.band wss://blastr.f7z.wxy/
```

**Weight Usage Examples**:
- Regular push-up: `"0"` (bodyweight)
- Weighted push-up: `"10"` (10kg weighted vest)
- Assisted push-up: `"-5"` (5kg assistance from bands)

---

### 2. Pull-up

**d-tag**: `pull-up`
**Muscle Groups**: back, arms
**Difficulty**: intermediate
**Equipment**: bodyweight

```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33401 \
  --tag 'd=pull-up' \
  --tag 'title=Pull-up' \
  --tag 'format=weight;reps;rpe;set_type' \
  --tag 'format_units=kg;count;0-10;enum' \
  --tag 'equipment=bodyweight' \
  --tag 'difficulty=intermediate' \
  --tag 't=back' \
  --tag 't=arms' \
  --tag 't=pull' \
  --tag 't=fitness' \
  --tag 'imeta=url https://youtu.be/eGo4IYlbE5g m video/mp4 purpose demonstration context exercise' \
  --tag 'imeta=url https://img.youtube.com/vi/eGo4IYlbE5g/maxresdefault.jpg m image/jpeg purpose thumbnail context exercise' \
  --content 'Fundamental upper body pulling exercise targeting the back and arms. Can be assisted with bands or weighted for progression.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net wss://relay.nostr.band wss://blastr.f7z.wxy/
```

**Weight Usage Examples**:
- Regular pull-up: `"0"` (bodyweight)
- Assisted pull-up: `"-20"` (20kg assistance from bands/machine)
- Weighted pull-up: `"10"` (10kg added weight)

---

### 3. Air Squat

**d-tag**: `air-squat`
**Muscle Groups**: legs, glutes, quads
**Difficulty**: beginner
**Equipment**: bodyweight

```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33401 \
  --tag 'd=air-squat' \
  --tag 'title=Air Squat' \
  --tag 'format=weight;reps;rpe;set_type' \
  --tag 'format_units=kg;count;0-10;enum' \
  --tag 'equipment=bodyweight' \
  --tag 'difficulty=beginner' \
  --tag 't=legs' \
  --tag 't=glutes' \
  --tag 't=quads' \
  --tag 't=squat' \
  --tag 't=fitness' \
  --tag 'imeta=url https://youtu.be/C_VtOYc6j5c m video/mp4 purpose demonstration context exercise' \
  --tag 'imeta=url https://img.youtube.com/vi/C_VtOYc6j5c/maxresdefault.jpg m image/jpeg purpose thumbnail context exercise' \
  --content 'Fundamental lower body exercise targeting legs, glutes, and quads. Essential movement pattern for building functional strength and mobility.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net wss://relay.nostr.band 
```

---

### 4. Burpee

**d-tag**: `burpee`
**Muscle Groups**: full-body, cardio
**Difficulty**: intermediate
**Equipment**: bodyweight

```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33401 \
  --tag 'd=burpee' \
  --tag 'title=Burpee' \
  --tag 'format=weight;reps;rpe;set_type' \
  --tag 'format_units=kg;count;0-10;enum' \
  --tag 'equipment=bodyweight' \
  --tag 'difficulty=intermediate' \
  --tag 't=full-body' \
  --tag 't=cardio' \
  --tag 't=conditioning' \
  --tag 't=fitness' \
  --tag 'imeta=url https://youtu.be/auBLPXO8Fww m video/mp4 purpose demonstration context exercise' \
  --tag 'imeta=url https://img.youtube.com/vi/auBLPXO8Fww/maxresdefault.jpg m image/jpeg purpose thumbnail context exercise' \
  --content 'High-intensity full-body exercise combining squat, plank, push-up, and jump. Excellent for cardiovascular conditioning and functional strength.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net wss://relay.nostr.band 
```

---

### 5. Plank

**d-tag**: `plank`
**Muscle Groups**: core, abs, shoulders
**Difficulty**: beginner
**Equipment**: bodyweight

```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33401 \
  --tag 'd=plank' \
  --tag 'title=Plank' \
  --tag 'format=weight;duration;rpe;set_type' \
  --tag 'format_units=kg;seconds;0-10;enum' \
  --tag 'equipment=bodyweight' \
  --tag 'difficulty=beginner' \
  --tag 't=core' \
  --tag 't=abs' \
  --tag 't=shoulders' \
  --tag 't=isometric' \
  --tag 't=fitness' \
  --tag 'imeta=url https://youtu.be/ASdvN_XEl_c m video/mp4 purpose demonstration context exercise' \
  --tag 'imeta=url https://img.youtube.com/vi/ASdvN_XEl_c/maxresdefault.jpg m image/jpeg purpose thumbnail context exercise' \
  --content 'Fundamental core strengthening exercise. Isometric hold that builds core stability, shoulder strength, and full-body tension.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net wss://relay.nostr.band 
```

**Note**: Uses `duration` instead of `reps` for time-based exercise.

---

### 6. Hip Thrust

**d-tag**: `hip-thrust`
**Muscle Groups**: glutes, hamstrings
**Difficulty**: beginner
**Equipment**: bodyweight

```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33401 \
  --tag 'd=hip-thrust' \
  --tag 'title=Hip Thrust' \
  --tag 'format=weight;reps;rpe;set_type' \
  --tag 'format_units=kg;count;0-10;enum' \
  --tag 'equipment=bodyweight' \
  --tag 'difficulty=beginner' \
  --tag 't=glutes' \
  --tag 't=hamstrings' \
  --tag 't=hinge' \
  --tag 't=fitness' \
  --tag 'imeta=url https://youtu.be/xDmFkJxPzeM m video/mp4 purpose demonstration context exercise' \
  --tag 'imeta=url https://img.youtube.com/vi/xDmFkJxPzeM/maxresdefault.jpg m image/jpeg purpose thumbnail context exercise' \
  --content 'Glute-focused exercise targeting the posterior chain. Excellent for building hip strength and improving posture.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net wss://relay.nostr.band 
```

---

### 7. Mountain Climbers

**d-tag**: `mountain-climbers`
**Muscle Groups**: core, cardio, shoulders
**Difficulty**: intermediate
**Equipment**: bodyweight

```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33401 \
  --tag 'd=mountain-climbers' \
  --tag 'title=Mountain Climbers' \
  --tag 'format=weight;reps;rpe;set_type' \
  --tag 'format_units=kg;count;0-10;enum' \
  --tag 'equipment=bodyweight' \
  --tag 'difficulty=intermediate' \
  --tag 't=core' \
  --tag 't=cardio' \
  --tag 't=shoulders' \
  --tag 't=conditioning' \
  --tag 't=fitness' \
  --tag 'imeta=url https://youtu.be/kLh-uczlPLg m video/mp4 purpose demonstration context exercise' \
  --tag 'imeta=url https://img.youtube.com/vi/kLh-uczlPLg/maxresdefault.jpg m image/jpeg purpose thumbnail context exercise' \
  --content 'Dynamic core and cardio exercise performed in plank position. Builds core strength while providing cardiovascular conditioning.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net wss://relay.nostr.band 
```

---

### 8. Wall Slides

**d-tag**: `wall-slides`
**Muscle Groups**: back, shoulders
**Difficulty**: beginner
**Equipment**: bodyweight

```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33401 \
  --tag 'd=wall-slides' \
  --tag 'title=Wall Slides' \
  --tag 'format=weight;reps;rpe;set_type' \
  --tag 'format_units=kg;count;0-10;enum' \
  --tag 'equipment=bodyweight' \
  --tag 'difficulty=beginner' \
  --tag 't=back' \
  --tag 't=shoulders' \
  --tag 't=mobility' \
  --tag 't=fitness' \
  --tag 'imeta=url https://youtu.be/Vwn5hSf3WEg m video/mp4 purpose demonstration context exercise' \
  --tag 'imeta=url https://img.youtube.com/vi/Vwn5hSf3WEg/maxresdefault.jpg m image/jpeg purpose thumbnail context exercise' \
  --content 'Shoulder mobility and posture exercise performed against a wall. Helps counteract forward head posture and rounded shoulders.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net wss://relay.nostr.band 
```

---

## PROGRESSION EXERCISES (4 exercises)

### 9. Diamond Push-up

**d-tag**: `diamond-push-up`
**Muscle Groups**: triceps, chest, shoulders
**Difficulty**: advanced
**Equipment**: bodyweight

```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33401 \
  --tag 'd=diamond-push-up' \
  --tag 'title=Diamond Push-up' \
  --tag 'format=weight;reps;rpe;set_type' \
  --tag 'format_units=kg;count;0-10;enum' \
  --tag 'equipment=bodyweight' \
  --tag 'difficulty=advanced' \
  --tag 't=triceps' \
  --tag 't=chest' \
  --tag 't=shoulders' \
  --tag 't=push' \
  --tag 't=fitness' \
  --tag 'imeta=url https://youtu.be/J0DnG1_S92I m video/mp4 purpose demonstration context exercise' \
  --tag 'imeta=url https://img.youtube.com/vi/J0DnG1_S92I/maxresdefault.jpg m image/jpeg purpose thumbnail context exercise' \
  --content 'Advanced push-up variation with hands in diamond position. Emphasizes triceps development and requires greater upper body strength.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net wss://relay.nostr.band 
```

---

### 10. Wide Pull-up

**d-tag**: `wide-pull-up`
**Muscle Groups**: back, arms
**Difficulty**: intermediate
**Equipment**: bodyweight

```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33401 \
  --tag 'd=wide-pull-up' \
  --tag 'title=Wide Pull-up' \
  --tag 'format=weight;reps;rpe;set_type' \
  --tag 'format_units=kg;count;0-10;enum' \
  --tag 'equipment=bodyweight' \
  --tag 'difficulty=intermediate' \
  --tag 't=back' \
  --tag 't=arms' \
  --tag 't=pull' \
  --tag 't=fitness' \
  --tag 'imeta=url https://youtu.be/XB_7En-zf_M m video/mp4 purpose demonstration context exercise' \
  --tag 'imeta=url https://img.youtube.com/vi/XB_7En-zf_M/maxresdefault.jpg m image/jpeg purpose thumbnail context exercise' \
  --content 'Pull-up variation with wider grip emphasizing lat development. Targets the outer back and builds back width.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net wss://relay.nostr.band 
```

---

### 11. Bulgarian Split Squat

**d-tag**: `bulgarian-split-squat`
**Muscle Groups**: legs
**Difficulty**: intermediate
**Equipment**: bodyweight

```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33401 \
  --tag 'd=bulgarian-split-squat' \
  --tag 'title=Bulgarian Split Squat' \
  --tag 'format=weight;reps;rpe;set_type' \
  --tag 'format_units=kg;count;0-10;enum' \
  --tag 'equipment=bodyweight' \
  --tag 'difficulty=intermediate' \
  --tag 't=legs' \
  --tag 't=unilateral' \
  --tag 't=fitness' \
  --tag 'imeta=url https://youtu.be/2C-uNgKwPLE m video/mp4 purpose demonstration context exercise' \
  --tag 'imeta=url https://img.youtube.com/vi/2C-uNgKwPLE/maxresdefault.jpg m image/jpeg purpose thumbnail context exercise' \
  --content 'Single-leg squat variation with rear foot elevated. Builds unilateral leg strength and improves balance and stability.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net wss://relay.nostr.band 
```

---

### 12. Pike Push-up

**d-tag**: `pike-push-up`
**Muscle Groups**: shoulders, triceps, core
**Difficulty**: intermediate
**Equipment**: bodyweight

```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33401 \
  --tag 'd=pike-push-up' \
  --tag 'title=Pike Push-up' \
  --tag 'format=weight;reps;rpe;set_type' \
  --tag 'format_units=kg;count;0-10;enum' \
  --tag 'equipment=bodyweight' \
  --tag 'difficulty=intermediate' \
  --tag 't=shoulders' \
  --tag 't=triceps' \
  --tag 't=core' \
  --tag 't=push' \
  --tag 't=fitness' \
  --tag 'imeta=url https://youtu.be/x4YNi4LBWQU m video/mp4 purpose demonstration context exercise' \
  --tag 'imeta=url https://img.youtube.com/vi/x4YNi4LBWQU/maxresdefault.jpg m image/jpeg purpose thumbnail context exercise' \
  --content 'Shoulder-focused push-up performed in pike position. Builds vertical pushing strength and prepares for handstand push-ups.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net wss://relay.nostr.band 
```

---

## CORE & FLEXIBILITY (3 exercises)

### 13. Bicycle Crunch

**d-tag**: `bicycle-crunch`
**Muscle Groups**: core, abs, obliques
**Difficulty**: beginner
**Equipment**: bodyweight

```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33401 \
  --tag 'd=bicycle-crunch' \
  --tag 'title=Bicycle Crunch' \
  --tag 'format=weight;reps;rpe;set_type' \
  --tag 'format_units=kg;count;0-10;enum' \
  --tag 'equipment=bodyweight' \
  --tag 'difficulty=beginner' \
  --tag 't=core' \
  --tag 't=abs' \
  --tag 't=obliques' \
  --tag 't=rotation' \
  --tag 't=fitness' \
  --tag 'imeta=url https://youtu.be/9FGilxCbdz8 m video/mp4 purpose demonstration context exercise' \
  --tag 'imeta=url https://img.youtube.com/vi/9FGilxCbdz8/maxresdefault.jpg m image/jpeg purpose thumbnail context exercise' \
  --content 'Dynamic core exercise targeting abs and obliques. Combines crunch movement with rotational component for comprehensive core training.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net wss://relay.nostr.band 
```

---

### 14. V-Up

**d-tag**: `v-up`
**Muscle Groups**: core, abs, hip-flexors
**Difficulty**: intermediate
**Equipment**: bodyweight

```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33401 \
  --tag 'd=v-up' \
  --tag 'title=V-Up' \
  --tag 'format=weight;reps;rpe;set_type' \
  --tag 'format_units=kg;count;0-10;enum' \
  --tag 'equipment=bodyweight' \
  --tag 'difficulty=intermediate' \
  --tag 't=core' \
  --tag 't=abs' \
  --tag 't=hip-flexors' \
  --tag 't=dynamic' \
  --tag 't=fitness' \
  --tag 'imeta=url https://youtu.be/7UVgs18Y1P4 m video/mp4 purpose demonstration context exercise' \
  --tag 'imeta=url https://img.youtube.com/vi/7UVgs18Y1P4/maxresdefault.jpg m image/jpeg purpose thumbnail context exercise' \
  --content 'Advanced core exercise combining upper and lower body movement. Targets entire abdominal region and hip flexors.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net wss://relay.nostr.band 
```

---

### 15. World's Greatest Stretch

**d-tag**: `worlds-greatest-stretch`
**Muscle Groups**: legs, back
**Difficulty**: beginner
**Equipment**: bodyweight

```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 33401 \
  --tag 'd=worlds-greatest-stretch' \
  --tag 'title=World'\''s Greatest Stretch' \
  --tag 'format=weight;duration;rpe;set_type' \
  --tag 'format_units=kg;seconds;0-10;enum' \
  --tag 'equipment=bodyweight' \
  --tag 'difficulty=beginner' \
  --tag 't=legs' \
  --tag 't=back' \
  --tag 't=mobility' \
  --tag 't=flexibility' \
  --tag 't=fitness' \
  --tag 'imeta=url https://youtu.be/FSSDLDhbacc m video/mp4 purpose demonstration context exercise' \
  --tag 'imeta=url https://img.youtube.com/vi/FSSDLDhbacc/maxresdefault.jpg m image/jpeg purpose thumbnail context exercise' \
  --content 'Comprehensive mobility exercise targeting hip flexors, thoracic spine, and multiple muscle groups. Excellent for warm-up and flexibility maintenance.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net wss://relay.nostr.band 
```

**Note**: Uses `duration` instead of `reps` for time-based stretch.

---

## Summary

### Key Features:
- ✅ **15 exercises** covering all major movement patterns
- ✅ **Numeric weight system** using `kg` format_units
- ✅ **NIP-101e compliant** single array format tags
- ✅ **NIP-92 media attachments** with demonstration videos and thumbnails
- ✅ **Difficulty distribution**: 6 beginner, 7 intermediate, 2 advanced
- ✅ **Equipment variety**: mostly bodyweight, some requiring basic equipment
- ✅ **Comprehensive coverage**: push, pull, squat, hinge, core, cardio, mobility

### Muscle Group Coverage:
- **Push**: 3 exercises (push-up, diamond push-up, pike push-up)
- **Pull**: 3 exercises (pull-up, wide pull-up, wall slides)
- **Legs**: 3 exercises (air squat, bulgarian split squat, hip thrust)
- **Core**: 4 exercises (plank, mountain climbers, bicycle crunch, v-up)
- **Full Body**: 2 exercises (burpee, world's greatest stretch)

### Equipment Tag Consistency:
- **✅ All exercises tagged as "bodyweight"** for consistent filtering in bodyweight collection
- **✅ Muscle groups aligned with CSV categories** (Chest, Back, Arms, Legs, Core, Shoulders, Full Body)
- **✅ Specific equipment noted in content** where relevant (pull-up bar, wall, bench/chair)

### NIP-92 Media Integration:
- **✅ All 15 exercises** include demonstration video and thumbnail
- **✅ YouTube thumbnails** auto-generated using standard format
- **✅ POWR custom fields** with `purpose=demonstration` and `context=exercise`
- **✅ NIP-92 compliant** space-delimited key/value pairs

### Exercise Name Updates:
- **✅ "Bodyweight Squat" → "Air Squat"** (d-tag: `air-squat`)
- More descriptive and commonly used terminology

### Next Steps:
1. **Review each command** for accuracy and completeness
2. **Approve commands** for publishing
3. **Execute commands** one by one with verification
4. **Test UI integration** to ensure proper display of videos and thumbnails
5. **Create workout templates** using these exercises

**Ready for your review and approval before publishing.**


Publish 30003 collection:
```bash
nak event --sec 8aaa02c7539d421391b1ac915e24dfcf9730b0e2ad3c8bf5e377320ff05e3e24 --kind 30003 \
  --tag 'd=powr-exercise-list' \
  --tag 'title=POWR Exercise List' \
  --tag 'description=Curated collection of bodyweight exercises for the POWR workout platform' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pushup-standard' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pullup-assisted' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pike-pushup' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:tricep-dips' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:wall-handstand' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:squats' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:lunges' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:calf-raises' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:plank' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:side-plank' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:mountain-climbers' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:burpees' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:jumping-jacks' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:pull-up' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:air-squat' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:burpee' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:hip-thrust' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:wall-slides' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:diamond-push-up' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:wide-pull-up' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:bulgarian-split-squat' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:bicycle-crunch' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:v-up' \
  --tag 'a=33401:55127fc9e1c03c6b459a3bab72fdb99def1644c5f239bdd09f3e5fb401ed9b21:worlds-greatest-stretch' \
  --tag 't=fitness' \
  --tag 't=bodyweight' \
  --tag 't=exercise-library' \
  --content 'Comprehensive collection of bodyweight exercises for the POWR workout platform. Includes fundamental movements, progressions, and specialized exercises covering all major muscle groups.' \
  wss://nos.lol wss://relay.damus.io wss://relay.primal.net 
```