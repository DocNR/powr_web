import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'POWR',
    short_name: 'POWR',
    description: 'Track your workouts, powered by Nostr. Decentralized and censorship resistant.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'en',
    categories: ['fitness', 'health', 'lifestyle'],
    
    icons: [
      // iOS specific icons
      {
        src: '/apple-touch-icon-180x180.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/apple-touch-icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/apple-touch-icon-167x167.png',
        sizes: '167x167',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any'
      },
      // Standard PWA icons
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      // Maskable icons for Android
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    
    // iOS specific
    prefer_related_applications: false,
    
    // Android specific
    display_override: ['window-controls-overlay', 'standalone'],
    
    // Enhanced PWA features
    shortcuts: [
      {
        name: 'Start Workout',
        short_name: 'Workout',
        description: 'Start a new workout session',
        url: '/?tab=active',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192'
          }
        ]
      },
      {
        name: 'View Progress',
        short_name: 'Progress',
        description: 'Check your workout progress',
        url: '/?tab=progress',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192'
          }
        ]
      }
    ],
    
    // Share target for workout data
    share_target: {
      action: '/share',
      method: 'POST',
      enctype: 'multipart/form-data',
      params: {
        title: 'title',
        text: 'text',
        url: 'url'
      }
    }
  }
}
