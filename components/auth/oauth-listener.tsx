// components/oauth-listener.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Hub } from 'aws-amplify/utils';
import { getCurrentUser } from 'aws-amplify/auth';

export default function OAuthListener() {
  const router = useRouter();

  useEffect(() => {
    // Import the oauth listener for multi-page apps
    import('aws-amplify/auth/enable-oauth-listener');
    
    const hubListener = Hub.listen('auth', async ({ payload }) => {
      switch (payload.event) {
        case 'signInWithRedirect':
          console.log('OAuth sign-in successful');
          try {
            const user = await getCurrentUser();
            console.log('User signed in:', user);
            router.push('/landing');
          } catch (error) {
            console.error('Error after OAuth sign-in:', error);
          }
          break;
        case 'signInWithRedirect_failure':
          console.error('OAuth sign-in failed:', payload.data);
          break;
      }
    });

    return () => hubListener();
  }, [router]);

  return null;
}