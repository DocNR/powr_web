/**
 * Public Workout Record Page
 * 
 * Displays workout records publicly using nevent encoding.
 * Uses PublicWorkoutDisplay component for full functionality.
 */

import { Metadata } from 'next';
import { PublicWorkoutDisplay } from '@/components/powr-ui/workout/PublicWorkoutDisplay';

interface PublicWorkoutPageProps {
  params: Promise<{
    nevent: string;
  }>;
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: PublicWorkoutPageProps): Promise<Metadata> {
  const { nevent } = await params;
  
  return {
    title: 'POWR Workout - Shared Workout',
    description: 'View this shared workout on POWR - the decentralized fitness platform.',
    openGraph: {
      title: 'POWR Workout - Shared Workout',
      description: 'View this shared workout on POWR - the decentralized fitness platform.',
      type: 'article',
      url: `https://powr-kappa.vercel.app/workout/${nevent}`,
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

// Main page component - uses PublicWorkoutDisplay for full functionality
export default async function PublicWorkoutPage({ params }: PublicWorkoutPageProps) {
  const { nevent } = await params;
  return <PublicWorkoutDisplay nevent={nevent} />;
}
