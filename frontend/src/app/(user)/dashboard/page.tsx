'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  Header,
  StatsCard,
  ImpressionsChart,
  BestPostCard,
  PlanInfoCard,
  ConnectedPlatformsCard,
  PlatformPerformanceCard,
  UpgradeCard,
} from '@/components/dashboard';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.data.user);
        console.log('Fetched user:', data.data.user);
      } catch (error) {
        console.error('Failed to fetch user', error);
      }
    };

    fetchUser();
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden p-4 gap-4">
      {/* Sidebar Area - Fixed, Rounded */}
      <div className="hidden lg:block h-full">
        <Sidebar />
      </div>

      {/* Right Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header - Standalone Box */}
        <div className="pb-4">
          <Header userName={user.name} userEmail={user.email} userAvatar={user.avatar} />
        </div>

        {/* Dashboard Content Container - Standalone Box */}
        <main className="flex-1 bg-[#F7F7F7] rounded-3xl overflow-y-auto px-6 py-8">
          {/* Welcome Section */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hi, {user.name.split(' ')[0]}</h1>
              <p className="text-gray-500 text-sm">welcome back</p>
            </div>
            <Link href="/create-post">
              <Button variant="default" className="gap-2">
                Create a post
                <Plus size={18} />
              </Button>
            </Link>
          </div>

          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StatsCard
              title="Total Posts"
              value="25"
              trend="5% increased from last month"
              variant="primary"
            />
            <StatsCard
              title="Total schedules"
              value="10"
              trend="8% increased from last month"
            />
            <StatsCard
              title="Total Drafts"
              value="12"
              trend="8% increased from last month"
            />
            <StatsCard
              title="Total Impressions"
              value="2"
              trend="8% increased from last month"
            />
          </div>

          {/* Main Grid - Charts and Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-8">
            {/* Impressions Chart - takes 2 columns */}
            <div className="lg:col-span-2">
              <ImpressionsChart />
            </div>

            {/* Best Post Card - takes 1 column */}
            <BestPostCard />

            {/* Plan Info Card - takes 1 column */}
            <PlanInfoCard />
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Connected Platforms */}
            <ConnectedPlatformsCard />

            {/* Platform Performance */}
            <PlatformPerformanceCard />

            {/* Upgrade Card */}
            <UpgradeCard />
          </div>
        </main>
      </div>
    </div>
  );
}