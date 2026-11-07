import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../services/auth';
import { GoogleGIcon, SpinnerIcon } from './icons';

interface GoogleButtonProps {
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  onSuccess?: () => void;
  onError?: () => void;
  className?: string;
}

/**
 * Clean native "Sign in with Google" button (modeled after Linkly and ABot).
 * Uses useGoogleLogin under the hood to trigger Google OAuth popup without
 * letting Google's iframe auto-render personalized Gmail IDs or shift layout.
 */
export const GoogleButton: React.FC<GoogleButtonProps> = ({
  size = 'large',
  fullWidth = false,
  onSuccess,
  onError,
  className = '',
}) => {
  const { clientId, handleAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        if (!res.ok) throw new Error('Failed to retrieve user profile');
        const profile = (await res.json()) as {
          sub?: string;
          name?: string;
          email?: string;
          picture?: string;
        };

        handleAccessToken(
          tokenResponse.access_token,
          {
            sub: profile.sub || 'google-user',
            name: profile.name || 'Google User',
            email: profile.email || '',
            picture: profile.picture,
          },
          tokenResponse.expires_in || 3600
        );

        onSuccess?.();
      } catch (err) {
        console.error('Google profile fetch error:', err);
        onError?.();
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setLoading(false);
      onError?.();
    },
  });

  if (!clientId) {
    return (
      <div
        className={`rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-400 leading-relaxed text-center ${className}`}
      >
        Google sign-in isn't configured yet. Add your <code className="font-mono">VITE_GOOGLE_CLIENT_ID</code>{' '}
        to <code className="font-mono">.env.local</code>.
      </div>
    );
  }

  const isSmall = size === 'small';

  return (
    <div className={`flex justify-center items-center ${fullWidth ? 'w-full' : ''} ${className}`}>
      <button
        type="button"
        onClick={() => {
          if (!loading) {
            setLoading(true);
            login();
          }
        }}
        disabled={loading}
        className={`inline-flex items-center justify-center gap-2.5 font-semibold transition-all duration-150 select-none shadow-xs active:scale-[0.98] disabled:opacity-60
          bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100
          border border-stone-300 dark:border-stone-700
          hover:bg-stone-50 dark:hover:bg-stone-750 hover:border-stone-400 dark:hover:border-stone-600
          focus:outline-hidden focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600 focus:ring-offset-2 dark:ring-offset-stone-900
          ${isSmall ? 'py-2 px-3 text-xs rounded-xl w-full' : 'py-3 px-5 text-sm rounded-xl max-w-xs w-full'}
        `}
      >
        {loading ? (
          <SpinnerIcon className={isSmall ? 'w-3.5 h-3.5 animate-spin' : 'w-4 h-4 animate-spin'} />
        ) : (
          <GoogleGIcon className={isSmall ? 'w-4 h-4 flex-shrink-0' : 'w-4.5 h-4.5 flex-shrink-0'} />
        )}
        <span className="tracking-wide truncate">
          {loading ? 'Signing in…' : isSmall ? 'Sign in with Google' : 'Continue with Google'}
        </span>
      </button>
    </div>
  );
};
