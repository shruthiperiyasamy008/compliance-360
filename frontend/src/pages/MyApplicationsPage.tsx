import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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

export const MyApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  const fetchApplications = async () => {
    try {
      let query = '?';
      if (search) query += `search=${encodeURIComponent(search)}&`;
      if (categoryFilter) query += `category=${encodeURIComponent(categoryFilter)}&`;
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
  }, [search, categoryFilter, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-xs bg-[#48745A]/15 text-[#48745A]">APPROVED</span>;
      case 'CORRECTION_REQUIRED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-xs bg-[#B33A3A]/15 text-[#B33A3A] flex items-center gap-1"><AlertCircle className="w-3 h-3" /> CORRECTION REQUIRED</span>;
      case 'RESUBMITTED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-xs bg-[#263B50]/15 text-[#263B50]">RESUBMITTED</span>;
      case 'EVC_SCHEDULED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-xs bg-[#B77932]/15 text-[#B77932]">EVC SCHEDULED</span>;
      case 'UNDER_SCRUTINY':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-xs bg-[#B77932]/15 text-[#B77932]">UNDER SCRUTINY</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-xs bg-[#E8DED0] text-[#40372F]">{status}</span>;
    }
  };

  return (
    <Layout portalType="INSTITUTION">
      <div className="space-y-6">
        <div className="bg-[#FFFEFC] p-6 border border-[#D6C5AE] rounded-sm shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#40372F] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#8B3A3A]" /> My Submitted Applications
            </h1>
            <p className="text-xs text-[#A89580] mt-1">
              Real-time tracker of institutional proposals submitted to the AICTE Bureau
            </p>
          </div>
          <Link
            to="/institution/new-application"
            className="px-4 py-2 bg-[#8B3A3A] hover:bg-[#732F2F] text-white text-xs font-semibold rounded-sm transition"
          >
            + Register Application
          </Link>
        </div>

        {/* Filter & Search Bar */}
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
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-xs text-[#40372F]"
            >
              <option value="">All Categories</option>
              <option value="Introduction of a New Course or Programme">New Course</option>
              <option value="Infrastructure or Facility Request">Facility Request</option>
              <option value="Extension of Approval">Extension of Approval</option>
              <option value="New Institution">New Institution</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-xs text-[#40372F]"
            >
              <option value="">All Statuses</option>
              <option value="UNDER_SCRUTINY">Under Scrutiny</option>
              <option value="CORRECTION_REQUIRED">Correction Required</option>
              <option value="RESUBMITTED">Resubmitted</option>
              <option value="EVC_SCHEDULED">EVC Scheduled</option>
              <option value="APPROVED">Approved</option>
            </select>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#D6C5AE] text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#40372F] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Application ID</th>
                  <th className="py-3 px-4">Category & Title</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Risk Profile</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6C5AE] text-[#40372F]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[#A89580]">
                      Loading applications from database...
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[#A89580]">
                      No applications found matching query criteria.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-[#FAF7F2] transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#8B3A3A]">
                        {app.application_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-sm text-[#40372F]">{app.title}</div>
                        <div className="text-[11px] text-[#A89580]">{app.category} • AY {app.academic_year}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#263B50]">
                        {app.current_stage}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(app.status)}
                      </td>
                      <td className="py-3.5 px-4 text-[#A89580]">
                        {app.deadline ? new Date(app.deadline).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                          app.risk_level === 'HIGH' ? 'bg-[#B33A3A]/15 text-[#B33A3A]' :
                          app.risk_level === 'MEDIUM' ? 'bg-[#B77932]/15 text-[#B77932]' :
                          'bg-[#48745A]/15 text-[#48745A]'
                        }`}>
                          {app.risk_level} ({app.risk_score})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => navigate(`/institution/applications/${app.id}`)}
                          className="px-3 py-1 bg-[#263B50] hover:bg-[#1D2E3F] text-white rounded-sm text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
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

