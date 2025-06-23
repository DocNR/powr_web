# Documentation Maintenance Rules

## Overview
This rule establishes guidelines for maintaining clean, consistent, and useful documentation in the POWR Workout PWA. Each document type has specific formatting rules defined in its header.

## 🚨 MANDATORY: Header-First Documentation Editing

**BEFORE EDITING ANY DOCUMENT: READ THE HEADER FIRST**

1. **🔍 ALWAYS CHECK THE HEADER FIRST** (PREVENTS FORMATTING INCONSISTENCIES)
   - **STEP 1**: Open the document and immediately scroll to the top
   - **STEP 2**: Read the `formatting_rules` section in the document header
   - **STEP 3**: Follow the specified guidelines for that document type exactly
   - **STEP 4**: Update `last_updated` date when making changes
   - **STEP 5**: Verify `status` field reflects current accuracy

2. **🎯 HEADER-DRIVEN EDITING WORKFLOW**
   - **Document header = Design guide** for that specific document
   - **Each document type has unique rules** defined in its own header
   - **Never assume formatting** - always check the header first
   - **Prevents inconsistencies** like mixing changelog formats or roadmap styles

3. **📋 MISSING HEADER PROTOCOL**
   - **If no header found**: Add appropriate header before editing content
   - **Use category-specific template** based on document purpose
   - **Include all required fields** (title, description, status, dates, category, formatting_rules)
   - **Set status to 'draft'** until content is verified against formatting rules

4. **Header Structure**
   All documentation files should include this header:
   ```yaml
   ---
   title: Document Title
   description: Brief description of document purpose
   status: verified|needs-update|draft|archived
   last_updated: YYYY-MM-DD
   last_verified: YYYY-MM-DD
   related_code: 
     - /path/to/relevant/file.ts
   category: architecture|roadmap|guide|reference
   formatting_rules:
     - "Rule 1 specific to this document type"
     - "Rule 2 specific to this document type"
   ---
   ```

3. **Formatting Rules by Category**

   **architecture**: Conceptual focus
   - No implementation code blocks
   - Use mermaid diagrams for system design
   - Reference implementation files with: `See: path/to/file.ts`
   - Maximum 5 lines for pattern examples
   - Focus on "what" and "why", not "how"
   
   **roadmap**: Planning focus  
   - Use checkbox lists for tasks
   - No code or technical implementation details
   - Group by time period (This Week, Next Sprint, Future Epochs)
   - Include priority markers (🔴 Critical, 🟡 High, 🟢 Normal)
   - Link to ARCHITECTURE.md for technical context
   - **Bug fixes belong in CHANGELOG.md, not ROADMAP.md** - roadmap is for future features only
   - Only add new features and enhancements to roadmap
   - Mark completed features as complete, but don't add bug fix details
   
   **guide**: Instructional focus
   - Step-by-step numbered instructions
   - Command examples in code blocks are OK
   - Link to example files, don't embed full implementations
   - Include troubleshooting section
   - Keep explanations brief - link to architecture for theory
   
   **reference**: Specification focus
   - Use tables for data structures
   - Type definitions and API signatures only
   - No implementation code
   - Link to source files for implementations
   - Keep descriptions factual and brief

4. **Code Example Rules**

   **In Documentation Files**:
   - Maximum 5 lines per code example
   - Must be pattern demonstrations, not full implementations
   - Always include file reference for full code
   - Use comments to explain the pattern being shown

   **In Examples Folder** (`docs/examples/`):
   - One concept per file
   - Include header comment explaining what pattern is demonstrated
   - Keep files under 100 lines
   - Link back to relevant documentation
   - Use descriptive filenames (e.g., `xstate-workout-pattern.tsx`)

5. **When Adding Code**
   Ask yourself:
   - Is this showing a pattern (OK) or full implementation (use examples/)?
   - Could a diagram explain this better?
   - Is there a file I can reference instead?
   - Will this code example become outdated quickly?

6. **Status Management**
   - `verified`: Recently checked against actual code implementation
   - `needs-update`: Known inaccuracies or outdated information
   - `draft`: Work in progress, not ready for use
   - `archived`: No longer maintained, kept for historical reference

7. **Archiving Rules**
   Move documents to `docs/archive/` when:
   - Task is completed and documented in CHANGELOG
   - Plan has been implemented or abandoned
   - Information is superseded by newer documentation
   - Document hasn't been updated in 6+ months and is no longer relevant

## Example: Updating Project Documentation

```markdown
---
title: POWR Workout PWA Architecture
description: System design and technical architecture for web PWA
status: verified
last_updated: 2025-06-21
last_verified: 2025-06-21
related_code: 
  - /lib/machines/
  - /lib/services/
  - /providers/NDKProvider.tsx
category: architecture
formatting_rules:
  - "No implementation code - concepts and patterns only"
  - "Use mermaid diagrams for system design"
  - "Reference files with: See: `path/to/file.ts`"
  - "Maximum 5 lines for pattern examples"
  - "Focus on what/why, not how"
---

## State Management

We use XState v5 for managing application state, focusing on predictable state transitions
and clear separation of concerns for web browser environments.

**Pattern**: Global NDK Actor for Nostr publishing
See: `lib/actors/globalNDKActor.ts`

The architecture supports NDK-first data persistence, eliminating custom database
complexity while maintaining offline-first functionality through IndexedDB cache.
```

## Common Mistakes to Avoid

1. **Don't embed large code blocks** - Link to files instead
2. **Don't mix planning with architecture** - Keep them in separate docs
3. **Don't duplicate information** - Single source of truth
4. **Don't forget to update headers** - Especially last_updated
5. **Don't keep outdated docs active** - Archive them

## Verification Checklist

Before committing documentation changes:
- [ ] Header is complete with all required fields
- [ ] Formatting rules in header are followed
- [ ] Code examples are under 5 lines
- [ ] Implementation files are referenced, not embedded
- [ ] Last_updated date is current
- [ ] Related_code paths are valid
- [ ] No duplicate information across documents

---

**Last Updated**: 2025-06-21
**Project**: POWR Workout PWA
**Environment**: Web Browser
