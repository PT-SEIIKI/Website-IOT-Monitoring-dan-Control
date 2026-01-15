import { useMemo, useEffect, useState } from 'react';
import { socket } from '@/lib/socket';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { PowerChart } from '@/components/dashboard/PowerChart';
import { TopConsumers } from '@/components/dashboard/TopConsumers';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { mockRooms, getDashboardStats, ELECTRICITY_TARIFF } from '@/data/mockData';
import { Building2, Zap, Activity, Wallet, Lightbulb, Wind } from 'lucide-react';

export default function Dashboard() {
  const stats = useMemo(() => getDashboardStats(mockRooms), []);
  const [deviceUpdates, setDeviceUpdates] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);

  useEffect(() => {
    socket.on("device_update", (updatedDevice) => {
      console.log("Received real-time update:", updatedDevice);
      setDeviceUpdates(prev => [updatedDevice, ...prev].slice(0, 5));
    });

    socket.on("summary_update", (data) => {
      console.log("Received summary update:", data);
      setSummaryData(data);
    });

    return () => {
      socket.off("device_update");
      socket.off("summary_update");
    };
  }, []);

  const currentStats = useMemo(() => {
    if (!summaryData) return stats;
    return {
      ...stats,
      lampsOn: summaryData.lamps_on,
      activeDevices: summaryData.lamps_on, // Assuming lamps are the main active devices for now
      todayKwh: summaryData.energy_today.toFixed(4),
      todayCost: Math.round(summaryData.cost_today)
    };
  }, [summaryData, stats]);

  return (
    <div className="min-h-screen">
      <Header 
        title="Dashboard" 
        subtitle="Overview sistem monitoring IoT kampus"
      />

      <div className="p-4 md:p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Ruangan"
            value={currentStats.totalRooms}
            icon={Building2}
            variant="primary"
          />
          <StatCard
            title="Perangkat Aktif"
            value={currentStats.activeDevices}
            subtitle={`${currentStats.lampsOn} L, ${currentStats.acsOn} AC`}
            icon={Activity}
            variant="success"
          />
          <StatCard
            title="Lampu Menyala"
            value={currentStats.lampsOn}
            icon={Lightbulb}
            variant="warning"
          />
          <StatCard
            title="AC Menyala"
            value={currentStats.acsOn}
            icon={Wind}
            variant="accent"
          />
          <StatCard
            title="Konsumsi Hari Ini"
            value={`${currentStats.todayKwh}`}
            subtitle="kWh"
            icon={Zap}
            trend={{ value: 12, isPositive: false }}
            variant="accent"
          />
          <StatCard
            title="Biaya Hari Ini"
            value={`Rp ${currentStats.todayCost.toLocaleString()}`}
            icon={Wallet}
            variant="default"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 overflow-hidden w-full">
            <PowerChart />
          </div>
          <div className="w-full">
            <TopConsumers />
          </div>
        </div>

        {/* Activity & Info Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 overflow-hidden w-full">
            <RecentActivity />
          </div>
          
          {/* Tariff Info Card */}
          <div className="glass-card rounded-xl p-4 md:p-5 animate-fade-in w-full">
            <h3 className="text-lg font-semibold mb-4">Informasi Tarif</h3>
            
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">Tarif Listrik per kWh</p>
                <p className="text-2xl font-bold font-mono text-accent mt-1">
                  Rp {ELECTRICITY_TARIFF.toLocaleString()}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-warning" />
                    <span className="text-xs text-muted-foreground">Lampu</span>
                  </div>
                  <p className="font-mono font-semibold mt-1">50-100W</p>
                </div>
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-accent" />
                    <span className="text-xs text-muted-foreground">AC</span>
                  </div>
                  <p className="font-mono font-semibold mt-1">1000-1500W</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground mb-2">Quick Stats</p>
                <div className="flex justify-between text-sm">
                  <span>ESP32 Online</span>
                  <span className="font-mono text-success">
                    {mockRooms.filter(r => r.isOnline).length}/{mockRooms.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
