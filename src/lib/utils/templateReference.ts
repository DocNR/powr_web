/**
 * Template Reference Normalization Utilities
 * Prevents corruption during XState machine communication
 */

export interface TemplateReference {
  kind: string;
  pubkey: string;
  dTag: string;
}

export function parseTemplateReference(ref: string): TemplateReference | null {
  if (!ref || typeof ref !== 'string') return null;
  
  const parts = ref.split(':');
  if (parts.length !== 3) return null;
  
  return {
    kind: parts[0],
    pubkey: parts[1], 
    dTag: parts[2]
  };
}

export function normalizeTemplateReference(ref: string | undefined): string | undefined {
  if (!ref) return undefined;
  
  const parts = ref.split(':');
  
  // Already clean - return as-is
  if (parts.length === 3) {
    return ref;
  }
  
  // Corruption pattern detected: 33402:pubkey:33402:pubkey:dtag
  if (parts.length === 5 && parts[0] === parts[2] && parts[1] === parts[3]) {
    console.log('[TemplateReference] Fixed corruption:', {
      original: ref,
      fixed: `${parts[0]}:${parts[1]}:${parts[4]}`
    });
    return `${parts[0]}:${parts[1]}:${parts[4]}`;
  }
  
  // Other corruption patterns - try to extract valid parts
  if (parts.length > 3) {
    console.warn('[TemplateReference] Attempting to fix unknown corruption:', ref);
    return `${parts[0]}:${parts[1]}:${parts[parts.length - 1]}`;
  }
  
  // Cannot fix
  console.error('[TemplateReference] Cannot normalize reference:', ref);
  return undefined;
}

export function isValidTemplateReference(ref: string): boolean {
  const parsed = parseTemplateReference(ref);
  return parsed !== null && parsed.kind === '33402' && parsed.pubkey.length === 64;
}
