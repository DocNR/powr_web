# NIP-46 Handshake Debugging with NAK

## Purpose
Use NAK and websocat to verify if Primal (or other mobile signers) are actually publishing NIP-46 handshake events to the relays we specify in the QR code.

## The Event We're Looking For

### NIP-46 Response Event Structure
```json
{
  "kind": 24133,  // NIP-46 response event (defined in NIP-46 spec)
  "pubkey": "PRIMAL_USER_PUBKEY",  // Your real Nostr pubkey (from Primal)
  "content": "<encrypted>",  // NIP-44 encrypted handshake response
  "tags": [
    ["p", "6ef54bfb..."]  // Session pubkey (from our QR code)
  ],
  "created_at": 1706454123,
  "id": "...",
  "sig": "..."
}
```

## Real-Time Monitoring (During QR Scan)

### Method 1: Monitor Specific Session Pubkey (RECOMMENDED)

**When to use**: While scanning QR code, monitor for responses to YOUR session pubkey

```bash
# From your logs, extract the session pubkey (the long hex after nostrconnect://)
# Example: nostrconnect://6ef54bfb10db0cf95b470dd6810a0c31b397a7cf...
SESSION_PUBKEY="6ef54bfb10db0cf95b470dd6810a0c31b397a7cf67327252b70ef73d35c2fe69"

# Monitor for handshake responses on nos.lol
echo '["REQ","nip46-test",{"kinds":[24133],"#p":["'$SESSION_PUBKEY'"]}]' | websocat wss://nos.lol

# Monitor across ALL our relays (open 3 terminals):
echo '["REQ","nip46-test",{"kinds":[24133],"#p":["'$SESSION_PUBKEY'"]}]' | websocat wss://relay.damus.io
echo '["REQ","nip46-test",{"kinds":[24133],"#p":["'$SESSION_PUBKEY'"]}]' | websocat wss://nos.lol
echo '["REQ","nip46-test",{"kinds":[24133],"#p":["'$SESSION_PUBKEY'"]}]' | websocat wss://relay.primal.net
```

**What you should see when Primal scans**:
```json
["EVENT","nip46-test",{
  "kind":24133,
  "pubkey":"YOUR_REAL_NOSTR_PUBKEY",
  "content":"<encrypted-data>",
  "tags":[["p","6ef54bfb..."]],
  "created_at":1706454123,
  "id":"abc123...",
  "sig":"..."
}]
["EOSE","nip46-test"]
```

**If you see nothing**: Primal isn't publishing to those relays!

### Method 2: Monitor ALL Kind 24133 Events (Broader)

**When to use**: Check if ANY NIP-46 events are being published (debug relay connectivity)

```bash
# Monitor all NIP-46 events on nos.lol
echo '["REQ","nip46-all",{"kinds":[24133],"limit":10}]' | websocat wss://nos.lol

# With timestamp (only recent events)
FIVE_MINUTES_AGO=$(($(date +%s) - 300))
echo '["REQ","nip46-recent",{"kinds":[24133],"since":'$FIVE_MINUTES_AGO'}]' | websocat wss://nos.lol
```

## Historical Event Checking (After QR Scan)

### Method 3: Search for Events by Session Pubkey (NAK)

**When to use**: After scanning QR, check if the handshake event was published

```bash
# Your session pubkey from the QR code
SESSION_PUBKEY="6ef54bfb10db0cf95b470dd6810a0c31b397a7cf67327252b70ef73d35c2fe69"

# Check nos.lol for any events addressed to your session
nak req -k 24133 --tag p=$SESSION_PUBKEY wss://nos.lol

# Check all 3 relays
nak req -k 24133 --tag p=$SESSION_PUBKEY wss://relay.damus.io | jq
nak req -k 24133 --tag p=$SESSION_PUBKEY wss://nos.lol | jq
nak req -k 24133 --tag p=$SESSION_PUBKEY wss://relay.primal.net | jq
```

### Method 4: Search by Your Real Nostr Pubkey (Find All Your NIP-46 Activity)

**When to use**: Check if Primal has EVER published NIP-46 events for you

