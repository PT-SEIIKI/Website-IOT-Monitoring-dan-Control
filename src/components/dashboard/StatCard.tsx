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
    <div className="glass-card rounded-xl p-4 md:p-5 animate-fade-in hover:border-primary/30 transition-all duration-300 group relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 truncate">{title}</p>
          <div className="flex items-baseline gap-1 flex-wrap">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold font-mono tracking-tight leading-none truncate max-w-full">
              {value}
            </h2>
          </div>
          {subtitle && (
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1 font-medium truncate opacity-80">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-full w-fit",
              trend.isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        
        <div className={cn(
          "p-2.5 md:p-3 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0 shadow-sm",
          styles.iconBg
        )}>
          <Icon className={cn("w-5 h-5 md:w-6 md:h-6", styles.iconColor)} />
        </div>
      </div>
      
      {/* Decorative accent for hover */}
      <div className={cn(
        "absolute bottom-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity",
        styles.iconBg.replace('/10', '/30')
      )} />
    </div>
  );
}
