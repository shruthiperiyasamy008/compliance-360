import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { apiFetch } from '../services/api';
import { 
  Building2, 
  Search, 
  Filter, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';

export const AdminApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState(searchParams.get('stage') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  const fetchApplications = async () => {
    try {
      let query = '?';
      if (search) query += `search=${encodeURIComponent(search)}&`;
      if (stageFilter) query += `stage=${encodeURIComponent(stageFilter)}&`;
      if (statusFilter) query += `status=${encodeURIComponent(statusFilter)}&`;

      const res = await apiFetch(`/applications${query}`);
      setApplications(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [search, stageFilter, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-xs bg-[#48745A]/15 text-[#48745A]">APPROVED</span>;
      case 'CORRECTION_REQUIRED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-xs bg-[#B33A3A]/15 text-[#B33A3A] flex items-center gap-1"><AlertCircle className="w-3 h-3" /> CORRECTION REQUIRED</span>;
      case 'RESUBMITTED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-xs bg-[#263B50] text-white">RESUBMITTED</span>;
      case 'EVC_SCHEDULED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-xs bg-[#B77932]/15 text-[#B77932]">EVC SCHEDULED</span>;
      case 'UNDER_SCRUTINY':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-xs bg-[#B77932]/15 text-[#B77932]">UNDER SCRUTINY</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-xs bg-[#E8DED0] text-[#40372F]">{status}</span>;
    }
  };

  return (
    <Layout portalType="ADMIN">
      <div className="space-y-6">
        <div className="bg-[#FFFEFC] p-6 border border-[#D6C5AE] rounded-sm shadow-xs flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-[#40372F] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#8B3A3A]" /> Unified Application Management
            </h1>
            <p className="text-xs text-[#A89580] mt-1">
              Every proposal registered by institutions arrives synchronously in this administrative queue.
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-[#FFFEFC] p-4 border border-[#D6C5AE] rounded-sm flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#A89580] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Application ID or proposal title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-xs text-[#40372F]"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-1.5 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-xs text-[#40372F]"
            >
              <option value="">All Stages</option>
              <option value="Scrutiny">Scrutiny</option>
              <option value="EVC">EVC</option>
              <option value="SAC/SHC Review">SAC/SHC Review</option>
              <option value="Decision">Decision</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-xs text-[#40372F]"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_SCRUTINY">Under Scrutiny</option>
              <option value="CORRECTION_REQUIRED">Correction Required</option>
              <option value="RESUBMITTED">Resubmitted</option>
              <option value="EVC_SCHEDULED">EVC Scheduled</option>
              <option value="APPROVED">Approved</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#D6C5AE] text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#40372F] font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Application ID</th>
                  <th className="py-3 px-4">Institution & Region</th>
                  <th className="py-3 px-4">Category & Title</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6C5AE] text-[#40372F]">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8 text-[#A89580]">Loading applications...</td></tr>
                ) : applications.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-[#A89580]">No applications match criteria.</td></tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-[#FAF7F2]">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#8B3A3A]">{app.application_id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-sm text-[#40372F]">{app.institution_name}</div>
                        <div className="text-[11px] text-[#A89580]">{app.region} Region</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#40372F]">{app.title}</div>
                        <div className="text-[11px] text-[#A89580]">{app.category}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#263B50]">{app.current_stage}</td>
                      <td className="py-3.5 px-4">{getStatusBadge(app.status)}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                          app.risk_level === 'HIGH' ? 'bg-[#B33A3A] text-white' :
                          app.risk_level === 'MEDIUM' ? 'bg-[#B77932] text-white' :
                          'bg-[#48745A]/15 text-[#48745A]'
                        }`}>
                          {app.risk_level} ({app.risk_score})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => navigate(`/admin/applications/${app.id}`)}
                          className="px-3.5 py-1.5 bg-[#8B3A3A] hover:bg-[#732F2F] text-white font-semibold text-xs rounded-sm transition cursor-pointer"
                        >
                          Review Case
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

