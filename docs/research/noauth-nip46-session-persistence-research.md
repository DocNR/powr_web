# Noauth NIP-46 Session Persistence Research

## Research Objective
Investigate how noauth (nsec.app) handles NIP-46 bunker session persistence and reconnection to solve auto-login hanging issues in POWR Workout PWA.

## Key Questions Being Researched
1. **Session Management & Persistence**: How does noauth handle session persistence across browser refreshes?
2. **NIP-46 Implementation Details**: How does noauth implement the NIP-46 `connect` and `disconnect` flows?
3. **Client Keypair Management**: How does noauth expect client keypairs to be reused across sessions?
4. **Error Handling & Timeouts**: What are the expected timeout behaviors for connection attempts?
5. **Auto-Login Best Practices**: Does noauth have recommended patterns for automatic reconnection?

## Research Findings

### 1. Connect Token System (Critical Discovery)

**Key Finding**: Noauth uses a sophisticated **connect token system** for session persistence.

#### Connect Token Structure
```typescript
interface DbConnectToken {
  token: string;      // Unique token identifier
  npub: string;       // User's public key
  timestamp: number;  // Creation timestamp
  expiry: number;     // Expiration timestamp
  subNpub?: string;   // Optional sub-key
}
```

#### Token Lifecycle Management
- **Creation**: Tokens are generated during initial connection
- **Storage**: Stored in IndexedDB (Dexie) and/or Prisma database
- **Expiration**: Tokens have TTL (Time To Live) - expired tokens are automatically cleaned up
- **Consumption**: Tokens are consumed (deleted) after successful connection

#### Critical Code Patterns
```typescript
// Token cleanup on startup (backend.ts:112)
for (const t of tokens) {
  if (t.timestamp < Date.now() - TOKEN_TTL) 
    await this.dbi.removeConnectToken(t.token)
}

// Token validation during connect (backend.ts:914)
const token = this.connectTokens.find((t) => t.token === secret)
if (!token || token.expiry < Date.now() || token.npub !== npub) {
  console.log('unknown token', secret)
  return [DECISION.IGNORE, undefined]
}
```

### 2. Connection State Management

#### App Connection Tracking
```typescript
// Check if app is already connected (backend.ts:903)
const connected = !!this.apps.find((a) => a.appNpub === appNpub)
if (!connected && method !== 'connect') {
  console.log('ignoring request before connect', method, id, appNpub, npub)
  return [DECISION.IGNORE, undefined]
}
```

**Key Insight**: Noauth maintains an in-memory list of connected apps. If an app isn't in this list, all non-connect requests are ignored.

#### Reconnection Handling
```typescript
// Reconnection logic (backend.ts:1210-1225)
let reconnected = false
const onDisconnect = () => {
  if (reconnected) return
  if (ndk.pool.connectedRelays().length > 0) return
  reconnected = true
  
  // Exponential backoff reconnection
  const bo = self.keys.find((k) => k.npub === npub)?.backoff || 1000
  setTimeout(() => {
    console.log('reconnect relays for key', npub, 'backoff', bo)
    for (const r of ndk.pool.relays.values()) r.disconnect()
    backend.handlers = {}
    // ... restart logic
  }, bo)
}
```

### 3. Session Persistence Patterns

#### Database Schema
```typescript
// Dexie schema (dbi-dexie.ts:23)
connectTokens: 'token,npub,timestamp,expiry,subNpub,[npub+subNpub]'

// Database operations
addConnectToken: async (r: DbConnectToken) => await db.connectTokens.add(r)
listConnectTokens: async () => await db.connectTokens.toArray()
removeConnectToken: async (token: string) => await db.connectTokens.delete(token)
```

#### Token-Based Auto-Login Flow
1. **Initial Connection**: Client generates connect token during first auth
2. **Token Storage**: Token stored in browser's IndexedDB
3. **Reconnection**: Client sends stored token with connect request
4. **Validation**: Server validates token (expiry, npub match)
5. **Success**: If valid, connection established without re-auth
6. **Failure**: If invalid/expired, full auth flow required

### 4. Client-Side Implementation Patterns

