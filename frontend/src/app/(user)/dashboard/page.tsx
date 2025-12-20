'use client';

import { useEffect, useState } from 'react';
import { api, clearAccessToken } from '@/lib/axios';
import { useRouter } from 'next/navigation';

// ✅ Define user type
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null); // ✅ Add type here
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.data.user);
      } catch (error) {
        console.error('Failed to fetch user' , error);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await api.delete('/auth/logout');
      clearAccessToken(); // ✅ Clear access token from memory
      router.push('/login');
    } catch (error) {
      console.error(error);
      alert('Logout failed');
    }
  };

  if (!user) {
    return <div>Loading user...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-4">Welcome, {user.name}!</p>
      <p className="text-gray-600">{user.email}</p>
      <button
        onClick={handleLogout}
        className="mt-4 bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-2 rounded transition"
      >
        Logout
      </button>
    </div>
  );
}