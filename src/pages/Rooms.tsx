import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { RoomCard } from '@/components/rooms/RoomCard';
import { mockRooms as initialRooms } from '@/data/mockData';
import { Room, Lamp } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Search, Grid3X3, List, Power, PowerOff, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { socket } from '@/lib/socket';

export default function Rooms() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [searchQuery, setSearchQuery] = useState('');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const isAdmin = user?.role === 'admin';

  // Get unique floors and buildings
  const floors = useMemo(() => [...new Set(rooms.map(r => r.floor))].sort(), [rooms]);
  const buildings = useMemo(() => [...new Set(rooms.map(r => r.building))].sort(), [rooms]);

  // Filter rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           room.building.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFloor = floorFilter === 'all' || room.floor === parseInt(floorFilter);
      const matchesBuilding = buildingFilter === 'all' || room.building === buildingFilter;
      return matchesSearch && matchesFloor && matchesBuilding;
    });
  }, [rooms, searchQuery, floorFilter, buildingFilter]);

  useEffect(() => {
    // Fetch initial device states
    const fetchDevices = async () => {
      try {
        const response = await fetch('/api/devices');
        if (response.ok) {
          const devices = await response.json();
          setRooms(prev => prev.map(room => {
            if (room.esp32Id === 'power-monitor-001') {
              const currentLamps = Array.from({ length: 6 }, (_, i) => {
                const device = devices.find((d: any) => d.id === i + 1);
                return {
                  id: i + 1,
                  name: `Lampu ${i + 1}`,
                  status: device ? device.status : false,
                  wattage: device ? device.value : 3.6
                };
              });
              return {
                ...room,
                lamps: currentLamps,
                lampStatus: currentLamps.some(l => l.status),
                currentPowerWatt: devices.reduce((sum: number, d: any) => sum + (d.status ? d.value : 0), 0)
              };
            }
            return room;
          }));
        }
      } catch (error) {
        console.error("Error fetching devices:", error);
      }
    };

    fetchDevices();

    socket.on("summary_update", (data: any) => {
      console.log("Rooms received summary update:", data);
      setRooms(prevRooms => prevRooms.map(room => {
        // In this implementation, power-monitor-001 represents our room 1.0.1
        if (room.esp32Id === 'power-monitor-001') { 
          return {
            ...room,
            currentPowerWatt: Math.round(data.power_total || 0),
            isOnline: true,
            lastSeen: new Date()
          };
        }
        return room;
      }));
    });

    socket.on("device_update", (updatedDevice: any) => {
      setRooms(prev => prev.map(room => {
        // Individual lamp updates (1-6)
        const isTargetDevice = updatedDevice.id >= 1 && updatedDevice.id <= 6;
        
        if (isTargetDevice) {
          const currentLamps = room.lamps || Array.from({ length: 6 }, (_, i) => ({
            id: i + 1,
            name: `Lampu ${i + 1}`,
            status: false,
            wattage: 3.6
          }));

          const updatedLamps = currentLamps.map(l => 
            l.id === updatedDevice.id ? { ...l, status: updatedDevice.status } : l
          );

          return {
            ...room,
            lamps: updatedLamps,
            lampStatus: updatedLamps.some(l => l.status),
            currentPowerWatt: updatedDevice.value || room.currentPowerWatt,
            lastSeen: new Date(updatedDevice.lastSeen)
          };
        }
        return room;
      }));
    });

    socket.on("master_update", (data) => {
      console.log("Master update:", data);
      // Optional: update master status in UI if needed
    });

    return () => {
      socket.off("device_update");
      socket.off("master_update");
    };
  }, []);

  const handleToggleLamp = (roomId: number, status: boolean) => {
    socket.emit("control_device", { 
      deviceId: roomId, 
      status, 
      type: 'light' 
    });
    
    setRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          lampStatus: status,
          currentPowerWatt: status ? room.currentPowerWatt + 75 : room.currentPowerWatt - 75
        };
      }
      return room;
    }));

    const roomName = rooms.find(r => r.id === roomId)?.name;
    toast({
      title: status ? 'Lampu dinyalakan' : 'Lampu dimatikan',
      description: `${roomName}`,
    });
  };


  const handleUpdateLamp = (roomId: number, lampId: number, data: Partial<Lamp>) => {
    setRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        // Strict 6 relay mapping (all lamps)
        const currentLamps = room.lamps || Array.from({ length: 6 }, (_, i) => ({
          id: i + 1,
          name: `Lampu ${i + 1}`,
          status: false,
          brand: 'Philips',
          wattage: 3.6,
          technician: 'Staff IT',
          lastChanged: new Date(),
        }));
        
        const updatedLamps = currentLamps.map(l => 
          l.id === lampId ? { ...l, ...data } : l
        );

        if (data.status !== undefined) {
          socket.emit("control_device", {
            deviceId: lampId,
            status: data.status,
            value: 0
          });
        }

        if (data.brand) {
          toast({
            title: 'Lampu Diganti',
            description: `Lampu ${lampId} di ${room.name} berhasil diperbarui.`,
          });
        }

        return {
          ...room,
          lamps: updatedLamps,
          lampStatus: updatedLamps.some(l => l.status)
        };
      }
      return room;
    }));
  };

  const handleBulkTurnOffLamps = () => {
    setRooms(prev => prev.map(room => ({
      ...room,
      lampStatus: false,
      currentPowerWatt: 0,
      lamps: (room.lamps || []).map(l => ({ ...l, status: false }))
    })));
    toast({
      title: 'Semua lampu dimatikan',
      description: `${rooms.filter(r => r.lampStatus).length} lampu telah dimatikan`,
    });
  };


  const activeStats = useMemo(() => ({
    lampsOn: rooms.filter(r => r.lampStatus).length,
    online: rooms.filter(r => r.isOnline).length,
  }), [rooms]);

  return (
    <div className="min-h-screen pb-10">
      <Header 
        title="Kontrol Ruangan" 
        subtitle="Kelola perangkat IoT di setiap ruangan secara real-time"
      />

      <div className="p-6 space-y-6 max-w-[1600px] ">
        {/* Actions */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === 'grid' ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === 'list' ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/5 border border-success/10 text-success">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="font-bold">{activeStats.online} Online</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-warning/5 border border-warning/10 text-warning">
            <Power className="w-3 h-3" />
            <span className="font-bold">{activeStats.lampsOn} Lampu Aktif</span>
          </div>
        </div>

        {/* Rooms Grid */}
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
            : "space-y-4"
        )}>
          {filteredRooms.map((room, index) => (
            <div 
              key={room.id}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <RoomCard
                room={room}
                onToggleLamp={handleToggleLamp}
                onUpdateLamp={handleUpdateLamp}
              />
            </div>
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-xl font-bold text-muted-foreground">Tidak ada ruangan ditemukan</p>
            <p className="text-muted-foreground">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        )}
      </div>

      
    </div>
  );
}