#### Connection Management (websocket.ts)
```typescript
public async connect(): Promise<boolean> {
  return new Promise((resolve) => {
    if (this.isConnected) return resolve(true)
    
    this.ws = new WebSocket(this.url)
    this.ws.onopen = () => {
      this.isConnected = true
      resolve(true)
    }
    
    this.ws.onerror = (error: Event) => {
      console.log('WebSocket connection error:', error)
      resolve(false)
      this.onClose && this.onClose()
    }
  })
}
```

#### NostrConnect Flow (useHandleNostrConnect.ts)
```typescript
const connect = async (npub: string, pubkey: string) => {
  const nostrconnect = `nostrconnect://${pubkey}${search}`
  const requestId = await client.nostrConnect(npub, nostrconnect, {
    appName: meta.appName,
    appUrl: meta.appUrl,
    appIcon: meta.appIcon,
    perms: meta.perms
  })
  
  if (!requestId) {
    return navigate(`/key/${npub}`, { replace: true })
  }
  
  navigate(`/key/${npub}?confirm-connect=true&reqId=${requestId}&popup=true`)
}
```

### 5. Error Handling & Timeout Patterns

#### Critical Timeout Values (DISCOVERED)
```typescript
// Connect token TTL (const.ts:4)
export const TOKEN_TTL = 600000 // 10 minutes

// Request TTL (consts.ts:10)  
export const REQ_TTL = 60000 // 1 min
```

#### Token Cleanup Logic
```typescript
// Cleanup expired tokens on startup (backend.ts:112)
if (t.timestamp < Date.now() - TOKEN_TTL) 
  await this.dbi.removeConnectToken(t.token)

// Cleanup expired pending requests (backend.ts:120)
if (p.timestamp < Date.now() - REQ_TTL) 
  await this.dbi.removePending(p.id)
```

#### Request Filtering by TTL
```typescript
// Client-side request filtering (useTriggerConfirmModal.ts:28)
const filteredPendingReqs = pending.filter((p) => 
  p.npub === npub && p.timestamp > Date.now() - REQ_TTL
)
```

#### Connection Timeout Handling
```typescript
// No explicit timeout in connect method - relies on WebSocket timeout
// Error handling focuses on connection state rather than timeouts

// Request deduplication (backend.ts:895)
// same reqs usually come on reconnects
if (this.doneReqIds.includes(id)) {
  console.log('request already done', id)
  return [DECISION.IGNORE, undefined]
}
```

#### Backoff Strategy
```typescript
// Exponential backoff for reconnections
const bo = self.keys.find((k) => k.npub === npub)?.backoff || 1000
// Backoff is reset on successful connection (backend.ts:1201)
```

## Critical Connect Method Implementation (DISCOVERED)

### **Connect Method Flow (backend.ts:911-920)**
```typescript
// Token validation during connect
if (method === 'connect') {
  if (params && params.length >= 2 && params[1]) {
    const secret = params[1]  // Connect token from client
    const token = this.connectTokens.find((t) => t.token === secret)
    
    if (!token || token.expiry < Date.now() || token.npub !== npub) {
      console.log('unknown token', secret)
      return [DECISION.IGNORE, undefined]
    }
    
    // Token is valid - proceed with connection
    subNpub = token.subNpub
  }
}
```

### **App Connection State Enforcement (backend.ts:903-907)**
```typescript
// Critical: Apps must be "connected" before processing any non-connect requests
const connected = !!this.apps.find((a) => a.appNpub === appNpub)
if (!connected && method !== 'connect') {
  console.log('ignoring request before connect', method, id, appNpub, npub)
  return [DECISION.IGNORE, undefined]
}
```

### **Connect Token Consumption (backend.ts:745-782)**
```typescript
// Token is consumed (deleted) after successful connect
if (method === 'connect') {
  const token = params && params.length >= 2 ? params[1] : ''
  
  // Consume the token even if app not allowed, reload
  if (token) {
    await this.dbi.removeConnectToken(token)
    this.connectTokens = await this.dbi.listConnectTokens()
  }
  
  // Add app to connected list on successful connect
  if (method === 'connect' && allow) {
    // App is now "connected" and can make other requests
  }
}
```

## Critical Insights for POWR Auto-Login Issue

### 1. **Missing Connect Token System**
**Problem**: Our current implementation doesn't use connect tokens for session persistence.
**Solution**: Implement connect token generation, storage, and validation.

### 2. **App Connection State Tracking**
**Problem**: We may not be properly tracking which apps are "connected" vs just authenticated.
**Solution**: Maintain connected app registry and validate connection state before processing requests.

### 3. **Token Consumption Pattern**
**Problem**: Connect tokens are single-use - they get deleted after first use.
**Solution**: Generate new tokens for each session, don't reuse old tokens.

### 4. **Request Deduplication**
**Problem**: Reconnection attempts may be sending duplicate requests.
**Solution**: Track completed request IDs to avoid processing duplicates.

### 5. **Proper Reconnection Flow**
**Problem**: Our auto-login may be hanging because we're not following the expected reconnection pattern.
**Solution**: Implement proper disconnect detection and backoff-based reconnection.

## Recommended Implementation Changes

### 1. Add Connect Token System
```typescript
interface ConnectToken {
  token: string;
  npub: string;
  appNpub: string;
  timestamp: number;
  expiry: number;
}

