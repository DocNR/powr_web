# Cline Rules Index - POWR Web Project

**Smart navigation system for development rules and best practices in the POWR Workout PWA**

## Quick Start for AI Assistants

**🚨 ALWAYS CHECK THIS INDEX FIRST** when encountering development issues. This index provides problem-based navigation to the most relevant rules.

## Problem-Based Navigation

### 🚨 "I'm Fighting XState" / State Management Issues
**Symptoms**: Complex workarounds, timing issues, defensive programming
- **Primary**: [xstate-anti-pattern-prevention.md](./xstate-anti-pattern-prevention.md) - Core principles and red flags
- **Web Services**: [service-layer-architecture.md](./service-layer-architecture.md) - Service extraction patterns for web
- **External Services**: [xstate-external-service-integration.md](./xstate-external-service-integration.md) - API integration patterns
- **Workout Patterns**: [xstate-workout-patterns.md](./xstate-workout-patterns.md) - Workout-specific state patterns

### 🔐 "Working with Authentication/Keys/Security"
**Symptoms**: Private key handling, NDK integration, authentication flows
- **Primary**: [web-private-key-security.md](./web-private-key-security.md) - Web browser security requirements
- **Integration**: [web-ndk-actor-integration.md](./web-ndk-actor-integration.md) - NDK + XState patterns for web
- **Browser Storage**: [browser-storage-patterns.md](./browser-storage-patterns.md) - Secure web storage patterns

### 🏗️ "Planning a New Feature" / Project Management
**Symptoms**: Starting new work, creating tasks, documentation needs
- **Primary**: [task-creation-process.md](./task-creation-process.md) - Standardized task workflow
- **Documentation**: [documentation-maintenance.md](./documentation-maintenance.md) - Doc standards and formatting
- **Post-Task**: [post-task-completion-workflow.md](./post-task-completion-workflow.md) - Documentation and commit workflow

### 🔧 "Code Quality Issues" / Development Workflow
**Symptoms**: Import problems, formatting issues, git workflow questions, over-engineering
- **Simplicity**: [simple-solutions-first.md](./simple-solutions-first.md) - Prevents over-engineering and complex workarounds
- **Imports**: [auto-formatter-imports.md](./auto-formatter-imports.md) - Auto-formatter workflow
- **Research**: [research-before-implementation.md](./research-before-implementation.md) - API research patterns

### 🎨 "Building UI Components" / Interface Development
**Symptoms**: Custom component creation, styling inconsistencies, accessibility concerns
- **Primary**: [shadcn-ui-component-library.md](./shadcn-ui-component-library.md) - UI component library standards
- **Consistency**: Use shadcn/ui before building custom components
- **Accessibility**: Built-in a11y compliance through Radix UI primitives

### 💪 "Working with Workout Events" / Nostr Integration
**Symptoms**: NIP-101e events, workout data validation, event publishing
- **Primary**: [nip-101e-standards.md](./nip-101e-standards.md) - Workout event standards
- **Publishing**: [workout-event-publishing.md](./workout-event-publishing.md) - Event publishing patterns
- **Verification**: [nostr-event-verification.md](./nostr-event-verification.md) - NAK/websocat verification commands

### 🔍 "Verifying Published Content" / Event Validation
**Symptoms**: Need to check Nostr events, NAK command issues, event not found errors
- **Primary**: [nostr-event-verification.md](./nostr-event-verification.md) - Proven NAK and websocat commands
- **Standards**: [nip-101e-standards.md](./nip-101e-standards.md) - Event structure compliance
- **Research**: [research-before-implementation.md](./research-before-implementation.md) - Nostr MCP for protocol docs

## Rule Categories

### 🎯 **Critical Rules** (Read First)
1. **[simple-solutions-first.md](./simple-solutions-first.md)** - Prevents over-engineering and complex workarounds
2. **[xstate-anti-pattern-prevention.md](./xstate-anti-pattern-prevention.md)** - Prevents expensive workarounds
3. **[web-private-key-security.md](./web-private-key-security.md)** - Web security requirements
4. **[task-creation-process.md](./task-creation-process.md)** - Project workflow
5. **[research-before-implementation.md](./research-before-implementation.md)** - API research patterns

### 🔧 **Technical Implementation**
5. **[ndk-best-practices.md](./ndk-best-practices.md)** - Official NDK patterns and best practices
6. **[web-ndk-actor-integration.md](./web-ndk-actor-integration.md)** - Web NDK Actor patterns
7. **[service-layer-architecture.md](./service-layer-architecture.md)** - Service extraction for web
8. **[xstate-external-service-integration.md](./xstate-external-service-integration.md)** - External service patterns
9. **[nip-101e-standards.md](./nip-101e-standards.md)** - Workout event standards
10. **[shadcn-ui-component-library.md](./shadcn-ui-component-library.md)** - UI component library standards

### 📝 **Documentation & Workflow**
11. **[documentation-maintenance.md](./documentation-maintenance.md)** - Doc standards
12. **[auto-formatter-imports.md](./auto-formatter-imports.md)** - Import workflow
13. **[post-task-completion-workflow.md](./post-task-completion-workflow.md)** - Post-task workflow
14. **[nostr-event-verification.md](./nostr-event-verification.md)** - NAK/websocat verification commands
15. **[workout-event-publishing.md](./workout-event-publishing.md)** - Event publishing patterns

