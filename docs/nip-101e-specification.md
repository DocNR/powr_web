# NIP-101e: Workout Events

`draft` `optional`

This specification defines workout events for fitness tracking. These workout events support both planning (templates) and recording (completed activities).

## Event Kinds

### Event Kind Selection Rationale

The event kinds in this NIP follow Nostr protocol conventions:

- **Exercise and Workout Templates** (33401, 33402) use parameterized replaceable event kinds (30000+) because:
  - They represent content that may be updated or improved over time
  - The author may want to replace previous versions with improved ones
  - They need the `d` parameter to distinguish between different templates by the same author
  - Multiple versions shouldn't accumulate in clients' storage

- **Workout Records** (1301) use a standard event kind (0-9999) because:
  - They represent a chronological feed of activity that shouldn't replace previous records
  - Each workout is a unique occurrence that adds to a user's history
  - Users publish multiple records over time, creating a timeline
  - They're conceptually similar to notes (kind 1) but with structured fitness data

### Exercise Template (kind: 33401)
Defines reusable exercise definitions. These should remain public to enable discovery and sharing. The `content` field contains detailed form instructions and notes.

#### Format

The format uses an _addressable event_ of `kind:33401`.

The `.content` of these events SHOULD be detailed instructions for proper exercise form. It is required but can be an empty string.

The list of tags are as follows:

* `d` (required) - universally unique identifier (UUID). Generated by the client creating the exercise template.
* `title` (required) - Exercise name
* `format` (required) - Defines data structure for exercise tracking (possible parameters: `weight`, `reps`, `rpe`, `set_type`)
* `format_units` (required) - Defines units for each parameter (possible formats: "kg", "count", "0-10", "enum")
  - When "enum" is used, valid values are: `["warmup", "normal", "drop", "failure", "working"]`
* `equipment` (required) - Equipment type (possible values: `barbell`, `dumbbell`, `bodyweight`, `machine`, `cardio`)
* `difficulty` (optional) - Skill level (possible values: `beginner`, `intermediate`, `advanced`)
* `imeta` (optional) - Media metadata for form demonstrations following NIP-92 format
* `t` (optional, repeated) - Hashtags for categorization such as muscle group or body movement (possible values: `chest`, `legs`, `push`, `pull`)

```
{
  "id": <32-bytes lowercase hex-encoded SHA-256 of the serialized event data>,
  "pubkey": <32-bytes lowercase hex-encoded public key of the event creator>,
  "created_at": <Unix timestamp in seconds>,
  "kind": 33401,
  "content": "<detailed form instructions and notes>",
  "tags": [
    ["d", "<UUID>"],
    ["title", "<exercise name>"],
    ["format", "<parameter>", "<parameter>", "<parameter>", "<parameter>"],
    ["format_units", "<unit>", "<unit>", "<unit>", "<unit>"],
    ["equipment", "<equipment type>"],
    ["difficulty", "<skill level>"],
    ["imeta", 
      "url <url to demonstration media>",
      "m <media type>",
      "dim <dimensions>",
      "alt <alt text>"
    ],
    ["t", "<hashtag>"],
    ["t", "<hashtag>"],
    ["t", "<hashtag>"]
  ]
}
```

### Workout Template (kind: 33402)
Defines a complete workout plan. The `content` field contains workout notes and instructions. Workout templates can prescribe specific parameters while leaving others configurable by the user performing the workout.

#### Format

The format uses an _addressable event_ of `kind:33402`.

The `.content` of these events SHOULD contain workout notes and instructions. It is required but can be an empty string.

The list of tags are as follows:

* `d` (required) - universally unique identifier (UUID). Generated by the client creating the workout template.
* `title` (required) - Workout name
* `type` (required) - Type of workout (possible values: `strength`, `superset`, `circuit`, `emom`, `amrap`, `metcon`)
* `exercise` (required, repeated) - Exercise reference and prescription. Format: ["exercise", "<kind>:<pubkey>:<d-tag>", "<relay-url>", ...parameters matching exercise template format, "<set_number>"]
* `rounds` (optional) - Number of rounds for repeating formats
* `duration` (optional) - Total workout duration in seconds
* `interval` (optional) - Duration of each exercise portion in seconds (for timed workouts)
* `rest_between_rounds` (optional) - Rest time between rounds in seconds
* `rest_between_sets` (optional) - Rest time between sets in seconds
* `t` (optional, repeated) - Hashtags for categorization

