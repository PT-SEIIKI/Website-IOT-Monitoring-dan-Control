import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockRooms, ELECTRICITY_TARIFF, generatePowerChartData } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { socket } from '@/lib/socket';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { Download, FileText, Calendar, TrendingUp, TrendingDown, Building2, Zap, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Reports() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [dateRange, setDateRange] = useState('7days');
  const [devices, setDevices] = useState<Array<{id: number, name: string, status: boolean, power: number, type: string}>>([]);

  const powerData = useMemo(() => generatePowerChartData(), []);

  // Initialize devices and set up socket listeners
  useEffect(() => {
    // Initialize devices with default values
    const initialDevices = Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      name: `Lampu ${i + 1}`,
      status: false,
      power: 0,
      type: 'lamp'
    }));
    setDevices(initialDevices);

    // Listen for device updates
    socket.on("device_update", (updatedDevice: any) => {
      setDevices(prev => prev.map(device => 
        device.id === updatedDevice.id 
          ? { 
              ...device, 
              status: updatedDevice.status, 
              power: updatedDevice.power || 0,
              type: updatedDevice.type || 'lamp'
            }
          : device
      ));
    });

    return () => {
      socket.off("device_update");
    };
  }, []);

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

  // Device type breakdown - dynamic based on actual devices
  const deviceBreakdown = useMemo(() => {
    const totalPower = devices.reduce((sum, device) => sum + device.power, 0);
    
    if (totalPower === 0) {
      // Fallback to default if no power data
      return devices.map((device, index) => ({
        name: device.name,
        value: 16.67, // Equal distribution for 6 devices
        color: `hsl(${(index * 60) % 360}, 70%, 50%)`
      }));
    }

    return devices.map((device, index) => ({
      name: device.name,
      value: totalPower > 0 ? parseFloat(((device.power / totalPower) * 100).toFixed(1)) : 0,
      color: `hsl(${(index * 60) % 360}, 70%, 50%)`
    }));
  }, [devices]);

  // Building comparison
  const buildingData = useMemo(() => [
    { name: 'Gedung A', kwh: 523.4 },
    { name: 'Gedung B', kwh: 278.9 },
    { name: 'Gedung C', kwh: 45.02 },
  ], []);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.text('Laporan Konsumsi Daya Kampus', 14, 22);
    doc.setFontSize(10);
    doc.text(`Tanggal Laporan: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}`, 14, 30);
    doc.text(`Periode: ${dateRange}`, 14, 35);
    
    // Summary table
    autoTable(doc, {
      startY: 45,
      head: [['Metric', 'Value']],
      body: [
        ['Total Konsumsi (kWh)', summaryData.totalKwh],
        ['Total Biaya (Rp)', `Rp ${summaryData.totalCost}`],
        ['Rata-rata Harian (kWh/hari)', summaryData.avgDaily],
        ['Waktu Puncak', summaryData.peakHour],
      ],
      theme: 'grid',
    });
    
    // Floor breakdown table
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Lantai', 'Konsumsi (kWh)', 'Biaya (Rp)']],
      body: floorData.map(f => [f.name, f.kwh, `Rp ${f.cost.toLocaleString()}`]),
      theme: 'striped',
    });
    
    doc.save(`Laporan-IoT-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const handleExportExcel = () => {
    // Summary Data
    const summaryWS = XLSX.utils.json_to_sheet([
      { Metric: 'Total Konsumsi (kWh)', Value: summaryData.totalKwh },
      { Metric: 'Total Biaya (Rp)', Value: summaryData.totalCost },
      { Metric: 'Rata-rata Harian (kWh/hari)', Value: summaryData.avgDaily },
      { Metric: 'Waktu Puncak', Value: summaryData.peakHour },
    ]);

    // Floor Data
    const floorWS = XLSX.utils.json_to_sheet(floorData);
    
    // Building Data
    const buildingWS = XLSX.utils.json_to_sheet(buildingData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, summaryWS, "Ringkasan");
    XLSX.utils.book_append_sheet(wb, floorWS, "Per Lantai");
    XLSX.utils.book_append_sheet(wb, buildingWS, "Per Gedung");

    XLSX.writeFile(wb, `Laporan-IoT-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

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
              <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
                <Download className="w-4 h-4" />
                PDF
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleExportExcel}>
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
        <div className="grid grid-cols-1 gap-6">
      </div>
    </div>
  );
}
