import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { generatePowerChartData } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { socket } from '@/lib/socket';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Download, Calendar, Zap, Wallet, LayoutGrid } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { id } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Reports() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [dateRange, setDateRange] = useState('7days');
  const [dbDevices, setDbDevices] = useState<any[]>([]);
  const [selectedLampId, setSelectedLampId] = useState<string>('all');
  const [tariff, setTariff] = useState(1500);

  const [dailyEnergyLogs, setDailyEnergyLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/settings/electricity_tariff')
      .then(res => res.json())
      .then(data => {
        if (data.value) setTariff(parseFloat(data.value));
      });

    const fetchDevices = () => {
      fetch('/api/devices')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setDbDevices(data.filter(d => d.type === 'light'));
          }
        });
    };

    const fetchEnergyLogs = () => {
      fetch('/api/energy-history')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setDailyEnergyLogs(data);
          }
        });
    };

    fetchDevices();
    fetchEnergyLogs();
    socket.on("device_update", fetchDevices);
    socket.on("energy_update", () => {
      fetchDevices();
      fetchEnergyLogs();
    });
    return () => {
      socket.off("device_update", fetchDevices);
      socket.off("energy_update");
    };
  }, []);

  const filteredDevices = useMemo(() => {
    if (selectedLampId === 'all') return dbDevices;
    return dbDevices.filter(d => d.id.toString() === selectedLampId);
  }, [dbDevices, selectedLampId]);

  const totalKwhFiltered = useMemo(() => {
    return filteredDevices.reduce((sum, d) => sum + (d.kwh || 0), 0);
  }, [filteredDevices]);

  const totalKwhAll = useMemo(() => {
    return dbDevices.reduce((sum, d) => sum + (d.kwh || 0), 0);
  }, [dbDevices]);

  const powerData = useMemo(() => {
    // Group energy logs by time/date and filter by selected lamp
    let filteredLogs = dailyEnergyLogs;
    if (selectedLampId !== 'all') {
      filteredLogs = dailyEnergyLogs.filter(log => log.deviceId.toString() === selectedLampId);
    }

    if (filteredLogs.length === 0) {
      const baseTotal = selectedLampId === 'all' ? totalKwhAll : totalKwhFiltered;
      return [
        { time: '00:00', kwh: baseTotal * 0.1 },
        { time: '04:00', kwh: baseTotal * 0.15 },
        { time: '08:00', kwh: baseTotal * 0.4 },
        { time: '12:00', kwh: baseTotal * 0.7 },
        { time: '16:00', kwh: baseTotal * 0.9 },
        { time: '20:00', kwh: baseTotal * 1.0 },
      ];
    }

    // Transform dailyEnergy data into chart format
    // For simplicity, we'll sort and display the last few entries
    return filteredLogs
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10)
      .map(log => ({
        time: format(new Date(log.date), 'dd/MM HH:mm'),
        kwh: log.kwh
      }));
  }, [dailyEnergyLogs, selectedLampId, totalKwhAll, totalKwhFiltered]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Laporan Konsumsi Daya Kampus', 14, 22);
    doc.setFontSize(10);
    doc.text(`Tanggal: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}`, 14, 30);
    doc.text(`Tarif Listrik: Rp ${tariff.toLocaleString()}/kWh`, 14, 35);
    
    autoTable(doc, {
      startY: 45,
      head: [['Nama Lampu', 'Power (W)', 'Total Konsumsi (kWh)', 'Biaya (Rp)']],
      body: filteredDevices.map(d => [
        d.name, 
        `${d.value || 0}W`, 
        (d.kwh || 0).toFixed(6), 
        `Rp ${Math.round((d.kwh || 0) * tariff).toLocaleString()}`
      ]),
      foot: [['Total', '', totalKwhFiltered.toFixed(6), `Rp ${Math.round(totalKwhFiltered * tariff).toLocaleString()}`]],
      theme: 'grid',
    });
    
    doc.save(`Laporan-IoT-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const handleExportExcel = () => {
    const data = filteredDevices.map(d => ({
      'Nama Lampu': d.name,
      'Power (Watt)': d.value || 0,
      'Total Konsumsi (kWh)': d.kwh || 0,
      'Estimasi Biaya (Rp)': Math.round((d.kwh || 0) * tariff)
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Lampu");
    XLSX.writeFile(wb, `Laporan-IoT-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="min-h-screen pb-10">
      <Header 
        title="Laporan Konsumsi" 
        subtitle="Analisis penggunaan daya per lampu dan total kampus"
      />

      <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
        {/* Filters and Actions */}
        <div className="flex flex-wrap gap-4 items-center justify-between glass-card p-4 rounded-xl">
          <div className="flex flex-wrap gap-3">
            <Select value={selectedLampId} onValueChange={setSelectedLampId}>
              <SelectTrigger className="w-[200px] bg-muted/50">
                <LayoutGrid className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Pilih Lampu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Lampu</SelectItem>
                {dbDevices.map(d => (
                  <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px] bg-muted/50">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 Hari Terakhir</SelectItem>
                <SelectItem value="30days">30 Hari Terakhir</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPDF}>
              <Download className="w-4 h-4" /> PDF
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExportExcel}>
              <Download className="w-4 h-4" /> Excel
            </Button>
          </div>
        </div>

        {/* Total Consumption Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6 border-l-4 border-l-accent">
            <div className="flex items-center gap-3 text-muted-foreground mb-4">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <span className="font-semibold">{selectedLampId === 'all' ? 'Total Konsumsi Kampus' : 'Konsumsi Lampu'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-4xl font-bold font-mono text-accent">{totalKwhFiltered.toFixed(6)}</span>
              <span className="text-sm text-muted-foreground mt-1">Total kWh Terakumulasi</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 border-l-4 border-l-success">
            <div className="flex items-center gap-3 text-muted-foreground mb-4">
              <div className="p-2 bg-success/10 rounded-lg">
                <Wallet className="w-6 h-6 text-success" />
              </div>
              <span className="font-semibold">Estimasi Total Biaya</span>
            </div>
            <div className="flex flex-col">
              <span className="text-4xl font-bold font-mono text-success">
                Rp {Math.round(totalKwhFiltered * tariff).toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground mt-1">Berdasarkan Tarif Rp {tariff.toLocaleString()}/kWh</span>
            </div>
          </div>
        </div>

        {/* Graphics Section */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Grafik Penggunaan Daya</h3>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Real-time Data</Badge>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={powerData}>
                <defs>
                  <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(187 92% 50%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(187 92% 50%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'hsl(215 20% 55%)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(215 20% 55%)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'hsl(222 47% 8%)', 
                    border: '1px solid hsl(217 33% 17%)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number) => [`${value.toFixed(6)} kWh`, 'Konsumsi']}
                />
                <Area type="monotone" dataKey="kwh" stroke="hsl(187 92% 50%)" strokeWidth={3} fillOpacity={1} fill="url(#colorKwh)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="glass-card rounded-2xl overflow-hidden border border-border/50">
          <div className="p-5 border-b border-border bg-muted/30">
            <h3 className="text-lg font-bold">Rincian Konsumsi Per Lampu</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[200px]">Nama Lampu</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Daya (W)</TableHead>
                  <TableHead className="text-right">Konsumsi (kWh)</TableHead>
                  <TableHead className="text-right">Estimasi Biaya</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.map((d) => (
                  <TableRow key={d.id} className="hover:bg-muted/20 border-border/50">
                    <TableCell className="font-semibold">{d.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={d.status ? "default" : "secondary"} className={cn(
                        "text-[10px] uppercase",
                        d.status ? "bg-success/20 text-success border-success/30" : "bg-muted text-muted-foreground"
                      )}>
                        {d.status ? 'Aktif' : 'Mati'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{d.value || 0}W</TableCell>
                    <TableCell className="text-right font-mono text-accent">{(d.kwh || 0).toFixed(6)}</TableCell>
                    <TableCell className="text-right font-mono">
                      Rp {Math.round((d.kwh || 0) * tariff).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredDevices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      Menunggu data dari sensor...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter className="bg-muted/50 border-t-2 border-border">
                <TableRow>
                  <TableCell colSpan={3} className="font-bold text-lg">Total Seluruh Lampu</TableCell>
                  <TableCell className="text-right font-bold text-lg text-accent font-mono">
                    {totalKwhFiltered.toFixed(6)} kWh
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg text-success font-mono">
                    Rp {Math.round(totalKwhFiltered * tariff).toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

function TableFooter({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <tfoot className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}>
      {children}
    </tfoot>
  );
}

