# Post-Task Completion Workflow Rule

## Brief overview
This rule establishes a comprehensive workflow for updating documentation after completing tasks, including changelog updates with audience-specific sections, roadmap maintenance, task archiving, and commit message generation with optional execution.

## Post-Task Completion Workflow

### Core 4-Step Process
1. **Update CHANGELOG.md** - Add entry with audience-specific sections
2. **Update ROADMAP.md** - Mark completed tasks and brief status updates
3. **Archive Task Documents** - Mark as complete and move to archive
4. **Generate Commit Message** - Provide structured commit message for user review

## Step 1: CHANGELOG.md Updates

### Audience-Specific Format (Option 3)
Use three distinct sections for different audiences:

#### **User Impact** (Business-focused, 1-3 lines)
- What users can now do or what problems are solved
- Focus on features, fixes, and user-visible improvements
- Use clear, non-technical language

#### **Developer Notes** (Technical summary, 2-5 lines)
- Key technical changes and architectural decisions
- File references and implementation patterns used
- Performance improvements with metrics when available

#### **Architecture Changes** (Design patterns, 1-3 lines)
- New patterns established or .clinerules compliance
- Service extractions, state management improvements
- Foundation laid for future features

### Example Entry Format
```markdown
### Added
- **Feature Name COMPLETE (Date) ✅**
  
  **User Impact**: Users can now [specific capability] with [key benefit]. [Problem solved or workflow improved].
  
  **Developer Notes**: [Technical implementation summary]. [Key files updated]. [Performance metrics if applicable].
  
  **Architecture Changes**: [Pattern established]. [.clinerules compliance]. [Future development foundation].
```

### Entry Length Guidelines
- **Total entry**: Maximum 10 lines (down from current 20+)
- **User Impact**: 1-3 lines maximum
- **Developer Notes**: 2-5 lines maximum  
- **Architecture Changes**: 1-3 lines maximum
- **Lead with completion status**: Date and ✅ for completed features

### What NOT to Include in CHANGELOG
- Detailed sub-bullet breakdowns (move to feature docs)
- Step-by-step implementation details (reference task docs)
- Extensive file lists (mention key files only)
- Multiple paragraphs per section (keep concise)

## Step 2: ROADMAP.md Updates

### Completion Marking
- Mark completed tasks with ✅ and completion date
- Update task status from `[ ]` to `[x]` for checkboxes
- Add brief completion note if task scope changed

### Status Updates
- Move completed items to appropriate completed sections
- Update current phase progress indicators
- Adjust timeline estimates based on actual completion

### Example Updates
```markdown
**🔴 Critical: NDK-First Architecture Validation (1 week)**
- [x] Setup NDK provider and authentication ✅ (June 21, 2025)
- [x] Create workout event publishing system ✅ (June 21, 2025)
- [ ] Build workout template browser
```

## Step 3: Task Document Archiving

### Mark Task as Complete
Add completion status to task document header:
```markdown
---
status: completed
completed_date: YYYY-MM-DD
completion_notes: "Brief note about any scope changes or lessons learned"
---
```

### Archive Location
- Move completed task documents to `docs/archive/tasks/`
- Maintain original filename for reference
- Update any links in other documents

### Archive Timing
- **Immediately after completion**: For single-session tasks
- **After verification**: For complex tasks requiring testing
- **After documentation**: When feature docs are created

## Step 4: Git Commit Message Generation

### Commit Message Standards
Follow **Conventional Commits** specification: https://www.conventionalcommits.org/

#### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Rules
- **Subject line**: 50 characters or less
- **Type**: feat, fix, docs, style, refactor, test, chore
- **Description**: Imperative mood ("add" not "added")
- **Body**: Wrap at 72 characters, explain what and why
- **Footer**: Reference issues, breaking changes

#### Types by Task Category
- `feat:` New features for users
- `fix:` Bug fixes for users  
- `docs:` Documentation changes
- `style:` Code formatting (no logic changes)
- `refactor:` Code restructuring (no behavior changes)
- `test:` Adding or updating tests
- `chore:` Build process, dependencies, tooling