**Important: Set Number Parameter**

The `set_number` parameter was added to prevent unintended deduplication by NDK and other Nostr clients. When multiple sets have identical parameters (same weight, reps, RPE, and set type), the unique set number ensures each set is preserved as a separate tag. This is critical for:
- Multi-set prescriptions (e.g., "3 sets of 10 reps")
- Superset and circuit training patterns
- Proper workout structure preservation

```
{
  "id": <32-bytes lowercase hex-encoded SHA-256 of the serialized event data>,
  "pubkey": <32-bytes lowercase hex-encoded public key of the event creator>,
  "created_at": <Unix timestamp in seconds>,
  "kind": 33402,
  "content": "<workout notes and instructions>",
  "tags": [
    ["d", "<UUID>"],
    ["title", "<workout name>"],
    ["type", "<workout type>"],
    ["rounds", "<number of rounds>"],
    ["duration", "<duration in seconds>"],
    ["interval", "<interval in seconds>"],
    ["rest_between_rounds", "<rest time in seconds>"],
    ["rest_between_sets", "<rest time in seconds>"],
    ["exercise", "<kind>:<pubkey>:<d-tag>", "<relay-url>", "<param1>", "<param2>", "<param3>", "<param4>", "<set_number>"],
    ["exercise", "<kind>:<pubkey>:<d-tag>", "<relay-url>", "<param1>", "<param2>", "<param3>", "<param4>", "<set_number>"],
    ["t", "<hashtag>"],
    ["t", "<hashtag>"]
  ]
}
```

### Workout Record (kind: 1301)
Records a completed workout session. The `content` field contains notes about the workout.

#### Format

The format uses a standard event of `kind:1301`.

The `.content` of these events SHOULD contain notes about the workout experience. It is required but can be an empty string.

The list of tags are as follows:

* `d` (required) - universally unique identifier (UUID). Generated by the client creating the workout record.
* `title` (required) - Workout name
* `type` (required) - Type of workout (possible values: `strength`, `superset`, `circuit`, `emom`, `amrap`, `metcon`)
* `exercise` (required, repeated) - Exercise reference and completion data. Format: ["exercise", "<kind>:<pubkey>:<d-tag>", "<relay-url>", ...parameters matching exercise template format, "<set_number>"]
* `start` (required) - Unix timestamp in seconds for workout start
* `end` (required) - Unix timestamp in seconds for workout end
* `completed` (required) - Boolean indicating if workout was completed as planned
* `rounds_completed` (optional) - Number of rounds completed
* `interval` (optional) - Duration of each exercise portion in seconds (for timed workouts)
* `template` (optional) - Reference to the workout template used, if any. Format: ["template", "<kind>:<pubkey>:<d-tag>", "<relay-url>"]
* `pr` (optional, repeated) - Personal Record achieved during workout. Format: "<kind>:<pubkey>:<d-tag>,<metric>,<value>"
* `t` (optional, repeated) - Hashtags for categorization

```
{
  "id": <32-bytes lowercase hex-encoded SHA-256 of the serialized event data>,
  "pubkey": <32-bytes lowercase hex-encoded public key of the event creator>,
  "created_at": <Unix timestamp in seconds>,
  "kind": 1301,
  "content": "<workout notes>",
  "tags": [
    ["d", "<UUID>"],
    ["title", "<workout name>"],
    ["type", "<workout type>"],
    ["rounds_completed", "<number of rounds completed>"],
    ["start", "<Unix timestamp in seconds>"],
    ["end", "<Unix timestamp in seconds>"],
    
    ["exercise", "<kind>:<pubkey>:<d-tag>", "<relay-url>", "<weight>", "<reps>", "<rpe>", "<set_type>", "<set_number>"],
    ["exercise", "<kind>:<pubkey>:<d-tag>", "<relay-url>", "<weight>", "<reps>", "<rpe>", "<set_type>", "<set_number>"],
    
    ["template", "<kind>:<pubkey>:<d-tag>", "<relay-url>"],
    ["pr", "<kind>:<pubkey>:<d-tag>,<metric>,<value>"],
    ["completed", "<true/false>"],
    ["t", "<hashtag>"],
    ["t", "<hashtag>"]
  ]
}
```

