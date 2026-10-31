import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { apiFetch } from '../services/api';
import { 
  ShieldCheck, 
  Layers, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileCheck, 
  Activity,
  ArrowRight,
  TrendingUp,
  MapPin
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await apiFetch('/admin/dashboard');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Layout portalType="ADMIN">
        <div className="p-8 text-center text-[#A89580]">Loading central AICTE bureau dashboard...</div>
      </Layout>
    );
  }

  const m = data?.metrics || {};

  return (
    <Layout portalType="ADMIN">
      <div className="space-y-6">
        {/* Bureau Status Header */}
        <div className="bg-[#FFFEFC] p-6 border border-[#D6C5AE] rounded-sm shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#40372F]">AICTE Central Approval Bureau</h1>
              <span className="px-2.5 py-0.5 rounded-sm bg-[#263B50] text-xs font-semibold text-white">
                Live Governance Hub
              </span>
            </div>
            <p className="text-xs text-[#A89580] mt-1">
              Synchronized single-database instance • Processing institutional proposals across all regional offices
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/admin/intelligence')}
              className="px-4 py-2 bg-[#263B50] hover:bg-[#1D2E3F] text-white text-xs font-semibold rounded-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Activity className="w-4 h-4 text-[#D6C5AE]" /> Open Intelligence Centre
            </button>
          </div>
        </div>

        {/* Central Workload Metric Grid - Clickable to open filtered records */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div 
            onClick={() => navigate('/admin/applications')}
            className="p-4 bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm hover:border-[#263B50] cursor-pointer transition"
          >
            <div className="text-xs text-[#A89580] font-medium uppercase tracking-wider">Total Pipeline</div>
            <div className="text-2xl font-bold text-[#40372F] mt-1">{m.total_applications || 0}</div>
            <div className="text-[11px] text-[#A89580] mt-1">Applications total</div>
          </div>

          <div 
            onClick={() => navigate('/admin/applications?stage=Scrutiny')}
            className="p-4 bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm hover:border-[#8B3A3A] cursor-pointer transition"
          >
            <div className="text-xs text-[#8B3A3A] font-semibold uppercase tracking-wider">Awaiting Scrutiny</div>
            <div className="text-2xl font-bold text-[#8B3A3A] mt-1">{m.awaiting_scrutiny || 0}</div>
            <div className="text-[11px] text-[#A89580] mt-1">Document verification</div>
          </div>

          <div 
            onClick={() => navigate('/admin/applications?status=RESUBMITTED')}
            className="p-4 bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm hover:border-[#263B50] cursor-pointer transition"
          >
            <div className="text-xs text-[#263B50] font-semibold uppercase tracking-wider">Re-Scrutiny Queue</div>
            <div className="text-2xl font-bold text-[#263B50] mt-1">{m.requiring_rescrutiny || 0}</div>
            <div className="text-[11px] text-[#A89580] mt-1">Replacements in</div>
          </div>

          <div 
            onClick={() => navigate('/admin/applications?stage=EVC')}
            className="p-4 bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm hover:border-[#B77932] cursor-pointer transition"
          >
            <div className="text-xs text-[#B77932] font-semibold uppercase tracking-wider">Awaiting EVC</div>
            <div className="text-2xl font-bold text-[#B77932] mt-1">{m.awaiting_evc || 0}</div>
            <div className="text-[11px] text-[#A89580] mt-1">Expert inspections</div>
          </div>

          <div 
            onClick={() => navigate('/admin/applications?status=CORRECTION_REQUIRED')}
            className="p-4 bg-[#FFFEFC] border border-[#B33A3A] rounded-sm bg-[#B33A3A]/5 hover:bg-[#B33A3A]/10 cursor-pointer transition"
          >
            <div className="text-xs text-[#B33A3A] font-bold uppercase tracking-wider">With Institution</div>
            <div className="text-2xl font-bold text-[#B33A3A] mt-1">{m.correction_returned || 0}</div>
            <div className="text-[11px] text-[#B33A3A] mt-1">Corrections flagged</div>
          </div>

          <div 
            onClick={() => navigate('/admin/intelligence')}
            className="p-4 bg-[#FFFEFC] border border-[#B33A3A] rounded-sm hover:border-[#B33A3A] cursor-pointer transition"
          >
            <div className="text-xs text-[#B33A3A] font-bold uppercase tracking-wider">High Risk Delays</div>
            <div className="text-2xl font-bold text-[#B33A3A] mt-1">{m.high_risk_delay || 0}</div>
            <div className="text-[11px] text-[#A89580] mt-1">Rule Engine alerts</div>
          </div>
        </div>

        {/* Bureau Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workload by Stage & Regional Breakdown */}
          <div className="lg:col-span-2 bg-[#FFFEFC] border border-[#D6C5AE] p-6 rounded-sm shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#40372F] flex items-center gap-2 border-b border-[#D6C5AE] pb-2">
                <Layers className="w-4 h-4 text-[#8B3A3A]" /> Workload Distribution Across Processing Stages
              </h2>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {Object.entries(data?.stage_breakdown || {}).map(([stage, count]: any) => (
                  <div key={stage} className="p-3 bg-[#FAF7F2] border border-[#D6C5AE] rounded-sm">
                    <div className="text-xs font-semibold text-[#40372F]">{stage}</div>
                    <div className="text-xl font-bold text-[#263B50] mt-1">{count}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-base font-bold text-[#40372F] flex items-center gap-2 border-b border-[#D6C5AE] pb-2">
                <MapPin className="w-4 h-4 text-[#263B50]" /> Regional Bureau Pendency
              </h2>
              <div className="mt-3 divide-y divide-[#D6C5AE] text-xs">
                {Object.entries(data?.regional_pendency || {}).map(([region, count]: any) => (
                  <div key={region} className="py-2.5 flex justify-between items-center">
                    <span className="font-semibold text-[#40372F]">{region} Regional Office</span>
                    <span className="font-bold text-[#8B3A3A] bg-[#FAF7F2] px-2.5 py-0.5 rounded-xs border border-[#D6C5AE]">
                      {count} Pending Application{count > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bureau Audit Activity Log */}
          <div className="bg-[#FFFEFC] border border-[#D6C5AE] p-6 rounded-sm shadow-xs flex flex-col">
            <h3 className="text-base font-bold text-[#40372F] border-b border-[#D6C5AE] pb-2 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#263B50]" /> Recent Bureau Action Log
            </h3>

            <div className="space-y-3 overflow-y-auto max-h-[380px]">
              {data?.recent_audits?.map((log: any) => (
                <div key={log.id} className="p-2.5 bg-[#FAF7F2] border border-[#D6C5AE] rounded-sm text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-[#8B3A3A] font-mono">{log.action}</span>
                    <span className="text-[10px] text-[#A89580]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[#40372F] mt-1">
                    Actor: <span className="font-semibold">{log.actor_name}</span> ({log.actor_role})
                  </div>
                  {log.details && (
                    <div className="text-[10px] text-[#A89580] mt-1 font-mono">
                      {JSON.stringify(log.details)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

