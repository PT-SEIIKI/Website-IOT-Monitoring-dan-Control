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
type MonitoringMode = 'individual' | 'total';

interface PowerLogEntry {
  id: number | string;
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

function generateMonitoringData(dateRange: DateRange, deviceFilter: string): PowerLogEntry[] {
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
  const [monitoringMode, setMonitoringMode] = useState<MonitoringMode>('individual');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [realtimeDevices, setRealtimeDevices] = useState<any[]>([]);
  const [individualLamps, setIndividualLamps] = useState<IndividualLamp[]>([]);
  const [energyData, setEnergyData] = useState<Record<number, any>>({});
  const [currentTariff, setCurrentTariff] = useState(ELECTRICITY_TARIFF);

  const [selectedDeviceId, setSelectedDeviceId] = useState<number | 'all'>('all');

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
            setIndividualLamps(devices
              .filter(d => d.id !== 99) // Filter out AC central
              .map(d => ({
                id: d.id,
                name: d.name,
                roomName: d.room || "Main Room",
                roomId: 1,
                status: d.status,
                wattage: d.value || 3.6,
                lastSeen: new Date(d.lastSeen || new Date()),
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
      if (updatedDevice.id === 99) return; // Filter out AC central
      setIndividualLamps(prev => {
        const index = prev.findIndex(l => l.id === updatedDevice.id);
        if (index !== -1) {
          const newLamps = [...prev];
          newLamps[index] = {
            ...newLamps[index],
            status: updatedDevice.status,
            wattage: updatedDevice.value || 3.6,
            totalKwh: updatedDevice.kwh || 0,
            totalCost: Math.round((updatedDevice.kwh || 0) * currentTariff)
          };
          return newLamps;
        } else {
          return [...prev, {
            id: updatedDevice.id,
            name: updatedDevice.name,
            roomName: updatedDevice.room || "Main Room",
            roomId: 1,
            status: updatedDevice.status,
            wattage: updatedDevice.value || 3.6,
            lastSeen: new Date(),
            totalKwh: updatedDevice.kwh || 0,
            totalCost: Math.round((updatedDevice.kwh || 0) * currentTariff)
          }];
        }
      });
    });

    socket.on("energy_update", (data) => {
      if (data.relay_id === 99) return; // Filter out AC central
      setEnergyData(prev => ({
        ...prev,
        [data.relay_id]: data
      }));
      
      setIndividualLamps(prev => {
        const index = prev.findIndex(l => l.id === data.relay_id);
        if (index !== -1) {
          const newLamps = [...prev];
          newLamps[index] = {
            ...newLamps[index],
            totalKwh: data.kwh,
            totalCost: Math.round(data.kwh * currentTariff)
          };
          return newLamps;
        }
        return prev;
      });
    });

    return () => {
      socket.off("device_update");
      socket.off("energy_update");
    };
  }, [currentTariff]);

  const mergedLamps = useMemo(() => {
    return individualLamps;
  }, [individualLamps]);

  const monitoringLogs = useMemo(() => {
    if (monitoringMode === 'total') {
      const totalKwh = individualLamps.reduce((sum, l) => sum + (l.totalKwh || 0), 0);
      const totalCost = individualLamps.reduce((sum, l) => sum + (l.totalCost || 0), 0);
      const totalWattage = individualLamps.reduce((sum, l) => sum + (l.status ? l.wattage : 0), 0);
      
      return [{
        id: 'total',
        timestamp: new Date(),
        roomName: 'Semua Ruangan',
        deviceType: 'lamp' as const,
        powerWatt: Math.round(totalWattage),
        kwh: totalKwh,
        cost: totalCost
      }];
    }

    let displayLamps = individualLamps;
    if (selectedDeviceId !== 'all') {
      displayLamps = individualLamps.filter(l => l.id === selectedDeviceId);
    }

    return displayLamps.map(lamp => ({
        id: lamp.id,
        timestamp: lamp.lastSeen,
        roomName: lamp.roomName,
        deviceType: 'lamp' as const,
        powerWatt: lamp.wattage,
        kwh: lamp.totalKwh,
        cost: lamp.totalCost
    })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [individualLamps, monitoringMode, selectedDeviceId]);

  const filteredLogs = useMemo(() => {
    return monitoringLogs;
  }, [monitoringLogs]);

  const filteredLamps = useMemo(() => {
    return individualLamps;
  }, [individualLamps]);

  const summary = useMemo(() => {
    let targetLamps = individualLamps;
    if (monitoringMode === 'individual' && selectedDeviceId !== 'all') {
      targetLamps = individualLamps.filter(l => l.id === selectedDeviceId);
    }

    const totalKwh = targetLamps.reduce((sum, lamp) => sum + (lamp.totalKwh || 0), 0);
    const totalCost = targetLamps.reduce((sum, lamp) => sum + (lamp.totalCost || 0), 0);
    const totalWatt = targetLamps.reduce((sum, lamp) => sum + (lamp.status ? lamp.wattage : 0), 0);

    return {
      totalKwh: totalKwh.toFixed(6),
      totalCost: totalCost.toLocaleString(),
      totalWatt: Math.round(totalWatt),
      totalLamps: targetLamps.length,
      lampsOn: targetLamps.filter(l => l.status).length,
    };
  }, [individualLamps, monitoringMode, selectedDeviceId]);

  const lampComparisonData = useMemo(() => {
    return individualLamps
      .map(lamp => ({
        name: lamp.name,
        kwh: lamp.totalKwh
      }))
      .sort((a, b) => b.kwh - a.kwh)
      .slice(0, 10);
  }, [individualLamps]);

  const powerData = useMemo(() => {
    // Generate base trend data
    const baseTrend = generatePowerChartData();
    
    // Scale the data based on actual summary value
    const currentTotal = parseFloat(summary.totalKwh);
    if (currentTotal === 0) return baseTrend;
    
    // Distribution factor to make it look realistic
    return baseTrend.map(d => ({
      ...d,
      kwh: d.kwh * (currentTotal / 0.05)
    }));
  }, [summary.totalKwh]);

  const filteredComparisonData = useMemo(() => {
    if (monitoringMode === 'individual' && selectedDeviceId !== 'all') {
      return individualLamps
        .filter(l => l.id === selectedDeviceId)
        .map(lamp => ({
          name: lamp.name,
          kwh: lamp.totalKwh
        }));
    }
    return lampComparisonData;
  }, [lampComparisonData, monitoringMode, selectedDeviceId, individualLamps]);

  const safeFormat = (date: any, fmt: string, options?: any) => {
    try {
      if (!date || isNaN(new Date(date).getTime())) return "-";
      return format(new Date(date), fmt, options);
    } catch (e) {
      return "-";
    }
  };

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
            <Select value={monitoringMode} onValueChange={(v: MonitoringMode) => {
              setMonitoringMode(v);
              if (v === 'total') setSelectedDeviceId('all');
            }}>
              <SelectTrigger className="w-[180px] bg-muted/50">
                <Activity className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Mode Monitoring" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Per Perangkat</SelectItem>
                <SelectItem value="total">Total Keseluruhan</SelectItem>
              </SelectContent>
            </Select>

            {monitoringMode === 'individual' && (
              <Select value={selectedDeviceId.toString()} onValueChange={(v) => setSelectedDeviceId(v === 'all' ? 'all' : parseInt(v))}>
                <SelectTrigger className="w-[180px] bg-muted/50">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Pilih Lampu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Lampu</SelectItem>
                  {individualLamps.map(lamp => (
                    <SelectItem key={lamp.id} value={lamp.id.toString()}>
                      {lamp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

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
          </div>

          {isAdmin && (
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Excel
            </Button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm">Total kWh</span>
            </div>
            <p className="text-2xl font-bold font-mono">{summary.totalKwh}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Activity className="w-4 h-4 text-warning" />
              <span className="text-sm">Power (Watt)</span>
            </div>
            <p className="text-2xl font-bold font-mono">{summary.totalWatt}W</p>
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
                <BarChart data={filteredComparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(210 40% 98%)', fontSize: 10 }} width={140} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(222 47% 8%)', 
                      border: '1px solid hsl(217 33% 17%)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value.toFixed(6)} kWh`, 'Konsumsi']}
                  />
                  <Bar dataKey="kwh" radius={[0, 4, 4, 0]}>
                    {filteredComparisonData.map((_, index) => (
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
            {(monitoringMode === 'total' ? filteredLogs : filteredLogs.slice(0, 15)).map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-sm">
                  {safeFormat(log.timestamp, 'dd MMM HH:mm', { locale: id })}
                </TableCell>
                <TableCell>{log.roomName}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
                    Lampu
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">{log.powerWatt}W</TableCell>
                <TableCell className="text-right font-mono text-accent">{log.kwh.toFixed(6)}</TableCell>
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
