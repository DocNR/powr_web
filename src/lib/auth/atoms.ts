/**
 * Authentication Atoms for POWR Workout PWA
 * 
 * Jotai-based state management following Chachi PWA patterns.
 * Supports ONLY NIP-07 (browser extensions) and NIP-46 (remote signing).
 * Avoids React Context API per .clinerules/ndk-best-practices.md
 */

import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import type { Account, LoginMethod } from './types';

// Core authentication atoms (following Chachi's exact structure)
export const accountAtom = atomWithStorage<Account | null>(
  'powr-current-account',
  null,
  createJSONStorage<Account | null>(() => {
    if (typeof window !== 'undefined') {
      // Add debugging wrapper around localStorage
      return {
        getItem: (key: string) => {
          const value = localStorage.getItem(key);
          console.log('[Auth Atoms] accountAtom getItem:', key, value ? `${JSON.parse(value)?.pubkey?.slice(0, 16)}... (${JSON.parse(value)?.method})` : 'null');
          return value;
        },
        setItem: (key: string, value: string) => {
          const parsed = JSON.parse(value);
          console.log('[Auth Atoms] accountAtom setItem:', key, parsed ? `${parsed.pubkey?.slice(0, 16)}... (${parsed.method})` : 'null');
          localStorage.setItem(key, value);
        },
        removeItem: (key: string) => {
          console.log('[Auth Atoms] accountAtom removeItem:', key);
          localStorage.removeItem(key);
        },
        clear: () => localStorage.clear(),
        length: localStorage.length,
        key: (index: number) => localStorage.key(index)
      } as Storage;
    }
    // Return a mock storage for SSR
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null
    } as Storage;
  })
  // Remove getOnInit: true to prevent hydration mismatch
);

export const accountsAtom = atomWithStorage<Account[]>(
  'powr-accounts',
  [],
  createJSONStorage<Account[]>(() => {
    if (typeof window !== 'undefined') {
      // Add debugging wrapper around localStorage
      return {
        getItem: (key: string) => {
          const value = localStorage.getItem(key);
          console.log('[Auth Atoms] accountsAtom getItem:', key, value ? `${JSON.parse(value).length} accounts` : 'null');
          return value;
        },
        setItem: (key: string, value: string) => {
          const parsed = JSON.parse(value);
          console.log('[Auth Atoms] accountsAtom setItem:', key, `${parsed.length} accounts:`, parsed.map((a: Account) => `${a.pubkey.slice(0, 16)}... (${a.method})`));
          localStorage.setItem(key, value);
        },
        removeItem: (key: string) => {
          console.log('[Auth Atoms] accountsAtom removeItem:', key);
          localStorage.removeItem(key);
        },
        clear: () => localStorage.clear(),
        length: localStorage.length,
        key: (index: number) => localStorage.key(index)
      } as Storage;
    }
    // Return a mock storage for SSR
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null
    } as Storage;
  })
  // Remove getOnInit: true to prevent hydration mismatch
);

export const methodAtom = atomWithStorage<LoginMethod | null>(
  'powr-login-method',
  null,
  createJSONStorage<LoginMethod | null>(() => {
    if (typeof window !== 'undefined') {
      // Add debugging wrapper around localStorage
      return {
        getItem: (key: string) => {
          const value = localStorage.getItem(key);
          console.log('[Auth Atoms] methodAtom getItem:', key, value ? JSON.parse(value) : 'null');
          return value;
        },
        setItem: (key: string, value: string) => {
          const parsed = JSON.parse(value);
          console.log('[Auth Atoms] methodAtom setItem:', key, parsed);
          localStorage.setItem(key, value);
        },
        removeItem: (key: string) => {
          console.log('[Auth Atoms] methodAtom removeItem:', key);
          localStorage.removeItem(key);
        },
        clear: () => localStorage.clear(),
        length: localStorage.length,
        key: (index: number) => localStorage.key(index)
      } as Storage;
    }
    // Return a mock storage for SSR
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null
    } as Storage;
  })
  // Remove getOnInit: true to prevent hydration mismatch
);

// Derived atoms for convenience
export const isAuthenticatedAtom = atom<boolean>((get) => {
  const account = get(accountAtom);
  return account !== null && !!account.pubkey;
});

export const pubkeyAtom = atom<string | undefined>((get) => {
  const account = get(accountAtom);
  return account?.pubkey;
});

export const canSignAtom = atom<boolean>((get) => {
  const account = get(accountAtom);
  return account?.pubkey !== undefined;
});

// Authentication state atom for UI
export const authStateAtom = atom((get) => {
  const account = get(accountAtom);
  const accounts = get(accountsAtom);
  const loginMethod = get(methodAtom);
  const isAuthenticated = get(isAuthenticatedAtom);

  return {
    account,
    accounts,
    loginMethod,
    isAuthenticated,
    isLoading: false, // Will be managed by individual hooks
    error: null
  };
});

// Debug function to inspect localStorage state
export const debugAuthStateAtom = atom(
  null,
  () => {
    if (typeof window !== 'undefined') {
      console.log('[Auth Debug] === LOCALSTORAGE STATE INSPECTION ===');
      console.log('[Auth Debug] powr-current-account:', localStorage.getItem('powr-current-account'));
      console.log('[Auth Debug] powr-accounts:', localStorage.getItem('powr-accounts'));
      console.log('[Auth Debug] powr-login-method:', localStorage.getItem('powr-login-method'));
      
      // Check for potential conflicts
      const currentAccount = localStorage.getItem('powr-current-account');
      const loginMethod = localStorage.getItem('powr-login-method');
      const accounts = localStorage.getItem('powr-accounts');
      
      if (currentAccount && loginMethod && accounts) {
        const parsedAccount = JSON.parse(currentAccount);
        const parsedMethod = JSON.parse(loginMethod);
        const parsedAccounts = JSON.parse(accounts);
        
        console.log('[Auth Debug] CONFLICT CHECK:');
        console.log('[Auth Debug] - Current account method:', parsedAccount?.method);
        console.log('[Auth Debug] - Stored login method:', parsedMethod);
        console.log('[Auth Debug] - Methods match:', parsedAccount?.method === parsedMethod);
        console.log('[Auth Debug] - Account exists in accounts array:', parsedAccounts.some((a: Account) => a.pubkey === parsedAccount?.pubkey));
        
        // Check for mixed authentication methods
        const uniqueMethods = [...new Set(parsedAccounts.map((a: Account) => a.method))];
        if (uniqueMethods.length > 1) {
          console.log('[Auth Debug] ⚠️  MIXED AUTH METHODS DETECTED:', uniqueMethods);
          console.log('[Auth Debug] This could cause auto-login conflicts!');
        }
      }
      
      console.log('[Auth Debug] === END INSPECTION ===');
    }
  }
);

// Reset function atom (following Chachi's useResetState pattern)
export const resetAuthStateAtom = atom(
  null,
  (get, set) => {
    set(accountAtom, null);
    set(methodAtom, null);
    // Note: We keep accountsAtom for account switching functionality
  }
);