```bash
# Your real Nostr pubkey (from Primal app)
YOUR_PUBKEY="abc123..."  # Replace with your actual pubkey

# Find all NIP-46 events you've published
nak req -k 24133 -a $YOUR_PUBKEY wss://nos.lol | jq

# Count how many NIP-46 events you've sent
nak req -k 24133 -a $YOUR_PUBKEY wss://nos.lol | jq -s 'length'

# Show recent events with timestamps
nak req -k 24133 -a $YOUR_PUBKEY wss://nos.lol | jq -s 'sort_by(.created_at) | reverse | .[0:5]'
```

## Debugging Workflow

### Step 1: Setup Real-Time Monitoring

**Before scanning QR code:**

1. Extract session pubkey from console logs:
```
[NIP-46 Login] 🔍 FULL QR CODE URL: nostrconnect://6ef54bfb10db...
```

2. Start monitoring (keep terminal open):
```bash
SESSION_PUBKEY="6ef54bfb10db0cf95b470dd6810a0c31b397a7cf67327252b70ef73d35c2fe69"
echo '["REQ","watch",{"kinds":[24133],"#p":["'$SESSION_PUBKEY'"]}]' | websocat wss://nos.lol
```

3. Scan QR code with Primal
4. Watch terminal for events

### Step 2: Check Historical Events

**After scanning (if no events seen):**

```bash
# Check last 5 minutes of activity
FIVE_MIN_AGO=$(($(date +%s) - 300))
nak req -k 24133 --tag p=$SESSION_PUBKEY wss://nos.lol | jq 'select(.created_at > '$FIVE_MIN_AGO')'

# Broader search: all events to your session in last hour
ONE_HOUR_AGO=$(($(date +%s) - 3600))
nak req -k 24133 --tag p=$SESSION_PUBKEY wss://nos.lol | jq 'select(.created_at > '$ONE_HOUR_AGO')'
```

### Step 3: Cross-Relay Verification

**Check if the event exists on OTHER relays:**

```bash
# Maybe Primal publishes to different relays?
for relay in "wss://relay.nsec.app" "wss://relay.snort.social" "wss://relay.nostr.band"; do
  echo "Checking $relay..."
  nak req -k 24133 --tag p=$SESSION_PUBKEY $relay | jq -c 'select(.id) | {relay: "'$relay'", found: true}'
done
```

### Step 4: Verify Relay Connectivity

**Make sure the relays are actually working:**

```bash
# Test relay with a known event kind (kind 0 profile events are common)
echo '["REQ","test",{"kinds":[0],"limit":1}]' | timeout 5 websocat wss://nos.lol

# Should see at least one profile event, proving relay works
```

## What Different Results Mean

### ✅ Event Found on Our Relays
```bash
nak req -k 24133 --tag p=$SESSION_PUBKEY wss://nos.lol | jq
# Output: {"kind":24133,"pubkey":"...","tags":[["p","6ef54bfb..."]]...}
```
**Meaning**: Primal IS publishing, but our app isn't receiving it. Problem is in our NDK subscription setup.

### 🚨 Event Found on DIFFERENT Relays
```bash
nak req -k 24133 --tag p=$SESSION_PUBKEY wss://relay.nsec.app | jq
# Output: {"kind":24133,"pubkey":"...","tags":[["p","6ef54bfb..."]]...}
```
**Meaning**: Primal is ignoring our relay list in the QR code and using its own defaults. Need to investigate Primal's relay selection logic.

### ❌ No Event Found Anywhere
```bash
nak req -k 24133 --tag p=$SESSION_PUBKEY wss://nos.lol | jq
nak req -k 24133 --tag p=$SESSION_PUBKEY wss://relay.nsec.app | jq
# Both return: (no output)
```
**Meaning**: Primal never published a handshake event. Possible causes:
- QR code format is wrong
- Primal doesn't recognize our `nostrconnect://` format
- Primal has a bug
- Connection timeout before Primal could respond

## Example Debug Session

