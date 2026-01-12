import { useMemo } from 'react';
import { generateControlLogs } from '@/data/mockData';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Lightbulb, Wind, History, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function RecentActivity() {
  const activities = useMemo(() => generateControlLogs(), []);

  return (
    <div className="glass-card rounded-xl p-5 animate-fade-in flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <History className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-semibold">Aktivitas Terakhir</h3>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs text-primary hover:text-primary hover:bg-primary/5 gap-1">
          <Link to="/history">
            Lihat Semua <ArrowRight className="w-3 h-3" />
          </Link>
        </Button>
      </div>

      <div className="space-y-4 flex-1">
        {activities.map((activity, index) => {
          const isLamp = activity.deviceType === 'lamp';
          const isOn = activity.action === 'turn_on';
          const isReplace = activity.action === 'replace';
          const Icon = isLamp ? Lightbulb : Wind;

          return (
            <div 
              key={activity.id}
              className="flex items-start gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors group border border-transparent hover:border-border/50"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn(
                "p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110",
                isReplace ? "bg-warning/10 text-warning" : (isLamp ? "bg-warning/10 text-warning" : "bg-accent/10 text-accent")
              )}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold truncate">
                    {isReplace ? 'Penggantian Lampu' : (isLamp ? 'Kontrol Lampu' : 'Kontrol AC')}
                  </p>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted/50 px-2 py-0.5 rounded-full">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: id })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  <span className="font-semibold text-foreground">{activity.userName}</span>
                  {isReplace ? ` mengganti ${activity.lampName || 'lampu'}` : ` ${isOn ? 'menyalakan' : 'mematikan'} perangkat`} di 
                  <span className="font-semibold text-foreground"> {activity.roomName}</span>
                </p>
                {isReplace && (
                  <div className="mt-2 flex gap-2">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-warning/5 text-warning border border-warning/10 font-bold uppercase">Maintenance</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
