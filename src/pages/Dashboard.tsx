import { useMemo, useEffect, useState } from 'react';
import { socket } from '@/lib/socket';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { PowerChart } from '@/components/dashboard/PowerChart';
import { mockRooms, getDashboardStats } from '@/data/mockData';
import { Zap, Wallet, Lightbulb } from 'lucide-react';

export default function Dashboard() {
  const stats = useMemo(() => getDashboardStats(mockRooms), []);
  const [, setDeviceUpdates] = useState<any[]>([]);
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
    if (!summaryData) return stats as any;
    return {
      ...stats,
      lampsOn: summaryData.lamps_on,
      activeDevices: summaryData.lamps_on,
      todayKwh: (summaryData.energy_today || 0).toFixed(6),
      todayCost: Math.round(summaryData.cost_today || 0),
      currentPower: summaryData.power_total || 0
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Lampu Menyala"
            value={currentStats.lampsOn}
            icon={Lightbulb}
            variant="warning"
          />
          <StatCard
            title="Konsumsi Hari Ini"
            value={`${currentStats.todayKwh}`}
            subtitle="kWh"
            icon={Zap}
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
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          <div className="overflow-hidden w-full">
            <PowerChart />
          </div>
        </div>
      </div>
    </div>
  );
}
