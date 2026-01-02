import { Room } from '@/types';
import { ControlSwitch } from '@/components/ui/switch';
import { Lightbulb, Wind, Wifi, WifiOff, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface RoomCardProps {
  room: Room;
  onToggleLamp: (roomId: number, status: boolean) => void;
  onToggleAC: (roomId: number, status: boolean) => void;
}

export function RoomCard({ room, onToggleLamp, onToggleAC }: RoomCardProps) {
  const [isLampLoading, setIsLampLoading] = useState(false);
  const [isACLoading, setIsACLoading] = useState(false);

  const handleLampToggle = async (checked: boolean) => {
    setIsLampLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onToggleLamp(room.id, checked);
    setIsLampLoading(false);
  };

  const handleACToggle = async (checked: boolean) => {
    setIsACLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onToggleAC(room.id, checked);
    setIsACLoading(false);
  };

  return (
    <div className={cn(
      "glass-card rounded-xl p-5 animate-fade-in transition-all duration-300 hover:border-primary/30",
      !room.isOnline && "opacity-60"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{room.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              Lantai {room.floor}
            </Badge>
            <span className="text-xs text-muted-foreground">{room.building}</span>
          </div>
        </div>
        
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
          room.isOnline 
            ? "bg-success/10 text-success" 
            : "bg-destructive/10 text-destructive"
        )}>
          {room.isOnline ? (
            <>
              <Wifi className="w-3 h-3" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Lamp Control */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg transition-all",
              room.lampStatus 
                ? "bg-warning/20 shadow-[0_0_12px_hsl(38_92%_50%_/_0.3)]" 
                : "bg-muted"
            )}>
              <Lightbulb className={cn(
                "w-5 h-5 transition-colors",
                room.lampStatus ? "text-warning" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <p className="font-medium text-sm">Lampu</p>
              <p className="text-xs text-muted-foreground">
                {room.lampStatus ? 'Menyala' : 'Mati'}
              </p>
            </div>
          </div>
          
          <ControlSwitch
            variant="lamp"
            checked={room.lampStatus}
            onCheckedChange={handleLampToggle}
            disabled={!room.isOnline}
            isLoading={isLampLoading}
          />
        </div>

        {/* AC Control */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg transition-all",
              room.acStatus 
                ? "bg-accent/20 shadow-[0_0_12px_hsl(187_92%_50%_/_0.3)]" 
                : "bg-muted"
            )}>
              <Wind className={cn(
                "w-5 h-5 transition-colors",
                room.acStatus ? "text-accent" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <p className="font-medium text-sm">AC</p>
              <p className="text-xs text-muted-foreground">
                {room.acStatus ? 'Menyala' : 'Mati'}
              </p>
            </div>
          </div>
          
          <ControlSwitch
            variant="ac"
            checked={room.acStatus}
            onCheckedChange={handleACToggle}
            disabled={!room.isOnline}
            isLoading={isACLoading}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          <span className="font-mono text-sm font-semibold text-accent">
            {room.currentPowerWatt.toLocaleString()} W
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(room.lastSeen, { addSuffix: true, locale: id })}
        </span>
      </div>
    </div>
  );
}
