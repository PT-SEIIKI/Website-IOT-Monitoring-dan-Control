import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Wrench, Calendar, Zap, User, Lightbulb, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { mockRooms } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest, queryClient } from '@/lib/api';
import { useQuery, useMutation } from '@tanstack/react-query';

interface Installation {
  id: number;
  lampId: number;
  roomName: string;
  roomId: number;
  technicianName: string;
  wattage: number;
  installationDate: string | Date;
}

export default function Pemasangan() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedLamp, setSelectedLamp] = useState<{roomId: number, lampId: number} | null>(null);

  // Form State
  const [technicianName, setTechnicianName] = useState('');
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: installations = [], isLoading } = useQuery<Installation[]>({
    queryKey: ['/api/installations'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/installations');
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newInst: Omit<Installation, 'id'>) => {
      const res = await apiRequest('POST', '/api/installations', newInst);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/installations'] });
      toast({ title: "Berhasil", description: "Data pemasangan ditambahkan" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal menyimpan data", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Installation> }) => {
      const res = await apiRequest('PATCH', `/api/installations/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/installations'] });
      toast({ title: "Berhasil", description: "Data pemasangan diperbarui" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal memperbarui data", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/installations/${id}`);
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/installations'] });
      toast({ title: "Berhasil", description: "Data pemasangan dihapus" });
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast({ title: "Error", description: "Gagal menghapus data", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setTechnicianName('');
    setEditingId(null);
    setSelectedLamp(null);
  };

  const handleLampClick = (roomId: number, lampId: number) => {
    if (!isAdmin) return;
    
    console.log("Lamp clicked:", { roomId, lampId });
    const existingInstallation = installations.find(
      i => i.roomId === roomId && i.lampId === lampId
    );
    
    if (existingInstallation) {
      // Edit existing installation
      setEditingId(existingInstallation.id);
      setTechnicianName(existingInstallation.technicianName);
      setSelectedLamp({ roomId, lampId });
    } else {
      // Add new installation
      resetForm();
      setSelectedLamp({ roomId, lampId });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!isAdmin) return;

    console.log("Saving installation attempt:", { 
      selectedLamp, 
      technicianName, 
      technicianNameType: typeof technicianName,
      technicianNameLength: technicianName?.length 
    });

    const isTechnicianValid = technicianName && technicianName.trim().length > 0;
    const isLampSelected = selectedLamp !== null && selectedLamp.roomId !== undefined && selectedLamp.lampId !== undefined;

    if (!isLampSelected || !isTechnicianValid) {
      console.log("Validation failed details:", { isLampSelected, isTechnicianValid });
      toast({ 
        title: "Error", 
        description: `Mohon lengkapi semua field (${!isTechnicianValid ? 'Nama Teknisi' : 'Pilih Lampu'})`, 
        variant: "destructive" 
      });
      return;
    }

    const room = mockRooms.find(r => r.id === selectedLamp.roomId);
    if (!room) {
      toast({ 
        title: "Error", 
        description: "Data ruangan tidak valid", 
        variant: "destructive" 
      });
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: {
          technicianName: technicianName.trim(),
        }
      });
    } else {
      createMutation.mutate({
        lampId: selectedLamp.lampId,
        roomName: room.name,
        roomId: selectedLamp.roomId,
        technicianName: technicianName.trim(),
        wattage: 3.6,
        installationDate: new Date().toISOString(),
      });
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const getLampInstallation = (roomId: number, lampId: number) => {
    return installations.find(i => i.roomId === roomId && i.lampId === lampId);
  };

  return (
    <div className="min-h-screen">
      <Header title="Data Pemasangan" subtitle="Kelola riwayat pemasangan dan penggantian lampu" />
      
      <div className="p-6 space-y-6">
        {/* Room Cards with Lamp Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {mockRooms.map((room) => (
            <div key={room.id} className="glass-card rounded-xl p-5 animate-fade-in">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{room.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      Lantai {room.floor}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{room.building}</span>
                  </div>
                </div>
                
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                  room.isOnline 
                    ? "bg-success/10 text-success" 
                    : "bg-destructive/10 text-destructive"
                )}>
                  {room.isOnline ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span>Online</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-destructive" />
                      <span>Offline</span>
                    </>
                  )}
                </div>
              </div>

              {/* Lamp Grid Layout */}
              <div className="mb-6 p-4 rounded-xl bg-muted/20 border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Wrench className="w-3 h-3" />
                    {isAdmin ? "Klik lampu untuk kelola data pemasangan" : "Detail data pemasangan lampu"}
                  </p>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/20 text-primary uppercase tracking-tighter">
                    Installation Mode
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5].map((lampId) => {
                    const installation = getLampInstallation(room.id, lampId);
                    return (
                      <button
                        key={lampId}
                        onClick={() => handleLampClick(room.id, lampId)}
                        disabled={!isAdmin}
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-lg transition-all border group w-full",
                          installation 
                            ? "bg-success/10 border-success/30 hover:bg-success/20 shadow-[0_0_8px_rgba(34,197,94,0.15)]" 
                            : "bg-muted/50 border-transparent hover:bg-muted",
                          !isAdmin && "cursor-default"
                        )}
                      >
                        <Lightbulb className={cn(
                          "w-6 h-6 mb-1 transition-all duration-300",
                          installation ? "text-success fill-success/20 scale-110" : "text-muted-foreground scale-100"
                        )} />
                        <span className={cn(
                          "text-[10px] font-medium truncate w-full text-center",
                          installation ? "text-success" : ""
                        )}>
                          L{lampId}
                        </span>
                        {installation && (
                          <div className="mt-1 text-xs text-success">
                            <div className="font-medium">{installation.technicianName}</div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Room Installation Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Terpasang:</span>
                  <span className="font-mono font-semibold">
                    {installations.filter(i => i.roomId === room.id).length}/5
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Installation Data Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-lg font-semibold">Data Pemasangan Lengkap</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Lampu mana</TableHead>
                  <TableHead>Nama Teknisi</TableHead>
                  <TableHead>Tanggal Pemasangan</TableHead>
                  {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {installations.map((installation) => (
                  <TableRow key={installation.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{installation.roomName}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Zap className="w-3 h-3 text-warning" />
                          <span>Lampu {installation.lampId}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{installation.technicianName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{(() => {
                          try {
                            return format(new Date(installation.installationDate), 'dd MMM yyyy', { locale: id });
                          } catch (e) {
                            return '-';
                          }
                        })()}</span>
                      </div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingId(installation.id);
                              setTechnicianName(installation.technicianName);
                              setSelectedLamp({ roomId: installation.roomId, lampId: installation.lampId });
                              setIsDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(installation.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Add/Edit Installation Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Data' : 'Tambah Data'} Pemasangan
                {selectedLamp && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    - Lampu {selectedLamp.lampId} di {mockRooms.find(r => r.id === selectedLamp.roomId)?.name}
                  </span>
                )}
              </DialogTitle>
              <div className="sr-only">Form untuk memasukkan data teknisi pemasangan lampu</div>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nama Teknisi</Label>
                <Input 
                  id="technicianName"
                  name="technicianName"
                  value={technicianName} 
                  onChange={e => setTechnicianName(e.target.value)} 
                  placeholder="Masukkan nama teknisi" 
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Pemasangan</Label>
                <Input 
                  type="date" 
                  value={today} 
                  disabled
                  className="bg-muted"
                />
                <p className="text-[10px] text-muted-foreground italic">* Tanggal otomatis diset hari ini</p>
              </div>
              <Button onClick={handleSave} className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? 'Update Data' : 'Simpan Data'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {installations.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Wrench className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Belum ada data pemasangan</p>
            <p className="text-muted-foreground">Klik lampu pada ruangan untuk menambahkan data pemasangan</p>
          </div>
        )}
      </div>
    </div>
  );
}