// Store in localStorage/IndexedDB
const storeConnectToken = (token: ConnectToken) => {
  localStorage.setItem(`connect_token_${token.appNpub}`, JSON.stringify(token));
}

const getConnectToken = (appNpub: string): ConnectToken | null => {
  const stored = localStorage.getItem(`connect_token_${appNpub}`);
  if (!stored) return null;
  
  const token = JSON.parse(stored);
  if (token.expiry < Date.now()) {
    localStorage.removeItem(`connect_token_${appNpub}`);
    return null;
  }
  
  return token;
}
```

### 2. Implement Connection State Tracking
```typescript
interface ConnectionState {
  isConnected: boolean;
  connectedApps: Set<string>;
  lastConnectTime: number;
  connectionToken?: string;
}

const connectionState: ConnectionState = {
  isConnected: false,
  connectedApps: new Set(),
  lastConnectTime: 0
};
```

### 3. Add Request Deduplication
```typescript
const completedRequests = new Set<string>();

const isRequestCompleted = (requestId: string): boolean => {
  return completedRequests.has(requestId);
}

const markRequestCompleted = (requestId: string): void => {
  completedRequests.add(requestId);
  // Clean up old requests periodically
  if (completedRequests.size > 1000) {
    // Keep only recent requests
  }
}
```

### 4. Implement Proper Auto-Login Flow
```typescript
const autoLogin = async (bunkerUrl: string): Promise<boolean> => {
  try {
    // 1. Check for existing connect token
    const token = getConnectToken(appNpub);
    if (!token) {
      console.log('No connect token found, full auth required');
      return false;
    }
    
    // 2. Attempt connection with token
    const connectParams = [appNpub, token.token];
    const result = await sendNip46Request('connect', connectParams);
    
    // 3. Handle response
    if (result.error) {
      console.log('Connect token invalid:', result.error);
      localStorage.removeItem(`connect_token_${appNpub}`);
      return false;
    }
    
    // 4. Mark as connected
    connectionState.isConnected = true;
    connectionState.connectedApps.add(appNpub);
    connectionState.lastConnectTime = Date.now();
    
    return true;
  } catch (error) {
    console.error('Auto-login failed:', error);
    return false;
  }
}
```

## Token Generation and Storage Flow (DISCOVERED)

### **Token Generation Process (backend.ts:1787-1800)**
```typescript
// Generate new connect token during nostrConnect flow
const t: DbConnectToken = {
  npub,
  subNpub,
  timestamp: Date.now(),
  expiry: Date.now() + TOKEN_TTL,  // 10 minutes from now
  token: bytesToHex(randomBytes(TOKEN_SIZE)),  // 16 bytes = 32 hex chars
}

await this.dbi.addConnectToken(t)
this.connectTokens = await this.dbi.listConnectTokens()
return t  // Token returned to client
```

### **Client-Side nostrConnect Flow (useHandleNostrConnect.ts:29)**
```typescript
// Client initiates connection and receives token
const requestId = await client.nostrConnect(npub, nostrconnect, {
  appName: meta.appName,
  appUrl: meta.appUrl,
  appIcon: meta.appIcon,
  perms: meta.perms
})

