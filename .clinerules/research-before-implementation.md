# Research Before Implementation Rule

## Core Principle
**Always research external APIs and libraries using available tools before implementing code that depends on them.**

## When This Rule Applies
- Implementing code that uses external libraries (NDK, XState, etc.)
- Creating integrations with third-party APIs
- Using unfamiliar frameworks or tools
- Building on top of complex libraries with evolving APIs

## Required Research Process

### 1. Use MCP Tools First
- **repo-explorer**: Search actual source code for API patterns and add research directories
- **web-fetch**: Check official documentation
- **search-files**: Look for existing usage patterns in related projects

### 2. Research Checklist
Before writing implementation code, verify:
- [ ] Constructor/initialization patterns
- [ ] Required vs optional parameters
- [ ] Correct import statements
- [ ] Actual API method names and signatures
- [ ] Configuration options that actually exist
- [ ] Best practices from source code examples

### 3. Evidence-Based Implementation
- Quote actual source code examples when possible
- Reference specific files and line numbers from research
- Document any assumptions that couldn't be verified
- Note API version compatibility

## Anti-Patterns to Avoid

### ❌ Assumption-Based Coding
```typescript
// DON'T: Assume API based on documentation or memory
const adapter = new SomeAdapter({
  timeout: 5000,  // Does this option exist?
  retries: 3,     // Is this the correct name?
});
```

### ✅ Research-Based Coding
```typescript
// DO: Verify actual API from source code
// Based on repo-explorer search of SomeAdapter constructor:
// File: src/adapter.ts, Line 45: constructor(opts: {maxRetries?: number})
const adapter = new SomeAdapter({
  maxRetries: 3,  // Verified from actual source
});
```

## Research Documentation

### Document Research Process
When implementing based on research, include comments like:
```typescript
/**
 * NDK Configuration based on repo-explorer research:
 * - File: ndk-cache-dexie/src/index.ts, Line 44-69
 * - Verified options: dbName, eventCacheSize, profileCacheSize, saveSig
 * - enableOutboxModel confirmed in ndk-core/src/ndk/index.ts, Line 74
 */
```

### Track API Evolution
- Note the version/commit of researched code
- Document any deprecated patterns discovered
- Flag areas where API might be unstable

## Benefits of This Approach

### ✅ Prevents Common Issues
- Incorrect API usage
- Non-existent configuration options
- Outdated patterns from old documentation
- Incompatible method signatures

### ✅ Builds Reliable Code
- Code that actually works on first run
- Proper error handling based on real API behavior
- Optimal configuration based on source code insights
- Future-proof patterns

### ✅ Saves Development Time
- Reduces debugging of API misuse
- Prevents refactoring due to incorrect assumptions
- Builds confidence in implementation choices
- Creates reusable knowledge for team

## Implementation Workflow

1. **Identify External Dependencies**
   - List all external libraries/APIs to be used
   - Prioritize by complexity and unfamiliarity

2. **Research Phase**
   - Use MCP tools to explore actual source code
   - Document findings with specific references
   - Create research notes for team knowledge

3. **Implementation Phase**
   - Write code based on verified API patterns
   - Include research references in comments
   - Test against actual API behavior

4. **Documentation Phase**
   - Update project docs with research insights
   - Share learnings with team
   - Create reusable patterns for similar implementations

## MCP Tool Usage Guide

### repo-explorer Tool
The repo-explorer MCP server provides comprehensive research capabilities:

#### Adding Research Directories
```typescript
// Add documentation directories for research
use_mcp_tool({
  server_name: "repo-explorer",
  tool_name: "add_local_directory",
  arguments: {
    category: "documentation",
    repoName: "xstate-docs",
    directoryPath: "/Users/danielwyler/referencerepos/state-management/xstate",
    description: "XState documentation and guides (.mdx files)"
  }
});
```

#### Searching Research Materials
```typescript
// Search for specific concepts in documentation
use_mcp_tool({
  server_name: "repo-explorer",
  tool_name: "search_code",
  arguments: {
    pattern: "actor model",
    filePattern: "*.mdx",
    category: "documentation",
    repo: "xstate-docs",
    maxResults: 10,
    contextLines: 5
  }
});
```

#### Searching Source Code
```typescript
// Search for API patterns in source code
use_mcp_tool({
  server_name: "repo-explorer",
  tool_name: "search_code",
  arguments: {
    pattern: "NDKCacheAdapterDexie.*constructor|new NDKCacheAdapterDexie",
    filePattern: "*.ts",
    category: "nostr",
    repo: "ndk",
    maxResults: 20
  }
});
```

## Example: NDK Research Process

### 1. Add NDK Source Code (if not already added)
```typescript
// NDK is already in repo-explorer, but you could add local copies:
use_mcp_tool({
  server_name: "repo-explorer", 
  tool_name: "add_local_directory",
  arguments: {
    category: "source-code",
    repoName: "ndk-local",
    directoryPath: "/path/to/local/ndk",
    description: "Local NDK source code for research"
  }
});
```

### 2. Research Query
```typescript
use_mcp_tool({
  server_name: "repo-explorer",
  tool_name: "search_code", 
  arguments: {
    pattern: "NDKCacheAdapterDexie.*constructor|new NDKCacheAdapterDexie",
    filePattern: "*.ts",
    category: "nostr",
    repo: "ndk"
  }
});
// Result: Found actual constructor signature and options
```

### 3. Implementation Based on Research
```typescript
// Based on repo-explorer search results:
// - File: ndk-cache-dexie/src/index.ts, Line 44-69
// - Constructor accepts NDKCacheAdapterDexieOptions
// - Available options: dbName, eventCacheSize, profileCacheSize, saveSig
// - No expirationTime option exists (contrary to assumptions)
const cacheAdapter = new NDKCacheAdapterDexie({
  dbName: 'workout-pwa-cache',
  eventCacheSize: 10000,     // Verified option
  profileCacheSize: 1000,    // Verified option
  saveSig: true,             // Verified option
});
```

## Enforcement

### Code Review Checklist
- [ ] External API usage includes research references
- [ ] No assumptions about API without verification
- [ ] MCP tool usage documented where applicable
- [ ] Research findings shared with team
- [ ] Research directories added to repo-explorer for future reference

### Available Research Categories
Organize your research directories by category:
- **documentation**: Official docs, guides, tutorials
- **source-code**: Library/framework source code
- **examples**: Example projects and implementations
- **research**: Academic papers, blog posts, reference materials
- **local-projects**: Your own projects for pattern reference

### When to Skip Research
Research can be skipped only when:
- Using well-known, stable APIs (e.g., standard DOM APIs)
- Working with internal/proprietary code you wrote
- Implementing basic language features (not library-specific)
- Time-critical hotfixes (but research debt should be tracked)

---

**Remember**: A few minutes of research can save hours of debugging and refactoring.
