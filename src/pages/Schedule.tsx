import { useState, useMemo } from 'react';
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
import { Plus, Pencil, Trash2, Clock, Lightbulb, Wind, Power, PowerOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const initialSchedules: Schedule[] = [
  { id: 1, roomId: 1, roomName: 'Ruang 101', deviceType: 'lamp', action: 'turn_on', time: '07:00', daysOfWeek: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'], isActive: true },
  { id: 2, roomId: 1, roomName: 'Ruang 101', deviceType: 'lamp', action: 'turn_off', time: '17:00', daysOfWeek: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'], isActive: true },
  { id: 3, roomId: 3, roomName: 'Ruang 201', deviceType: 'ac', action: 'turn_on', time: '08:00', daysOfWeek: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'], isActive: true },
  { id: 4, roomId: 3, roomName: 'Ruang 201', deviceType: 'ac', action: 'turn_off', time: '16:00', daysOfWeek: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'], isActive: true },
  { id: 5, roomId: 5, roomName: 'Lab Komputer 2', deviceType: 'lamp', action: 'turn_off', time: '22:00', daysOfWeek: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'], isActive: false },
];

export default function SchedulePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';
  
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Form state
  const [formRoom, setFormRoom] = useState('');
  const [formDevice, setFormDevice] = useState<'lamp' | 'ac'>('lamp');
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
      setFormDevice(schedule.deviceType);
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

    if (editingSchedule) {
      setSchedules(prev => prev.map(s => 
        s.id === editingSchedule.id 
          ? { ...s, roomId: room.id, roomName: room.name, deviceType: formDevice, action: formAction, time: formTime, daysOfWeek: formDays }
          : s
      ));
      toast({ title: 'Schedule diperbarui' });
    } else {
      const newSchedule: Schedule = {
        id: Date.now(),
        roomId: room.id,
        roomName: room.name,
        deviceType: formDevice,
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
                      <Select value={formDevice} onValueChange={(v: 'lamp' | 'ac') => setFormDevice(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lamp">Lampu</SelectItem>
                          <SelectItem value="ac">AC</SelectItem>
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
                  const Icon = schedule.deviceType === 'lamp' ? Lightbulb : Wind;
                  const ActionIcon = schedule.action === 'turn_on' ? Power : PowerOff;
                  const isOn = schedule.action === 'turn_on';
                  
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
                            schedule.deviceType === 'lamp' ? "text-warning" : "text-accent"
                          )} />
                          <span>{schedule.deviceType === 'lamp' ? 'Lampu' : 'AC'}</span>
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
