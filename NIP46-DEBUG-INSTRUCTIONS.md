# NIP-46 Handshake Debugging Instructions

## Your Session Information

**Session Pubkey (from logs):**
```
6ef54bfb10db0cf95b470dd6810a0c31b397a7cf67327252b70ef73d35c2fe69
```

**QR Code URL Generated:**
```
nostrconnect://6ef54bfb10db0cf95b470dd6810a0c31b397a7cf67327252b70ef73d35c2fe69?relay=wss%3A%2F%2Frelay.damus.io&relay=wss%3A%2F%2Fnos.lol&relay=wss%3A%2F%2Frelay.primal.net&secret=ipe9mqa8nh&name=powr.build&url=http%3A%2F%2Flocalhost%3A3001&image=http%3A%2F%2Flocalhost%3A3001%2Ficon-192.png&perms=sign_event%3A1%2Csign_event%3A1301%2Csign_event%3A33401%2Csign_event%3A33402%2Csign_event%3A30003
```

**Configured Relays:**
- wss://relay.damus.io
- wss://nos.lol
- wss://relay.primal.net

---

## 🚀 Quick Start: Run the Debug Script

The automated script will check all relays and tell you exactly where the problem is:

```bash
./nip46-debug-session.sh
```

This script will:
1. ✅ Check if handshake events exist on your configured relays
2. 🔍 Check other common relays (in case Primal uses different ones)
3. ⏰ Check for recent activity (last 15 minutes)
4. 📊 Provide a clear summary with next steps

---

## 📡 Real-Time Monitoring (Watch While Scanning)

If you want to watch events come in **while** you scan the QR code, open a terminal and run:

### Method 1: Monitor nos.lol (Most Common)
```bash
echo '["REQ","watch",{"kinds":[24133],"#p":["6ef54bfb10db0cf95b470dd6810a0c31b397a7cf67327252b70ef73d35c2fe69"]}]' | websocat wss://nos.lol
```

Keep this terminal open, then scan the QR code with Primal. You'll see events appear instantly if Primal publishes to nos.lol.

### Method 2: Monitor All 3 Relays (Open 3 Terminals)

**Terminal 1 - nos.lol:**
```bash
echo '["REQ","watch-nos",{"kinds":[24133],"#p":["6ef54bfb10db0cf95b470dd6810a0c31b397a7cf67327252b70ef73d35c2fe69"]}]' | websocat wss://nos.lol
```

**Terminal 2 - relay.damus.io:**
```bash
echo '["REQ","watch-damus",{"kinds":[24133],"#p":["6ef54bfb10db0cf95b470dd6810a0c31b397a7cf67327252b70ef73d35c2fe69"]}]' | websocat wss://relay.damus.io
```

**Terminal 3 - relay.primal.net:**
```bash
echo '["REQ","watch-primal",{"kinds":[24133],"#p":["6ef54bfb10db0cf95b470dd6810a0c31b397a7cf67327252b70ef73d35c2fe69"]}]' | websocat wss://relay.primal.net
```

**Then scan your QR code and watch for events!**

---

## 🔍 Manual Debugging Commands

### Check Historical Events (After Scanning)

**Quick check on nos.lol:**
```bash
nak req -k 24133 --tag p=6ef54bfb10db0cf95b470dd6810a0c31b397a7cf67327252b70ef73d35c2fe69 wss://nos.lol | jq
```

**Check all 3 relays:**
```bash
nak req -k 24133 --tag p=6ef54bfb10db0cf95b470dd6810a0c31b397a7cf67327252b70ef73d35c2fe69 wss://relay.damus.io | jq
nak req -k 24133 --tag p=6ef54bfb10db0cf95b470dd6810a0c31b397a7cf67327252b70ef73d35c2fe69 wss://nos.lol | jq
nak req -k 24133 --tag p=6ef54bfb10db0cf95b470dd6810a0c31b397a7cf67327252b70ef73d35c2fe69 wss://relay.primal.net | jq
```

