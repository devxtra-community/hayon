'use client';

import { useEffect } from 'react';
import { api, setAccessToken } from '@/lib/axios';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Try to silently refresh on app load
    const initAuth = async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        setAccessToken(data.data.accessToken);
      } catch (error) {
        // No valid refresh token - user needs to login
        console.log('No active session');
      }
    };

    initAuth();
  }, []);

  return <>{children}</>;
}