import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { apiFetch } from '../services/api';
import { NotificationItem } from '../types';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  ExternalLink,
  CheckCheck
} from 'lucide-react';

export const InstitutionNotificationCenterPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchNotifications = async () => {
    try {
      let q = '?';
      if (categoryFilter) q += `category=${encodeURIComponent(categoryFilter)}&`;
      if (unreadOnly) q += `unread_only=true&`;

      const res = await apiFetch(`/notifications${q}`);
      setNotifications(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [categoryFilter, unreadOnly]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Layout portalType="INSTITUTION">
      <div className="space-y-6">
        <div className="bg-[#FFFEFC] p-6 border border-[#D6C5AE] rounded-sm shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#40372F] flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#8B3A3A]" /> Institutional Notification & Obligation Centre
            </h1>
            <p className="text-xs text-[#A89580] mt-1">
              Surveillance stream of deficiency observations, approaching deadlines, and EVC updates.
            </p>
          </div>

          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-1.5 border border-[#D6C5AE] bg-[#FFFEFC] hover:bg-[#E8DED0] text-xs font-semibold text-[#40372F] rounded-sm transition cursor-pointer flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4 text-[#48745A]" /> Mark All as Read
          </button>
        </div>

        {/* Filters */}
        <div className="bg-[#FFFEFC] p-4 border border-[#D6C5AE] rounded-sm flex flex-col sm:flex-row gap-3 text-xs">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-[#40372F]"
          >
            <option value="">All Categories</option>
            <option value="APPLICATION_WORKFLOW">Application Workflow</option>
            <option value="EVC_SCHEDULING">EVC Coordination</option>
            <option value="COMPLIANCE">Compliance Undertakings</option>
            <option value="DOCUMENT_VALIDITY">Document Validity</option>
          </select>

          <label className="flex items-center gap-2 font-medium text-[#40372F] cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded-xs"
            />
            Show unread only
          </label>
        </div>

        {/* Stream */}
        <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm overflow-hidden shadow-xs divide-y divide-[#D6C5AE]">
          {loading ? (
            <div className="p-8 text-center text-xs text-[#A89580]">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#A89580]">No notifications matching filter.</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-5 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                  !n.is_read ? 'bg-[#FAF7F2]' : ''
                }`}
              >
                <div className="flex-1 space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#40372F]">{n.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-xs font-semibold ${
                      n.type === 'ACTION_REQUIRED' ? 'bg-[#B33A3A] text-white' : 'bg-[#E8DED0] text-[#40372F]'
                    }`}>
                      {n.type}
                    </span>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#8B3A3A]" title="Unread" />
                    )}
                  </div>

                  <p className="text-[#40372F]">{n.message}</p>

                  {n.recommended_action && (
                    <div className="text-[11px] text-[#8B3A3A] font-semibold">
                      Recommended Action: {n.recommended_action}
                    </div>
                  )}

                  <div className="text-[10px] text-[#A89580] flex items-center gap-4 pt-1">
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                    <span>Category: {n.category}</span>
                    {n.due_date && <span>Target Due: {new Date(n.due_date).toLocaleDateString()}</span>}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {n.link && (
                    <a
                      href={n.link}
                      className="px-3 py-1 bg-[#263B50] hover:bg-[#1D2E3F] text-white text-xs font-semibold rounded-sm transition flex items-center gap-1"
                    >
                      <span>Open Task</span> <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="px-2.5 py-1 border border-[#D6C5AE] bg-[#FFFEFC] hover:bg-[#E8DED0] text-[11px] font-semibold text-[#40372F] rounded-sm transition cursor-pointer"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

