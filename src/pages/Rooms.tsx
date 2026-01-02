import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { RoomCard } from '@/components/rooms/RoomCard';
import { mockRooms as initialRooms } from '@/data/mockData';
import { Room } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Search, Grid3X3, List, Power, PowerOff, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const handleToggleLamp = (roomId: number, status: boolean) => {
    setRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        const newPower = status 
          ? room.currentPowerWatt + 75 
          : Math.max(0, room.currentPowerWatt - 75);
        return { ...room, lampStatus: status, currentPowerWatt: newPower };
      }
      return room;
    }));
    
    const roomName = rooms.find(r => r.id === roomId)?.name;
    toast({
      title: status ? 'Lampu dinyalakan' : 'Lampu dimatikan',
      description: `${roomName}`,
    });
  };

  const handleToggleAC = (roomId: number, status: boolean) => {
    setRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        const acPower = status ? 1200 : -1200;
        const newPower = Math.max(0, room.currentPowerWatt + acPower);
        return { ...room, acStatus: status, currentPowerWatt: newPower };
      }
      return room;
    }));

    const roomName = rooms.find(r => r.id === roomId)?.name;
    toast({
      title: status ? 'AC dinyalakan' : 'AC dimatikan',
      description: `${roomName}`,
    });
  };

  const handleBulkTurnOffLamps = () => {
    setRooms(prev => prev.map(room => ({
      ...room,
      lampStatus: false,
      currentPowerWatt: room.acStatus ? 1200 : 0,
    })));
    toast({
      title: 'Semua lampu dimatikan',
      description: `${rooms.filter(r => r.lampStatus).length} lampu telah dimatikan`,
    });
  };

  const handleBulkTurnOffACs = () => {
    setRooms(prev => prev.map(room => ({
      ...room,
      acStatus: false,
      currentPowerWatt: room.lampStatus ? 75 : 0,
    })));
    toast({
      title: 'Semua AC dimatikan',
      description: `${rooms.filter(r => r.acStatus).length} AC telah dimatikan`,
    });
  };

  const activeStats = useMemo(() => ({
    lampsOn: rooms.filter(r => r.lampStatus).length,
    acsOn: rooms.filter(r => r.acStatus).length,
    online: rooms.filter(r => r.isOnline).length,
  }), [rooms]);

  return (
    <div className="min-h-screen">
      <Header 
        title="Kontrol Ruangan" 
        subtitle="Kelola perangkat IoT di setiap ruangan"
      />

      <div className="p-6 space-y-6">
        {/* Filters & Actions */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 lg:flex-none lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari ruangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted/50"
              />
            </div>

            {/* Floor Filter */}
            <Select value={floorFilter} onValueChange={setFloorFilter}>
              <SelectTrigger className="w-[140px] bg-muted/50">
                <SelectValue placeholder="Lantai" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Lantai</SelectItem>
                {floors.map(floor => (
                  <SelectItem key={floor} value={floor.toString()}>
                    Lantai {floor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Building Filter */}
            <Select value={buildingFilter} onValueChange={setBuildingFilter}>
              <SelectTrigger className="w-[160px] bg-muted/50">
                <Building2 className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Gedung" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Gedung</SelectItem>
                {buildings.map(building => (
                  <SelectItem key={building} value={building}>
                    {building}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
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

          {/* Bulk Actions (Admin Only) */}
          {isAdmin && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkTurnOffLamps}
                className="border-warning/50 text-warning hover:bg-warning/10"
              >
                <PowerOff className="w-4 h-4 mr-2" />
                Matikan Semua Lampu
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkTurnOffACs}
                className="border-accent/50 text-accent hover:bg-accent/10"
              >
                <PowerOff className="w-4 h-4 mr-2" />
                Matikan Semua AC
              </Button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>{activeStats.online} online</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 text-warning">
            <Power className="w-3 h-3" />
            <span>{activeStats.lampsOn} lampu aktif</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent">
            <Power className="w-3 h-3" />
            <span>{activeStats.acsOn} AC aktif</span>
          </div>
        </div>

        {/* Rooms Grid */}
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
            : "space-y-3"
        )}>
          {filteredRooms.map((room, index) => (
            <div 
              key={room.id}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <RoomCard
                room={room}
                onToggleLamp={handleToggleLamp}
                onToggleAC={handleToggleAC}
              />
            </div>
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Tidak ada ruangan ditemukan</p>
            <p className="text-muted-foreground">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        )}
      </div>
    </div>
  );
}
