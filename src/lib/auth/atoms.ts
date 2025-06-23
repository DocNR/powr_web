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
export const accountAtom = atom<Account | null>(null);

export const accountsAtom = atomWithStorage<Account[]>(
  'powr-accounts',
  [],
  createJSONStorage<Account[]>(() => {
    if (typeof window !== 'undefined') {
      return localStorage;
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
  }),
  { getOnInit: true }
);

export const methodAtom = atomWithStorage<LoginMethod | null>(
  'powr-login-method',
  null,
  createJSONStorage<LoginMethod | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage;
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
  }),
  { getOnInit: true }
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

// Reset function atom (following Chachi's useResetState pattern)
export const resetAuthStateAtom = atom(
  null,
  (get, set) => {
    set(accountAtom, null);
    set(methodAtom, null);
    // Note: We keep accountsAtom for account switching functionality
  }
);
