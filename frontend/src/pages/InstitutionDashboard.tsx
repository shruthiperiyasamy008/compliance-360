import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { apiFetch } from '../services/api';
import { 
  Building2, 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Bell,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const InstitutionDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await apiFetch('/institution/dashboard');
      setData(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Layout portalType="INSTITUTION">
        <div className="p-8 text-center text-[#A89580]">Loading institutional dashboard metrics...</div>
      </Layout>
    );
  }

  const metrics = data?.metrics || {};

  return (
    <Layout portalType="INSTITUTION">
      <div className="space-y-6">
        {/* Portal Greeting Banner */}
        <div className="bg-[#FFFEFC] p-6 border border-[#D6C5AE] rounded-sm shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#40372F]">{data?.institution_name || 'Institution Campus'}</h1>
              <span className="px-2.5 py-0.5 rounded-sm bg-[#E8DED0] text-xs font-semibold text-[#40372F]">
                AICTE ID: {data?.aicte_id}
              </span>
            </div>
            <p className="text-xs text-[#A89580] mt-1">
              Active Institutional Session • All application activities synchronize directly with AICTE Bureau
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/institution/new-application"
              className="px-4 py-2 bg-[#8B3A3A] hover:bg-[#732F2F] text-white text-sm font-semibold rounded-sm transition flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" /> Register New Application
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-[#B33A3A]/10 border border-[#B33A3A] text-xs text-[#B33A3A] rounded-sm">
            {error}
          </div>
        )}

        {/* Real-time Metric Cards - Clickable Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div 
            onClick={() => navigate('/institution/applications')}
            className="p-4 bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm hover:border-[#8B3A3A] cursor-pointer transition"
          >
            <div className="text-xs text-[#A89580] font-medium uppercase tracking-wider">Total Applications</div>
            <div className="text-2xl font-bold text-[#40372F] mt-1">{metrics.total_applications || 0}</div>
            <div className="text-[11px] text-[#A89580] mt-1 flex items-center gap-1">
              <span>View all records</span> <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          <div 
            onClick={() => navigate('/institution/applications?status=UNDER_SCRUTINY')}
            className="p-4 bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm hover:border-[#B77932] cursor-pointer transition"
          >
            <div className="text-xs text-[#B77932] font-medium uppercase tracking-wider">Under Review</div>
            <div className="text-2xl font-bold text-[#B77932] mt-1">{metrics.under_review || 0}</div>
            <div className="text-[11px] text-[#A89580] mt-1">Scrutiny queue</div>
          </div>

          <div 
            onClick={() => navigate('/institution/applications?status=CORRECTION_REQUIRED')}
            className="p-4 bg-[#FFFEFC] border border-[#B33A3A] rounded-sm bg-[#B33A3A]/5 hover:bg-[#B33A3A]/10 cursor-pointer transition"
          >
            <div className="text-xs text-[#B33A3A] font-bold uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Needs Correction
            </div>
            <div className="text-2xl font-bold text-[#B33A3A] mt-1">{metrics.correction_required || 0}</div>
            <div className="text-[11px] text-[#B33A3A] mt-1 font-medium">Action Required</div>
          </div>

          <div 
            onClick={() => navigate('/institution/applications?stage=EVC')}
            className="p-4 bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm hover:border-[#263B50] cursor-pointer transition"
          >
            <div className="text-xs text-[#263B50] font-medium uppercase tracking-wider">EVC / Committee</div>
            <div className="text-2xl font-bold text-[#263B50] mt-1">{metrics.awaiting_further_processing || 0}</div>
            <div className="text-[11px] text-[#A89580] mt-1">Inspection stage</div>
          </div>

          <div 
            onClick={() => navigate('/institution/applications?status=APPROVED')}
            className="p-4 bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm hover:border-[#48745A] cursor-pointer transition"
          >
            <div className="text-xs text-[#48745A] font-medium uppercase tracking-wider">Approved</div>
            <div className="text-2xl font-bold text-[#48745A] mt-1">{metrics.approved || 0}</div>
            <div className="text-[11px] text-[#A89580] mt-1">Sanction issued</div>
          </div>

          <div 
            onClick={() => navigate('/institution/validity')}
            className="p-4 bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm hover:border-[#B77932] cursor-pointer transition"
          >
            <div className="text-xs text-[#B77932] font-medium uppercase tracking-wider">Expiring Docs</div>
            <div className="text-2xl font-bold text-[#B77932] mt-1">{metrics.expiring_documents || 0}</div>
            <div className="text-[11px] text-[#A89580] mt-1">Lease / NOC status</div>
          </div>
        </div>

        {/* Two-Column Working Section: Compliance Tasks & Realtime Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Action Alerts */}
          <div className="lg:col-span-2 bg-[#FFFEFC] border border-[#D6C5AE] p-6 rounded-sm shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-[#D6C5AE] pb-3">
              <h2 className="text-base font-bold text-[#40372F] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#8B3A3A]" /> Priority Compliance & Action Items
              </h2>
              <Link to="/institution/compliance" className="text-xs text-[#8B3A3A] hover:underline font-semibold">
                Manage All Obligations →
              </Link>
            </div>

            <div className="space-y-3">
              {metrics.correction_required > 0 && (
                <div className="p-3.5 bg-[#B33A3A]/10 border-l-4 border-[#B33A3A] rounded-r-sm flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-[#B33A3A]">Application Returned for Correction</div>
                    <p className="text-xs text-[#40372F] mt-0.5">
                      Reviewing officer identified deficiencies in submitted floor plan / lab documents.
                    </p>
                  </div>
                  <Link
                    to="/institution/applications"
                    className="px-3 py-1.5 bg-[#B33A3A] text-white text-xs font-semibold rounded-sm hover:bg-[#732F2F] shrink-0"
                  >
                    Upload Replacement
                  </Link>
                </div>
              )}

              {metrics.overdue_actions > 0 && (
                <div className="p-3.5 bg-[#B77932]/10 border-l-4 border-[#B77932] rounded-r-sm flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-[#B77932]">Overdue Post-Approval Obligation</div>
                    <p className="text-xs text-[#40372F] mt-0.5">
                      Grievance Redressal committee notification evidence due date has elapsed.
                    </p>
                  </div>
                  <Link
                    to="/institution/compliance"
                    className="px-3 py-1.5 bg-[#B77932] text-white text-xs font-semibold rounded-sm hover:opacity-90 shrink-0"
                  >
                    Submit Proof
                  </Link>
                </div>
              )}

              <div className="p-3.5 bg-[#FAF7F2] border border-[#D6C5AE] rounded-sm flex justify-between items-center">
                <div>
                  <div className="text-sm font-semibold text-[#40372F]">Land Lease Deed Expiring in 45 Days</div>
                  <p className="text-xs text-[#A89580] mt-0.5">
                    30-Year registered lease deed requires renewal verification before the forthcoming academic cycle.
                  </p>
                </div>
                <Link
                  to="/institution/validity"
                  className="px-3 py-1.5 border border-[#D6C5AE] bg-[#FFFEFC] text-xs font-semibold rounded-sm hover:bg-[#E8DED0] shrink-0"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Live Notifications */}
          <div className="bg-[#FFFEFC] border border-[#D6C5AE] p-6 rounded-sm shadow-xs flex flex-col">
            <div className="flex items-center gap-2 border-b border-[#D6C5AE] pb-3 mb-4">
              <Bell className="w-4 h-4 text-[#263B50]" />
              <h3 className="text-base font-bold text-[#40372F]">Recent Bureau Alerts</h3>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px]">
              {data?.notifications?.length === 0 ? (
                <div className="text-xs text-[#A89580] text-center py-8">No notifications at present.</div>
              ) : (
                data?.notifications?.map((notif: any) => (
                  <div key={notif.id} className="p-2.5 bg-[#FAF7F2] border border-[#D6C5AE] rounded-sm text-xs">
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-semibold text-[#40372F]">{notif.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-xs font-semibold ${
                        notif.type === 'ACTION_REQUIRED' ? 'bg-[#B33A3A] text-white' : 'bg-[#E8DED0] text-[#40372F]'
                      }`}>
                        {notif.type}
                      </span>
                    </div>
                    <p className="text-[#40372F]/80 mt-1">{notif.message}</p>
                    <div className="text-[10px] text-[#A89580] mt-1.5">
                      {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

