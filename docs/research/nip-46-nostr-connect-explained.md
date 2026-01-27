# How NIP-46 Nostr Connect Works (Simple Explanation)

## The Big Picture

NIP-46 is like a secure walkie-talkie system that lets your phone (remote signer) talk to your web app over Nostr relays, so your web app never sees your private key.

## The Players

1. **Web App (POWR)** - "Client" - needs to sign events but doesn't have your private key
2. **Mobile Phone (Primal)** - "Remote Signer" - has your private key and can sign events
3. **Nostr Relays** - "The telephone network" - passes encrypted messages between them

## Step-by-Step: What SHOULD Happen

### Step 1: Web App Generates a "Session Key Pair"

```
Web App creates temporary keys just for this connection:
- Session Private Key: 6ef54bfb... (only web app knows this)
- Session Public Key: 6ef54bfb... (everyone can see this)
```

**Why?** This session key pair is used to encrypt messages between the web app and your phone. It's temporary and disposable.

### Step 2: Web App Creates the `nostrconnect://` URL

```
nostrconnect://6ef54bfb...?relay=wss://relay.damus.io&relay=wss://nos.lol&relay=wss://relay.primal.net&secret=ipe9mqa8nh
```

**Breaking it down:**
- `nostrconnect://` - Protocol (tells Primal "this is a remote signing request")
- `6ef54bfb...` - Session public key (so Primal knows who to talk to)
- `relay=...` - List of relays to use for communication
- `secret=ipe9mqa8nh` - One-time password (prevents connection hijacking)

**Why relays matter:** This is THE CRITICAL PART. Both the web app and Primal MUST be listening on the SAME relays, or they'll never hear each other!

### Step 3: Web App Subscribes to Relays, Waiting for Response

```
Web App → Relay 1: "Hey, I'm listening for messages to pubkey 6ef54bfb..."
Web App → Relay 2: "Hey, I'm listening for messages to pubkey 6ef54bfb..."
Web App → Relay 3: "Hey, I'm listening for messages to pubkey 6ef54bfb..."
```

The web app is now sitting there, waiting for Primal to send a "connect" response event.

### Step 4: You Scan QR Code with Primal

```
Primal reads the nostrconnect:// URL and extracts:
- Session pubkey to talk to: 6ef54bfb...
- Relays to use: relay.damus.io, nos.lol, relay.primal.net
- Secret to verify: ipe9mqa8nh
```

### Step 5: Primal Sends "Connect" Response (THIS IS THE HANDSHAKE!)

**This is where it's failing for us!**

Primal should create a NIP-46 "connect" response event:

```json
{
  "kind": 24133,  // NIP-46 response event
  "pubkey": "YOUR_REAL_NOSTR_PUBKEY",  // Primal's pubkey
  "content": "<encrypted-with-session-key>",  // NIP-44 encrypted message
  "tags": [
    ["p", "6ef54bfb..."]  // Addressed to web app's session pubkey
  ]
}
```

The content (encrypted) contains:
```json
{
  "id": "some-request-id",
  "result": "ipe9mqa8nh",  // The secret, confirming the connection
  "error": null
}
```

**Primal publishes this event to ALL the relays listed in the QR code.**

### Step 6: Web App Receives the Connect Response

```
Relay 1 → Web App: "Got an event for you! Kind 24133, from Primal's pubkey"
Relay 2 → Web App: "Got an event for you! Kind 24133, from Primal's pubkey"
Relay 3 → Web App: "Got an event for you! Kind 24133, from Primal's pubkey"
```

The web app:
1. Decrypts the content using its session private key
2. Checks that the secret matches ("ipe9mqa8nh")
3. Saves Primal's pubkey as the "remote signer"
4. **Connection established!** ✅

### Step 7: Future Signing Requests

Now when POWR needs to sign an event:

```
Web App → Relays → Primal: "Please sign this event: {kind: 1301, content: '...'}"
Primal → Relays → Web App: "Here's the signed event: {sig: '...'}"
```

All messages are encrypted with NIP-44 using the session keys.

## What We're Seeing (The Problem)

```
✅ Step 1: Session keys generated
✅ Step 2: nostrconnect:// URL created with correct relays
✅ Step 3: Web app subscribed to relays
✅ Step 4: Primal scanned QR code
🚨 Step 5: Primal SHOULD send connect response... but we never receive it
🚨 Step 6: blockUntilReady() hangs forever waiting
```

## Possible Failure Points

### 1. **Relay Mismatch**
```
Problem: Primal might be publishing to different relays than we're listening on
Solution: Verify network tab shows we're subscribed to all 3 relays
```

### 2. **Event Filtering Issue**
```
Problem: Our relay subscription filter might be wrong
Expected filter: { kinds: [24133], "#p": ["6ef54bfb..."] }
Solution: Check NDK subscription setup in network tab
```

### 3. **NDK Not Connected to Relays Yet**
```
Problem: blockUntilReady() called before NDK finished connecting to relays
Solution: Ensure NDK relay connections are fully established first
```

### 4. **Primal Not Publishing**
```
Problem: Primal might have an issue scanning our QR code format
Solution: Compare our URL format with working implementations
```

## How to Debug This

### 1. Check Network Tab (DevTools)

**What to look for:**
```
WebSocket connections to:
- wss://relay.damus.io
- wss://nos.lol  
- wss://relay.primal.net

Subscription messages sent:
["REQ", "some-id", {"kinds": [24133], "#p": ["6ef54bfb..."]}]

Expected response:
["EVENT", "some-id", {kind: 24133, pubkey: "...", tags: [["p", "6ef54bfb..."]]}]
```

### 2. Add Verbose Logging

```typescript
// Before blockUntilReady()
console.log('[NIP-46] Relay connections:', ndk.pool.relays.size);
console.log('[NIP-46] Connected relays:', 
  Array.from(ndk.pool.relays.values())
    .filter(r => r.status === 'connected')
    .map(r => r.url)
);

// Listen for ALL events on these relays
ndk.subscribe({kinds: [24133]}, {
  onEvent: (event) => {
    console.log('[NIP-46] Received event:', event);
  }
});
```

### 3. Manual Subscription Test

```typescript
// Instead of blockUntilReady(), manually subscribe
const sub = ndk.subscribe({
  kinds: [24133],
  "#p": [localSigner.user.pubkey]
}, {
  closeOnEose: false
});

sub.on('event', (event) => {
  console.log('[NIP-46] Got response event!', event);
  // Manually decrypt and process
});
```

## The Key Insight

**The handshake is just a Nostr event!**

If we're not seeing the connect response, it means:
1. Primal isn't publishing it, OR
2. We're not subscribed to the right relays/filters, OR
3. NDK isn't listening correctly

The solution is to trace the exact relay subscriptions NDK creates and verify they match what Primal expects.

---

**Next Step:** Add detailed logging to see exactly what NDK is doing when we call `blockUntilReady()`, and compare it with what the relays are actually receiving.
