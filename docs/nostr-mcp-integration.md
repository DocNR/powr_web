# Nostr MCP Integration Guide

## Overview
The Nostr Model Context Protocol (MCP) server from Nostrbook.dev provides direct access to comprehensive, AI-ready Nostr documentation. Nostrbook serves as "A Comprehensive Registry of Nostr Documentation" with structured, detailed knowledge about Nostr for both humans and AI. This integration ensures our POWR Workout PWA maintains strict NIP-101e compliance and follows current Nostr best practices.

### What is Nostrbook?
Nostrbook expands upon the official NIPs repository with:
- **Clearer explanations** of protocol concepts
- **Structured navigation** across all Nostr documentation
- **Detailed examples** and real-world implementations
- **Cross-references** between related concepts
- **AI-ready formatting** following llms.txt specification
- **Programmatic access** via markdown endpoints

## Installation Status
✅ **INSTALLED**: MCP configuration added to `.vscode/mcp.json`
✅ **PACKAGE INSTALLED**: `@nostrbook/mcp` installed globally
⚠️ **CONNECTION ISSUE**: MCP server not connecting to Claude Dev extension

## Available Tools

### Core Documentation Tools
- `read_nip(nip)` - Fetch NIPs from official repository
- `read_kind(kind)` - Get event kind documentation  
- `read_tag(tag)` - Access tag specifications
- `read_protocol(doc)` - Protocol documentation
- `read_nips_index()` - Full NIPs overview

### Alternative Access Methods (While MCP Connection Resolves)
Since Nostrbook follows the llms.txt specification, you can also access documentation directly:

#### Markdown Endpoints
- **Event Kinds**: `https://nostrbook.dev/kinds/1301.md` (NIP-101e workout records)
- **Tags**: `https://nostrbook.dev/tags/exercise.md` (exercise tag documentation)
- **Protocol**: `https://nostrbook.dev/protocol/event.md` (event structure)
- **Directory Indexes**: `https://nostrbook.dev/kinds/index.md` (all event kinds)

#### Programmatic URL Construction
- For kind N: `https://nostrbook.dev/kinds/N.md`
- For tag T: `https://nostrbook.dev/tags/T.md`
- For protocol section: `https://nostrbook.dev/protocol/SECTION.md`

## Usage Examples for POWR PWA

### NIP-101e Fitness Events Validation
```
# Check current NIP-101e specification
read_nip("101e")

# Validate workout record event structure (Kind 1301)
read_kind(1301)

# Verify exercise template format (Kind 33401)
read_kind(33401)

# Check workout template structure (Kind 33402)
read_kind(33402)
```

### Tag Format Verification
```
# Verify exercise tag format
read_tag("exercise")

# Check template reference tags
read_tag("template")

# Validate duration tag usage
read_tag("duration")
```

### Protocol Compliance
```
# Check event structure requirements
read_protocol("event")

# Verify filter specifications
read_protocol("filter")

# Review addressable event patterns
read_protocol("index")
```

## Integration with Development Workflow

### During NIP-101e Implementation
1. **Before coding**: Verify current event specifications
2. **During development**: Check tag formatting requirements
3. **Code review**: Validate compliance with official standards
4. **Testing**: Ensure generated events match specifications

### Compliance with .clinerules
This tool directly supports:
- `.clinerules/nip-101e-standards.md` - Ensures strict compliance
- `.clinerules/research-before-implementation.md` - Provides authoritative sources
- `.clinerules/ndk-best-practices.md` - Validates NDK usage patterns

### Example Development Scenarios

#### Scenario 1: Implementing Workout Record Publishing
```
# MCP Method (when connected):
read_nip("101e")
read_kind(1301)
read_tag("exercise")

# Alternative Method (direct access):
web_fetch("https://nostrbook.dev/kinds/1301.md")
web_fetch("https://nostrbook.dev/tags/exercise.md")
```

#### Scenario 2: Debugging Event Parsing Issues
```
# MCP Method:
read_protocol("event")
read_kind(33401)

# Alternative Method:
web_fetch("https://nostrbook.dev/protocol/event.md")
web_fetch("https://nostrbook.dev/kinds/33401.md")
```

