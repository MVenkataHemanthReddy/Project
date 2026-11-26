import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { Ticket, TicketStatus, Priority, Category, OverviewStats } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Activity,
  ArrowUpDown,
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/stats/overview');
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

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

  const handleQuickStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
    ticketId: string
  ) => {
    e.stopPropagation();
    const newStatus = e.target.value as TicketStatus;
    try {
      await api.patch(`/tickets/${ticketId}`, { status: newStatus });
      fetchTickets();
      fetchStats();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
            Support Operations
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Triage customer inquiries, review audit logs, and monitor resolution rates.
          </p>
        </div>
      </div>

      {/* Metric Cards (Apple Health / Linear style) */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-white border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <span className="text-[11px] font-medium text-zinc-400 block uppercase tracking-wider">
              Total Inquiries
            </span>
            <span className="text-2xl font-semibold text-zinc-900 mt-1 block tracking-tight">
              {stats.summary.totalTickets}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <span className="text-[11px] font-medium text-zinc-400 block uppercase tracking-wider">
              Open / Triage
            </span>
            <span className="text-2xl font-semibold text-blue-600 mt-1 block tracking-tight">
              {stats.summary.openTickets}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <span className="text-[11px] font-medium text-zinc-400 block uppercase tracking-wider">
              In Progress
            </span>
            <span className="text-2xl font-semibold text-amber-600 mt-1 block tracking-tight">
              {stats.summary.inProgressTickets}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <span className="text-[11px] font-medium text-zinc-400 block uppercase tracking-wider">
              Resolved
            </span>
            <span className="text-2xl font-semibold text-emerald-600 mt-1 block tracking-tight">
              {stats.summary.resolvedTickets}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <span className="text-[11px] font-medium text-zinc-400 block uppercase tracking-wider">
              Resolution Rate
            </span>
            <span className="text-2xl font-semibold text-zinc-900 mt-1 block tracking-tight">
              {stats.summary.resolutionRate}%
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <span className="text-[11px] font-medium text-zinc-400 block uppercase tracking-wider">
              Avg. Resolution
            </span>
            <span className="text-2xl font-semibold text-zinc-900 mt-1 block tracking-tight">
              {stats.summary.avgResolutionHours}h
            </span>
          </div>
        </div>
      )}

      {/* Distribution & Event Stream Row */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Priority Distribution */}
          <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block">
              Priority Breakdown
            </span>
            <div className="space-y-2">
              {stats.byPriority.map((item) => {
                const total = stats.summary.totalTickets || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.priority} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <PriorityBadge priority={item.priority} />
                      <span className="text-zinc-500 font-medium font-mono text-[11px]">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-zinc-800"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block">
              Category Breakdown
            </span>
            <div className="space-y-2">
              {stats.byCategory.map((item) => {
                const total = stats.summary.totalTickets || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <CategoryBadge category={item.category} />
                      <span className="text-zinc-500 font-medium font-mono text-[11px]">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-zinc-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Activity Stream */}
          <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-zinc-400" />
                Live Event Stream
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {stats.recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="p-2 rounded-lg bg-zinc-50 border border-zinc-100 text-[11px] space-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-800">
                      {act.action.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(act.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-zinc-500 line-clamp-1">{act.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ticket Management Table */}
      <div className="bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Table Filters */}
        <div className="p-3 border-b border-zinc-100 space-y-2.5 bg-zinc-50/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Segmented status selector */}
            <div className="inline-flex bg-zinc-100 p-0.5 rounded-lg text-xs font-medium text-zinc-600 overflow-x-auto">
              {[
                { id: 'ALL', label: 'All' },
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
                  className={`px-3 py-1 rounded-md transition-all ${
                    statusFilter === tab.id
                      ? 'bg-white text-zinc-900 font-semibold shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Keyword Search & Priority select */}
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter tickets..."
                  className="w-full pl-8 pr-2.5 py-1 text-xs rounded-md border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2 py-1 text-xs rounded-md border border-zinc-200 bg-white text-zinc-700 font-medium"
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

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/60 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                <th className="py-2.5 px-4 font-normal">Ticket</th>
                <th className="py-2.5 px-4 font-normal">Subject</th>
                <th className="py-2.5 px-4 font-normal">Customer</th>
                <th className="py-2.5 px-4 font-normal">Category</th>
                <th className="py-2.5 px-4 font-normal">Priority</th>
                <th className="py-2.5 px-4 font-normal">Status</th>
                <th className="py-2.5 px-4 font-normal text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {tableLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <div className="w-4 h-4 border-2 border-zinc-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-zinc-400 text-xs">
                    No tickets match the selected filters.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTicket(t.id)}
                    className="hover:bg-zinc-50/70 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-400 font-medium">
                      #{t.ticketNumber}
                    </td>

                    <td className="py-3 px-4 max-w-xs sm:max-w-md">
                      <div className="font-medium text-zinc-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {t.title}
                      </div>
                      <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                        {t.description}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-medium text-zinc-800 block">{t.user?.name}</span>
                      <span className="text-[10px] text-zinc-400 block">{t.user?.email}</span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <CategoryBadge category={t.category} />
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <PriorityBadge priority={t.priority} />
                    </td>

                    <td
                      className="py-3 px-4 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={t.status}
                        onChange={(e) => handleQuickStatusChange(e, t.id)}
                        className="text-[11px] font-medium px-2 py-1 rounded-md border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-zinc-400 text-[11px] text-right font-mono">
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
          <div className="px-4 py-2.5 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 bg-zinc-50/40">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} tickets)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="p-1 rounded hover:bg-zinc-200 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1 rounded hover:bg-zinc-200 disabled:opacity-30"
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
