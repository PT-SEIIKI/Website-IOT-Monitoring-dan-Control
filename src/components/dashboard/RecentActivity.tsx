import { useMemo } from 'react';
import { generateControlLogs } from '@/data/mockData';
import { Lightbulb, Wind, Power, PowerOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export function RecentActivity() {
  const logs = useMemo(() => generateControlLogs(), []);

  return (
    <div className="glass-card rounded-xl p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Aktivitas Terbaru</h3>
          <p className="text-sm text-muted-foreground">Log kontrol perangkat</p>
        </div>
      </div>

      <div className="space-y-4">
        {logs.map((log, index) => {
          const Icon = log.deviceType === 'lamp' ? Lightbulb : Wind;
          const ActionIcon = log.action === 'turn_on' ? Power : PowerOff;
          const isOn = log.action === 'turn_on';

          return (
            <div 
              key={log.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn(
                "p-2 rounded-lg",
                log.deviceType === 'lamp' ? "bg-warning/10" : "bg-accent/10"
              )}>
                <Icon className={cn(
                  "w-4 h-4",
                  log.deviceType === 'lamp' ? "text-warning" : "text-accent"
                )} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{log.roomName}</span>
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                    isOn ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                  )}>
                    <ActionIcon className="w-3 h-3" />
                    {isOn ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {log.userName} • {log.deviceType === 'lamp' ? 'Lampu' : 'AC'}
                </p>
              </div>

              <span className="text-xs text-muted-foreground shrink-0">
                {formatDistanceToNow(log.timestamp, { addSuffix: true, locale: id })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
