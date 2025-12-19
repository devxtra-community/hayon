// app/(protected)/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getAccessToken, setAccessToken } from '@/lib/axios';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Step 1: Check if we have access token in memory
      let token = getAccessToken();

      // Step 2: If no access token, try to refresh
      if (!token) {
        try {
          const { data } = await api.post('/auth/refresh');
          setAccessToken(data.data.accessToken);
          token = data.data.accessToken;
        } catch (error) {
          // No valid refresh token - redirect to login
          router.push('/login');
          return;
        }
      }

      // Step 3: Verify token by fetching user data
      try {
        await api.get('/auth/me');
        setIsAuthenticated(true);
      } catch (error) {
        // Token invalid - redirect to login
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated - render the page
  return <>{children}</>;
}