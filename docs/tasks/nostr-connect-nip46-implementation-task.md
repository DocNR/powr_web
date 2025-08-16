# Nostr Connect (NIP-46) Implementation Task

## Objective
Implement Nostr Connect (NIP-46) remote signing functionality in the POWR Workout PWA to provide a more reliable and persistent authentication method compared to bunker connections, enabling users to authenticate through remote signers while maintaining session persistence.

## Current State Analysis
- **Existing Authentication**: Currently supports NIP-07 browser extensions and private key fallback
- **Bunker Issues**: Previous attempts at bunker connection persistence have failed
- **NDK Integration**: Already using NDK with proper singleton pattern and authentication architecture
- **Security Patterns**: Web-specific security patterns already established in `.clinerules/web-private-key-security.md`

## Technical Approach

### NIP-46 vs Bunker Connection
**Nostr Connect (NIP-46) Benefits**:
- **Client-Initiated**: App generates `nostrconnect://` URI for user to share with remote signer
- **Better Persistence**: Connection state managed by both client and remote signer
- **Standardized Protocol**: Uses kind 24133 events for RPC communication
- **Session Recovery**: Can restore sessions using stored local signer keys

**Implementation Strategy**:
- Use NDK's `NDKNip46Signer.nostrconnect()` method instead of bunker flow
- Implement proper session persistence using encrypted local storage
- Add UI for displaying `nostrconnect://` URIs to users
- Handle connection lifecycle and error states

## Implementation Steps

### Phase 1: Core NIP-46 Integration
1. [ ] **Add NIP-46 Dependencies**
   - Verify NDK NIP-46 imports are available
   - Add necessary types and interfaces
   - Update authentication atoms to support NIP-46 state

2. [ ] **Create Nostr Connect Authentication Service**
   - Implement `NostrConnectAuthService` following service layer patterns
   - Generate and manage `nostrconnect://` URIs
   - Handle connection establishment and user discovery
   - Implement session persistence with encrypted storage

3. [ ] **Update Authentication Hooks**
   - Extend `useAuth` hook to support Nostr Connect flow
   - Add `useNostrConnect` hook for connection management
   - Implement connection state management (connecting, connected, error)

### Phase 2: UI Components and User Experience
4. [ ] **Create Nostr Connect UI Components**
   - `NostrConnectModal` - Display connection URI and QR code
   - `NostrConnectStatus` - Show connection state and user info
   - `NostrConnectSetup` - Guide users through connection process
   - Follow `.clinerules/radix-ui-component-library.md` patterns

5. [ ] **Integrate with Authentication Flow**
   - Add Nostr Connect option to login/auth screens
   - Implement connection timeout and retry logic
   - Add proper error handling and user feedback
   - Ensure mobile-friendly QR code display

### Phase 3: Session Management and Persistence
6. [ ] **Implement Session Persistence**
   - Store encrypted local signer keys following security patterns
   - Implement session restoration on app reload
   - Handle connection recovery after network interruptions
   - Add session cleanup on logout

7. [ ] **Connection Lifecycle Management**
   - Handle remote signer disconnection gracefully
   - Implement automatic reconnection attempts
   - Add connection health monitoring
   - Provide clear user feedback for connection states

### Phase 4: Integration with Existing Architecture
8. [ ] **Update NDK Provider**
   - Integrate NIP-46 signer with existing NDK singleton
   - Ensure compatibility with Global NDK Actor pattern
   - Maintain existing NIP-07 and private key fallback options
   - Follow `.clinerules/web-ndk-actor-integration.md` patterns

9. [ ] **Testing and Validation**
   - Test connection establishment and persistence
   - Verify event signing works correctly
   - Test session recovery across browser restarts
   - Validate security patterns compliance

## Success Criteria
- [ ] **Connection Establishment**: Users can successfully connect to remote signers using `nostrconnect://` URIs
- [ ] **Session Persistence**: Connections survive browser restarts and network interruptions
- [ ] **Event Signing**: All Nostr events (workout records, templates) sign correctly through remote signer
- [ ] **User Experience**: Clear UI feedback for connection states and error handling
- [ ] **Security Compliance**: All patterns follow `.clinerules/web-private-key-security.md` requirements
- [ ] **Architecture Integration**: Works seamlessly with existing NDK singleton and authentication patterns

