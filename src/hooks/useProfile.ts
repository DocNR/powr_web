/**
 * Profile Hook for NDK Profile Fetching
 * 
 * Simple hook to fetch user profiles from NDK cache and relays.
 * Uses Robohash monsters as fallback avatars.
 */

import { useState, useEffect } from 'react';
import { getNDKInstance } from '@/lib/ndk';
import { nip19 } from 'nostr-tools';

interface ProfileData {
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  nip05?: string;
  lud16?: string;
}

interface UseProfileResult {
  profile: ProfileData | null;
  loading: boolean;
  error: string | null;
}

/**
 * Generate Robohash monster avatar URL
 */
function generateRobohashAvatar(pubkey: string): string {
  // Use first 16 chars of pubkey as seed for consistent monsters
  const seed = pubkey.slice(0, 16);
  return `https://robohash.org/${seed}?set=set2&size=200x200`;
}

/**
 * Hook to fetch user profile data
 */
export function useProfile(pubkey?: string): UseProfileResult {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pubkey) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const ndk = getNDKInstance();
        if (!ndk) {
          throw new Error('NDK not initialized');
        }

        // Get user from NDK
        const user = ndk.getUser({ pubkey });
        
        // Try to fetch profile from cache first, then relays
        const ndkProfile = await user.fetchProfile();
        
        if (isCancelled) return;

        if (ndkProfile) {
          // Convert NDK profile to our format
          const profileData: ProfileData = {
            name: typeof ndkProfile.name === 'string' ? ndkProfile.name : undefined,
            display_name: typeof ndkProfile.displayName === 'string' ? ndkProfile.displayName : 
                         typeof ndkProfile.display_name === 'string' ? ndkProfile.display_name : undefined,
            about: typeof ndkProfile.about === 'string' ? ndkProfile.about : undefined,
            picture: typeof ndkProfile.image === 'string' ? ndkProfile.image : 
                    typeof ndkProfile.picture === 'string' ? ndkProfile.picture : undefined,
            nip05: typeof ndkProfile.nip05 === 'string' ? ndkProfile.nip05 : undefined,
            lud16: typeof ndkProfile.lud16 === 'string' ? ndkProfile.lud16 : undefined,
          };
          
          setProfile(profileData);
        } else {
          // No profile found - set empty profile
          setProfile({});
        }
      } catch (err) {
        if (isCancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch profile');
        // Set empty profile on error so we can still show fallback avatar
        setProfile({});
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isCancelled = true;
    };
  }, [pubkey]);

  return { profile, loading, error };
}

/**
 * Get display name from profile data
 */
export function getDisplayName(profile: ProfileData | null, pubkey?: string): string {
  if (!profile && !pubkey) return 'Anonymous';
  
  // Try display_name first, then name, then npub format
  if (profile?.display_name) return profile.display_name;
  if (profile?.name) return profile.name;
  
  if (pubkey) {
    try {
      // Convert to npub format for better readability
      const npub = nip19.npubEncode(pubkey);
      // Return truncated npub as fallback
      return `${npub.slice(0, 12)}...${npub.slice(-4)}`;
    } catch {
      // Fallback to hex if npub conversion fails
      return `${pubkey.slice(0, 8)}...${pubkey.slice(-4)}`;
    }
  }
  
  return 'Anonymous';
}

/**
 * Get avatar URL from profile data with Robohash fallback
 */
export function getAvatarUrl(profile: ProfileData | null, pubkey?: string): string {
  // If profile has a picture, use it
  if (profile?.picture) {
    return profile.picture;
  }
  
  // Fallback to Robohash monster if we have a pubkey
  if (pubkey) {
    return generateRobohashAvatar(pubkey);
  }
  
  // Ultimate fallback - generic monster
  return 'https://robohash.org/anonymous?set=set2&size=200x200';
}

/**
 * Hook specifically for avatar URL
 */
export function useAvatar(pubkey?: string): string {
  const { profile } = useProfile(pubkey);
  return getAvatarUrl(profile, pubkey);
}

/**
 * Hook specifically for display name
 */
export function useDisplayName(pubkey?: string): string {
  const { profile } = useProfile(pubkey);
  return getDisplayName(profile, pubkey);
}
