import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockRooms, generateControlLogs } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, subHours } from 'date-fns';
import { id } from 'date-fns/locale';
import { Search, Download, Calendar, Lightbulb, Wind, Power, PowerOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { ControlLog } from '@/types';
import { cn } from '@/lib/utils';

// Generate more history data
function generateExtendedLogs(): ControlLog[] {
  const logs: ControlLog[] = [];
  const users = [
    { id: 1, name: 'Admin User' },
    { id: 2, name: 'Staff User' },
  ];

  for (let i = 0; i < 100; i++) {
    const room = mockRooms[Math.floor(Math.random() * mockRooms.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const deviceType = Math.random() > 0.5 ? 'lamp' : 'ac';
    const action = Math.random() > 0.5 ? 'turn_on' : 'turn_off';
    
    logs.push({
      id: i + 1,
      roomId: room.id,
      roomName: room.name,
      userId: user.id,
      userName: user.name,
      deviceType,
      action,
      timestamp: subHours(new Date(), Math.floor(Math.random() * 168)),
    });
  }

  return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export default function History() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const allLogs = useMemo(() => generateExtendedLogs(), []);

  const filteredLogs = useMemo(() => {
    return allLogs.filter(log => {
      const matchesSearch = log.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           log.userName.toLowerCase().includes(searchQuery.toLowerCase());
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
    <div className="min-h-screen">
      <Header 
        title="Activity History" 
        subtitle="Log aktivitas kontrol perangkat"
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari ruangan atau user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted/50"
              />
            </div>

            <Select value={roomFilter} onValueChange={setRoomFilter}>
              <SelectTrigger className="w-[160px] bg-muted/50">
                <SelectValue placeholder="Ruangan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Ruangan</SelectItem>
                {mockRooms.map(room => (
                  <SelectItem key={room.id} value={room.name}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isAdmin && (
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-[160px] bg-muted/50">
                  <SelectValue placeholder="User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua User</SelectItem>
                  {uniqueUsers.map(userName => (
                    <SelectItem key={userName} value={userName}>
                      {userName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[140px] bg-muted/50">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Action</SelectItem>
                <SelectItem value="turn_on">Turn ON</SelectItem>
                <SelectItem value="turn_off">Turn OFF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isAdmin && (
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Logs
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm">
          <div className="px-3 py-1.5 rounded-full bg-muted/50">
            Total: <span className="font-mono font-semibold">{filteredLogs.length}</span> logs
          </div>
          <div className="px-3 py-1.5 rounded-full bg-success/10 text-success">
            ON: <span className="font-mono font-semibold">{filteredLogs.filter(l => l.action === 'turn_on').length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
            OFF: <span className="font-mono font-semibold">{filteredLogs.filter(l => l.action === 'turn_off').length}</span>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Waktu</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Ruangan</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => {
                  const isOn = log.action === 'turn_on';
                  const Icon = log.deviceType === 'lamp' ? Lightbulb : Wind;
                  const ActionIcon = isOn ? Power : PowerOff;
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(log.timestamp, 'dd MMM yyyy HH:mm', { locale: id })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-primary-foreground">
                            {log.userName.charAt(0)}
                          </div>
                          <span>{log.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{log.roomName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className={cn(
                            "w-4 h-4",
                            log.deviceType === 'lamp' ? "text-warning" : "text-accent"
                          )} />
                          <span>{log.deviceType === 'lamp' ? 'Lampu' : 'AC'}</span>
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
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
                      className="w-8"
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
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
