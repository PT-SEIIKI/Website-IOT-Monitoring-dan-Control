import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Header } from './Header';
import { Menu, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function MainLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-muted/30 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-2 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[280px] border-r-0">
                <Sidebar onNavClick={() => setIsMobileMenuOpen(false)} isMobile={true} />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <h1 className="font-bold text-sm gradient-text">IoT Control</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-sm">
              {user?.name.charAt(0)}
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-hidden p-1.5 md:p-2 lg:p-2.5">
          <div className="max-w-7xl mx-auto w-full h-full bg-background rounded-[1.25rem] shadow-xl shadow-primary/5 border border-border/50 overflow-hidden flex flex-col">
            <div className="flex-1 p-3 md:p-4 lg:p-5 overflow-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
