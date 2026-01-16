import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { mockRooms, ELECTRICITY_TARIFF } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Room } from '@/types';
import { Plus, Pencil, Trash2, Zap, Building2, Users, Save, AlertTriangle } from 'lucide-react';
import { Navigate } from 'react-router-dom';

// Mock users data
const mockUsers = [
  { id: 1, name: 'Admin User', email: 'admin@kampus.ac.id', role: 'admin' },
  { id: 2, name: 'Staff User', email: 'staff@kampus.ac.id', role: 'karyawan' },
  { id: 3, name: 'John Doe', email: 'john@kampus.ac.id', role: 'karyawan' },
];

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Redirect non-admin
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const [tariff, setTariff] = useState(ELECTRICITY_TARIFF.toString());
  const [isLoadingTariff, setIsLoadingTariff] = useState(true);

  useEffect(() => {
    fetch('/api/settings/electricity_tariff')
      .then(res => res.json())
      .then(data => {
        if (data.value) {
          setTariff(data.value);
        }
      })
      .finally(() => setIsLoadingTariff(false));
  }, []);

  const handleSaveTariff = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'electricity_tariff', value: tariff })
      });
      
      if (response.ok) {
        toast({
          title: 'Tarif diperbarui',
          description: `Tarif baru: Rp ${parseFloat(tariff).toLocaleString()}/kWh`,
        });
        // Update local storage or trigger a refetch in Monitoring page if needed
        window.dispatchEvent(new Event('tariff_updated'));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memperbarui tarif',
        variant: 'destructive'
      });
    }
  };

  const handleOpenRoomDialog = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setRoomForm({
        name: room.name,
        floor: room.floor.toString(),
        building: room.building,
        esp32Id: room.esp32Id,
      });
    } else {
      setEditingRoom(null);
      setRoomForm({ name: '', floor: '', building: '', esp32Id: '' });
    }
    setRoomDialogOpen(true);
  };

  const handleSaveRoom = () => {
    if (!roomForm.name || !roomForm.floor || !roomForm.building) {
      toast({ title: 'Error', description: 'Mohon lengkapi semua field', variant: 'destructive' });
      return;
    }

    if (editingRoom) {
      setRooms(prev => prev.map(r => 
        r.id === editingRoom.id 
          ? { ...r, name: roomForm.name, floor: parseInt(roomForm.floor), building: roomForm.building, esp32Id: roomForm.esp32Id }
          : r
      ));
      toast({ title: 'Ruangan diperbarui' });
    } else {
      const newRoom: Room = {
        id: Date.now(),
        name: roomForm.name,
        floor: parseInt(roomForm.floor),
        building: roomForm.building,
        esp32Id: roomForm.esp32Id || `ESP32_${Date.now()}`,
        lampStatus: false,
        acStatus: false,
        isOnline: false,
        lastSeen: new Date(),
        currentPowerWatt: 0,
      };
      setRooms(prev => [...prev, newRoom]);
      toast({ title: 'Ruangan ditambahkan' });
    }

    setRoomDialogOpen(false);
  };

  const handleOpenUserDialog = (u?: typeof mockUsers[0]) => {
    if (u) {
      setEditingUser(u);
      setUserForm({ name: u.name, email: u.email, password: '', role: u.role });
    } else {
      setEditingUser(null);
      setUserForm({ name: '', email: '', password: '', role: 'karyawan' });
    }
    setUserDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (!userForm.name || !userForm.email) {
      toast({ title: 'Error', description: 'Mohon lengkapi semua field', variant: 'destructive' });
      return;
    }

    if (editingUser) {
      setUsers(prev => prev.map(u => 
        u.id === editingUser.id 
          ? { ...u, name: userForm.name, email: userForm.email, role: userForm.role }
          : u
      ));
      toast({ title: 'User diperbarui' });
    } else {
      if (!userForm.password) {
        toast({ title: 'Error', description: 'Password harus diisi', variant: 'destructive' });
        return;
      }
      const newUser = {
        id: Date.now(),
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
      };
      setUsers(prev => [...prev, newUser]);
      toast({ title: 'User ditambahkan' });
    }

    setUserDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteDialog) return;

    if (deleteDialog.type === 'room') {
      setRooms(prev => prev.filter(r => r.id !== deleteDialog.id));
      toast({ title: 'Ruangan dihapus' });
    } else {
      setUsers(prev => prev.filter(u => u.id !== deleteDialog.id));
      toast({ title: 'User dihapus' });
    }

    setDeleteDialog(null);
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="Settings" 
        subtitle="Kelola konfigurasi sistem"
      />

      <div className="p-6">
        <Tabs defaultValue="tariff" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="tariff" className="gap-2">
              <Zap className="w-4 h-4" />
              Tarif Listrik
            </TabsTrigger>
            <TabsTrigger value="rooms" className="gap-2">
              <Building2 className="w-4 h-4" />
              Ruangan
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
          </TabsList>

          {/* Tariff Settings */}
          <TabsContent value="tariff">
            <div className="glass-card rounded-xl p-6 max-w-md">
              <h3 className="text-lg font-semibold mb-4">Tarif Listrik per kWh</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tarif (Rp)</Label>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      value={tariff}
                      onChange={(e) => setTariff(e.target.value)}
                      className="font-mono"
                    />
                    <Button onClick={handleSaveTariff} className="gap-2">
                      <Save className="w-4 h-4" />
                      Simpan
                    </Button>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Tarif saat ini</p>
                  <p className="text-2xl font-bold font-mono text-accent">
                    Rp {parseFloat(tariff).toLocaleString()}/kWh
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Rooms Settings */}
          <TabsContent value="rooms">
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-semibold">Daftar Ruangan</h3>
                <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" onClick={() => handleOpenRoomDialog()}>
                      <Plus className="w-4 h-4" />
                      Tambah Ruangan
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingRoom ? 'Edit Ruangan' : 'Tambah Ruangan'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nama Ruangan</Label>
                        <Input
                          value={roomForm.name}
                          onChange={(e) => setRoomForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ruang 101"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Lantai</Label>
                          <Input
                            type="number"
                            value={roomForm.floor}
                            onChange={(e) => setRoomForm(prev => ({ ...prev, floor: e.target.value }))}
                            placeholder="1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Gedung</Label>
                          <Input
                            value={roomForm.building}
                            onChange={(e) => setRoomForm(prev => ({ ...prev, building: e.target.value }))}
                            placeholder="Gedung A"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>ESP32 ID</Label>
                        <Input
                          value={roomForm.esp32Id}
                          onChange={(e) => setRoomForm(prev => ({ ...prev, esp32Id: e.target.value }))}
                          placeholder="ESP32_001"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSaveRoom}>Simpan</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Lantai</TableHead>
                    <TableHead>Gedung</TableHead>
                    <TableHead>ESP32 ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map(room => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">{room.name}</TableCell>
                      <TableCell>{room.floor}</TableCell>
                      <TableCell>{room.building}</TableCell>
                      <TableCell className="font-mono text-sm">{room.esp32Id}</TableCell>
                      <TableCell>
                        <Badge variant={room.isOnline ? "default" : "secondary"} className={room.isOnline ? "bg-success/10 text-success" : ""}>
                          {room.isOnline ? 'Online' : 'Offline'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenRoomDialog(room)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteDialog({ type: 'room', id: room.id })}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Users Settings */}
          <TabsContent value="users">
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-semibold">Daftar Users</h3>
                <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" onClick={() => handleOpenUserDialog()}>
                      <Plus className="w-4 h-4" />
                      Tambah User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingUser ? 'Edit User' : 'Tambah User'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nama</Label>
                        <Input
                          value={userForm.name}
                          onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={userForm.email}
                          onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{editingUser ? 'Password Baru (kosongkan jika tidak ingin mengubah)' : 'Password'}</Label>
                        <Input
                          type="password"
                          value={userForm.password}
                          onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={userForm.role} onValueChange={(v) => setUserForm(prev => ({ ...prev, role: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="karyawan">Karyawan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSaveUser}>Simpan</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenUserDialog(u)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive"
                            onClick={() => setDeleteDialog({ type: 'user', id: u.id })}
                            disabled={u.id === user?.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Konfirmasi Hapus
              </DialogTitle>
            </DialogHeader>
            <p>Apakah Anda yakin ingin menghapus {deleteDialog?.type === 'room' ? 'ruangan' : 'user'} ini?</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog(null)}>Batal</Button>
              <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
