import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Wrench, Calendar, Zap, User } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Installation {
  id: number;
  lampId: number;
  lampName: string;
  technicianName: string;
  wattage: number;
  installationDate: Date;
}

const initialInstallations: Installation[] = [
  { id: 1, lampId: 1, lampName: 'Lampu 1', technicianName: 'Budi Santoso', wattage: 3.6, installationDate: new Date() },
  { id: 2, lampId: 2, lampName: 'Lampu 2', technicianName: 'Andi Wijaya', wattage: 3.6, installationDate: new Date() },
];

export default function Pemasangan() {
  const { toast } = useToast();
  const [installations, setInstallations] = useState<Installation[]>(initialInstallations);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [lampId, setLampId] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [wattage, setWattage] = useState('');
  const [installDate, setInstallDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleSave = () => {
    if (!lampId || !technicianName || !wattage) {
      toast({ title: "Error", description: "Mohon lengkapi data", variant: "destructive" });
      return;
    }

    const newInstall = {
      id: editingId || Date.now(),
      lampId: parseInt(lampId),
      lampName: `Lampu ${lampId}`,
      technicianName,
      wattage: parseFloat(wattage),
      installationDate: new Date(installDate),
    };

    if (editingId) {
      setInstallations(prev => prev.map(i => i.id === editingId ? newInstall : i));
      toast({ title: "Berhasil", description: "Data pemasangan diperbarui" });
    } else {
      setInstallations(prev => [...prev, newInstall]);
      toast({ title: "Berhasil", description: "Data pemasangan ditambahkan" });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setLampId('');
    setTechnicianName('');
    setWattage('');
    setInstallDate(format(new Date(), 'yyyy-MM-dd'));
    setEditingId(null);
  };

  const handleEdit = (install: Installation) => {
    setEditingId(install.id);
    setLampId(install.lampId.toString());
    setTechnicianName(install.technicianName);
    setWattage(install.wattage.toString());
    setInstallDate(format(install.installationDate, 'yyyy-MM-dd'));
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setInstallations(prev => prev.filter(i => i.id !== id));
    toast({ title: "Berhasil", description: "Data pemasangan dihapus" });
  };

  return (
    <div className="min-h-screen">
      <Header title="Data Pemasangan" subtitle="Kelola riwayat pemasangan dan penggantian lampu" />
      
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="gap-2">
                <Plus className="w-4 h-4" /> Tambah Pemasangan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Data' : 'Tambah Data'} Pemasangan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Pilih Lampu (Terkoneksi)</Label>
                  <Select value={lampId} onValueChange={setLampId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih nomor lampu" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(id => (
                        <SelectItem key={id} value={id.toString()}>Lampu {id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nama Teknisi</Label>
                  <Input value={technicianName} onChange={e => setTechnicianName(e.target.value)} placeholder="Masukkan nama teknisi" />
                </div>
                <div className="space-y-2">
                  <Label>Wattage (W)</Label>
                  <Input type="number" value={wattage} onChange={e => setWattage(e.target.value)} placeholder="Contoh: 3.6" />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Pemasangan</Label>
                  <Input type="date" value={installDate} onChange={e => setInstallDate(e.target.value)} />
                </div>
                <Button onClick={handleSave} className="w-full mt-4">Simpan Data</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lampu</TableHead>
                <TableHead>Teknisi</TableHead>
                <TableHead>Konsumsi (W)</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installations.map(i => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-warning" /> {i.lampName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" /> {i.technicianName}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-accent">{i.wattage} W</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {format(i.installationDate, 'dd MMM yyyy', { locale: id })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(i)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(i.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
