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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAF7F4] via-[#FDFCFA] to-[#FAF7F4]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5C3D4E]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#FAF7F4] via-[#FDFCFA] to-[#FAF7F4]">
      <AdminSidebar variant="dark" />
      <main className="flex-1 p-8 overflow-y-auto">
        <AdminResources />
      </main>
    </div>
  );
}
