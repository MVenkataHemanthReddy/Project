import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { Ticket, TicketStatus, Priority, Category } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import {
  Search,
  Plus,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Filter,
} from 'lucide-react';

interface UserDashboardProps {
  onOpenCreateTicket: () => void;
  onSelectTicket: (ticketId: string) => void;
  refreshKey: number;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onOpenCreateTicket,
  onSelectTicket,
  refreshKey,
}) => {
  const { user } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch tickets.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter, categoryFilter, debouncedSearch, refreshKey]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Support Requests</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Track inquiries, bug reports, and updates from the engineering support team.
          </p>
        </div>

        <button
          onClick={onOpenCreateTicket}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Segmented Filter & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented status control */}
          <div className="inline-flex items-center bg-zinc-100 p-0.5 rounded-lg text-xs font-medium text-zinc-600 overflow-x-auto max-w-full">
            {[
              { id: 'ALL', label: 'All', count: pagination.total },
              { id: 'OPEN', label: 'Open', count: openCount },
              { id: 'IN_PROGRESS', label: 'In Progress', count: inProgressCount },
              { id: 'RESOLVED', label: 'Resolved', count: resolvedCount },
              { id: 'CLOSED', label: 'Closed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? 'bg-white text-zinc-900 font-semibold shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1.5 text-[10px] text-zinc-400">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by keyword..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 placeholder:text-zinc-400"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs rounded-md border border-zinc-200 bg-white text-zinc-700 font-medium focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              <option value="ALL">Priority: All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ticket List View (Apple / Linear Issue List Style) */}
      <div className="bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-xs">
            <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading tickets...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-600 text-xs">{error}</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center space-y-2.5">
            <Inbox className="w-7 h-7 mx-auto text-zinc-300 stroke-[1.5]" />
            <p className="text-xs font-semibold text-zinc-800">No tickets found</p>
            <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
              {search || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                ? 'Try adjusting your search criteria or filters.'
                : 'You currently have no open requests. Create a ticket if you need assistance.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTicket(t.id)}
                className="px-4 py-3.5 hover:bg-zinc-50/70 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <span className="font-mono text-[11px] text-zinc-400 font-medium shrink-0 pt-0.5 sm:pt-0">
                    #{t.ticketNumber}
                  </span>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-zinc-900 group-hover:text-blue-600 transition-colors">
                        {t.title}
                      </span>
                      <CategoryBadge category={t.category} />
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-1">
                      {t.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto text-xs">
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />

                  <div className="flex items-center gap-1 text-[11px] text-zinc-400 w-8 justify-end">
                    <MessageSquare className="w-3 h-3 text-zinc-400" />
                    <span>{t._count?.comments || 0}</span>
                  </div>

                  <span className="text-[11px] text-zinc-400 whitespace-nowrap min-w-[70px] text-right">
                    {new Date(t.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 bg-zinc-50/40">
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
