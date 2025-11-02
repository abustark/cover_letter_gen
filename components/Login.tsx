// src/components/Login.tsx
import React, { useState, useEffect } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import axios from 'axios';

interface UserProfile {
  name: string;
  picture: string;
}

export const Login: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        setUser({
          name: userInfo.data.name,
          picture: userInfo.data.picture,
        });
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    },
    onError: (error) => console.error('Login Failed:', error),
  });

  const logout = () => {
    googleLogout();
    setUser(null);
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <img src={user.picture} alt="User" className="w-8 h-8 rounded-full" />
        <span className="text-white text-sm hidden sm:block">{user.name}</span>
        <button
          onClick={logout}
          className="px-3 py-1.5 text-sm font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Log Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => login()}
      className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      Sign in with Google
    </button>
  );
};