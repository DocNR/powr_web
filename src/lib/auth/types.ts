/**
 * Authentication Types for POWR Workout PWA
 * 
 * Based on Chachi PWA patterns with enhanced security for web browsers.
 * Supports ONLY NIP-07 (browser extensions) and NIP-46 (remote signing).
 * Compatible with Amber (Android), nsecBunker, and other NIP-46 signers.
 * NO private key management for maximum security.
 */

export type LoginMethod = 'nip07' | 'nip46' | 'amber' | 'ephemeral' | 'readOnly';

export interface Account {
  method: LoginMethod;
  pubkey: string;
  npub?: string;
  name?: string;
  picture?: string;
  
  // NIP-46 specific fields
  bunker?: string;
  secret?: string;
  relays?: string[];
}

export interface AuthenticationState {
  account: Account | null;
  accounts: Account[];
  loginMethod: LoginMethod | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthenticationError {
  code: 'NIP07_NOT_AVAILABLE' | 'NIP07_PERMISSION_DENIED' | 'NIP46_INVALID_URL' | 'NIP46_CONNECTION_FAILED' | 'AMBER_NOT_INSTALLED' | 'AMBER_CONNECTION_ERROR' | 'AMBER_INVALID_PUBKEY' | 'AMBER_LOGIN_FAILED' | 'EPHEMERAL_GENERATION_FAILED' | 'UNKNOWN_ERROR';
  message: string;
  details?: Record<string, unknown>;
}

// NIP-46 connection settings
export interface Nip46Settings {
  pubkey: string;
  relays: string[];
  token?: string;
}

// Authentication validation results
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
  timestamp?: number;
}

// URL-based login support (bunker URLs only)
export interface LoginUrlParams {
  method: LoginMethod;
  data: string; // bunker URL for NIP-46
}

// NIP-07 detection (NDK provides the proper types)
export interface NostrEvent {
  id?: string;
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
  pubkey: string;
  sig?: string;
}