## Exercise Parameters

### Standard Parameters and Units
* `weight` - Load in kilograms (kg). Empty string for bodyweight exercises, negative values for assisted exercises
* `reps` - Number of repetitions (count)
* `rpe` - Rate of Perceived Exertion (0-10):
  - RPE 10: Could not do any more reps, technical failure
  - RPE 9: Could maybe do 1 more rep
  - RPE 8: Could definitely do 1 more rep, maybe 2
  - RPE 7: Could do 2-3 more reps
* `duration` - Time in seconds
* `set_type` - Set classification (possible values: `warmup`, `normal`, `drop`, `failure`)
* `set_number` - Per-exercise set counter (1, 2, 3...) - **Required for deduplication prevention**

**Note**: The `set_number` parameter is critical for preventing unintended deduplication of identical sets by NDK and other Nostr clients. This enables proper tracking of multiple identical sets and advanced training methodologies like supersets and circuit training.

Additional parameters can be defined in exercise templates in the `format_units` tag as needed for specific activities (e.g., distance, heartrate, intensity).

## Workout Types and Terminology

This specification provides examples of common workout structures but is not limited to these types. The format is extensible to support various training methodologies while maintaining consistent data structure.

### Common Workout Types

#### Strength
Traditional strength training focusing on sets and reps with defined weights. Typically includes warm-up sets, working sets, and may include techniques like drop sets or failure sets.

#### Superset
Two exercises performed back-to-back with minimal rest between exercises. Set numbers indicate pairing (same set number = performed together).

#### Circuit
Multiple exercises performed in sequence with minimal rest between exercises and defined rest periods between rounds. Focuses on maintaining work rate through prescribed exercises.

#### EMOM (Every Minute On the Minute)
Time-based workout where specific exercises are performed at the start of each minute. Rest time is whatever remains in the minute after completing prescribed work.

#### AMRAP (As Many Rounds/Reps As Possible)
Time-capped workout where the goal is to complete as many rounds or repetitions as possible of prescribed exercises while maintaining proper form.

#### Metcon (Metabolic Conditioning)
High-intensity workouts designed to improve cardiovascular fitness and metabolic capacity through varied movement patterns.

## Set Types

### Normal Sets
Standard working sets that count toward volume and progress tracking.

### Warm-up Sets
Preparatory sets using submaximal weights. These sets are not counted in metrics or progress tracking.

### Drop Sets
Sets performed immediately after a working set with reduced weight. These are counted in volume calculations but tracked separately for progress analysis.

### Failure Sets
Sets where technical failure was reached before completing prescribed reps. These sets are counted in metrics but marked to indicate intensity/failure was reached.

## Examples

### Exercise Template
```
{
  "kind": 33401,
  "content": "Stand with feet hip-width apart, barbell over midfoot. Hinge at hips, grip bar outside knees. Flatten back, brace core. Drive through floor, keeping bar close to legs.\n\nForm demonstration: https://powr.me/exercises/deadlift-demo.mp4",
  "tags": [
    ["d", "<UUID-deadlift>"],
    ["title", "Barbell Deadlift"],
    ["format", "weight", "reps", "rpe", "set_type"],
    ["format_units", "kg", "count", "0-10", "enum"],
    ["equipment", "barbell"],
    ["difficulty", "intermediate"],
    ["imeta", 
      "url https://powr.me/exercises/deadlift-demo.mp4",
      "m video/mp4",
      "dim 1920x1080",
      "alt Demonstration of proper barbell deadlift form"
    ],
    ["t", "compound"],
    ["t", "legs"],
    ["t", "posterior"]
  ]
}
```

