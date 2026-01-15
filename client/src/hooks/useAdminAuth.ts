import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';

export function useAdminAuth() {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  const { data, isLoading, error } = trpc.admin.verifySession.useQuery(undefined, {
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (!token) {
      setIsAuthenticated(false);
      setIsChecking(false);
      return;
    }

    if (!isLoading) {
      if (data?.valid) {
        setIsAuthenticated(true);
        setUsername(data.username);
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUsername');
      }
      setIsChecking(false);
    }
  }, [token, data, isLoading, error]);

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    setIsAuthenticated(false);
    setUsername(null);
    setLocation('/admin/login');
  };

  return {
    isAuthenticated,
    isChecking,
    username,
    logout,
    token,
  };
}
