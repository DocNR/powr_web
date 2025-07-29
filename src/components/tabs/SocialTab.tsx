'use client';

import React from 'react';
import { Users, MessageCircle, Sparkles } from 'lucide-react';
// import { Button } from '@/components/powr-ui/primitives/Button';
// import { Card, CardContent } from '@/components/powr-ui/primitives/Card';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/powr-ui/primitives/Avatar';
// import { useSubNavigation } from '@/providers/SubNavigationProvider';

export function SocialTab() {
  // const { getActiveSubTab } = useSubNavigation();
  // const activeSubTab = getActiveSubTab('social') || 'all';

  return (
    <>
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <Users className="h-8 w-8 text-[color:var(--workout-primary)]" />
          <h1 className="text-3xl font-bold tracking-tight">Social Fitness</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Connect with the Nostr fitness community
        </p>
      </div>

      {/* Main Coming Soon Message */}
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center space-y-6">
        <div className="relative">
          <MessageCircle className="h-24 w-24 text-muted-foreground/20" />
          <Sparkles className="h-8 w-8 text-[color:var(--workout-primary)] absolute -top-2 -right-2" />
        </div>
        
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">Social Features Coming Soon™</h2>
          <p className="text-muted-foreground max-w-md">
            We&apos;re building a decentralized social platform where fitness enthusiasts can share workouts, compete, and motivate each other through the Nostr protocol.
          </p>
        </div>

        {/* Feature Preview */}
        <div className="grid gap-4 text-sm max-w-lg mt-8">
          <div className="flex items-start gap-3 text-left">
            <div className="w-2 h-2 rounded-full bg-[color:var(--workout-primary)] mt-2 flex-shrink-0" />
            <p className="text-muted-foreground">
              Share your workout achievements with the community
            </p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <div className="w-2 h-2 rounded-full bg-[color:var(--workout-primary)] mt-2 flex-shrink-0" />
            <p className="text-muted-foreground">
              Follow friends and see their fitness progress
            </p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <div className="w-2 h-2 rounded-full bg-[color:var(--workout-primary)] mt-2 flex-shrink-0" />
            <p className="text-muted-foreground">
              Compete on leaderboards and challenge others
            </p>
          </div>
          <div className="flex items-start gap-3 text-left">
            <div className="w-2 h-2 rounded-full bg-[color:var(--workout-primary)] mt-2 flex-shrink-0" />
            <p className="text-muted-foreground">
              Discover new workouts from top performers
            </p>
          </div>
        </div>
      </div>
    </>
  );

}

