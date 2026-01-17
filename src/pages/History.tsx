import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockRooms } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { socket } from '@/lib/socket';
import { 
  Search, 
  Download, 
  Calendar, 
  Lightbulb, 
  Wind, 
  Power, 
  PowerOff, 
  ChevronLeft, 
  ChevronRight, 
  History as HistoryIcon, 
  User as UserIcon, 
  Building2,
  Info,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { ControlLog } from '@/types';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function History() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const itemsPerPage = 12;

  useEffect(() => {
    // Initial fetch
    let isMounted = true;
    fetch('/api/logs')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch logs');
        return res.json();
      })
      .then(data => {
        if (!isMounted) return;
        const formatted = (data || []).map((l: any) => ({
          ...l,
          timestamp: l.timestamp ? new Date(l.timestamp) : new Date(),
          userName: 'System / MQTT',
          roomName: 'Prototype 1.0.1',
          deviceType: l.deviceId === 6 ? 'ac' : 'lamp',
          lampName: l.deviceId === 0 ? 'Master Switch' : (l.deviceId === 6 ? 'Air Conditioner' : `Lampu ${l.deviceId}`)
        }));
        setAllLogs(formatted);
      })
      .catch(err => {
        console.error("Error fetching logs:", err);
      });

    const handleNewLog = (log: any) => {
      if (!isMounted) return;
      setAllLogs(prev => [{
        ...log,
        timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
        userName: log.user || 'System / MQTT',
        lampName: log.device || (log.deviceId === 0 ? 'Master Switch' : `Lampu ${log.deviceId}`),
        action: log.status || log.action
      }, ...prev]);
    };

    socket.on("device_update", (data) => {
       // Handle real-time device updates as history logs
       handleNewLog({
         timestamp: new Date(),
         user: data.user || 'System',
         device: data.name || `Lampu ${data.id}`,
         status: data.status ? 'Power ON' : 'Power OFF',
         deviceId: data.id
       });
    });

    socket.on("mqtt_log", (log) => {
      handleNewLog(log);
    });

    return () => {
      socket.off("device_update");
      socket.off("mqtt_log");
    };
  }, []);

  const filteredLogs = useMemo(() => {
    return allLogs.filter(log => {
      const matchesSearch = log.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (log.lampName?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesRoom = roomFilter === 'all' || log.roomName === roomFilter;
      const matchesUser = userFilter === 'all' || log.userName === userFilter;
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      return matchesSearch && matchesRoom && matchesUser && matchesAction;
    });
  }, [allLogs, searchQuery, roomFilter, userFilter, actionFilter]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const uniqueUsers = useMemo(() => {
    return [...new Set(allLogs.map(l => l.userName))];
  }, [allLogs]);

  return (
    <div className="min-h-screen pb-10">
      <Header 
        title="Riwayat Aktivitas" 
        subtitle="Log terstruktur untuk kontrol perangkat dan pemeliharaan sistem"
      />

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Filters & Actions Card */}
        <div className="glass-card rounded-2xl p-6 border-primary/10 shadow-sm">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 flex-1 min-w-[300px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari ruangan, petugas, atau lampu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-muted/30 border-none h-11 focus-visible:ring-primary/30"
                />
              </div>

              <Select value={roomFilter} onValueChange={setRoomFilter}>
                <SelectTrigger className="w-[180px] bg-muted/30 border-none h-11">
                  <SelectValue placeholder="Semua Ruangan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Ruangan</SelectItem>
                  {mockRooms.map(room => (
                    <SelectItem key={room.id} value={room.name}>{room.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isAdmin && (
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-[180px] bg-muted/30 border-none h-11">
                    <SelectValue placeholder="Semua Petugas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Petugas</SelectItem>
                    {uniqueUsers.map(userName => (
                      <SelectItem key={userName} value={userName}>{userName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[160px] bg-muted/30 border-none h-11">
                  <SelectValue placeholder="Semua Aksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Aksi</SelectItem>
                  <SelectItem value="turn_on">Power ON</SelectItem>
                  <SelectItem value="turn_off">Power OFF</SelectItem>
                  <SelectItem value="replace">Pergantian</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isAdmin && (
              <Button variant="outline" className="gap-2 h-11 px-5 border-primary/20 hover:bg-primary/5">
                <Download className="w-4 h-4" />
                Ekspor Laporan
              </Button>
            )}
          </div>

          <div className="flex gap-4 mt-6 pt-6 border-t border-border/40 overflow-x-auto pb-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/10">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Total: <span className="font-bold">{filteredLogs.length}</span> Entri</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/5 border border-success/10 text-success">
              <Power className="w-4 h-4" />
              <span className="text-sm font-medium">Power ON: <span className="font-bold">{filteredLogs.filter(l => l.action === 'turn_on').length}</span></span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-warning/5 border border-warning/10 text-warning">
              <HistoryIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Pergantian: <span className="font-bold">{filteredLogs.filter(l => l.action === 'replace').length}</span></span>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="glass-card rounded-2xl overflow-hidden border-primary/5 shadow-xl">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="w-[180px] font-bold py-5 pl-6">WAKTU</TableHead>
                  <TableHead className="font-bold py-5">PETUGAS / USER</TableHead>
                  <TableHead className="font-bold py-5">PERANGKAT</TableHead>
                  <TableHead className="font-bold py-5 pr-6">STATUS / AKSI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => {
                  const isReplace = log.action === 'replace' || log.action === 'Pergantian';
                  const isOn = log.action === 'turn_on' || log.action === 'Power ON' || log.action === 'on';
                  
                  return (
                    <TableRow 
                      key={log.id || Math.random()} 
                      className={cn(
                        "group cursor-pointer border-border/40 transition-colors",
                        isReplace ? "bg-warning/5 hover:bg-warning/10" : "hover:bg-muted/40"
                      )}
                      onClick={() => setSelectedLog(log)}
                    >
                      <TableCell className="font-mono text-sm py-4 pl-6">
                        <div className="flex flex-col">
                          <span className="font-bold">{format(log.timestamp, 'dd MMM yyyy')}</span>
                          <span className="text-xs text-muted-foreground">{format(log.timestamp, 'HH:mm:ss')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-primary-foreground shadow-sm">
                            {(log.userName || 'S').split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium group-hover:text-primary transition-colors">{log.userName}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Aktivitas Sistem</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-warning/10 text-warning">
                            <Lightbulb className="w-4 h-4" />
                          </div>
                          <span className="font-medium">{log.lampName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 pr-6">
                        <Badge className={cn(
                          "px-3 py-1 rounded-full gap-1.5 text-[11px] font-bold uppercase tracking-wider",
                          isReplace 
                            ? "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20 shadow-none"
                            : (isOn 
                                ? "bg-success/10 text-success border-success/30 hover:bg-success/20 shadow-none" 
                                : "bg-muted text-muted-foreground border-border hover:bg-muted shadow-none")
                        )} variant="outline">
                          {isReplace ? <HistoryIcon className="w-3 h-3" /> : (isOn ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />)}
                          {log.action}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {filteredLogs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Info className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">Tidak ada data history yang ditemukan</p>
                <p className="text-sm">Coba sesuaikan filter atau kata kunci pencarian Anda</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-6 bg-muted/10 border-t border-border/40">
            <p className="text-sm text-muted-foreground">
              Menampilkan <span className="font-bold text-foreground">{((currentPage - 1) * itemsPerPage) + 1}</span> - <span className="font-bold text-foreground">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> dari <span className="font-bold text-foreground">{filteredLogs.length}</span> entri
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-9 w-9 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={cn("h-9 w-9", currentPage === page && "shadow-md shadow-primary/20")}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-9 w-9 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Dialog - Enhanced Interactivity */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-2xl shadow-2xl">
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-8 border-b border-border/40">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-background flex items-center justify-center shadow-lg border border-primary/20">
                <HistoryIcon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">Detail Aktivitas</DialogTitle>
                <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  ID Log: #SYS-{selectedLog?.id.toString().padStart(4, '0')}
                </p>
              </div>
            </div>
          </div>

          {selectedLog && (
            <div className="p-8 space-y-8 bg-background">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">WAKTU EKSEKUSI</p>
                  <p className="font-semibold text-sm">{format(selectedLog.timestamp, 'eeee, dd MMMM yyyy', { locale: id })}</p>
                  <p className="text-sm text-primary font-bold">{format(selectedLog.timestamp, 'HH:mm:ss')}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">PETUGAS PELAKSANA</p>
                  <p className="font-semibold text-sm">{selectedLog.userName}</p>
                  <p className="text-[10px] text-muted-foreground">Authenticated via System Login</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 py-6 border-y border-border/40">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">LOKASI SISTEM</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="font-bold text-sm">{selectedLog.roomName}</span>
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">PERANGKAT & STATUS</p>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <span className="font-bold text-sm">
                      {selectedLog.deviceType === 'lamp' ? (selectedLog.lampName || 'Lampu') : 'AC'}
                    </span>
                    <Badge className={cn(
                      "px-2 py-0 text-[9px] font-bold uppercase",
                      selectedLog.action === 'turn_on' ? "bg-success/10 text-success border-success/30" : "bg-muted text-muted-foreground"
                    )}>
                      {selectedLog.action === 'turn_on' ? 'Power ON' : 'Power OFF'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {selectedLog.action === 'replace' && (
                <div className="rounded-2xl bg-gradient-to-br from-warning/10 to-orange-500/10 p-6 border border-warning/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                    <Lightbulb className="w-20 h-20 -mr-6 -mt-6" />
                  </div>
                  
                  <h4 className="text-sm font-bold text-warning flex items-center gap-2 mb-4">
                    <Info className="w-4 h-4" />
                    SPESIFIKASI TEKNIS PERGANTIAN
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">MEREK LAMPU</p>
                      <p className="font-bold text-sm">{selectedLog.brand}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">DAYA (WATT)</p>
                      <p className="font-bold text-sm text-primary">{selectedLog.wattage} Watt</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">PETUGAS MAINTENANCE</p>
                      <p className="font-bold text-sm">{selectedLog.technician}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">VERIFIKASI SISTEM</p>
                      <Badge className="bg-success/20 text-success text-[8px] font-black border-none h-4">TERCATAT</Badge>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Button 
                  onClick={() => setSelectedLog(null)} 
                  className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
                >
                  Tutup Rincian
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