## Technical Implementation Details

### Nostr Connect Service Architecture
```typescript
// Service handles business logic only - no NDK operations
export class NostrConnectAuthService {
  generateConnectionUri(options?: NostrConnectOptions): string
  validateConnectionResponse(response: NDKRpcResponse): boolean
  encryptAndStoreSession(localSigner: NDKPrivateKeySigner): Promise<void>
  restoreSession(): Promise<NDKPrivateKeySigner | null>
  clearSession(): Promise<void>
}
```

### Authentication Hook Integration
```typescript
// Extend existing auth patterns
export function useNostrConnect() {
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [connectionUri, setConnectionUri] = useState<string | null>(null)
  const [connectedUser, setConnectedUser] = useState<NDKUser | null>(null)
  
  const initiateConnection = useCallback(async (options?: NostrConnectOptions) => {
    // Generate nostrconnect:// URI and wait for remote signer response
  }, [])
  
  const disconnect = useCallback(async () => {
    // Clean up connection and clear stored session
  }, [])
  
  return { connectionState, connectionUri, connectedUser, initiateConnection, disconnect }
}
```

### UI Component Structure
```typescript
// Follow POWR UI component patterns
const NostrConnectModal = ({ isOpen, onClose }: NostrConnectModalProps) => {
  const { connectionUri, connectionState, initiateConnection } = useNostrConnect()
  
  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Connect Remote Signer</ModalTitle>
        </ModalHeader>
        <div className="space-y-4">
          {connectionUri && (
            <div className="text-center">
              <QRCodeDisplay value={connectionUri} />
              <p className="text-sm text-gray-600 mt-2">
                Scan this QR code with your Nostr signer app
              </p>
            </div>
          )}
          <ConnectionStatus state={connectionState} />
        </div>
      </ModalContent>
    </Modal>
  )
}
```

## References

### Required .clinerules Review
- **`.clinerules/web-private-key-security.md`** - Security patterns for key storage and encryption
- **`.clinerules/web-ndk-actor-integration.md`** - NDK integration patterns for web
- **`.clinerules/service-layer-architecture.md`** - Service layer patterns for business logic
- **`.clinerules/radix-ui-component-library.md`** - UI component standards

### NDK Documentation References
- **NIP-46 Specification**: Reviewed via Nostr MCP tool
- **NDK NIP-46 Implementation**: `ndk-core/src/signers/nip46/index.ts`
- **Nostr Connect URI Generation**: `ndk-core/src/signers/nip46/nostrconnect.ts`
- **RPC Communication**: `ndk-core/src/signers/nip46/rpc.ts`

### Key NDK Patterns Identified
- Use `NDKNip46Signer.nostrconnect(ndk, relay, localSigner, options)` for client-initiated connections
- Generate `nostrconnect://` URIs using `generateNostrConnectUri()` function
- Handle connection responses through `blockUntilReadyNostrConnect()` method
- Store local signer keys for session persistence using `toPayload()` and `fromPayload()` methods

## Timeline
- **Phase 1**: 2-3 days (Core integration and service layer)
- **Phase 2**: 2-3 days (UI components and user experience)
- **Phase 3**: 1-2 days (Session management and persistence)
- **Phase 4**: 1-2 days (Integration testing and validation)
- **Total**: 6-10 days

## Risk Mitigation
- **Connection Reliability**: Implement robust retry logic and connection health monitoring
- **Session Security**: Follow established encryption patterns for local storage
- **User Experience**: Provide clear feedback and error messages for connection states
- **Backward Compatibility**: Maintain existing NIP-07 and private key authentication options

## Post-Implementation
- Update authentication documentation with Nostr Connect flow
- Add troubleshooting guide for connection issues
- Consider adding connection analytics for reliability monitoring
- Document patterns for potential React Native migration

---

**Created**: 2025-08-16
**Estimated Effort**: 6-10 days
**Priority**: High (Alternative to failed bunker persistence)
**Dependencies**: Existing NDK integration, authentication architecture