// COMMENTED OUT: Original mock design - will be restored when building social features
/*
function SocialTabOriginal() {
  const { getActiveSubTab } = useSubNavigation();
  const activeSubTab = getActiveSubTab('social') || 'all';

  return (
    <div className="space-y-6">
      {activeSubTab === 'all' && <AllUsersView />}
      {activeSubTab === 'me' && <MeView />}
      {activeSubTab === 'leaderboard' && <LeaderboardView />}
    </div>
  );
}

// Me View Component - User's personal feed
function MeView() {
  return (
    <div className="-mx-4">
      {/* Personal Stats Header *\/}
      <div className="px-4 pb-4 border-b border-border">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">23</div>
            <div className="text-sm text-muted-foreground">Workouts This Month</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">7</div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </div>
        </div>
      </div>

      {/* My Posts Feed - Twitter/X style *\/}
      <div className="divide-y divide-border">
        {[
          {
            user: 'You',
            username: '@you',
            avatar: '',
            content: 'That was a tough one today! 💪',
            workoutDetails: {
              name: 'Waiter Curls',
              stats: [
                { label: 'HIGHEST WEIGHT', value: '15 lb' },
                { label: 'TOTAL VOLUME', value: '576 lb' },
                { label: 'ESTIMATED STRENGTH', value: '23.4 lb in 1 rep' }
              ]
            },
            time: '2 min ago',
            likes: 2000,
            comments: 12,
          },
          {
            user: 'You',
            username: '@you',
            avatar: '',
            content: 'Waiter Press session complete! Feeling the burn 🔥',
            workoutDetails: {
              name: 'Waiter Press',
              stats: [
                { label: 'HIGHEST WEIGHT', value: '10 lb' },
                { label: 'TOTAL VOLUME', value: '480 lb' },
                { label: 'ESTIMATED STRENGTH', value: '20.1 lb in 1 rep' }
              ]
            },
            time: '2 min ago',
            likes: 156,
            comments: 8,
          },
          {
            user: 'You',
            username: '@you',
            avatar: '',
            content: 'Dumbbell Snatch practice paying off! 💪',
            workoutDetails: {
              name: 'Dumbbell Snatch',
              stats: [
                { label: 'HIGHEST WEIGHT', value: '8 lb' },
                { label: 'TOTAL VOLUME', value: '320 lb' },
                { label: 'ESTIMATED STRENGTH', value: '15.0 lb in 1 rep' }
              ]
            },
            time: '2 min ago',
            likes: 89,
            comments: 5,
          },
          {
            user: 'You',
            username: '@you',
            avatar: '',
            content: 'Morning workout complete! Ready to tackle the day ✅',
            workoutDetails: null,
            time: '1 day ago',
            likes: 45,
            comments: 3,
          },
          {
            user: 'You',
            username: '@you',
            avatar: '',
            content: 'New personal record! Consistency is key 🎯',
            workoutDetails: null,
            time: '2 days ago',
            likes: 78,
            comments: 12,
          },
        ].map((post, index) => (
          <div key={index} className="px-4 py-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.avatar} alt={post.user} />
                <AvatarFallback className="bg-orange-500 text-white">
                  You
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-orange-500">{post.user}</span>
                  <span className="text-sm text-muted-foreground">{post.username}</span>
                  <span className="text-sm text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">{post.time}</span>
                </div>
                <p className="text-sm mb-3 leading-relaxed">{post.content}</p>
                
                {/* Workout Details Card (if present) *\/}
                {post.workoutDetails && (
                  <div className="mb-3 p-3 border border-border rounded-lg bg-muted/30">
                    <h4 className="font-medium mb-2">{post.workoutDetails.name}</h4>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      {post.workoutDetails.stats.map((stat, statIndex) => (
                        <div key={statIndex}>
                          <div className="text-muted-foreground">{stat.label}</div>
                          <div className="font-medium">{stat.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-6 text-muted-foreground">
                  <Button variant="ghost" size="sm" className="h-8 px-2 hover:text-red-500">
                    <Heart className="h-4 w-4 mr-1" />
                    <span className="text-sm">{post.likes}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2 hover:text-blue-500">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm">{post.comments}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2 hover:text-green-500">
                    <Share className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Leaderboard View Component
function LeaderboardView() {
  return (
    <div className="space-y-6">
      {/* Top 3 Podium *\/}
      <div className="flex items-end justify-center gap-4 mb-8">
        {/* 2nd Place *\/}
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-500 mx-auto mb-2 flex items-center justify-center">
            <span className="text-white font-bold">JD</span>
          </div>
          <div className="font-medium">John Davis</div>
          <div className="text-sm text-muted-foreground">142 workouts</div>
          <div className="w-12 h-12 rounded-full bg-gray-400 mx-auto mt-2 flex items-center justify-center">
            🥈
          </div>
        </div>

        {/* 1st Place *\/}
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 mx-auto mb-2 flex items-center justify-center ring-4 ring-orange-300">
            <span className="text-white font-bold text-lg">SL</span>
          </div>
          <div className="font-medium text-lg">Sarah Lee</div>
          <div className="text-sm text-muted-foreground">150 workouts</div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 mx-auto mt-2 flex items-center justify-center">
            🥇
          </div>
        </div>

        {/* 3rd Place *\/}
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-orange-400 mx-auto mb-2 flex items-center justify-center">
            <span className="text-white font-bold">EW</span>
          </div>
          <div className="font-medium">Emma White</div>
          <div className="text-sm text-muted-foreground">137 workouts</div>
          <div className="w-12 h-12 rounded-full bg-orange-400 mx-auto mt-2 flex items-center justify-center">
            🥉
          </div>
        </div>
      </div>

      {/* Rest of Leaderboard *\/}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {[
              { rank: 4, name: 'Mike Smith', workouts: 130, emoji: '🔥' },
              { rank: 5, name: 'Rachel Clark', workouts: 126, emoji: '🔥' },
              { rank: 6, name: 'Mark Taylor', workouts: 118, emoji: '🔥' },
              { rank: 7, name: 'Olivia Green', workouts: 112, emoji: '🔥' },
              { rank: 8, name: 'Chris Anderson', workouts: 108, emoji: '🔥' },
              { rank: 9, name: 'Jessica Taylor', workouts: 104, emoji: '🔥' },
              { rank: 10, name: 'David Brown', workouts: 100, emoji: '🔥' },
            ].map((entry) => (
              <div key={entry.rank} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-medium">{entry.rank}</span>
                  <span className="font-medium">{entry.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{entry.emoji}</span>
                  <span className="text-sm text-muted-foreground">{entry.workouts} workouts</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// All Users View Component - Twitter/X-like feed
function AllUsersView() {
  return (
    <div className="-mx-4">
      {/* Social Feed - No cards, thin hairlines *\/}
      <div className="divide-y divide-border">
        {[
          {
            user: 'John Doe',
            username: '@johndoe',
            avatar: '',
            content: 'That was a tough one today! 💪',
            workoutDetails: {
              name: 'Waiter Curls',
              stats: [
                { label: 'HIGHEST WEIGHT', value: '15 lb' },
                { label: 'TOTAL VOLUME', value: '576 lb' },
                { label: 'ESTIMATED STRENGTH', value: '23.4 lb in 1 rep' }
              ]
            },
            time: '2 min ago',
            likes: 2000,
            comments: 12,
          },
          {
            user: 'Sasha Pavlova',
            username: '@sashap',
            avatar: '',
            content: 'Today I tried the Arnold Legs Workout! OMG I\'m done! 🥵',
            workoutDetails: null,
            time: '5 min ago',
            likes: 156,
            comments: 8,
          },
          {
            user: 'Alex Johnson',
            username: '@alexj',
            avatar: '',
            content: 'New PR on deadlifts! 🔥 Feeling stronger every day',
            workoutDetails: null,
            time: '1 hour ago',
            likes: 89,
            comments: 15,
          },
          {
            user: 'Sarah Chen',
            username: '@sarahc',
            avatar: '',
            content: 'Morning cardio session complete ✅ Ready to tackle the day!',
            workoutDetails: null,
            time: '2 hours ago',
            likes: 45,
            comments: 6,
          },
          {
            user: 'Mike Rodriguez',
            username: '@miker',
            avatar: '',
            content: 'Shared my new upper body routine. Check it out if you want to build some serious strength! 💪',
            workoutDetails: null,
            time: '4 hours ago',
            likes: 234,
            comments: 28,
          },
        ].map((post, index) => (
          <div key={index} className="px-4 py-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.avatar} alt={post.user} />
                <AvatarFallback className="bg-orange-500 text-white">
                  {post.user.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{post.user}</span>
                  <span className="text-sm text-muted-foreground">{post.username}</span>
                  <span className="text-sm text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">{post.time}</span>
                </div>
                <p className="text-sm mb-3 leading-relaxed">{post.content}</p>
                
                {/* Workout Details Card (if present) *\/}
                {post.workoutDetails && (
                  <div className="mb-3 p-3 border border-border rounded-lg bg-muted/30">
                    <h4 className="font-medium mb-2">{post.workoutDetails.name}</h4>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      {post.workoutDetails.stats.map((stat, statIndex) => (
                        <div key={statIndex}>
                          <div className="text-muted-foreground">{stat.label}</div>
                          <div className="font-medium">{stat.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-6 text-muted-foreground">
                  <Button variant="ghost" size="sm" className="h-8 px-2 hover:text-red-500">
                    <Heart className="h-4 w-4 mr-1" />
                    <span className="text-sm">{post.likes}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2 hover:text-blue-500">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm">{post.comments}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2 hover:text-green-500">
                    <Share className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
*/
