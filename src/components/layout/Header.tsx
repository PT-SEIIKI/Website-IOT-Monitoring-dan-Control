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
    <header className="flex flex-col sm:flex-row items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border bg-card/50 backdrop-blur-sm gap-3">
      <div className="min-w-0 w-full sm:w-auto">
        <h1 className="text-lg md:text-2xl font-bold truncate leading-tight">{title}</h1>
        {subtitle && <p className="text-[10px] md:text-sm text-muted-foreground truncate opacity-80">{subtitle}</p>}
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2 md:gap-4 shrink-0 w-full sm:w-auto">
        {/* Search */}
        <div className="relative hidden xl:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cari ruangan..." 
            className="w-48 xl:w-64 pl-9 bg-muted/50 border-border focus:bg-background h-9"
          />
        </div>

        <div className="flex items-center gap-2 md:gap-4 ml-auto sm:ml-0">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative shrink-0 h-9 w-9">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-destructive rounded-full text-[9px] font-bold flex items-center justify-center text-destructive-foreground">
              3
            </span>
          </Button>

          {/* User Badge */}
          <div className="flex items-center gap-2 md:pl-4 md:border-l border-border h-9">
            <div className="w-8 h-8 rounded-full shrink-0 bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-primary-foreground shadow-sm">
              {user?.name.charAt(0)}
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-xs md:text-sm font-medium truncate max-w-[80px] md:max-w-[120px]">{user?.name}</p>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 capitalize h-4">
                {user?.role}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
