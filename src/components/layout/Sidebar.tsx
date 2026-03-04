import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Activity, 
  History, 
  FileBarChart, 
  Calendar, 
  Settings, 
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight,
  Wrench
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Kontrol Ruangan', href: '/rooms', icon: Building2 },
  { name: 'Monitoring', href: '/monitoring', icon: Activity },
  { name: 'History', href: '/history', icon: History },
  { name: 'Pemasangan', href: '/pemasangan', icon: Wrench },
  { name: 'Reports', href: '/reports', icon: FileBarChart },
  { name: 'Schedule', href: '/schedule', icon: Calendar, adminOnly: true },
  { name: 'Settings', href: '/settings', icon: Settings, adminOnly: true },
];

interface SidebarProps {
  onNavClick?: () => void;
  isMobile?: boolean;
}

export function Sidebar({ onNavClick, isMobile = false }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  const filteredNav = navigation.filter(item => !item.adminOnly || user?.role === 'admin');

  // On desktop, it's collapsed by default and expands on hover
  const collapsed = !isMobile && !isHovered;
  const sidebarWidth = isMobile ? "w-full" : (collapsed ? "w-16" : "w-64");

  return (
    <aside 
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      className={cn(
        "flex flex-col h-[calc(100vh-1rem)] m-2 rounded-2xl bg-sidebar border border-sidebar-border transition-all duration-300 relative z-40 shadow-lg",
        sidebarWidth
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent shrink-0">
          <Zap className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in truncate">
            <h1 className="font-bold text-lg gradient-text">IoT Control</h1>
            <p className="text-xs text-muted-foreground">Campus System</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/' && location.pathname.startsWith(item.href));
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 shrink-0 transition-colors",
                isActive && "text-primary"
              )} />
              <span className={cn(
                "font-medium text-sm animate-fade-in truncate transition-opacity duration-300",
                collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
              )}>
                {item.name}
              </span>
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-2 rounded-lg bg-muted/50 animate-fade-in overflow-hidden">
            <p className="font-medium text-sm truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        )}
        
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="font-medium text-sm animate-fade-in">Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle - Removed as per request (hover only) */}
    </aside>
  );
}
