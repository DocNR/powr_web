# Task Creation Process Rule

## Brief overview
This rule establishes a standardized process for creating tasks and implementation plans for the POWR Workout PWA, ensuring all new features follow established patterns and architecture.

## Task Creation Workflow

### 1. Start with Documentation Hub
Always begin by reviewing `docs/project-kickoff.md` which serves as the central navigation for all project documentation. This ensures you're aware of all available resources.

### 2. Select Task from Project Goals
- Review `docs/project-kickoff.md` for prioritized features and 10-day MVP timeline
- Choose tasks that align with NDK-first architecture validation goals
- Note any dependencies or prerequisites for golf app migration

### 3. Create Task Document
Create a new task document in `docs/tasks/[feature-name]-task.md` with this structure:

```markdown
# [Feature Name] Implementation Task

## Objective
Clear statement of what needs to be built

## Current State Analysis
- What exists now that's relevant
- Mock data or placeholders to replace
- Related implemented features

## Technical Approach
- How it fits with XState architecture
- NDK integration requirements
- Web browser optimizations needed

## Implementation Steps
1. [ ] Step-by-step breakdown
2. [ ] Small, testable chunks
3. [ ] Clear completion criteria

## Success Criteria
- [ ] User can...
- [ ] System handles...
- [ ] Data persists via NDK cache...

## References
- Link to relevant docs from project structure
```

### 4. Required Documentation Review
**MANDATORY - Always start by reviewing `.clinerules/README.md` for smart navigation to relevant rules.**

Based on the task type, review relevant sections:

**For All Tasks:**
- **`.clinerules/README.md`** - Smart navigation system for development rules (ALWAYS CHECK FIRST)
- `docs/project-kickoff.md` - Project goals and NDK-first architecture
- `docs/nip-101e-specification.md` - Workout event specifications
- Relevant `.clinerules/` files based on task type (use README.md navigation)

**For State Management:**
- `.clinerules/xstate-anti-pattern-prevention.md`
- `.clinerules/service-layer-architecture.md`
- `components/test/` examples

**For Nostr Features:**
- `docs/nip-101e-specification.md` - Workout event specs
- `.clinerules/web-ndk-actor-integration.md`
- `.clinerules/nip-101e-standards.md`

**For Authentication:**
- `.clinerules/web-private-key-security.md`
- Browser extension integration patterns

**For UI Components:**
- `components/test/` - Working examples
- Next.js 14 App Router patterns
- Tailwind CSS + component library integration

### 5. Implementation Process
1. **Code** following the technical approach
2. **Test** each implementation step
3. **Update** project documentation as features complete
4. **Validate** NDK-first architecture assumptions

### 6. Post-Implementation
After implementation is complete:

1. **Create/Update Feature Documentation**
   - Add to `docs/features/[feature-name]/`
   - Include usage examples
   - Document any new patterns for golf app migration

2. **Update Core Documentation**
   - Mark complete in project tracking
   - Add entry to development log
   - Update `docs/project-kickoff.md` if architecture insights gained

3. **Archive Task Document**
   - Move to `docs/archive/tasks/`
   - Preserves implementation history for golf app reference

### 7. Provide Task Kickoff Prompt
After creating the task document, provide a brief prompt for starting the task in a fresh context:

1. **Task Summary** (2-3 sentences)
   - What needs to be implemented
   - Key technical approach
   - Primary goal/outcome

2. **Key Files to Review** (3-5 most important)
   - Task document location
   - Critical reference files
   - Relevant Cline rules

3. **Starting Point** (1-2 sentences)
   - First step to take
   - Dependencies to check

This prompt enables efficient task startup in new contexts without requiring full conversation history.

## Example: NDK Workout Cache Integration Task

1. **Review** `docs/project-kickoff.md` to understand NDK-first goals
2. **Check** project timeline - critical for MVP validation
3. **Create** `docs/tasks/ndk-workout-cache-integration-task.md`
4. **Review** required docs:
   - `docs/project-kickoff.md` for NDK-first architecture
   - `docs/nip-101e-specification.md` for workout event structure
   - `.clinerules/web-ndk-actor-integration.md` for integration patterns
   - `.clinerules/service-layer-architecture.md` for service patterns
5. **Implement** following the plan
6. **Document** in `docs/features/workout-cache/`
7. **Update** project status and lessons learned
8. **Archive** the task document

## Key Principles

1. **NDK-First Validation**: Every task should validate or refine NDK-first architecture
2. **Reference Existing Patterns**: Use established web patterns from .clinerules
3. **Small Steps**: Break down into manageable chunks for 10-day timeline
4. **Golf App Migration**: Document patterns that will transfer to golf app
5. **Complete the Cycle**: Archive tasks when done for future reference

## Web-Specific Considerations

### Browser Environment Tasks
- Consider IndexedDB cache limitations
- Plan for offline-first functionality
- Account for browser security restrictions
- Optimize for web performance

### NDK Integration Tasks
- Validate browser NDK package compatibility
- Test with multiple relay connections
- Ensure proper error handling for network issues
- Document cache behavior differences from mobile

### PWA Feature Tasks
- Service worker integration
- App manifest configuration
- Offline queue management
- Push notification setup (if needed)

## Common Pitfalls to Avoid

- Starting coding without reviewing NDK-first goals
- Creating new patterns when web-optimized ones exist
- Forgetting to validate architecture assumptions
- Not documenting insights for golf app migration
- Skipping the documentation review step
- Ignoring 10-day MVP timeline constraints

## Task Categories for POWR PWA

### Phase 1: Foundation (Days 1-3)
- NDK provider setup and authentication
- Basic event publishing/reading
- XState machine adaptation

### Phase 2: Core Workflow (Days 4-7)
- Workout template browsing
- Active workout tracking
- Workout completion and publishing

### Phase 3: PWA Features (Days 8-10)
- Service worker setup
- Offline functionality
- Error handling and polish

## When to Apply This Rule

- Starting any new feature implementation
- Creating technical design documents
- Planning sprint work within 10-day timeline
- Validating NDK-first architecture decisions
- Preparing patterns for golf app migration

## Success Metrics

### Task Quality Indicators
- Clear connection to NDK-first validation goals
- Realistic timeline within 10-day MVP
- Documented patterns for golf app reuse
- Proper integration with existing web architecture

### Architecture Validation Indicators
- NDK cache performance meets expectations
- Event-driven data model works seamlessly
- No custom database code required
- Simplified architecture compared to dual-database approach

This rule ensures that all POWR PWA development contributes to the primary goal of validating NDK-first architecture for eventual golf app migration.

---

**Last Updated**: 2025-06-21
**Project**: POWR Workout PWA
**Environment**: Web Browser