// This returns a requestId that leads to token generation
// Token is stored server-side and returned via auth flow
```

### **Complete Auto-Login Flow Pattern**
1. **Initial Connection**: Client calls `nostrConnect()` with app details
2. **Token Generation**: Server generates token with 10-minute expiry
3. **User Authorization**: User approves connection in noauth UI
4. **Token Return**: Server returns token to client via auth callback
5. **Token Storage**: Client stores token in localStorage/IndexedDB
6. **Reconnection**: Client sends stored token with connect request
7. **Token Validation**: Server validates token (expiry, npub match)
8. **Token Consumption**: Server deletes token after successful connect
9. **App Registration**: Server adds app to connected apps list

## Critical Discovery: Why Our Auto-Login Hangs

### **Root Cause Analysis**
Based on the noauth research, our auto-login is likely hanging because:

1. **Missing Connect Token**: We're not implementing the connect token system
2. **No App Registration**: We're not tracking "connected" app state
3. **Invalid Reconnection Pattern**: We're trying to reuse old connections instead of proper token flow
4. **Timeout Mismatch**: Our timeouts don't match noauth's expectations (10min token TTL, 1min request TTL)

### **The Fix: Implement Proper Token Flow**
```typescript
// 1. Store token after successful initial auth
const storeConnectToken = (token: string, npub: string, appNpub: string) => {
  const connectToken = {
    token,
    npub,
    appNpub,
    timestamp: Date.now(),
    expiry: Date.now() + (10 * 60 * 1000) // 10 minutes
  }
  localStorage.setItem(`connect_token_${appNpub}`, JSON.stringify(connectToken))
}

// 2. Use token for auto-login
const autoLogin = async (bunkerUrl: string) => {
  const stored = localStorage.getItem(`connect_token_${appNpub}`)
  if (!stored) return false
  
  const connectToken = JSON.parse(stored)
  if (connectToken.expiry < Date.now()) {
    localStorage.removeItem(`connect_token_${appNpub}`)
    return false
  }
  
  // Send connect request with stored token
  const result = await sendNip46Request('connect', [appNpub, connectToken.token])
  
  if (result.error) {
    // Token invalid/expired - remove and require fresh auth
    localStorage.removeItem(`connect_token_${appNpub}`)
    return false
  }
  
  return true
}
```

## Follow-up Research Questions

### 1. **Does nsec.app support persistent nostrconnect:// URIs?**

**Answer: YES** - nsec.app fully supports persistent nostrconnect:// URIs through its connect token system.

**Key Findings:**
- **URI Format**: `nostrconnect://${pubkey}${search}` where search contains app metadata
- **URI Processing**: URIs are parsed to extract pubkey and metadata (useHandleNostrConnect.ts:28)
- **Persistence Mechanism**: URIs work with connect tokens for session persistence
- **QR Code Support**: Built-in QR scanner validates nostrconnect:// format (useQrReader.ts:37)