**Count events:**
```bash
nak req -k 24133 --tag p=6ef54bfb10db0cf95b470dd6810a0c31b397a7cf67327252b70ef73d35c2fe69 wss://nos.lol | jq -s 'length'
```

---

## 🎯 What Each Result Means

### ✅ If Events Found on Your Relays
```
✅ Found 1 event(s) on nos.lol
```
**Meaning**: Primal IS publishing, but NDK isn't receiving it.

**Next Steps**:
1. Add verbose logging to NDK subscription in `src/lib/auth/hooks.ts`
2. Verify NDK relay connections are established before `blockUntilReady()`
3. Check subscription filter matches: `{kinds: [24133], "#p": [SESSION_PUBKEY]}`
4. Review NDK Nip46Signer setup

### 🚨 If Events Found on DIFFERENT Relays
```
✅ Found 1 event(s) on wss://relay.nsec.app
❌ No events found on nos.lol
```
**Meaning**: Primal is ignoring your relay list and using its own defaults.

**Next Steps**:
1. Add `wss://relay.nsec.app` to your DEFAULT_RELAYS
2. Update QR code to include all relays Primal actually uses
3. Test again with updated relay list

### ❌ If No Events Found Anywhere
```
❌ No events found on nos.lol
❌ No events found on relay.damus.io
❌ No events found on relay.primal.net
```
**Meaning**: Primal never published the handshake event.

**Next Steps**:
1. Verify QR code scans successfully in Primal (check for error in app)
2. Try with different mobile signer (Amber, nsec.app)
3. Verify phone has internet connectivity
4. Check Primal app for known issues/required permissions

---

## 📋 Testing Workflow

### Step 1: Generate New QR Code
1. Refresh your app at http://localhost:3000
2. Click "Mobile Signer" authentication
3. Note the session pubkey from console logs

### Step 2: Start Monitoring (Optional)
```bash
# Keep this terminal open
echo '["REQ","watch",{"kinds":[24133],"#p":["6ef54bfb10db0cf95b470dd6810a0c31b397a7cf67327252b70ef73d35c2fe69"]}]' | websocat wss://nos.lol
```

### Step 3: Scan QR Code with Primal
- Open Primal iOS app
- Scan the QR code
- Watch the monitoring terminal for events

### Step 4: Run Debug Script
```bash
./nip46-debug-session.sh
```

### Step 5: Analyze Results
The script will tell you exactly where the problem is and provide specific next steps.

---

## 🔧 Quick Reference

**Session Pubkey:**
```
6ef54bfb10db0cf95b470dd6810a0c31b397a7cf67327252b70ef73d35c2fe69
```

**One-Line Event Check:**
```bash
nak req -k 24133 --tag p=6ef54bfb10db0cf95b470dd6810a0c31b397a7cf67327252b70ef73d35c2fe69 wss://nos.lol | jq -s 'if length == 0 then "❌ No events found" else "✅ Found \(length) event(s)" end'
```

**Real-Time Monitor:**
```bash
echo '["REQ","watch",{"kinds":[24133],"#p":["6ef54bfb10db0cf95b470dd6810a0c31b397a7cf67327252b70ef73d35c2fe69"]}]' | websocat wss://nos.lol
```

---

## 📚 Additional Resources

- **Full Task Doc**: `docs/tasks/ndk-authentication-migration-task.md`
- **NIP-46 Explanation**: `docs/research/nip-46-nostr-connect-explained.md`
- **NAK Debugging Guide**: `docs/research/nip-46-handshake-debugging-with-nak.md`
- **NIP-46 Spec**: https://github.com/nostr-protocol/nips/blob/master/46.md

---

## 🎉 Success Criteria

You'll know it's working when:
1. ✅ Real-time monitor shows event when you scan QR
2. ✅ Debug script finds events on your relays
3. ✅ `blockUntilReady()` completes successfully
4. ✅ Primal connection establishes and you can sign events

---

**Ready to debug!** Start with the automated script:
```bash
./nip46-debug-session.sh
```

This will immediately tell you whether Primal is publishing events or not, which determines your next steps.
