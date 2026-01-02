import { useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { PowerChart } from '@/components/dashboard/PowerChart';
import { TopConsumers } from '@/components/dashboard/TopConsumers';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { mockRooms, getDashboardStats, ELECTRICITY_TARIFF } from '@/data/mockData';
import { Building2, Zap, Activity, Wallet, Lightbulb, Wind } from 'lucide-react';

export default function Dashboard() {
  const stats = useMemo(() => getDashboardStats(mockRooms), []);

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
            value={stats.totalRooms}
            icon={Building2}
            variant="primary"
          />
          <StatCard
            title="Perangkat Aktif"
            value={stats.activeDevices}
            subtitle={`${stats.lampsOn} lampu, ${stats.acsOn} AC`}
            icon={Activity}
            variant="success"
          />
          <StatCard
            title="Lampu Menyala"
            value={stats.lampsOn}
            icon={Lightbulb}
            variant="warning"
          />
          <StatCard
            title="AC Menyala"
            value={stats.acsOn}
            icon={Wind}
            variant="accent"
          />
          <StatCard
            title="Konsumsi Hari Ini"
            value={`${stats.todayKwh}`}
            subtitle="kWh"
            icon={Zap}
            trend={{ value: 12, isPositive: false }}
            variant="accent"
          />
          <StatCard
            title="Biaya Hari Ini"
            value={`Rp ${stats.todayCost.toLocaleString()}`}
            icon={Wallet}
            variant="default"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 overflow-hidden">
            <PowerChart />
          </div>
          <TopConsumers />
        </div>

        {/* Activity & Info Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 overflow-hidden">
            <RecentActivity />
          </div>
          
          {/* Tariff Info Card */}
          <div className="glass-card rounded-xl p-4 md:p-5 animate-fade-in">
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
