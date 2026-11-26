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
  CheckCircle2,
  UserCheck,
  AlertCircle,
  Loader2,
  Calendar,
  Tag,
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
  const [editPriority, setEditPriority] = useState<Priority>('MEDIUM');
  const [editCategory, setEditCategory] = useState<Category>('GENERAL');
  const [savingEdit, setSavingEdit] = useState(false);

  // Tab state (Comments vs Event Audit Trail)
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
          setEditPriority(res.data.data.priority);
          setEditCategory(res.data.data.category);
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

  // Handler: Add comment
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
      alert(err.response?.data?.error || 'Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handler: Update status (Admin only)
  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    try {
      const res = await api.patch(`/tickets/${ticket.id}`, {
        status: newStatus,
      });
      setTicket((prev) => (prev ? { ...prev, status: newStatus, resolvedAt: res.data.data.resolvedAt } : null));
      onTicketUpdated();
      // Refetch ticket to refresh audit trail
      const fresh = await api.get(`/tickets/${ticket.id}`);
      setTicket(fresh.data.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status.');
    }
  };

  // Handler: Update priority (Admin or owner)
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

  // Handler: Save edit
  const handleSaveEdit = async () => {
    if (!ticket) return;
    setSavingEdit(true);
    try {
      const res = await api.patch(`/tickets/${ticket.id}`, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority,
        category: editCategory,
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

  // Handler: Delete ticket
  const handleDelete = async () => {
    if (!ticket) return;
    if (!window.confirm(`Are you sure you want to delete Ticket #${ticket.ticketNumber}?`)) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
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
          <div className="flex items-center gap-2">
            {canDelete && (
              <button
                onClick={handleDelete}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Delete ticket"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex-1 p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm">Loading ticket details...</p>
          </div>
        ) : error ? (
          <div className="flex-1 p-8 text-center text-rose-600 text-sm flex flex-col items-center justify-center">
            <AlertCircle className="w-10 h-10 mb-2" />
            <p>{error}</p>
          </div>
        ) : ticket ? (
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Left 2 Cols: Main Info, Comments & Timeline */}
            <div className="lg:col-span-2 p-6 flex flex-col space-y-6">
              {/* Title & Description */}
              {isEditing ? (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Editing Ticket
                    </span>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    rows={4}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={savingEdit}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm disabled:opacity-50"
                    >
                      {savingEdit ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                      {ticket.title}
                    </h1>
                    {canEdit && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors"
                        title="Edit ticket"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      {ticket.user?.name}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                    {ticket.description}
                  </div>
                </div>
              )}

              {/* Tab Navigation: Comments vs Activity Audit Log */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      activeTab === 'comments'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Responses ({ticket.comments?.length || 0})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      activeTab === 'history'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Event Audit Trail ({ticket.activityLogs?.length || 0})</span>
                  </button>
                </div>

                {/* Tab: Comments Thread */}
                {activeTab === 'comments' && (
                  <div className="mt-4 space-y-4">
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {ticket.comments?.length === 0 ? (
                        <p className="text-center py-6 text-slate-400 text-xs">
                          No responses on this ticket yet. Start the conversation below.
                        </p>
                      ) : (
                        ticket.comments?.map((comment) => (
                          <div
                            key={comment.id}
                            className={`p-3.5 rounded-xl border text-xs ${
                              comment.user?.role === 'ADMIN'
                                ? 'bg-purple-50/50 border-purple-100'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-800">
                                  {comment.user?.name}
                                </span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                    comment.user?.role === 'ADMIN'
                                      ? 'bg-purple-200 text-purple-800'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {comment.user?.role}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {new Date(comment.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                              {comment.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* New Comment Input */}
                    <form onSubmit={handleAddComment} className="pt-2 flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={
                          isAdmin
                            ? 'Reply as Admin (notifies customer)...'
                            : 'Add a message or update on your ticket...'
                        }
                        className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 placeholder:text-slate-400"
                      />
                      <button
                        type="submit"
                        disabled={submittingComment || !newComment.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 transition-all shrink-0"
                      >
                        {submittingComment ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Reply</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* Tab: Event Audit Trail */}
                {activeTab === 'history' && (
                  <div className="mt-4 space-y-3 max-h-80 overflow-y-auto">
                    {ticket.activityLogs?.length === 0 ? (
                      <p className="text-center py-6 text-slate-400 text-xs">
                        No events logged yet.
                      </p>
                    ) : (
                      ticket.activityLogs?.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                        >
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800">
                                {log.action.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(log.createdAt).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-slate-600 mt-0.5">{log.details}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Management & Metadata Panel */}
            <div className="p-6 bg-slate-50/50 space-y-6">
              {/* Status Controller */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Ticket Status
                </label>
                {isAdmin ? (
                  <div className="space-y-1.5">
                    {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as TicketStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(st)}
                        className={`w-full px-3 py-2 text-xs font-medium rounded-lg border text-left flex items-center justify-between transition-all ${
                          ticket.status === st
                            ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 text-blue-700 shadow-sm'
                            : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <StatusBadge status={st} />
                        </div>
                        {ticket.status === st && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <StatusBadge status={ticket.status} size="md" />
                    <p className="text-[11px] text-slate-400 mt-2">
                      Status is managed by helpdesk administrators.
                    </p>
                  </div>
                )}
              </div>

              {/* Priority Controller */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Priority
                </label>
                {isAdmin ? (
                  <select
                    value={ticket.priority}
                    onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent 🔥</option>
                  </select>
                ) : (
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                )}
              </div>

              {/* Ticket Details Summary */}
              <div className="border-t border-slate-200 pt-4 space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Submitted by</span>
                  <span className="font-semibold text-slate-800">{ticket.user?.name}</span>
                  <span className="text-slate-500 block text-[11px]">{ticket.user?.email}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Assigned Agent</span>
                  <span className="font-semibold text-slate-800">
                    {ticket.assignedTo?.name || 'Unassigned (General Pool)'}
                  </span>
                </div>

                {ticket.resolvedAt && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Resolved At</span>
                    <span className="font-semibold text-purple-700">
                      {new Date(ticket.resolvedAt).toLocaleString()}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 block text-[11px]">Last Updated</span>
                  <span className="text-slate-600">
                    {new Date(ticket.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
