import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { SimulatedEmail } from '../types';
import { X, Mail, RefreshCw, Send, CheckCircle2 } from 'lucide-react';

interface EmailOutboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailOutboxModal: React.FC<EmailOutboxModalProps> = ({ isOpen, onClose }) => {
  const [emails, setEmails] = useState<SimulatedEmail[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await api.get('/simulator/emails');
      setEmails(res.data.data || []);
    } catch (err) {
      console.error('Failed to load simulated emails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Event-Driven Email Outbox</h2>
              <p className="text-xs text-slate-500">
                Simulated emails automatically dispatched by event listeners
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchEmails}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
              title="Refresh outbox"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {emails.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <Send className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No outbound emails recorded yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                Create a ticket or update its status to watch the event-driven dispatcher send emails!
              </p>
            </div>
          ) : (
            emails.map((email) => (
              <div
                key={email.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 hover:bg-white transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    To: {email.to}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(email.sentAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800">{email.subject}</p>
                <div className="p-3 bg-white rounded-lg border border-slate-100 text-xs text-slate-600 whitespace-pre-wrap font-mono">
                  {email.body}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>{emails.length} total event-driven notifications</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
