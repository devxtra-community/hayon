// 'use client';

// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { setAccessToken } from '@/lib/axios';

// export default function AuthCallback() {
//   const router = useRouter();

//   useEffect(() => {
//     // Extract from fragment (#)
//     const hash = window.location.hash.substring(1); // Remove #
//     const params = new URLSearchParams(hash);
//     const accessToken = params.get('accessToken');
//     const error = new URLSearchParams(window.location.search).get('error');

//     if (error) {
//       router.push(`/login?error=${error}`);
//       return;
//     }

//     if (accessToken) {
//       // Store in memory
//       setAccessToken(accessToken);
      
//       // Clean URL
//       window.history.replaceState({}, document.title, '/auth/callback');
      
//       router.push('/dashboard');
//     } else {
//       router.push('/login?error=no_token');
//     }
//   }, [router]);

//   return (
//     <div className="flex items-center justify-center min-h-screen">
//       <div className="text-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
//         <p className="mt-4 text-gray-600">Completing sign in...</p>
//       </div>
//     </div>
//   );
// }


'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, setAccessToken } from '@/lib/axios';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const success = searchParams.get('success');
      const error = searchParams.get('error');

      if (error) {
        router.push(`/login?error=${error}`);
        return;
      }

      if (success) {
        try {
          // ✅ Call refresh endpoint to get access token
          // Refresh token is automatically sent in HttpOnly cookie
          const { data } = await api.post('/auth/refresh');
          
          // Store access token in memory
          setAccessToken(data.data.accessToken);
          
          // Redirect to dashboard
          router.push('/dashboard');
        } catch (err) {
          console.error('Failed to obtain access token:', err);
          router.push('/login?error=auth_failed');
        }
      } else {
        router.push('/login?error=invalid_callback');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}