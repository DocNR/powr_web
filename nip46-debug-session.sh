#!/bin/bash
# NIP-46 Handshake Debugging Script
# Session from localhost-1769446966085.log

# ============================================
# SESSION INFORMATION
# ============================================
SESSION_PUBKEY="6ef54bfb10db0cf95b470dd6810a0c31b397a7cf67327252b70ef73d35c2fe69"

echo "======================================"
echo "NIP-46 HANDSHAKE DEBUGGING"
echo "======================================"
echo "Session Pubkey: $SESSION_PUBKEY"
echo ""
echo "RELAYS CONFIGURED:"
echo "  - wss://relay.damus.io"
echo "  - wss://nos.lol"
echo "  - wss://relay.primal.net"
echo ""

# ============================================
# STEP 1: CHECK HISTORICAL EVENTS
# ============================================
echo "======================================"
echo "STEP 1: Checking for Historical Events"
echo "======================================"
echo ""

echo "Checking nos.lol..."
NOS_RESULT=$(nak req -k 24133 --tag p=$SESSION_PUBKEY wss://nos.lol 2>/dev/null | jq -s 'length')
if [ "$NOS_RESULT" = "0" ]; then
  echo "❌ No events found on nos.lol"
else
  echo "✅ Found $NOS_RESULT event(s) on nos.lol"
  nak req -k 24133 --tag p=$SESSION_PUBKEY wss://nos.lol | jq -c '{created:(.created_at|todate),from:.pubkey[:16]}'
fi
echo ""

echo "Checking relay.damus.io..."
DAMUS_RESULT=$(nak req -k 24133 --tag p=$SESSION_PUBKEY wss://relay.damus.io 2>/dev/null | jq -s 'length')
if [ "$DAMUS_RESULT" = "0" ]; then
  echo "❌ No events found on relay.damus.io"
else
  echo "✅ Found $DAMUS_RESULT event(s) on relay.damus.io"
  nak req -k 24133 --tag p=$SESSION_PUBKEY wss://relay.damus.io | jq -c '{created:(.created_at|todate),from:.pubkey[:16]}'
fi
echo ""

echo "Checking relay.primal.net..."
PRIMAL_RESULT=$(nak req -k 24133 --tag p=$SESSION_PUBKEY wss://relay.primal.net 2>/dev/null | jq -s 'length')
if [ "$PRIMAL_RESULT" = "0" ]; then
  echo "❌ No events found on relay.primal.net"
else
  echo "✅ Found $PRIMAL_RESULT event(s) on relay.primal.net"
  nak req -k 24133 --tag p=$SESSION_PUBKEY wss://relay.primal.net | jq -c '{created:(.created_at|todate),from:.pubkey[:16]}'
fi
echo ""

# ============================================
# STEP 2: CHECK OTHER COMMON RELAYS
# ============================================
echo "======================================"
echo "STEP 2: Checking Other Common Relays"
echo "======================================"
echo "(In case Primal uses different relays)"
echo ""

for relay in "wss://relay.nsec.app" "wss://relay.snort.social" "wss://relay.nostr.band"; do
  echo "Checking $relay..."
  result=$(nak req -k 24133 --tag p=$SESSION_PUBKEY $relay 2>/dev/null | jq -s 'length')
  if [ "$result" = "0" ]; then
    echo "  ❌ No events found"
  else
    echo "  ✅ Found $result event(s)"
    nak req -k 24133 --tag p=$SESSION_PUBKEY $relay | jq -c '{relay: "'$relay'", created:(.created_at|todate), from:.pubkey[:16]}'
  fi
  echo ""
done

# ============================================
# STEP 3: RECENT ACTIVITY CHECK
# ============================================
echo "======================================"
echo "STEP 3: Recent Activity (Last 15 min)"
echo "======================================"
echo ""

FIFTEEN_MIN_AGO=$(($(date +%s) - 900))

echo "Checking nos.lol for recent events..."
nak req -k 24133 --tag p=$SESSION_PUBKEY wss://nos.lol 2>/dev/null | jq -s --arg since "$FIFTEEN_MIN_AGO" '
  map(select(.created_at > ($since | tonumber))) | 
  length as $count | 
  if $count == 0 then 
    "❌ No recent events (last 15 minutes)" 
  else 
    "✅ Found \($count) event(s) in last 15 minutes"
  end'

# ============================================
# SUMMARY
# ============================================
echo ""
echo "======================================"
echo "SUMMARY"
echo "======================================"

TOTAL=$((NOS_RESULT + DAMUS_RESULT + PRIMAL_RESULT))

if [ "$TOTAL" = "0" ]; then
  echo ""
  echo "🚨 NO HANDSHAKE EVENTS FOUND ANYWHERE"
  echo ""
  echo "This means:"
  echo "  1. Primal iOS is NOT publishing the handshake event"
  echo "  2. OR the QR code format is incorrect"
  echo "  3. OR Primal has connectivity issues"
  echo ""
  echo "NEXT STEPS:"
  echo "  - Verify QR code scans successfully in Primal"
  echo "  - Check Primal app for error messages"
  echo "  - Try with a different mobile signer (Amber, nsec.app)"
  echo "  - Verify your phone has internet connectivity"
  echo ""
else
  echo ""
  echo "✅ HANDSHAKE EVENT(S) FOUND!"
  echo ""
  echo "Total events across our relays: $TOTAL"
  echo ""
  echo "This means:"
  echo "  1. Primal IS publishing the handshake"
  echo "  2. The problem is in our NDK subscription setup"
  echo "  3. NDK is not receiving/processing the event"
  echo ""
  echo "NEXT STEPS:"
  echo "  - Add verbose logging to NDK subscription creation"
  echo "  - Verify NDK is connected to relays before blockUntilReady()"
  echo "  - Check subscription filter matches: {kinds: [24133], #p: [session_pubkey]}"
  echo "  - Review src/lib/auth/hooks.ts NIP-46 signer setup"
  echo ""
fi

echo "Full event details available with:"
echo "  nak req -k 24133 --tag p=$SESSION_PUBKEY wss://nos.lol | jq"
echo ""
