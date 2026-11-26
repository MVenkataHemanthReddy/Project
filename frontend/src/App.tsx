import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthPage } from './pages/AuthPage';
import { UserDashboard } from './pages/UserDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Navbar } from './components/Navbar';
import { CreateTicketModal } from './components/CreateTicketModal';
import { TicketDetailModal } from './components/TicketDetailModal';
import { EmailOutboxModal } from './components/EmailOutboxModal';
import { Loader2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-sm text-slate-300 font-medium">Initializing HelpDesk System...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleTicketCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleTicketUpdated = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        onOpenCreateModal={() => setCreateModalOpen(true)}
        onOpenEmailModal={() => setEmailModalOpen(true)}
        onSelectTicket={(id) => setSelectedTicketId(id)}
      />

      {/* Role-based Dashboard */}
      <main className="flex-1">
        {user.role === 'ADMIN' ? (
          <AdminDashboard
            onSelectTicket={(id) => setSelectedTicketId(id)}
            refreshKey={refreshKey}
          />
        ) : (
          <UserDashboard
            onOpenCreateTicket={() => setCreateModalOpen(true)}
            onSelectTicket={(id) => setSelectedTicketId(id)}
            refreshKey={refreshKey}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Support Ticket Management System • Node.js, Express, TypeScript, React, Prisma</span>
          <span className="font-mono text-[11px]">Event-Driven Architecture (Node.js EventEmitter)</span>
        </div>
      </footer>

      {/* Modals */}
      <CreateTicketModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onTicketCreated={handleTicketCreated}
      />

      <TicketDetailModal
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        onTicketUpdated={handleTicketUpdated}
      />

      <EmailOutboxModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainLayout />
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
