/**
 * Public Workout Record Page
 * 
 * Displays workout records publicly using nevent encoding.
 * Simplified version for initial implementation.
 */

import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/powr-ui/primitives/Card';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Dumbbell, Share2, Copy } from 'lucide-react';

interface PublicWorkoutPageProps {
  params: {
    nevent: string;
  };
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: PublicWorkoutPageProps): Promise<Metadata> {
  return {
    title: 'POWR Workout - Shared Workout',
    description: 'View this shared workout on POWR - the decentralized fitness platform.',
    openGraph: {
      title: 'POWR Workout - Shared Workout',
      description: 'View this shared workout on POWR - the decentralized fitness platform.',
      type: 'article',
      url: `https://powr.me/workout/${params.nevent}`,
      images: [
        {
          url: '/assets/workout-record-fallback.jpg',
          width: 1200,
          height: 630,
          alt: 'POWR Workout Summary'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'POWR Workout - Shared Workout',
      description: 'View this shared workout on POWR - the decentralized fitness platform.',
      images: ['/assets/workout-record-fallback.jpg']
    }
  };
}

// Client component for interactive features
function ShareActions({ nevent }: { nevent: string }) {
  const handleCopyURL = async () => {
    try {
      const url = `${window.location.origin}/workout/${nevent}`;
      await navigator.clipboard.writeText(url);
      console.log('URL copied to clipboard');
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/workout/${nevent}`;
      const title = 'POWR Workout';
      const text = 'Check out this workout on POWR';

      if (navigator.share && navigator.canShare) {
        const shareData = { title, text, url };
        
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }

      // Fallback to copy URL
      await handleCopyURL();
    } catch (error) {
      console.error('Failed to share workout:', error);
      await handleCopyURL();
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleCopyURL}>
        <Copy className="h-4 w-4 mr-2" />
        Copy Link
      </Button>
      <Button variant="outline" size="sm" onClick={handleShare}>
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>
    </div>
  );
}

// Main page component
export default function PublicWorkoutPage({ params }: PublicWorkoutPageProps) {
  // For now, show a placeholder page
  // TODO: Implement actual workout data fetching
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Shared Workout</h1>
              <p className="text-muted-foreground mt-1">
                Workout shared from POWR
              </p>
            </div>
            <ShareActions nevent={params.nevent} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Workout Summary */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  Workout Loading...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Loading workout data from Nostr network...
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Event ID: {params.nevent}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>About POWR</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  POWR is a decentralized workout tracking platform built on Nostr. 
                  Track your workouts, share your progress, and own your data.
                </p>
                <Button className="w-full" asChild>
                  <a href="/" target="_blank" rel="noopener noreferrer">
                    Try POWR
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Social Sharing Preview */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Share This Workout</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-3 text-sm">
                  <div className="font-medium mb-1">Shared Workout</div>
                  <div className="text-muted-foreground">
                    Loading workout details...
                  </div>
                </div>
                <div className="mt-4">
                  <ShareActions nevent={params.nevent} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
