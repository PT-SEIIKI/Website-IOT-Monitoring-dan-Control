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
import { Download, Calendar, Zap, Wallet, Activity, Lightbulb, Wind } from 'lucide-react';
import { format, subDays, subHours } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

type DateRange = 'today' | 'yesterday' | '7days' | '30days';
type DeviceFilter = 'all' | 'lamp' | 'ac';

interface PowerLogEntry {
  id: number;
  timestamp: Date;
  roomName: string;
  deviceType: 'lamp' | 'ac';
  powerWatt: number;
  kwh: number;
  cost: number;
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
    const deviceType = Math.random() > 0.5 ? 'lamp' : 'ac';
    
    if (deviceFilter !== 'all' && deviceFilter !== deviceType) continue;
    
    const powerWatt = deviceType === 'lamp' ? 50 + Math.random() * 50 : 1000 + Math.random() * 500;
    const duration = 0.5 + Math.random() * 2;
    const kwh = (powerWatt * duration) / 1000;
    
    entries.push({
      id: i + 1,
      timestamp: subHours(now, randomHours),
      roomName: room.name,
      deviceType,
      powerWatt: Math.round(powerWatt),
      kwh: parseFloat(kwh.toFixed(3)),
      cost: parseFloat((kwh * ELECTRICITY_TARIFF).toFixed(0)),
    });
  }
  
  return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export default function Monitoring() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>('all');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [realtimeDevices, setRealtimeDevices] = useState<any[]>([]);

  useEffect(() => {
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
    });

    return () => {
      socket.off("device_update");
    };
  }, []);

  const powerData = useMemo(() => generatePowerChartData(), []);
  const monitoringLogs = useMemo(() => generateMonitoringData(dateRange, deviceFilter), [dateRange, deviceFilter]);

  const filteredLogs = useMemo(() => {
    if (roomFilter === 'all') return monitoringLogs;
    return monitoringLogs.filter(log => log.roomName === roomFilter);
  }, [monitoringLogs, roomFilter]);

  const summary = useMemo(() => ({
    totalKwh: filteredLogs.reduce((sum, log) => sum + log.kwh, 0).toFixed(2),
    totalCost: filteredLogs.reduce((sum, log) => sum + log.cost, 0).toLocaleString(),
    avgPower: (filteredLogs.reduce((sum, log) => sum + log.powerWatt, 0) / (filteredLogs.length || 1)).toFixed(0),
    lampLogs: filteredLogs.filter(l => l.deviceType === 'lamp').length,
    acLogs: filteredLogs.filter(l => l.deviceType === 'ac').length,
  }), [filteredLogs]);

  // Room comparison data
  const roomComparisonData = useMemo(() => {
    const roomTotals: Record<string, number> = {};
    filteredLogs.forEach(log => {
      roomTotals[log.roomName] = (roomTotals[log.roomName] || 0) + log.kwh;
    });
    return Object.entries(roomTotals)
      .map(([name, kwh]) => ({ name, kwh: parseFloat(kwh.toFixed(2)) }))
      .sort((a, b) => b.kwh - a.kwh)
      .slice(0, 8);
  }, [filteredLogs]);

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
                <SelectItem value="all">Semua Device</SelectItem>
                <SelectItem value="lamp">Lampu</SelectItem>
                <SelectItem value="ac">AC</SelectItem>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm">Rata-rata</span>
            </div>
            <p className="text-2xl font-bold font-mono">{summary.avgPower}W</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Lightbulb className="w-4 h-4 text-warning" />
              <span className="text-sm">Log Lampu</span>
            </div>
            <p className="text-2xl font-bold font-mono">{summary.lampLogs}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Wind className="w-4 h-4 text-accent" />
              <span className="text-sm">Log AC</span>
            </div>
            <p className="text-2xl font-bold font-mono">{summary.acLogs}</p>
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

          {/* Room Comparison */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-lg font-semibold mb-4">Perbandingan Ruangan</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomComparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(210 40% 98%)', fontSize: 11 }} width={100} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(222 47% 8%)', 
                      border: '1px solid hsl(217 33% 17%)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value} kWh`, 'Konsumsi']}
                  />
                  <Bar dataKey="kwh" radius={[0, 4, 4, 0]}>
                    {roomComparisonData.map((_, index) => (
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
                      <Badge variant={log.deviceType === 'lamp' ? 'secondary' : 'outline'} className={
                        log.deviceType === 'lamp' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-accent/10 text-accent border-accent/20'
                      }>
                        {log.deviceType === 'lamp' ? 'Lampu' : 'AC'}
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