```bash
# 1. Extract session pubkey from logs
SESSION="6ef54bfb10db0cf95b470dd6810a0c31b397a7cf67327252b70ef73d35c2fe69"

# 2. Monitor in real-time (Terminal 1)
echo '["REQ","watch",{"kinds":[24133],"#p":["'$SESSION'"]}]' | websocat wss://nos.lol

# 3. Scan QR with Primal (watch Terminal 1 for events)

# 4. If nothing received, check history across all relays (Terminal 2)
echo "=== Checking nos.lol ==="
nak req -k 24133 --tag p=$SESSION wss://nos.lol | jq -c '{relay:"nos.lol",id:.id,created:(.created_at|todate)}'

echo "=== Checking relay.damus.io ==="
nak req -k 24133 --tag p=$SESSION wss://relay.damus.io | jq -c '{relay:"damus",id:.id,created:(.created_at|todate)}'

echo "=== Checking relay.primal.net ==="
nak req -k 24133 --tag p=$SESSION wss://relay.primal.net | jq -c '{relay:"primal",id:.id,created:(.created_at|todate)}'

# 5. Check Primal's default relay (just in case)
echo "=== Checking relay.nsec.app (nsec.app's default) ==="
nak req -k 24133 --tag p=$SESSION wss://relay.nsec.app | jq -c '{relay:"nsec.app",id:.id,created:(.created_at|todate)}'
```

## Quick Reference Commands

### Copy-Paste Monitoring Setup
```bash
# Replace SESSION_PUBKEY with actual value from your logs
SESSION_PUBKEY="PASTE_YOUR_SESSION_PUBKEY_HERE"

# Monitor nos.lol (most common)
echo '["REQ","watch",{"kinds":[24133],"#p":["'$SESSION_PUBKEY'"]}]' | websocat wss://nos.lol

# After scan, check if event exists
nak req -k 24133 --tag p=$SESSION_PUBKEY wss://nos.lol | jq

# Check event count
nak req -k 24133 --tag p=$SESSION_PUBKEY wss://nos.lol | jq -s 'length'
```

### Multi-Relay Check Script
```bash
#!/bin/bash
SESSION="$1"
if [ -z "$SESSION" ]; then
  echo "Usage: $0 <session-pubkey>"
  exit 1
fi

echo "Checking NIP-46 handshake for session: $SESSION"
echo ""

for relay in "wss://relay.damus.io" "wss://nos.lol" "wss://relay.primal.net" "wss://relay.nsec.app"; do
  echo "=== Checking $relay ==="
  count=$(nak req -k 24133 --tag p=$SESSION $relay 2>/dev/null | jq -s 'length')
  if [ "$count" = "0" ]; then
    echo "❌ No events found"
  else
    echo "✅ Found $count event(s)"
    nak req -k 24133 --tag p=$SESSION $relay | jq -c '{created:(.created_at|todate),from:.pubkey[:16]}'
  fi
  echo ""
done
```

Save as `check-nip46-handshake.sh`, then:
```bash
chmod +x check-nip46-handshake.sh
./check-nip46-handshake.sh 6ef54bfb10db0cf95b470dd6810a0c31b397a7cf67327252b70ef73d35c2fe69
```

## Next Steps Based on Results

### If Event Found on Our Relays
➡️ Problem is in our NDK subscription setup
- Add logging to NDK subscription creation
- Verify filter: `{kinds: [24133], "#p": [SESSION_PUBKEY]}`
- Check if NDK relay connections are established before `blockUntilReady()`

### If Event Found on Different Relays
➡️ Primal is using different relays than specified
- Document which relays Primal actually uses
- Either add those relays to our list OR
- Investigate why Primal ignores relay params in QR code

### If No Event Found Anywhere
➡️ Primal isn't publishing at all
- Verify QR code format matches NIP-46 spec exactly
- Test with different mobile signer (nsec.app, Amber)
- Check Primal app logs/support for known issues

---

**Key Takeaway**: The handshake is just a Nostr event! If NAK can't find it, it was never published. This immediately tells us whether the problem is on Primal's side (not publishing) or our side (not receiving).