### Commit Message Templates

#### Feature Completion
```
feat(scope): complete [feature name]

- User Impact: [1-line summary]
- Developer Notes: [1-line technical summary]
- Architecture: [1-line pattern summary]

Files: [key files updated]
```

#### Bug Fix
```
fix(scope): resolve [issue description]

- Root Cause: [brief cause]
- Solution: [brief solution]
- Impact: [user benefit]

Files: [files fixed]
```

#### Documentation Update
```
docs: update post-task completion workflow

- Added audience-specific changelog format
- Integrated git commit workflow
- Established task archiving process

Files: CHANGELOG.md, ROADMAP.md, docs/archive/tasks/
```

### Commit Execution Workflow
- **Cline provides**: Well-formatted commit message for user review
- **User executes**: `git add`, `git commit`, and `git push` operations manually
- **User choice**: Can modify commit message before execution
- **No automatic commits**: User maintains full control over git operations

## Integration with Existing Rules

### References to Other .clinerules
- **Documentation formatting**: Follow `.clinerules/documentation-maintenance.md`
- **Task creation**: Reference `.clinerules/task-creation-process.md` for task lifecycle
- **Standard prompts**: Use consistent formatting across all documentation

### .clinerules README.md Updates
Add this rule to the "Documentation & Workflow" section and update problem-based navigation:

```markdown
| "Task is complete" / "How do I document this?" | post-task-completion-workflow.md |
| "How should I commit this?" / "What's the commit format?" | post-task-completion-workflow.md |
```

## Example Complete Workflow

### Task: "NDK Provider Setup and Authentication"

#### 1. CHANGELOG.md Entry
```markdown
### Added
- **NDK Provider Setup and Authentication COMPLETE (June 21, 2025) ✅**
  
  **User Impact**: Users can now authenticate with Nostr browser extensions or private keys, enabling secure workout data publishing to the Nostr network.
  
  **Developer Notes**: Implemented NDKProvider with NIP-07 extension detection and encrypted private key fallback. Uses Web Crypto API for secure browser storage.
  
  **Architecture Changes**: Established web-specific authentication patterns for NDK integration. Foundation ready for XState machine publishing.
```

#### 2. ROADMAP.md Update
```markdown
**🔴 Critical: NDK-First Architecture Validation (1 week)**
- [x] Setup NDK provider and authentication ✅ (June 21, 2025)
- [x] Create basic event publishing test ✅ (June 21, 2025)
- [ ] Build workout template browser
```

#### 3. Task Document Archive
Move `docs/tasks/ndk-provider-setup-task.md` to `docs/archive/tasks/` with completion status.

#### 4. Commit Message
```
feat(auth): complete NDK provider setup and authentication

- User Impact: Secure Nostr authentication with extension and private key support
- Developer Notes: NIP-07 detection with encrypted fallback using Web Crypto API
- Architecture: Web-specific NDK authentication patterns established

Files: providers/NDKProvider.tsx, lib/crypto-utils.ts, CHANGELOG.md, ROADMAP.md
```

## When to Apply This Rule

### Always Apply For
- Completing any development task
- Finishing features or bug fixes
- Major architectural changes
- Documentation updates

### Especially Important When
- Task completion affects multiple stakeholders
- Changes impact future development
- Architectural patterns are established
- User-facing features are completed

### Success Metrics
- Changelog entries are scannable and informative
- Roadmap accurately reflects project status
- Task documents are properly archived
- Commit messages follow consistent standards
- Documentation stays current with development

## Benefits of This Workflow

### For Users
- Clear understanding of what's new and fixed
- Business impact of changes is obvious
- Non-technical stakeholders can follow progress

### For Developers
- Technical context preserved for future reference
- Architectural decisions documented
- File references enable quick code location
- Patterns established for consistent development

### For Project Management
- Accurate roadmap status tracking
- Clear completion criteria and dates
- Historical record of development decisions
- Foundation for future planning

---

**Last Updated**: 2025-06-21
**Project**: POWR Workout PWA
**Next Review**: After implementing several tasks using this workflow
