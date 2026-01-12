import { Room } from '@/types';
import { ControlSwitch } from '@/components/ui/switch';
import { Lightbulb, Wind, Wifi, WifiOff, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

import { Room, Lamp } from '@/types';
import { ControlSwitch } from '@/components/ui/switch';
import { Lightbulb, Wind, Wifi, WifiOff, Zap, History, Settings2, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
  onToggleAC: (roomId: number, status: boolean) => void;
  onUpdateLamp?: (roomId: number, lampId: number, data: Partial<Lamp>) => void;
}

export function RoomCard({ room, onToggleLamp, onToggleAC, onUpdateLamp }: RoomCardProps) {
  const [isLampLoading, setIsLampLoading] = useState(false);
  const [isACLoading, setIsACLoading] = useState(false);
  const [selectedLamp, setSelectedLamp] = useState<Lamp | null>(null);

  // Mock lamps if not present
  const lamps: Lamp[] = room.lamps || Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Lampu ${i + 1}`,
    status: room.lampStatus,
    brand: 'Philips',
    wattage: 15,
    technician: 'Staff IT',
    lastChanged: new Date(Date.now() - Math.random() * 1000000000),
  }));

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
        <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Settings2 className="w-3 h-3" />
          LAYOUT LAMPU INDIVIDUAL
        </p>
        <div className="grid grid-cols-5 gap-3">
          {lamps.map((lamp) => (
            <Dialog key={lamp.id}>
              <DialogTrigger asChild>
                <button
                  onClick={() => setSelectedLamp(lamp)}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-lg transition-all border group",
                    lamp.status 
                      ? "bg-warning/10 border-warning/30 hover:bg-warning/20 shadow-[0_0_8px_rgba(234,179,8,0.1)]" 
                      : "bg-muted/50 border-transparent hover:bg-muted"
                  )}
                >
                  <Lightbulb className={cn(
                    "w-6 h-6 mb-1 transition-colors",
                    lamp.status ? "text-warning fill-warning/20" : "text-muted-foreground"
                  )} />
                  <span className="text-[10px] font-medium truncate w-full text-center">
                    L{lamp.id}
                  </span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-warning" />
                    Log Pergantian: {lamp.name}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleReplaceLamp} className="space-y-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">Tanggal</Label>
                    <Input id="date" value={format(new Date(), 'dd/MM/yyyy')} disabled className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="brand" className="text-right">Merek</Label>
                    <Input id="brand" name="brand" defaultValue={lamp.brand} placeholder="Contoh: Philips" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="wattage" className="text-right">Daya (W)</Label>
                    <Input id="wattage" name="wattage" type="number" defaultValue={lamp.wattage} placeholder="15" className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="technician" className="text-right">Petugas</Label>
                    <Input id="technician" name="technician" defaultValue={lamp.technician} placeholder="Nama petugas" className="col-span-3" required />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Riwayat Terakhir
                    </h4>
                    <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
                      <p>Merek: {lamp.brand}</p>
                      <p>Daya: {lamp.wattage} Watt</p>
                      <p>Petugas: {lamp.technician}</p>
                      <p>Terakhir Ganti: {lamp.lastChanged ? format(lamp.lastChanged, 'dd MMM yyyy', { locale: id }) : '-'}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-4">
                    <Button type="submit" className="w-full">Simpan Data Pergantian</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ))}
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
              <p className="font-medium text-sm">Master Lampu</p>
              <p className="text-xs text-muted-foreground">
                {room.lampStatus ? 'Semua Menyala' : 'Semua Mati'}
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

}

}
