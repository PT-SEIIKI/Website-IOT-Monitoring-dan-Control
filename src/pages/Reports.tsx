import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockRooms, ELECTRICITY_TARIFF, generatePowerChartData } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { Download, FileText, Calendar, TrendingUp, TrendingDown, Building2, Zap, Wallet } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Reports() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [dateRange, setDateRange] = useState('7days');

  const powerData = useMemo(() => generatePowerChartData(), []);

  // Generate summary data
  const summaryData = useMemo(() => {
    const totalKwh = 847.32;
    const totalCost = totalKwh * ELECTRICITY_TARIFF;
    const previousKwh = 912.45;
    const change = ((totalKwh - previousKwh) / previousKwh) * 100;

    return {
      totalKwh: totalKwh.toFixed(2),
      totalCost: Math.round(totalCost).toLocaleString(),
      change: change.toFixed(1),
      isPositive: change < 0,
      avgDaily: (totalKwh / 7).toFixed(2),
      peakHour: '13:00 - 14:00',
      mostEfficient: 'Ruang 301',
      leastEfficient: 'Lab Komputer 2',
    };
  }, []);

  // Floor breakdown data
  const floorData = useMemo(() => [
    { name: 'Lantai 1', kwh: 312, cost: 450784 },
    { name: 'Lantai 2', kwh: 428, cost: 618329 },
    { name: 'Lantai 3', kwh: 107, cost: 154583 },
  ], []);

  // Device type breakdown
  const deviceBreakdown = useMemo(() => [
    { name: 'Lampu', value: 35, color: 'hsl(38 92% 50%)' },
    { name: 'AC', value: 65, color: 'hsl(187 92% 50%)' },
  ], []);

  // Building comparison
  const buildingData = useMemo(() => [
    { name: 'Gedung A', kwh: 523.4 },
    { name: 'Gedung B', kwh: 278.9 },
    { name: 'Gedung C', kwh: 45.02 },
  ], []);

  return (
    <div className="min-h-screen">
      <Header 
        title="Reports & Analytics" 
        subtitle="Analisis konsumsi dan laporan penggunaan"
      />

      <div className="p-6 space-y-6">
        {/* Actions */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px] bg-muted/50">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 Hari Terakhir</SelectItem>
                <SelectItem value="30days">30 Hari Terakhir</SelectItem>
                <SelectItem value="90days">90 Hari Terakhir</SelectItem>
              </SelectContent>
            </Select>

            {isAdmin && (
              <Button className="gap-2 bg-gradient-to-r from-primary to-accent">
                <FileText className="w-4 h-4" />
                Generate Report
              </Button>
            )}
          </div>

          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                PDF
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Excel
              </Button>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <Zap className="w-5 h-5 text-accent" />
              <span>Total Konsumsi</span>
            </div>
            <p className="text-3xl font-bold font-mono">{summaryData.totalKwh}</p>
            <p className="text-sm text-muted-foreground">kWh</p>
            <div className={`flex items-center gap-1 mt-2 text-sm ${summaryData.isPositive ? 'text-success' : 'text-destructive'}`}>
              {summaryData.isPositive ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              <span>{Math.abs(parseFloat(summaryData.change))}% vs periode sebelumnya</span>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <Wallet className="w-5 h-5 text-success" />
              <span>Total Biaya</span>
            </div>
            <p className="text-3xl font-bold font-mono">Rp {summaryData.totalCost}</p>
            <p className="text-sm text-muted-foreground">periode ini</p>
          </div>

          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <TrendingUp className="w-5 h-5 text-warning" />
              <span>Rata-rata Harian</span>
            </div>
            <p className="text-3xl font-bold font-mono">{summaryData.avgDaily}</p>
            <p className="text-sm text-muted-foreground">kWh/hari</p>
          </div>

          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <Building2 className="w-5 h-5 text-primary" />
              <span>Peak Hour</span>
            </div>
            <p className="text-2xl font-bold font-mono">{summaryData.peakHour}</p>
            <p className="text-sm text-muted-foreground">waktu puncak</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Consumption Trend */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-lg font-semibold mb-4">Trend Konsumsi</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={powerData}>
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
                  <Line type="monotone" dataKey="kwh" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Building Comparison */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-lg font-semibold mb-4">Konsumsi per Gedung</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buildingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(210 40% 98%)', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(222 47% 8%)', 
                      border: '1px solid hsl(217 33% 17%)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value} kWh`, 'Konsumsi']}
                  />
                  <Bar dataKey="kwh" radius={[4, 4, 0, 0]}>
                    {buildingData.map((_, index) => (
                      <Cell key={index} fill={index === 0 ? 'hsl(217 91% 60%)' : index === 1 ? 'hsl(187 92% 50%)' : 'hsl(38 92% 50%)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Device Breakdown */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-lg font-semibold mb-4">Breakdown Perangkat</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deviceBreakdown.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(222 47% 8%)', 
                      border: '1px solid hsl(217 33% 17%)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value}%`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {deviceBreakdown.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floor Breakdown */}
          <div className="glass-card rounded-xl p-5 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Breakdown per Lantai</h3>
            <div className="space-y-4">
              {floorData.map((floor, index) => (
                <div key={floor.name} className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{floor.name}</span>
                    <span className="font-mono text-accent">{floor.kwh} kWh</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(floor.kwh / 500) * 100}%`,
                        backgroundColor: index === 0 ? 'hsl(217 91% 60%)' : index === 1 ? 'hsl(187 92% 50%)' : 'hsl(38 92% 50%)'
                      }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Biaya: Rp {floor.cost.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Efficiency Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-5 border-success/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-success/10">
                <TrendingDown className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">Ruangan Paling Efisien</h3>
                <p className="text-sm text-muted-foreground">Konsumsi terendah periode ini</p>
              </div>
            </div>
            <p className="text-2xl font-bold">{summaryData.mostEfficient}</p>
            <p className="text-sm text-muted-foreground mt-1">Rata-rata 12.3 kWh/hari</p>
          </div>

          <div className="glass-card rounded-xl p-5 border-warning/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-warning/10">
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold">Perlu Perhatian</h3>
                <p className="text-sm text-muted-foreground">Konsumsi tertinggi periode ini</p>
              </div>
            </div>
            <p className="text-2xl font-bold">{summaryData.leastEfficient}</p>
            <p className="text-sm text-muted-foreground mt-1">Rata-rata 89.7 kWh/hari</p>
          </div>
        </div>
      </div>
    </div>
  );
}
