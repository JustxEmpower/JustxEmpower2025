import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';

export function useCustomerAuth() {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customer, setCustomer] = useState<any>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('customerToken') : null;

  const { data, isLoading } = trpc.customer.me.useQuery(undefined, {
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
        setCustomer(data.customer);
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem('customerToken');
      }
      setIsChecking(false);
    }
  }, [token, data, isLoading]);

  const logout = useCallback(() => {
    localStorage.removeItem('customerToken');
    setIsAuthenticated(false);
    setCustomer(null);
    setLocation('/login');
  }, [setLocation]);

  return { isAuthenticated, isChecking, customer, logout, token };
}