## AI Assistant Quick Reference

### When User Says...

| User Statement | Check These Rules |
|---|---|
| "XState is confusing" / "This feels complex" | xstate-anti-pattern-prevention.md |
| "I need to integrate NDK" / "Authentication issues" | ndk-best-practices.md, web-private-key-security.md |
| "NDK undefined in XState" / "Publishing from state machines" | web-ndk-actor-integration.md |
| "Starting a new feature" / "How do I plan this?" | task-creation-process.md |
| "Imports keep getting removed" / "Auto-formatter issues" | auto-formatter-imports.md |
| "How should I commit this?" / "What's the commit format?" | post-task-completion-workflow.md |
| "Working with workout data" / "NIP-101e events" | nip-101e-standards.md |
| "Need Nostr documentation" / "Protocol compliance" | research-before-implementation.md (Nostr MCP) |
| "Need to create a service" / "Extract business logic" | service-layer-architecture.md |
| "Using NDK hooks" / "Data fetching patterns" | ndk-best-practices.md |
| "This feels complex" / "Should I build a service for this?" | simple-solutions-first.md |
| "Building UI components" / "Need a form/button/modal" | shadcn-ui-component-library.md |
| "Custom component creation" / "Styling inconsistencies" | shadcn-ui-component-library.md |
| "Need to verify published events" / "Check Nostr content" | nostr-event-verification.md |
| "NAK commands failing" / "Event not found" | nostr-event-verification.md |

### Red Flag Keywords → Immediate Rules to Check

| Keywords | Rules to Check |
|---|---|
| "workaround", "hack", "temporary fix" | xstate-anti-pattern-prevention.md |
| "private key", "NDK", "authentication" | ndk-best-practices.md, web-private-key-security.md |
| "NDK undefined", "publishing from state machines" | web-ndk-actor-integration.md |
| "useEffect", "timing", "race condition" | xstate-anti-pattern-prevention.md |
| "external service", "API integration" | xstate-external-service-integration.md |
| "workout events", "NIP-101e", "exercise data" | nip-101e-standards.md |
| "imports removed", "auto-format" | auto-formatter-imports.md |
| "useSubscribe", "loading states", "React Context" | ndk-best-practices.md |
| "workaround", "hack", "temporary fix" | simple-solutions-first.md |
| "verify events", "NAK", "websocat", "event not found" | nostr-event-verification.md |
| "published content", "dependency chain", "collection references" | nostr-event-verification.md |

## Cost-Saving Lessons Learned

### 💰 **Expensive Mistake: NDK Workaround (6+ hours)**
**What Happened**: Tried to inject NDK through XState context instead of using Global Actor pattern
**Cost**: 6+ hours of development + cleanup time
**Prevention**: Following xstate-anti-pattern-prevention.md would have caught this immediately

**Key Lesson**: When XState feels difficult, the solution is almost always to simplify and follow framework best practices, not build workarounds.

### 🎯 **Prevention Checklist**
Before any XState work:
1. ✅ Check xstate-anti-pattern-prevention.md
2. ✅ Ask: "Am I fighting the framework?"
3. ✅ Look for existing patterns in our codebase
4. ✅ If complexity > 30 minutes, STOP and review rules

## POWR Web Project Specific Context

### **Architecture Goals**
- **NDK-First**: Validate NDK IndexedDB cache as primary persistence
- **XState v5**: Complex workout state management
- **Next.js 14**: App Router with PWA capabilities
- **NIP-101e**: Workout events as primary data model

### **Success Metrics**
- Zero custom database code - All persistence via NDK cache
- Events as data model - No object-relational mapping needed
- Simplified architecture - Single source of truth for data
- Proven patterns for golf app migration

## Rule Maintenance

### Adding New Rules
1. Create the rule file with clear examples
2. Update this index with problem-based navigation
3. Add to appropriate category
4. Update AI quick reference tables

### Updating Existing Rules
1. Update the rule file
2. Check if index navigation needs updates
3. Update last_updated dates
4. Consider if new categories are needed

## Emergency Protocols

### 🚨 When Development Feels Stuck (>2 hours on one issue)
1. **STOP** - Don't continue building workarounds
2. **CHECK** - Review relevant rules from this index
3. **SIMPLIFY** - Look for simpler XState patterns
4. **ASK** - Use the problem-based navigation above

### 🔥 When Security is Involved
1. **IMMEDIATELY** check web-private-key-security.md
2. **NEVER** hardcode keys or sensitive data
3. **ALWAYS** use established web authentication patterns
4. **VERIFY** with security checklist before proceeding

## Success Metrics

### How to Know Rules Are Working
- ✅ Development feels smooth and predictable
- ✅ No "hack" or "workaround" comments in code
- ✅ XState patterns are simple and documented
- ✅ Security practices are consistent
- ✅ New features follow established patterns

### Warning Signs Rules Need Updates
- ❌ Repeated similar problems across features
- ❌ Complex workarounds becoming common
- ❌ Security patterns being bypassed
- ❌ Documentation falling behind code

---

**Last Updated**: 2025-06-25
**Project**: POWR Workout PWA
**Next Review**: When adding new rule categories or after major architectural changes
