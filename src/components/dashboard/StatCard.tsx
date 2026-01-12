import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'accent';
}

const variantStyles = {
  default: {
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
  },
  primary: {
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  success: {
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
  },
  warning: {
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
  },
  accent: {
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
  },
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className="glass-card rounded-xl p-3 md:p-5 animate-fade-in hover:border-primary/30 transition-colors group">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0 w-full">
          <p className="text-[10px] md:text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-lg md:text-2xl lg:text-3xl font-bold mt-0.5 md:mt-2 font-mono tracking-tight break-words">
            {value}
          </p>
          {subtitle && (
            <p className="text-[10px] md:text-sm text-muted-foreground mt-0.5 md:mt-1 opacity-80">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 mt-1 md:mt-2 text-[10px] md:text-sm font-medium",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="hidden xs:inline text-muted-foreground font-normal ml-0.5">vs kemarin</span>
            </div>
          )}
        </div>
        
        <div className={cn(
          "p-2 md:p-3 rounded-lg md:rounded-xl transition-transform group-hover:scale-110 shrink-0 self-end sm:self-start",
          styles.iconBg
        )}>
          <Icon className={cn("w-4 h-4 md:w-6 md:h-6", styles.iconColor)} />
        </div>
      </div>
    </div>
  );
}
