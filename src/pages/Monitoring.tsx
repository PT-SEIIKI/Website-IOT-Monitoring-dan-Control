import { useState, useMemo, useEffect } from 'react';
import { socket } from '@/lib/socket';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockRooms, ELECTRICITY_TARIFF, generatePowerChartData } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, Cell
} from 'recharts';
import { Download, Calendar, Zap, Wallet, Activity, Lightbulb } from 'lucide-react';
import { format, subDays, subHours } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type DateRange = 'today' | 'yesterday' | '7days' | '30days';
type DeviceFilter = 'all' | 'lamp';

interface PowerLogEntry {
  id: number;
  timestamp: Date;
  roomName: string;
  deviceType: 'lamp';
  powerWatt: number;
  kwh: number;
  cost: number;
}

interface IndividualLamp {
  id: number;
  name: string;
  roomName: string;
  roomId: number;
  status: boolean;
  wattage: number;
  lastSeen: Date;
  totalKwh: number;
  totalCost: number;
}

function generateMonitoringData(dateRange: DateRange, deviceFilter: DeviceFilter): PowerLogEntry[] {
  const now = new Date();
  const entries: PowerLogEntry[] = [];
  
  const hoursToGenerate = dateRange === 'today' ? 24 : 
                          dateRange === 'yesterday' ? 24 :
                          dateRange === '7days' ? 168 : 720;
  
  const startOffset = dateRange === 'yesterday' ? 24 : 0;
  
  for (let i = 0; i < 50; i++) {
    const randomHours = Math.floor(Math.random() * hoursToGenerate) + startOffset;
    const room = mockRooms[Math.floor(Math.random() * mockRooms.length)];
    
    const powerWatt = 50 + Math.random() * 50;
    const duration = 0.5 + Math.random() * 2;
    const kwh = (powerWatt * duration) / 1000;
    
    entries.push({
      id: i + 1,
      timestamp: subHours(now, randomHours),
      roomName: room.name,
      deviceType: 'lamp',
      powerWatt: Math.round(powerWatt),
      kwh: parseFloat(kwh.toFixed(3)),
      cost: parseFloat((kwh * ELECTRICITY_TARIFF).toFixed(0)),
    });
  }
  
  return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

function generateIndividualLampData(): IndividualLamp[] {
  const lamps: IndividualLamp[] = [];
  
  mockRooms.forEach(room => {
    for (let i = 1; i <= 6; i++) {
      const isOn = Math.random() > 0.6;
      const hoursUsed = isOn ? 2 + Math.random() * 6 : 0;
      const kwhUsed = (3.6 * hoursUsed) / 1000;
      
      lamps.push({
        id: i,
        name: `Lampu ${i}`,
        roomName: room.name,
        roomId: room.id,
        status: isOn,
        wattage: 3.6,
        lastSeen: new Date(),
        totalKwh: parseFloat(kwhUsed.toFixed(4)),
        totalCost: parseFloat((kwhUsed * ELECTRICITY_TARIFF).toFixed(0)),
      });
    }
  });
  
  return lamps;
}

export default function Monitoring() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>('all');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [realtimeDevices, setRealtimeDevices] = useState<any[]>([]);
  const [individualLamps, setIndividualLamps] = useState<IndividualLamp[]>([]);
  const [energyData, setEnergyData] = useState<Record<number, any>>({});
  const [currentTariff, setCurrentTariff] = useState(ELECTRICITY_TARIFF);

  useEffect(() => {
    const fetchTariff = () => {
      fetch('/api/settings/electricity_tariff')
        .then(res => res.json())
        .then(data => {
          if (data.value) setCurrentTariff(parseFloat(data.value));
        });
    };

    const fetchInitialDevices = () => {
      fetch('/api/devices')
        .then(res => res.json())
        .then(devices => {
          if (Array.isArray(devices)) {
            setIndividualLamps(devices.map(d => ({
              id: d.id,
              name: d.name,
              roomName: "Main Monitoring Room",
              roomId: 1,
              status: d.status,
              wattage: d.value || 3.6,
              lastSeen: new Date(d.lastSeen),
              totalKwh: d.kwh || 0,
              totalCost: Math.round((d.kwh || 0) * currentTariff),
            })));
          }
        });
    };

    fetchTariff();
    fetchInitialDevices();
    window.addEventListener('tariff_updated', fetchTariff);

    socket.on("device_update", (updatedDevice) => {
      setRealtimeDevices(prev => {
        const index = prev.findIndex(d => d.id === updatedDevice.id);
        if (index !== -1) {
          const newDevices = [...prev];
          newDevices[index] = updatedDevice;
          return newDevices;
        }
        return [updatedDevice, ...prev];
      });

      // Update individual lamps state for table/cards
      setIndividualLamps(prev => {
        const index = prev.findIndex(l => l.id === updatedDevice.id);
        if (index !== -1) {
          const newLamps = [...prev];
          newLamps[index] = {
            ...newLamps[index],
            status: updatedDevice.status,
            totalKwh: updatedDevice.kwh || 0,
            totalCost: Math.round((updatedDevice.kwh || 0) * currentTariff)
          };
          return newLamps;
        }
        return prev;
      });
    });

    socket.on("energy_update", (data) => {
      // data: {"type":"relay_energy","relay_id":1,"kwh":0.000106,"timestamp":120046}
      setEnergyData(prev => ({
        ...prev,
        [data.relay_id]: data
      }));
    });

    return () => {
      socket.off("device_update");
      socket.off("energy_update");
    };
  }, []);

  const powerData = useMemo(() => generatePowerChartData(), []);
  const monitoringLogs = useMemo(() => {
    return mergedLamps.flatMap(lamp => {
      // Create a few log entries for each lamp based on its current state
      return [{
        id: lamp.id,
        timestamp: lamp.lastSeen,
        roomName: lamp.roomName,
        deviceType: 'lamp' as const,
        powerWatt: lamp.wattage,
        kwh: lamp.totalKwh,
        cost: lamp.totalCost
      }];
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [mergedLamps]);
  const individualLampData = useMemo(() => generateIndividualLampData(), []);

  const mergedLamps = useMemo(() => {
    return individualLamps.map(lamp => {
      const energy = energyData[lamp.id];
      if (energy) {
        return {
          ...lamp,
          totalKwh: energy.kwh,
          totalCost: Math.round(energy.kwh * currentTariff)
        };
      }
      return lamp;
    });
  }, [individualLamps, energyData, currentTariff]);

  const filteredLogs = useMemo(() => {
    if (roomFilter === 'all') return monitoringLogs;
    return monitoringLogs.filter(log => log.roomName === roomFilter);
  }, [monitoringLogs, roomFilter]);

  const filteredLamps = useMemo(() => {
    if (roomFilter === 'all') return mergedLamps;
    return mergedLamps.filter(lamp => lamp.roomName === roomFilter);
  }, [mergedLamps, roomFilter]);

  const summary = useMemo(() => {
    const totalKwh = filteredLamps.reduce((sum, lamp) => sum + (lamp.totalKwh || 0), 0);
    const totalCost = filteredLamps.reduce((sum, lamp) => sum + (lamp.totalCost || 0), 0);
    const avgPower = filteredLamps.length > 0 
      ? filteredLamps.reduce((sum, lamp) => sum + lamp.wattage, 0) / filteredLamps.length 
      : 0;

    return {
      totalKwh: totalKwh.toFixed(6),
      totalCost: totalCost.toLocaleString(),
      avgPower: avgPower.toFixed(1),
      totalLamps: filteredLamps.length,
      lampsOn: filteredLamps.filter(l => l.status).length,
    };
  }, [filteredLamps]);

  // Per-lamp comparison data for chart
  const lampComparisonData = useMemo(() => {
    return filteredLamps
      .map(lamp => ({
        name: `${lamp.roomName} - ${lamp.name}`,
        kwh: lamp.totalKwh
      }))
      .sort((a, b) => b.kwh - a.kwh)
      .slice(0, 10);
  }, [filteredLamps]);

  return (
    <div className="min-h-screen">
      <Header 
        title="Power Monitoring" 
        subtitle="Pantau konsumsi daya listrik real-time"
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <Select value={dateRange} onValueChange={(v: DateRange) => setDateRange(v)}>
              <SelectTrigger className="w-[160px] bg-muted/50">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="yesterday">Kemarin</SelectItem>
                <SelectItem value="7days">7 Hari</SelectItem>
                <SelectItem value="30days">30 Hari</SelectItem>
              </SelectContent>
            </Select>

            <Select value={deviceFilter} onValueChange={(v: DeviceFilter) => setDeviceFilter(v)}>
              <SelectTrigger className="w-[140px] bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Lampu</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roomFilter} onValueChange={setRoomFilter}>
              <SelectTrigger className="w-[180px] bg-muted/50">
                <SelectValue placeholder="Pilih ruangan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Ruangan</SelectItem>
                {mockRooms.map(room => (
                  <SelectItem key={room.id} value={room.name}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isAdmin && (
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Excel
            </Button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm">Total kWh</span>
            </div>
            <p className="text-2xl font-bold font-mono">{summary.totalKwh}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Wallet className="w-4 h-4 text-success" />
              <span className="text-sm">Total Biaya</span>
            </div>
            <p className="text-2xl font-bold font-mono">Rp {summary.totalCost}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Power Trend */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-lg font-semibold mb-4">Trend Konsumsi</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={powerData}>
                  <defs>
                    <linearGradient id="monitorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(187 92% 50%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(187 92% 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" vertical={false} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(222 47% 8%)', 
                      border: '1px solid hsl(217 33% 17%)',
                      borderRadius: '8px'
                    }}
                  />
                  <Area type="monotone" dataKey="kwh" stroke="hsl(187 92% 50%)" strokeWidth={2} fill="url(#monitorGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lamp Comparison */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-lg font-semibold mb-4">Perbandingan per Lampu (kWh)</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lampComparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(210 40% 98%)', fontSize: 11 }} width={120} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(222 47% 8%)', 
                      border: '1px solid hsl(217 33% 17%)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value} kWh`, 'Konsumsi']}
                  />
                  <Bar dataKey="kwh" radius={[0, 4, 4, 0]}>
                    {lampComparisonData.map((_, index) => (
                      <Cell key={index} fill={index === 0 ? 'hsl(38 92% 50%)' : 'hsl(217 91% 60%)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-lg font-semibold">Log Konsumsi</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Waktu</TableHead>
                  <TableHead>Ruangan</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead className="text-right">Power</TableHead>
                  <TableHead className="text-right">kWh</TableHead>
                  <TableHead className="text-right">Biaya</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.slice(0, 15).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {format(log.timestamp, 'dd MMM HH:mm', { locale: id })}
                    </TableCell>
                    <TableCell>{log.roomName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
                        Lampu
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{log.powerWatt}W</TableCell>
                    <TableCell className="text-right font-mono text-accent">{log.kwh}</TableCell>
                    <TableCell className="text-right font-mono">Rp {log.cost.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
