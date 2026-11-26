import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  Bell,
  Plus,
  LogOut,
  Mail,
  CheckCircle2,
  Inbox,
  Shield,
  User,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  onOpenCreateModal: () => void;
  onOpenEmailModal: () => void;
  onSelectTicket?: (ticketId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreateModal,
  onOpenEmailModal,
  onSelectTicket,
}) => {
  const { user, logout, switchDemoUser } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200/80 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand & Workspace */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-semibold shadow-sm">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
              <path d="M13 5v2" />
              <path d="M13 17v2" />
              <path d="M13 11v2" />
            </svg>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-sm text-zinc-900 tracking-tight">Support Desk</span>
            <span className="text-[11px] font-medium text-zinc-400 hidden sm:inline">
              / {isAdmin ? 'Administration' : 'Workspace'}
            </span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Email Outbox Log Button */}
          <button
            onClick={onOpenEmailModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
            title="Inspect event-driven email dispatches"
          >
            <Mail className="w-3.5 h-3.5 text-zinc-500" />
            <span>Outbox</span>
          </button>

          {/* New Ticket Button */}
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] rounded-md shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Ticket</span>
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-zinc-200/90 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-2 border-b border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-zinc-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.2 rounded-full border border-blue-200/50">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-[11px] text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-zinc-400 text-xs">
                      <Inbox className="w-6 h-6 mx-auto mb-2 text-zinc-300 stroke-[1.5]" />
                      No notifications right now
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (!notif.isRead) markAsRead(notif.id);
                          if (notif.ticketId && onSelectTicket) {
                            onSelectTicket(notif.ticketId);
                            setShowNotifications(false);
                          }
                        }}
                        className={`p-3 text-left hover:bg-zinc-50 transition-colors cursor-pointer flex gap-2.5 ${
                          !notif.isRead ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <div className="mt-1">
                          {!notif.isRead ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 block" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-zinc-900 leading-snug">
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-zinc-400 mt-1 block">
                            {new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-zinc-200 mx-0.5" />

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pl-1.5 hover:bg-zinc-100 rounded-md transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-zinc-200 text-zinc-800 font-medium text-[11px] flex items-center justify-center border border-zinc-300/60">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="text-xs font-medium text-zinc-800 hidden sm:inline">
                {user?.name?.split(' ')[0]}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-zinc-200/90 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-2 border-b border-zinc-100">
                  <p className="text-xs font-semibold text-zinc-900 leading-none">{user?.name}</p>
                  <p className="text-[11px] text-zinc-500 mt-1 truncate">{user?.email}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-700">
                    {isAdmin ? <Shield className="w-3 h-3 text-zinc-700" /> : <User className="w-3 h-3 text-zinc-700" />}
                    <span>{user?.role}</span>
                  </div>
                </div>

                {/* Account Switcher for Demo */}
                <div className="px-2 py-1.5 border-b border-zinc-100">
                  <span className="text-[10px] font-medium text-zinc-400 px-2 uppercase tracking-wider block mb-1">
                    Switch Persona
                  </span>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => {
                        switchDemoUser('admin');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-2 py-1 text-xs rounded-md hover:bg-zinc-100 text-zinc-700 flex items-center justify-between"
                    >
                      <span>Admin (Sarah Connor)</span>
                      {user?.email === 'admin@helpdesk.com' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        switchDemoUser('john');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-2 py-1 text-xs rounded-md hover:bg-zinc-100 text-zinc-700 flex items-center justify-between"
                    >
                      <span>User (John Doe)</span>
                      {user?.email === 'john@example.com' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        switchDemoUser('alice');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-2 py-1 text-xs rounded-md hover:bg-zinc-100 text-zinc-700 flex items-center justify-between"
                    >
                      <span>User (Alice Smith)</span>
                      {user?.email === 'alice@example.com' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-md flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
