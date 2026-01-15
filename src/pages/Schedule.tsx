import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { mockRooms } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Schedule } from '@/types';
import { Plus, Pencil, Trash2, Clock, Lightbulb, Power, PowerOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];


export default function SchedulePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';
  
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Load schedules from localStorage on mount
  useEffect(() => {
    const storedSchedules = localStorage.getItem('iot-schedules');
    if (storedSchedules) {
      try {
        setSchedules(JSON.parse(storedSchedules));
      } catch (error) {
        console.error('Error loading schedules:', error);
      }
    }
  }, []);

  // Save schedules to localStorage whenever they change
  useEffect(() => {
    if (schedules.length > 0) {
      localStorage.setItem('iot-schedules', JSON.stringify(schedules));
    }
  }, [schedules]);

  // Check and execute schedules every minute
  useEffect(() => {
    const checkAndExecuteSchedules = () => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      const currentDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1]; // Adjust for Sunday = 0

      schedules.forEach(schedule => {
        if (schedule.isActive && 
            schedule.time === currentTime && 
            schedule.daysOfWeek.includes(currentDay)) {
          
          // Execute schedule action
          executeScheduleAction(schedule);
        }
      });
    };

    // Check immediately
    checkAndExecuteSchedules();
    
    // Set up interval to check every minute
    const interval = setInterval(checkAndExecuteSchedules, 60000);
    
    return () => clearInterval(interval);
  }, [schedules]);

  const executeScheduleAction = (schedule: Schedule) => {
    console.log('Executing schedule:', schedule);
    
    // Here you would normally send the command to your IoT devices
    // For now, we'll just show a toast notification
    const actionText = schedule.action === 'turn_on' ? 'dinyalakan' : 'dimatikan';
    const deviceText = schedule.deviceType === 'lamp' ? 'semua lampu' : `lampu ${schedule.deviceType.split('_')[1]}`;
    
    toast({
      title: 'Schedule Dieksekusi',
      description: `${deviceText} di ruangan ${schedule.roomName} telah ${actionText} otomatis`,
    });

    // You can also emit to socket if needed:
    // socket.emit('execute_schedule', schedule);
  };

  // Form state
  const [formRoom, setFormRoom] = useState('');
  const [formDevice, setFormDevice] = useState<'lamp' | 'lamp_1' | 'lamp_2' | 'lamp_3' | 'lamp_4' | 'lamp_5'>('lamp');
  const [formAction, setFormAction] = useState<'turn_on' | 'turn_off'>('turn_on');
  const [formTime, setFormTime] = useState('08:00');
  const [formDays, setFormDays] = useState<string[]>([]);

  const resetForm = () => {
    setFormRoom('');
    setFormDevice('lamp');
    setFormAction('turn_on');
    setFormTime('08:00');
    setFormDays([]);
    setEditingSchedule(null);
  };

  const handleOpenDialog = (schedule?: Schedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormRoom(schedule.roomId.toString());
      setFormDevice(schedule.deviceType as any);
      setFormAction(schedule.action);
      setFormTime(schedule.time);
      setFormDays(schedule.daysOfWeek);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const room = mockRooms.find(r => r.id === parseInt(formRoom));
    if (!room || formDays.length === 0) {
      toast({
        title: 'Error',
        description: 'Mohon lengkapi semua field',
        variant: 'destructive',
      });
      return;
    }

    const deviceType = formDevice as 'lamp' | 'lamp_1' | 'lamp_2' | 'lamp_3' | 'lamp_4' | 'lamp_5';

    if (editingSchedule) {
      setSchedules(prev => prev.map(s => 
        s.id === editingSchedule.id 
          ? { ...s, roomId: room.id, roomName: room.name, deviceType, action: formAction, time: formTime, daysOfWeek: formDays }
          : s
      ));
      toast({ title: 'Schedule diperbarui' });
    } else {
      const newSchedule: Schedule = {
        id: Date.now(),
        roomId: room.id,
        roomName: room.name,
        deviceType,
        action: formAction,
        time: formTime,
        daysOfWeek: formDays,
        isActive: true,
      };
      setSchedules(prev => [...prev, newSchedule]);
      toast({ title: 'Schedule ditambahkan' });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: number) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    toast({ title: 'Schedule dihapus' });
  };

  const handleToggleActive = (id: number) => {
    setSchedules(prev => prev.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive } : s
    ));
  };

  const toggleDay = (day: string) => {
    setFormDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="Automation Schedule" 
        subtitle="Jadwal otomatis untuk kontrol perangkat"
      />

      <div className="p-6 space-y-6">
        {/* Actions */}
        {isAdmin && (
          <div className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-primary to-accent" onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4" />
                  Tambah Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingSchedule ? 'Edit Schedule' : 'Tambah Schedule'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Ruangan</Label>
                    <Select value={formRoom} onValueChange={setFormRoom}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih ruangan" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockRooms.map(room => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Device</Label>
                      <Select value={formDevice} onValueChange={(v: any) => setFormDevice(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lamp">Semua Lampu</SelectItem>
                          <SelectItem value="lamp_1">Lampu 1</SelectItem>
                          <SelectItem value="lamp_2">Lampu 2</SelectItem>
                          <SelectItem value="lamp_3">Lampu 3</SelectItem>
                          <SelectItem value="lamp_4">Lampu 4</SelectItem>
                          <SelectItem value="lamp_5">Lampu 5</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Action</Label>
                      <Select value={formAction} onValueChange={(v: 'turn_on' | 'turn_off') => setFormAction(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="turn_on">Turn ON</SelectItem>
                          <SelectItem value="turn_off">Turn OFF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Waktu</Label>
                    <Input 
                      type="time" 
                      value={formTime} 
                      onChange={(e) => setFormTime(e.target.value)} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Hari</Label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                            formDays.includes(day)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleSave} className="w-full">
                    {editingSchedule ? 'Update Schedule' : 'Simpan Schedule'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Schedules Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Status</TableHead>
                  <TableHead>Ruangan</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Hari</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => {
                  const isLamp = schedule.deviceType.startsWith('lamp');
                  const Icon = Lightbulb;
                  const ActionIcon = schedule.action === 'turn_on' ? Power : PowerOff;
                  const isOn = schedule.action === 'turn_on';
                  
                  let deviceLabel = 'Semua Lampu';
                  if (schedule.deviceType.startsWith('lamp_')) {
                    deviceLabel = `Lampu ${schedule.deviceType.split('_')[1]}`;
                  }
                  
                  return (
                    <TableRow key={schedule.id} className={cn(!schedule.isActive && "opacity-50")}>
                      <TableCell>
                        <Switch
                          checked={schedule.isActive}
                          onCheckedChange={() => handleToggleActive(schedule.id)}
                          disabled={!isAdmin}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{schedule.roomName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className={cn(
                            "w-4 h-4",
                            isLamp ? "text-warning" : "text-accent"
                          )} />
                          <span>{deviceLabel}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "gap-1",
                          isOn 
                            ? "bg-success/10 text-success border-success/20" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          <ActionIcon className="w-3 h-3" />
                          {isOn ? 'ON' : 'OFF'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-mono">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {schedule.time}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {schedule.daysOfWeek.map(day => (
                            <span 
                              key={day} 
                              className="px-2 py-0.5 rounded bg-muted text-xs"
                            >
                              {day.slice(0, 3)}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(schedule)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(schedule.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {schedules.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Belum ada schedule</p>
            <p className="text-muted-foreground">Tambahkan jadwal otomatis untuk kontrol perangkat</p>
          </div>
        )}
      </div>
    </div>
  );
}
