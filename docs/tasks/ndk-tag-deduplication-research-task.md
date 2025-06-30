# NDK Tag Deduplication Research Task

## Objective
Research NDK source code to determine if NDK automatically deduplicates identical tags during event creation or publishing, which would explain why our workout events lose duplicate exercise tags.

## Background
Through comprehensive testing with both NIP-07 and NIP-46 authentication methods, we discovered that:
- Our service generates 10-12 exercise tags correctly
- NDK preserves all tags during event creation
- Published events only contain 4 unique exercise tags (one per exercise type)
- Both authentication methods show identical deduplication behavior

This suggests NDK itself or the Nostr protocol has built-in tag deduplication logic.

## Research Questions
1. Does NDK's `new NDKEvent()` constructor deduplicate identical tags?
2. Does NDK's `publish()` method filter duplicate tags before sending to relays?
3. Is there any documented behavior about tag deduplication in NDK?
4. Are there any configuration options to control tag deduplication?
5. How does NDK handle arrays with identical string array elements?

## Research Approach
Use the repo-explorer MCP tool to search NDK source code for:
- Tag deduplication logic
- Array filtering in event creation
- Publishing pipeline tag processing
- Configuration options for tag handling

## Key Files to Investigate
Based on NDK architecture, focus on:
- Event creation classes (`NDKEvent`)
- Publishing logic (`publish()` methods)
- Tag processing utilities
- Event validation/normalization code

## Expected Findings
We expect to find either:
1. **Explicit deduplication**: Code that intentionally removes duplicate tags
2. **Implicit deduplication**: Use of `Set()` or similar that removes duplicates
3. **Protocol compliance**: Logic that enforces Nostr protocol tag uniqueness
4. **No deduplication**: Confirming the issue is elsewhere in the pipeline

## Success Criteria
- [ ] Identify exact location of tag deduplication (if it exists in NDK)
- [ ] Understand the reasoning behind deduplication behavior
- [ ] Determine if behavior can be configured or overridden
- [ ] Document findings for workout event tag strategy
- [ ] Provide recommendation for handling duplicate exercise tags

## Implementation Impact
Understanding NDK's tag behavior will determine our approach:
- **If NDK deduplicates**: Modify our tags to be unique (add set numbers)
- **If NDK doesn't deduplicate**: Look for relay-level or protocol-level causes
- **If configurable**: Adjust NDK settings to preserve duplicate tags

## Research Timeline
- **Phase 1**: Search NDK source for tag-related code (30 minutes)
- **Phase 2**: Analyze event creation and publishing pipeline (30 minutes)
- **Phase 3**: Document findings and recommendations (15 minutes)

## Related Files
- `src/lib/services/workoutAnalytics.ts` - Tag generation logic
- `src/lib/actors/globalNDKActor.ts` - Publishing pipeline with debug logs
- Console logs showing tag preservation through NDK creation but loss after publishing

---

**Created**: 2025-06-29
**Priority**: High - Blocking workout event accuracy
**Category**: Research
**Environment**: NDK Source Code Analysis
