import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminSidebar from '@/components/AdminSidebar';
import AdminResources from '@/components/admin/AdminResources';

export default function AdminResourcesPage() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation('/admin/login');
    }
  }, [isAuthenticated, isChecking, setLocation]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-stone-50">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <AdminResources />
      </main>
    </div>
  );
}
