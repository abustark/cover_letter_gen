import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../services/auth';

interface GoogleButtonProps {
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  onSuccess?: () => void;
  onError?: () => void;
  className?: string;
}

/* Official "Sign in with Google" button. Google renders its own responsive
   button (popup on desktop, full-height sheet on mobile) so it works
   flawlessly across viewports with no extra styling to maintain. */
export const GoogleButton: React.FC<GoogleButtonProps> = ({
  size = 'large' as 'small' | 'medium' | 'large',
  fullWidth = true,
  onSuccess,
  onError,
  className = '',
}) => {
  const { clientId, handleCredential } = useAuth();

  if (!clientId) {
    return (
      <div
        className={`rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-400 leading-relaxed ${className}`}
      >
        Google sign-in isn't configured yet. Add your <code className="font-mono">VITE_GOOGLE_CLIENT_ID</code>{' '}
        to <code className="font-mono">.env.local</code> (and as a Vercel environment variable) to enable it.
      </div>
    );
  }

  const handleSuccess = (response: CredentialResponse) => {
    if (response.credential) {
      handleCredential(response.credential);
      onSuccess?.();
    } else {
      onError?.();
    }
  };

  return (
    <div className={className}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => onError?.()}
        theme="outline"
        shape="rectangular"
        text="signin_with"
        size={size}
        containerProps={{ className: fullWidth ? 'w-full' : '' }}
      />
    </div>
  );
};
