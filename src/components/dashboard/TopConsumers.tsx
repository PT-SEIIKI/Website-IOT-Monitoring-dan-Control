import { useMemo, useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { mockRooms } from '@/data/mockData';
import { Zap } from 'lucide-react';
import { socket } from '@/lib/socket';

export function TopConsumers() {
  const [deviceData, setDeviceData] = useState<any[]>([]);

  useEffect(() => {
    // Initial fetch
    fetch('/api/devices')
      .then(res => res.json())
      .then(data => setDeviceData(data));

    const handleUpdate = (updatedDevice: any) => {
      setDeviceData(prev => {
        const index = prev.findIndex(d => d.id === updatedDevice.id);
        if (index !== -1) {
          const newData = [...prev];
          newData[index] = updatedDevice;
          return newData;
        }
        return [...prev, updatedDevice];
      });
    };

    socket.on("device_update", handleUpdate);
    return () => {
      socket.off("device_update", handleUpdate);
    };
  }, []);

  const data = useMemo(() => {
    if (deviceData.length === 0) {
      return mockRooms
        .filter(r => r.currentPowerWatt > 0)
        .sort((a, b) => b.currentPowerWatt - a.currentPowerWatt)
        .slice(0, 5)
        .map(room => ({
          name: room.name,
          watt: room.currentPowerWatt,
        }));
    }

    // Group by room (mock mapping relay to room for simplicity)
    const roomPower: Record<string, number> = {};
    deviceData.forEach(d => {
      const roomName = d.room || "Prototype 1.0.1";
      roomPower[roomName] = (roomPower[roomName] || 0) + (d.status ? (d.value || 0) : 0);
    });

    return Object.entries(roomPower)
      .map(([name, watt]) => ({ name, watt }))
      .sort((a, b) => b.watt - a.watt)
      .slice(0, 5);
  }, [deviceData]);

  return (
    <div className="glass-card rounded-xl p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Top Konsumsi</h3>
          <p className="text-sm text-muted-foreground">Ruangan dengan konsumsi tertinggi</p>
        </div>
        <Zap className="w-5 h-5 text-warning" />
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <XAxis 
              type="number" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
              tickFormatter={(value) => `${value}W`}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(210 40% 98%)', fontSize: 12 }}
              width={100}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'hsl(222 47% 8%)', 
                border: '1px solid hsl(217 33% 17%)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(210 40% 98%)', fontWeight: 600 }}
              formatter={(value: number) => [`${value} Watt`, 'Konsumsi']}
            />
            <Bar dataKey="watt" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={index === 0 ? 'hsl(38 92% 50%)' : 'hsl(217 91% 60%)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total aktif</span>
          <span className="font-mono font-semibold text-accent">
            {data.reduce((sum, item) => sum + item.watt, 0).toLocaleString()} W
          </span>
        </div>
      </div>
    </div>
  );
}
