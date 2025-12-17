'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setAccessToken } from '@/lib/axios';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Extract from fragment (#)
    const hash = window.location.hash.substring(1); // Remove #
    const params = new URLSearchParams(hash);
    const accessToken = params.get('accessToken');
    const error = new URLSearchParams(window.location.search).get('error');

    if (error) {
      router.push(`/login?error=${error}`);
      return;
    }

    if (accessToken) {
      // Store in memory
      setAccessToken(accessToken);
      
      // Clean URL
      window.history.replaceState({}, document.title, '/auth/callback');
      
      router.push('/dashboard');
    } else {
      router.push('/login?error=no_token');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}