```typescript
// URI construction pattern (useHandleNostrConnect.ts:28)
const nostrconnect = `nostrconnect://${pubkey}${search}`
const requestId = await client.nostrConnect(npub, nostrconnect, {
  appName: meta.appName,
  appUrl: meta.appUrl,
  appIcon: meta.appIcon,
  perms: meta.perms
})
```

### 2. **Can the same client keypair be reused across sessions?**

**Answer: YES** - Client keypairs can and should be reused across sessions for persistent app identity.

**Key Findings:**
- **App Identity**: Client keypair (appNpub) serves as persistent app identifier
- **Connection Tracking**: Apps are tracked by appNpub in connected apps list (backend.ts:903)
- **Session Validation**: Same appNpub can reconnect using stored connect tokens
- **No Keypair Rotation**: No evidence of forced keypair rotation - same keypair expected

```typescript
// App connection validation by keypair (backend.ts:903)
const connected = !!this.apps.find((a) => a.appNpub === appNpub)
if (!connected && method !== 'connect') {
  console.log('ignoring request before connect', method, id, appNpub, npub)
  return [DECISION.IGNORE, undefined]
}
```

### 3. **How does nsec.app handle reconnection with the same URI?**

**Answer: TOKEN-BASED RECONNECTION** - nsec.app uses connect tokens for seamless reconnection without re-authorization.

**Key Findings:**
- **Reconnection Detection**: "same reqs usually come on reconnects" (backend.ts:895)
- **Request Deduplication**: Completed request IDs are tracked to prevent duplicate processing
- **Automatic Reconnection**: Built-in reconnection logic with exponential backoff (backend.ts:1210-1225)
- **Token Revalidation**: Stored connect tokens enable reconnection without user interaction

```typescript
// Reconnection handling (backend.ts:895-898)
// same reqs usually come on reconnects
if (this.doneReqIds.includes(id)) {
  console.log('request already done', id)
  // FIXME maybe repeat the reply, but without the Notification?
  return [DECISION.IGNORE, undefined]
}

// Automatic reconnection with backoff (backend.ts:1210-1225)
let reconnected = false
const onDisconnect = () => {
  if (reconnected) return
  if (ndk.pool.connectedRelays().length > 0) return
  reconnected = true
  
  const bo = self.keys.find((k) => k.npub === npub)?.backoff || 1000
  setTimeout(() => {
    console.log('reconnect relays for key', npub, 'backoff', bo)
    for (const r of ndk.pool.relays.values()) r.disconnect()
    backend.handlers = {}
    // ... restart connection
  }, bo)
}
```

**Reconnection Flow:**
1. **Connection Lost**: WebSocket disconnect detected
2. **Backoff Delay**: Exponential backoff before reconnection attempt
3. **Token Validation**: Stored connect token used for automatic reconnection
4. **Request Deduplication**: Previous requests ignored to prevent duplicates
5. **Session Restoration**: App returns to connected state without user interaction

## Critical Implementation Insights

### **URI Persistence Strategy**
- **Store Complete URI**: Save full nostrconnect:// URI including metadata
- **Reuse Same Client Keypair**: Don't generate new keypairs per session
- **Token-Based Auth**: Use connect tokens for automatic reconnection
- **Handle Disconnections**: Implement proper reconnection with backoff

### **Session Management Best Practices**
- **Persistent App Identity**: Same appNpub across all sessions
- **Connect Token Storage**: Store tokens with proper TTL (10 minutes)
- **Request Deduplication**: Track completed requests to prevent duplicates
- **Graceful Reconnection**: Handle network issues with automatic retry

### **Why Our Auto-Login Hangs - Complete Picture**
1. **Missing URI Persistence**: We're not storing the complete nostrconnect:// URI
2. **No Client Keypair Reuse**: We may be generating new keypairs per session
3. **Missing Token System**: We're not implementing the connect token flow
4. **No Reconnection Logic**: We're not handling disconnections properly
5. **Request Duplication**: We may be sending duplicate requests on reconnect

## Next Research Steps

✅ **COMPLETE**: Token generation and storage patterns
✅ **COMPLETE**: Connect method implementation details  
✅ **COMPLETE**: App connection state tracking
✅ **COMPLETE**: Timeout values and cleanup logic
✅ **COMPLETE**: Error handling patterns
✅ **COMPLETE**: Persistent URI support validation
✅ **COMPLETE**: Client keypair reuse patterns
✅ **COMPLETE**: Reconnection handling mechanisms

## Implementation Priority

**HIGH PRIORITY** (Fixes auto-login hanging):
1. Implement connect token storage and retrieval
2. Add proper token validation in auto-login flow
3. Handle token expiry and cleanup
4. Track app connection state

**MEDIUM PRIORITY** (Improves reliability):
5. Add request deduplication
6. Implement proper timeout handling
7. Add exponential backoff for reconnections

**LOW PRIORITY** (Nice to have):
8. Enhanced error messages
9. Connection state debugging
10. Performance optimizations

---

**Research Status**: In Progress
**Last Updated**: 2025-08-02
**Key Discovery**: Connect token system is critical for session persistence
