# Workout PWA - NDK Architecture Validation

A fitness tracking Progressive Web App built with Next.js and NDK (Nostr Development Kit) to validate NDK-first architecture patterns.

## 🎯 Primary Goal

**Architectural Hypothesis**: Can NDK IndexedDB cache + Nostr events completely replace custom database architecture for complex real-time applications?

This project serves as a proof-of-concept to validate whether we can eliminate the dual-database complexity in our existing golf and fitness apps by using a single NDK-first architecture.

## 📋 Key Documents

- **[Project Kickoff](./docs/project-kickoff.md)** - Complete project overview, goals, and development plan
- **[NIP-101e Specification](./docs/nip-101e-specification.md)** - Workout event specification for Nostr protocol

## 🏗️ Architecture

### Current Problem (Golf/Fitness Apps)
- Custom SQLite database for app data
- NDK SQLite cache for Nostr events  
- Complex field mapping between systems
- Manual sync logic and data duplication

### Proposed Solution (This Project)
- NDK IndexedDB cache as only persistence layer
- Nostr events (NIP-101e) as primary data model
- No custom database, no field mapping, no sync complexity
- XState machines for complex state management

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **State Management**: XState v5
- **Nostr Integration**: NDK browser packages
- **Styling**: Tailwind CSS
- **Caching**: NDKCacheAdapterDexie (IndexedDB)
- **Authentication**: NIP-07 browser extensions + private key fallback

## 📦 Core Dependencies

```bash
# Core NDK for web (not mobile)
npm install @nostr-dev-kit/ndk
npm install @nostr-dev-kit/ndk-cache-dexie

# State management
npm install xstate @xstate/react

# Utilities
npm install uuid @types/uuid
```

## 🎯 Success Metrics

- ✅ Complete workout flow: Template selection → Active tracking → Event publishing
- ✅ Offline functionality with automatic sync when online
- ✅ NIP-101e compliance for all workout events
- ✅ XState machines managing complex workout state
- ✅ Zero custom database code - All persistence via NDK cache
- ✅ Events as data model - No object-relational mapping needed

## 🔄 Workout Flow

```
Browse Templates (33402) → Setup Workout (XState) → Track Sets/Reps (XState) → Publish Record (1301)
```

## 📅 Development Phases

### Phase 1: Foundation (Days 1-3)
- Next.js + NDK setup, basic authentication
- NIP-101e event utilities, test publishing/reading
- XState machine adaptation from golf app patterns

### Phase 2: Core Workflow (Days 4-7)
- Active workout machine with timer
- Template browser UI
- Active workout interface
- Workout completion and publishing

### Phase 3: PWA Features (Days 8-10)
- Service worker setup, offline queue
- Error handling, loading states
- Testing, polish, deployment

## 🧪 NIP-101e Event Types

- **Kind 33401**: Exercise Templates (addressable events)
- **Kind 33402**: Workout Templates (addressable events)
- **Kind 1301**: Workout Records (standard events)

## 🌐 Relay Strategy

Using public relays for real-world testing:
- `wss://relay.damus.io` (reliable, fast)
- `wss://nos.lol` (good performance)
- `wss://relay.primal.net` (Nostr-native)

## 🎯 Success = Proof

If workout tracking works seamlessly with just NDK cache + events, then we can confidently refactor the golf app to eliminate database complexity.

## 📝 Development Status

- [x] NDK research and architecture planning
- [x] Technical stack decisions
- [x] Development phases defined
- [x] Project structure planned
- [ ] Project initialization
- [ ] NDK provider setup
- [ ] Basic authentication implementation

## 🔗 Related Projects

This project validates patterns for:
- **Golf App (Noga)**: React Native golf tracking with complex state
- **Fitness App (POWR)**: Existing fitness tracking application
- **Future Analytics**: Gamekeeper analytics backend integration

---

**Target MVP**: 10 days from start  
**Deployment**: Vercel (planned)  
**Monitoring**: Console logging + error boundaries (MVP)