### Superset Workout Template
```
{
  "kind": 33402,
  "content": "Upper body superset combining pushing and pulling movements. Perform bench press immediately followed by barbell rows, then rest 2-3 minutes before next round.",
  "tags": [
    ["d", "<UUID-superset-template>"],
    ["title", "Bench Press / Barbell Row Superset"],
    ["type", "superset"],
    ["rest_between_sets", "180"],
    
    ["exercise", "33401:<pubkey>:<UUID-bench-press>", "<relay-url>", "80", "8", "7", "normal", "1"],
    ["exercise", "33401:<pubkey>:<UUID-barbell-row>", "<relay-url>", "70", "8", "7", "normal", "1"],
    ["exercise", "33401:<pubkey>:<UUID-bench-press>", "<relay-url>", "80", "8", "7", "normal", "2"],
    ["exercise", "33401:<pubkey>:<UUID-barbell-row>", "<relay-url>", "70", "8", "7", "normal", "2"],
    ["exercise", "33401:<pubkey>:<UUID-bench-press>", "<relay-url>", "80", "8", "7", "normal", "3"],
    ["exercise", "33401:<pubkey>:<UUID-barbell-row>", "<relay-url>", "70", "8", "7", "normal", "3"],
    
    ["t", "strength"],
    ["t", "superset"]
  ]
}
```

### Circuit Workout Record
```
{
  "kind": 1301,
  "content": "Completed full circuit as prescribed. Form held well through first 2 rounds, showed fatigue on final round.",
  "tags": [
    ["d", "<UUID-workout-record>"],
    ["title", "Full Body Circuit"],
    ["type", "circuit"],
    ["rounds_completed", "3"],
    ["start", "1706454000"],
    ["end", "1706455800"],
    
    ["exercise", "33401:<pubkey>:<UUID-squat>", "<relay-url>", "0", "15", "7", "normal", "1"],
    ["exercise", "33401:<pubkey>:<UUID-pushup>", "<relay-url>", "0", "12", "7", "normal", "1"],
    ["exercise", "33401:<pubkey>:<UUID-pullup>", "<relay-url>", "0", "8", "8", "normal", "1"],
    ["exercise", "33401:<pubkey>:<UUID-plank>", "<relay-url>", "0", "30", "7", "normal", "1"],
    
    ["exercise", "33401:<pubkey>:<UUID-squat>", "<relay-url>", "0", "15", "7", "normal", "2"],
    ["exercise", "33401:<pubkey>:<UUID-pushup>", "<relay-url>", "0", "12", "7", "normal", "2"],
    ["exercise", "33401:<pubkey>:<UUID-pullup>", "<relay-url>", "0", "8", "8", "normal", "2"],
    ["exercise", "33401:<pubkey>:<UUID-plank>", "<relay-url>", "0", "30", "7", "normal", "2"],
    
    ["exercise", "33401:<pubkey>:<UUID-squat>", "<relay-url>", "0", "15", "8", "normal", "3"],
    ["exercise", "33401:<pubkey>:<UUID-pushup>", "<relay-url>", "0", "10", "9", "normal", "3"],
    ["exercise", "33401:<pubkey>:<UUID-pullup>", "<relay-url>", "0", "6", "9", "failure", "3"],
    ["exercise", "33401:<pubkey>:<UUID-plank>", "<relay-url>", "0", "25", "8", "normal", "3"],
    
    ["completed", "true"],
    ["t", "circuit"],
    ["t", "conditioning"]
  ]
}
```

## Implementation Guidelines

1. All workout records MUST include accurate start and end times
2. Templates MAY prescribe specific parameters while leaving others as empty strings for user input
3. Records MUST include actual values for all parameters defined in exercise format
4. Failed sets SHOULD be marked with `failure` set_type
5. Records SHOULD be marked as `false` for completed if prescribed work wasn't completed
6. PRs SHOULD only be tracked in workout records, not templates
7. Exercise references MUST use the format "kind:pubkey:d-tag" to ensure proper attribution and versioning
8. Set numbers MUST be included in both templates and records to prevent deduplication
9. Set numbers in templates indicate exercise grouping (same number = performed together for supersets/circuits)
10. Set numbers in records indicate chronological order and provide unique identification per set

## References

This NIP draws inspiration from:
- [NIP-01: Basic Protocol Flow Description](https://github.com/nostr-protocol/nips/blob/master/01.md)
- [NIP-52: Calendar Events](https://github.com/nostr-protocol/nips/blob/master/52.md)
- [NIP-92: Media Attachments](https://github.com/nostr-protocol/nips/blob/master/92.md#nip-92)