#### Scenario 3: Adding New Event Types
```
# MCP Method:
read_nips_index()
read_kind(30023)
read_tag("d")

# Alternative Method:
web_fetch("https://nostrbook.dev/kinds/index.md")
web_fetch("https://nostrbook.dev/kinds/30023.md")
web_fetch("https://nostrbook.dev/tags/d.md")
```

#### Scenario 4: NIP-101e Compliance Verification
```
# Verify current NIP-101e specification
web_fetch("https://github.com/nostr-protocol/nips/blob/master/101e.md")

# Check Nostrbook's structured documentation
web_fetch("https://nostrbook.dev/kinds/1301.md")  # Workout records
web_fetch("https://nostrbook.dev/kinds/33401.md") # Exercise templates
web_fetch("https://nostrbook.dev/kinds/33402.md") # Workout templates
```

## Benefits for POWR PWA Development

### 1. **Real-time Compliance**
- Always current with latest Nostr specifications
- No reliance on potentially outdated documentation
- Immediate access to official sources
- **AI-ready structured data** for consistent interpretation

### 2. **Development Efficiency**
- Faster implementation with authoritative references
- Reduced debugging time from specification mismatches
- Clear validation of event structures
- **Cross-referenced documentation** showing relationships between concepts

### 3. **Code Quality**
- Ensures generated events follow current standards
- Validates tag formatting against official specs
- Maintains forward compatibility
- **Detailed examples** for proper implementation patterns

### 4. **Architecture Validation**
- Supports NDK-first architecture validation
- Ensures proper addressable event usage
- Validates relay interaction patterns
- **Comprehensive protocol documentation** beyond basic NIPs

### 5. **AI-Enhanced Development**
- **Structured for AI comprehension** following llms.txt specification
- **Programmatic access** via clean markdown endpoints
- **Consistent formatting** across all documentation
- **Up-to-date information** regularly maintained

## Activation Instructions

### For Cline/Claude Dev Users
1. **Restart VSCode** or reload the Claude Dev extension
2. **Verify connection** in MCP servers list
3. **Test with simple query**: `read_nips_index()`

### For GitHub Copilot Users
The MCP server will automatically be available for Copilot to use when asking Nostr-related questions.

## Troubleshooting

### Server Not Connected (Current Issue)
- ✅ Node.js is installed and working
- ✅ VSCode restarted
- ✅ `.vscode/mcp.json` configuration is correct
- ✅ Package installed globally: `npm install -g @nostrbook/mcp`
- ❌ **Issue**: Claude Dev extension not recognizing MCP server

### Possible Solutions to Try
1. **Reload Claude Dev Extension**: 
   - Open Command Palette (Cmd+Shift+P)
   - Run "Developer: Reload Window"
   - Or disable/re-enable Claude Dev extension

2. **Alternative MCP Configuration**:
   - Try using direct path to installed package
   - Check if Claude Dev supports this MCP format

3. **Manual Testing**:
   - Test package directly: `npx @nostrbook/mcp`
   - Verify package functionality outside of MCP

### Tool Execution Errors
- Verify internet connection (fetches from GitHub)
- Check if `npx` command is available
- Package is installed globally at: `/Users/danielwyler/.nvm/versions/node/v18.20.5/lib`

## Integration with Existing MCP Servers

This Nostr MCP server complements your existing servers:

- **repo-explorer**: Code patterns and examples
- **code-context-manager**: Change tracking
- **socratic-explorer**: Problem-solving
- **nostr**: Protocol compliance ← **NEW**

## Future Enhancements

### Potential Additions
- Custom NIP-101e validation tools
- Workout event template generators
- Compliance checking automation
- Integration with testing workflows

### Monitoring Usage
Track how often the tool helps with:
- NIP-101e compliance issues
- Event structure validation
- Tag formatting verification
- Protocol specification clarification

---

**Last Updated**: 2025-06-25
**Status**: Installed, connection troubleshooting needed
**Alternative Access**: Direct web_fetch to Nostrbook.dev markdown endpoints
**Next Steps**: 
1. Try reloading Claude Dev extension
2. Use web_fetch for immediate access to documentation
3. Test alternative MCP configuration
**Package Location**: `/Users/danielwyler/.nvm/versions/node/v18.20.5/lib/node_modules/@nostrbook/mcp`
**Nostrbook Homepage**: https://nostrbook.dev
**Direct Documentation**: https://nostrbook.dev/kinds/, https://nostrbook.dev/tags/, https://nostrbook.dev/protocol/
