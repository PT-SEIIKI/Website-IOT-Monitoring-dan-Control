import { useState, useMemo, useEffect } from 'react';
import { socket } from '@/lib/socket';
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

  // Load schedules from backend on mount
  useEffect(() => {
    fetch('/api/schedules')
      .then(res => res.json())
      .then(data => {
        setSchedules(data.map((s: any) => ({
          ...s,
          daysOfWeek: JSON.parse(s.daysOfWeek)
        })));
      })
      .catch(error => console.error('Error loading schedules:', error));

    socket.on("schedule_executed", (data: any) => {
      toast({
        title: 'Schedule Dieksekusi',
        description: data.message,
      });
    });

    return () => {
      socket.off("schedule_executed");
    };
  }, []);

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
      setFormAction(schedule.action as any);
      setFormTime(schedule.time);
      setFormDays(schedule.daysOfWeek);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const room = mockRooms.find(r => r.id === parseInt(formRoom));
    if (!room || formDays.length === 0) {
      toast({
        title: 'Error',
        description: 'Mohon lengkapi semua field',
        variant: 'destructive',
      });
      return;
    }

    const scheduleData = {
      roomId: room.id,
      roomName: room.name,
      deviceType: formDevice,
      action: formAction,
      time: formTime,
      daysOfWeek: JSON.stringify(formDays),
      isActive: true,
    };

    try {
      if (editingSchedule) {
        const response = await fetch(`/api/schedules/${editingSchedule.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scheduleData)
        });
        const updated = await response.json();
        setSchedules(prev => prev.map(s => s.id === updated.id ? { ...updated, daysOfWeek: JSON.parse(updated.daysOfWeek) } : s));
        toast({ title: 'Schedule diperbarui' });
      } else {
        const response = await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scheduleData)
        });
        const created = await response.json();
        setSchedules(prev => [...prev, { ...created, daysOfWeek: JSON.parse(created.daysOfWeek) }]);
        toast({ title: 'Schedule ditambahkan' });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal menyimpan schedule', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      setSchedules(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Schedule dihapus' });
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal menghapus schedule', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (id: number) => {
    const schedule = schedules.find(s => s.id === id);
    if (!schedule) return;

    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !schedule.isActive })
      });
      const updated = await response.json();
      setSchedules(prev => prev.map(s => s.id === id ? { ...updated, daysOfWeek: JSON.parse(updated.daysOfWeek) } : s));
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal mengubah status schedule', variant: 'destructive' });
    }
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
