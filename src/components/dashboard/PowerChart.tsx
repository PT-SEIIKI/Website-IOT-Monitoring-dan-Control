import { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { generatePowerChartData } from '@/data/mockData';

export function PowerChart() {
  const data = useMemo(() => generatePowerChartData(), []);

  return (
    <div className="glass-card rounded-xl p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Konsumsi Daya</h3>
          <p className="text-sm text-muted-foreground">24 jam terakhir</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-muted-foreground">kWh</span>
          </div>
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(187 92% 50%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(187 92% 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(217 33% 17%)" 
              vertical={false}
            />
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(222 47% 8%)', 
                border: '1px solid hsl(217 33% 17%)',
                borderRadius: '8px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)'
              }}
              labelStyle={{ color: 'hsl(210 40% 98%)', fontWeight: 600 }}
              itemStyle={{ color: 'hsl(187 92% 50%)' }}
              formatter={(value: number) => [`${value} kWh`, 'Konsumsi']}
            />
            <Area
              type="monotone"
              dataKey="kwh"
              stroke="hsl(187 92% 50%)"
              strokeWidth={2}
              fill="url(#powerGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
