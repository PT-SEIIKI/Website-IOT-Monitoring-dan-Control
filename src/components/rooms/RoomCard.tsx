import { Room, Lamp } from '@/types';
import { ControlSwitch } from '@/components/ui/switch';
import { Lightbulb, Wifi, WifiOff, Zap, History, Settings2, Building2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { socket } from '@/lib/socket';
import { apiClient } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RoomCardProps {
  room: Room;
  onToggleLamp: (roomId: number, status: boolean) => void;
  onUpdateLamp?: (roomId: number, lampId: number, data: Partial<Lamp>) => void;
}

export function RoomCard({ room, onToggleLamp, onUpdateLamp }: RoomCardProps) {
  const [isLampLoading, setIsLampLoading] = useState(false);
  const [selectedLamp, setSelectedLamp] = useState<Lamp | null>(null);

  // Exactly 5 Lamps (Relay 1-5) and 1 AC (Relay 6)
  const lamps: Lamp[] = (room.lamps || []).filter(l => l.id >= 1 && l.id <= 5);
  
  if (lamps.length === 0) {
    for (let i = 1; i <= 5; i++) {
      lamps.push({ id: i, name: `Lampu ${i}`, status: false, wattage: 3.6 });
    }
  }


  const handleLampToggle = async (checked: boolean) => {
    setIsLampLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Turn on/off all individual lamps when master lamp is toggled
    if (room.lamps) {
      room.lamps.forEach(lamp => {
        if (lamp.id >= 1 && lamp.id <= 5) {
          // Only toggle if the lamp status doesn't match the desired state
          if (lamp.status !== checked) {
            handleIndividualLampToggle(lamp.id);
          }
        }
      });
    }
    
    onToggleLamp(room.id, checked);
    setIsLampLoading(false);
  };


  const handleReplaceLamp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      brand: formData.get('brand') as string,
      wattage: parseInt(formData.get('wattage') as string),
      technician: formData.get('technician') as string,
      lastChanged: new Date(),
    };
    if (selectedLamp && onUpdateLamp) {
      onUpdateLamp(room.id, selectedLamp.id, data);
    }
    setSelectedLamp(null);
  };

  const handleIndividualLampToggle = async (lampId: number) => {
    if (!room.isOnline) return;
    
    const targetLamp = lamps.find(l => l.id === lampId);
    if (targetLamp && onUpdateLamp) {
      const newStatus = !targetLamp.status;
      
      try {
        // Emit MQTT control command for individual lamp
        socket.emit("mqtt_control", {
          topic: `iot/monitoring/power-monitor-001/lamp/${lampId}`,
          message: {
            type: `lamp_${lampId}`,
            id: lampId,
            status: newStatus ? "on" : "off",
            value: newStatus ? 3.6 : 0,
            power: newStatus ? 3.6 : 0
          }
        });
        
        // Update local state
        onUpdateLamp(room.id, lampId, { status: newStatus });
        
      } catch (error) {
        console.error('Control failed:', error);
        
        // Try socket.io as fallback
        if (socket.connected) {
          socket.emit("mqtt_control", {
            topic: `iot/monitoring/power-monitor-001/lamp/${lampId}`,
            message: {
              type: `lamp_${lampId}`,
              id: lampId,
              status: newStatus ? "on" : "off",
              value: newStatus ? 3.6 : 0,
              power: newStatus ? 3.6 : 0
            }
          });
          onUpdateLamp(room.id, lampId, { status: newStatus });
        }
      }
    }
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

      {/* Visualisasi Lampu Individual */}
      <div className="mb-6 p-4 rounded-xl bg-muted/20 border border-border/50">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
            <Settings2 className="w-3 h-3" />
            Kontrol Lampu
          </p>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/20 text-primary uppercase tracking-tighter">
            Interactive Grid
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {lamps.map((lamp) => (
            <div key={lamp.id} className="relative group">
              <button
                onClick={(e) => handleIndividualLampToggle(lamp.id)}
                disabled={!room.isOnline}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-lg transition-all border group w-full",
                  lamp.status 
                    ? "bg-warning/10 border-warning/30 hover:bg-warning/20 shadow-[0_0_8px_rgba(234,179,8,0.15)]" 
                    : "bg-muted/50 border-transparent hover:bg-muted"
                )}
              >
                <Lightbulb className={cn(
                  "w-6 h-6 mb-1 transition-all duration-300",
                  lamp.status ? "text-warning fill-warning/20 scale-110" : "text-muted-foreground scale-100"
                )} />
                <span className="text-[10px] font-medium truncate w-full text-center">
                  L{lamp.id}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Replacement Dialog (Standalone) */}
      <Dialog open={!!selectedLamp} onOpenChange={(open) => !open && setSelectedLamp(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Log Pergantian: {selectedLamp?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReplaceLamp} className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right text-xs">Tanggal</Label>
              <Input id="date" value={format(new Date(), 'dd/MM/yyyy')} disabled className="col-span-3 h-9 text-sm" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="brand" className="text-right text-xs">Merek</Label>
              <Input id="brand" name="brand" defaultValue={selectedLamp?.brand} placeholder="Contoh: Philips" className="col-span-3 h-9 text-sm" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="wattage" className="text-right text-xs">Daya (W)</Label>
              <Input id="wattage" name="wattage" type="number" defaultValue={selectedLamp?.wattage} placeholder="15" className="col-span-3 h-9 text-sm" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="technician" className="text-right text-xs">Petugas</Label>
              <Input id="technician" name="technician" defaultValue={selectedLamp?.technician} placeholder="Nama petugas" className="col-span-3 h-9 text-sm" required />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button type="button" variant="ghost" onClick={() => setSelectedLamp(null)}>Batal</Button>
              <Button type="submit" className="flex-1">Simpan Data</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
              <p className="font-medium text-sm">Master Lampu</p>
              <p className="text-xs text-muted-foreground">
                {room.lampStatus ? 'Beberapa Menyala' : 'Semua Mati'}
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
