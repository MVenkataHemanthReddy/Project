import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Ticket, TicketStatus, Priority, Category } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { CategoryBadge } from './CategoryBadge';
import {
  X,
  MessageSquare,
  History,
  Send,
  Trash2,
  Edit2,
  AlertCircle,
  Loader2,
  CornerDownLeft,
} from 'lucide-react';

interface TicketDetailModalProps {
  ticketId: string | null;
  onClose: () => void;
  onTicketUpdated: () => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticketId,
  onClose,
  onTicketUpdated,
}) => {
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comments state
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Edit ticket state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');

  useEffect(() => {
    if (!ticketId) return;

    let isMounted = true;
    async function fetchTicketDetails() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/tickets/${ticketId}`);
        if (isMounted) {
          setTicket(res.data.data);
          setEditTitle(res.data.data.title);
          setEditDescription(res.data.data.description);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.error || 'Failed to load ticket details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchTicketDetails();
    return () => {
      isMounted = false;
    };
  }, [ticketId]);

  if (!ticketId) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !ticket) return;

    setSubmittingComment(true);
    try {
      const res = await api.post(`/tickets/${ticket.id}/comments`, {
        content: newComment.trim(),
      });
      setTicket((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          comments: [...(prev.comments || []), res.data.data],
        };
      });
      setNewComment('');
      onTicketUpdated();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to post response.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    try {
      const res = await api.patch(`/tickets/${ticket.id}`, { status: newStatus });
      setTicket((prev) => (prev ? { ...prev, status: newStatus, resolvedAt: res.data.data.resolvedAt } : null));
      onTicketUpdated();
      const fresh = await api.get(`/tickets/${ticket.id}`);
      setTicket(fresh.data.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status.');
    }
  };

  const handlePriorityChange = async (newPriority: Priority) => {
    if (!ticket) return;
    try {
      await api.patch(`/tickets/${ticket.id}`, { priority: newPriority });
      setTicket((prev) => (prev ? { ...prev, priority: newPriority } : null));
      onTicketUpdated();
      const fresh = await api.get(`/tickets/${ticket.id}`);
      setTicket(fresh.data.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update priority.');
    }
  };

  const handleSaveEdit = async () => {
    if (!ticket) return;
    setSavingEdit(true);
    try {
      const res = await api.patch(`/tickets/${ticket.id}`, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      });
      setTicket((prev) => (prev ? { ...prev, ...res.data.data } : null));
      setIsEditing(false);
      onTicketUpdated();
      const fresh = await api.get(`/tickets/${ticket.id}`);
      setTicket(fresh.data.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update ticket.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!ticket) return;
    if (!window.confirm(`Delete Ticket #${ticket.ticketNumber}?`)) {
      return;
    }

    try {
      await api.delete(`/tickets/${ticket.id}`);
      onTicketUpdated();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete ticket.');
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const isOwner = user?.id === ticket?.userId;
  const canEdit = isAdmin || (isOwner && ticket?.status !== 'RESOLVED' && ticket?.status !== 'CLOSED');
  const canDelete = isAdmin || (isOwner && ticket?.status === 'OPEN');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200/90 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-3.5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-medium text-zinc-400">
              #{ticket?.ticketNumber || '...'}
            </span>
            {ticket && (
              <div className="flex items-center gap-2">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                <CategoryBadge category={ticket.category} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {canDelete && (
              <button
                onClick={handleDelete}
                className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                title="Delete ticket"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="flex-1 p-12 flex flex-col items-center justify-center text-zinc-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-800 mb-2" />
            <span>Loading ticket details...</span>
          </div>
        ) : error ? (
          <div className="flex-1 p-8 text-center text-rose-600 text-xs flex flex-col items-center justify-center">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p>{error}</p>
          </div>
        ) : ticket ? (
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200/80">
            {/* Left 2 Cols: Main Content & Timeline */}
            <div className="lg:col-span-2 p-6 flex flex-col space-y-6">
              {/* Subject & Description */}
              {isEditing ? (
                <div className="space-y-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 font-medium"
                  />
                  <textarea
                    rows={4}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-200 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={savingEdit}
                      className="px-3 py-1 text-xs font-medium text-white bg-zinc-900 rounded disabled:opacity-50"
                    >
                      {savingEdit ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base sm:text-lg font-semibold text-zinc-900 tracking-tight leading-snug">
                      {ticket.title}
                    </h2>
                    {canEdit && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-1 text-zinc-400 hover:text-zinc-800 rounded hover:bg-zinc-100 transition-colors"
                        title="Edit title or description"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-100 text-zinc-700 text-xs whitespace-pre-wrap leading-relaxed">
                    {ticket.description}
                  </div>
                </div>
              )}

              {/* Segmented Tabs: Responses vs Audit History */}
              <div className="border-t border-zinc-100 pt-4 flex-1 flex flex-col">
                <div className="flex items-center gap-1.5 bg-zinc-100 p-0.5 rounded-lg text-xs font-medium text-zinc-600 self-start mb-4">
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                      activeTab === 'comments'
                        ? 'bg-white text-zinc-900 font-semibold shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Responses ({ticket.comments?.length || 0})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                      activeTab === 'history'
                        ? 'bg-white text-zinc-900 font-semibold shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Audit Trail ({ticket.activityLogs?.length || 0})</span>
                  </button>
                </div>

                {/* Responses Tab */}
                {activeTab === 'comments' && (
                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {ticket.comments?.length === 0 ? (
                        <p className="text-center py-6 text-zinc-400 text-xs">
                          No responses recorded yet.
                        </p>
                      ) : (
                        ticket.comments?.map((comment) => (
                          <div
                            key={comment.id}
                            className={`p-3.5 rounded-xl border text-xs ${
                              comment.user?.role === 'ADMIN'
                                ? 'bg-zinc-50/80 border-zinc-200'
                                : 'bg-white border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-zinc-900">
                                  {comment.user?.name}
                                </span>
                                {comment.user?.role === 'ADMIN' && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-800">
                                    Support Staff
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                {new Date(comment.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-zinc-700 whitespace-pre-wrap leading-relaxed">
                              {comment.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Reply Input */}
                    <form onSubmit={handleAddComment} className="pt-2 flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={
                          isAdmin
                            ? 'Reply as support administrator...'
                            : 'Write a response or provide additional details...'
                        }
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400"
                      />
                      <button
                        type="submit"
                        disabled={submittingComment || !newComment.trim()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-sm disabled:opacity-40 transition-all shrink-0"
                      >
                        {submittingComment ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CornerDownLeft className="w-3.5 h-3.5" />
                        )}
                        <span>Reply</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* Audit Trail Tab */}
                {activeTab === 'history' && (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {ticket.activityLogs?.length === 0 ? (
                      <p className="text-center py-6 text-zinc-400 text-xs">
                        No activity recorded.
                      </p>
                    ) : (
                      ticket.activityLogs?.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 text-xs"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-zinc-900">
                                {log.action.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                {new Date(log.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-0.5">{log.details}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Meta Inspector Sidebar */}
            <div className="p-6 bg-zinc-50/40 space-y-5 text-xs">
              {/* Status Picker */}
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Status
                </span>
                {isAdmin ? (
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-zinc-200 bg-white font-medium focus:ring-1 focus:ring-zinc-900 cursor-pointer"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                ) : (
                  <StatusBadge status={ticket.status} size="md" />
                )}
              </div>

              {/* Priority Picker */}
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Priority
                </span>
                {isAdmin ? (
                  <select
                    value={ticket.priority}
                    onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-zinc-200 bg-white font-medium focus:ring-1 focus:ring-zinc-900 cursor-pointer"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                ) : (
                  <PriorityBadge priority={ticket.priority} />
                )}
              </div>

              {/* Metadata Details */}
              <div className="pt-4 border-t border-zinc-200/80 space-y-3">
                <div>
                  <span className="text-zinc-400 text-[10px] uppercase tracking-wider block">Customer</span>
                  <span className="font-medium text-zinc-800 block mt-0.5">{ticket.user?.name}</span>
                  <span className="text-zinc-400 text-[11px]">{ticket.user?.email}</span>
                </div>

                <div>
                  <span className="text-zinc-400 text-[10px] uppercase tracking-wider block">Assignee</span>
                  <span className="text-zinc-600 block mt-0.5">
                    {ticket.assignedTo?.name || 'Unassigned'}
                  </span>
                </div>

                <div>
                  <span className="text-zinc-400 text-[10px] uppercase tracking-wider block">Created</span>
                  <span className="text-zinc-600 font-mono text-[11px] block mt-0.5">
                    {new Date(ticket.createdAt).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>

                {ticket.resolvedAt && (
                  <div>
                    <span className="text-zinc-400 text-[10px] uppercase tracking-wider block">Resolved</span>
                    <span className="text-emerald-700 font-mono text-[11px] block mt-0.5">
                      {new Date(ticket.resolvedAt).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
