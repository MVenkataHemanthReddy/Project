import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { Ticket, TicketStatus, Priority, Category, OverviewStats } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import {
  Search,
  CheckCircle2,
  Clock,
  Inbox,
  Users,
  Activity,
  Percent,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface AdminDashboardProps {
  onSelectTicket: (ticketId: string) => void;
  refreshKey: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onSelectTicket,
  refreshKey,
}) => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const res = await api.get('/stats/overview');
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  // Fetch Tickets
  const fetchTickets = useCallback(async () => {
    setTableLoading(true);
    try {
      const params: any = {
        page,
        limit: 10,
      };

      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const res = await api.get('/tickets', { params });
      setTickets(res.data.data || []);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load admin tickets:', err);
    } finally {
      setTableLoading(false);
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter, categoryFilter, debouncedSearch, refreshKey]);

  useEffect(() => {
    fetchStats();
    fetchTickets();
  }, [fetchTickets]);

  // Inline Status Quick Changer
  const handleQuickStatusChange = async (e: React.MouseEvent, ticketId: string, newStatus: TicketStatus) => {
    e.stopPropagation();
    try {
      await api.patch(`/tickets/${ticketId}`, { status: newStatus });
      fetchTickets();
      fetchStats();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Admin Operations Center
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              Full Governance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time management of helpdesk tickets, automated event triggers, and system performance metrics.
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Inbox className="w-4 h-4 text-slate-400" />
              Total Tickets
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-2">
              {stats.summary.totalTickets}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-500" />
              Open Tickets
            </span>
            <p className="text-2xl font-extrabold text-emerald-700 mt-2">
              {stats.summary.openTickets}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-blue-600 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-500" />
              In Progress
            </span>
            <p className="text-2xl font-extrabold text-blue-700 mt-2">
              {stats.summary.inProgressTickets}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-purple-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-purple-500" />
              Resolved
            </span>
            <p className="text-2xl font-extrabold text-purple-700 mt-2">
              {stats.summary.resolvedTickets}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-indigo-500" />
              Resolution Rate
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-2">
              {stats.summary.resolutionRate}%
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              Registered Users
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-2">
              {stats.summary.totalUsers}
            </p>
          </div>
        </div>
      )}

      {/* Breakdowns & Recent Activity Row */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Priority Distribution */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Distribution by Priority
            </h3>
            <div className="space-y-2">
              {stats.byPriority.map((item) => {
                const total = stats.summary.totalTickets || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.priority} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <PriorityBadge priority={item.priority} />
                      <span className="text-slate-600 font-semibold">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.priority === 'URGENT'
                            ? 'bg-rose-500'
                            : item.priority === 'HIGH'
                            ? 'bg-orange-500'
                            : item.priority === 'MEDIUM'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Distribution by Category
            </h3>
            <div className="space-y-2">
              {stats.byCategory.map((item) => {
                const total = stats.summary.totalTickets || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <CategoryBadge category={item.category} />
                      <span className="text-slate-600 font-semibold">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Event Stream */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                Live Event Audit Trail
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {stats.recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] space-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {act.action.replace('_', ' ')}
                    </span>
                    <span className="text-slate-400">
                      {new Date(act.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-slate-600 line-clamp-1">{act.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Ticket Governance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'All Tickets' },
              { id: 'OPEN', label: 'Open' },
              { id: 'IN_PROGRESS', label: 'In Progress' },
              { id: 'RESOLVED', label: 'Resolved' },
              { id: 'CLOSED', label: 'Closed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === tab.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search all tickets by title, customer, or keywords..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent 🔥</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All Categories</option>
                <option value="TECHNICAL">Technical</option>
                <option value="BILLING">Billing</option>
                <option value="ACCOUNT">Account</option>
                <option value="FEATURE_REQUEST">Feature Request</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Subject & Description</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status Transition</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {tableLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No tickets match the selected criteria.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTicket(t.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      #{t.ticketNumber}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                      <div className="font-semibold text-slate-900 line-clamp-1">
                        {t.title}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {t.description}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{t.user?.name}</div>
                      <div className="text-[10px] text-slate-400">{t.user?.email}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <CategoryBadge category={t.category} />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={t.priority} />
                    </td>

                    <td
                      className="py-3.5 px-4 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={t.status}
                        onChange={(e) =>
                          handleQuickStatusChange(
                            e as any,
                            t.id,
                            e.target.value as TicketStatus
                          )
                        }
                        className={`text-xs px-2.5 py-1 rounded-full border font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer ${
                          t.status === 'OPEN'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : t.status === 'RESOLVED'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                      {new Date(t.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total tickets)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
