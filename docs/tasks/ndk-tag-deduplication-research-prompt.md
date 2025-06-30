# NDK Tag Deduplication Research Prompt

## 🎯 **Task Summary**
Research NDK source code to determine if NDK automatically deduplicates identical tags during event creation or publishing. Our workout events are losing duplicate exercise tags somewhere in the NDK pipeline.

## 🔍 **Key Evidence**
- **Service generates**: 10-12 exercise tags correctly ✅
- **NDK event creation**: Preserves all tags ✅
- **Published events**: Only 4 unique exercise tags ❌
- **Both NIP-07 and NIP-46**: Show identical deduplication behavior

## 🔬 **Research Focus**
Use repo-explorer MCP tool to search NDK source code for tag deduplication logic in:

1. **NDKEvent constructor** and tag handling
2. **publish() method** and publishing pipeline  
3. **Event validation/normalization** code
4. **Any use of Set() or deduplication utilities** on tags

## 🚀 **Starting Point**
Begin by searching the NDK repository for patterns like:
- `tags.*filter`
- `tags.*unique` 
- `new Set.*tags`
- `deduplicate`
- `tags.*Set`
- `Array.from.*Set`

## 📋 **Research Steps**

### Step 1: Search for Tag Deduplication Patterns
```typescript
// Use repo-explorer to search for:
use_mcp_tool({
  server_name: "repo-explorer",
  tool_name: "search_code",
  arguments: {
    pattern: "tags.*filter|tags.*unique|new Set.*tags|deduplicate",
    filePattern: "*.ts",
    category: "nostr", 
    repo: "ndk",
    maxResults: 20
  }
});
```

### Step 2: Examine NDKEvent Class
```typescript
// Search for NDKEvent constructor and tag handling:
use_mcp_tool({
  server_name: "repo-explorer", 
  tool_name: "search_code",
  arguments: {
    pattern: "class NDKEvent|constructor.*tags|this\\.tags",
    filePattern: "*.ts",
    category: "nostr",
    repo: "ndk", 
    maxResults: 15
  }
});
```

### Step 3: Investigate Publishing Pipeline
```typescript
// Search for publish method and tag processing:
use_mcp_tool({
  server_name: "repo-explorer",
  tool_name: "search_code", 
  arguments: {
    pattern: "publish.*tags|tags.*publish|event\\.tags.*=",
    filePattern: "*.ts",
    category: "nostr",
    repo: "ndk",
    maxResults: 15
  }
});
```

### Step 4: Look for Array/Set Operations on Tags
```typescript
// Search for Set operations that might deduplicate:
use_mcp_tool({
  server_name: "repo-explorer",
  tool_name: "search_code",
  arguments: {
    pattern: "Array\\.from.*Set|\\[\\.\\.\\. new Set|Set\\(.*tags\\)",
    filePattern: "*.ts", 
    category: "nostr",
    repo: "ndk",
    maxResults: 10
  }
});
```

## 🎯 **Expected Findings**
Look for evidence of:

1. **Explicit deduplication**: Code that intentionally removes duplicate tags
2. **Implicit deduplication**: Use of `Set()` or similar that removes duplicates  
3. **Protocol compliance**: Logic that enforces Nostr protocol tag uniqueness
4. **Configuration options**: Settings to control tag deduplication behavior

## 📝 **Documentation Requirements**
Document findings including:
- **Exact file locations** where tag processing occurs
- **Code snippets** showing deduplication logic (if found)
- **Reasoning** behind the deduplication (comments, documentation)
- **Configuration options** to control behavior (if any)
- **Recommendations** for handling duplicate exercise tags

## 🔧 **Implementation Impact**
Based on findings, determine approach:
- **If NDK deduplicates**: Modify tags to be unique (add set numbers)
- **If NDK doesn't deduplicate**: Look for relay-level or protocol causes
- **If configurable**: Adjust NDK settings to preserve duplicate tags

## 📁 **Related Files**
- `docs/tasks/ndk-tag-deduplication-research-task.md` - Full task details
- `src/lib/services/workoutAnalytics.ts` - Tag generation logic
- `src/lib/actors/globalNDKActor.ts` - Publishing pipeline with debug logs
- Console logs showing tag preservation through NDK creation but loss after publishing

## ⏱️ **Time Estimate**
- **Research**: 45 minutes
- **Documentation**: 15 minutes
- **Total**: 1 hour

---

**Priority**: High - Blocking workout event accuracy
**Next Action**: Execute MCP searches to investigate NDK tag handling
