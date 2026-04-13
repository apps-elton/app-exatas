import { AdminSidebar } from './AdminSidebar';
import { AdminMobileHeader } from './AdminMobileHeader';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row h-dvh overflow-hidden">
      <AdminSidebar />
      <AdminMobileHeader />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
