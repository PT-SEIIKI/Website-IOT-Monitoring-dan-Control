import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-bold truncate">{title}</h1>
        {subtitle && <p className="text-xs md:text-sm text-muted-foreground truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {/* Search */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cari ruangan..." 
            className="w-48 xl:w-64 pl-9 bg-muted/50 border-border focus:bg-background"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative shrink-0">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive rounded-full text-[10px] font-bold flex items-center justify-center text-destructive-foreground">
            3
          </span>
        </Button>

        {/* User Badge */}
        <div className="flex items-center gap-2 md:pl-4 md:border-l border-border">
          <div className="w-8 h-8 rounded-full shrink-0 bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-primary-foreground">
            {user?.name.charAt(0)}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium truncate max-w-[100px]">{user?.name}</p>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">
              {user?.role}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
