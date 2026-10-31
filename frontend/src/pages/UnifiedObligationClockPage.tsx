import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { apiFetch } from '../services/api';
import { UnifiedObligationItem } from '../types';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  UserCheck, 
  Building2,
  ArrowRight
} from 'lucide-react';

export const UnifiedObligationClockPage: React.FC = () => {
  const [obligations, setObligations] = useState<UnifiedObligationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [partyFilter, setPartyFilter] = useState('');

  const fetchTimeline = async () => {
    try {
      let q = '?';
      if (partyFilter) q += `party=${encodeURIComponent(partyFilter)}&`;
      const res = await apiFetch(`/obligations/timeline${q}`);
      setObligations(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [partyFilter]);

  return (
    <Layout portalType="ADMIN">
      <div className="space-y-6">
        <div className="bg-[#FFFEFC] p-6 border border-[#D6C5AE] rounded-sm shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#40372F] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#8B3A3A]" /> Unified Obligation Clock & Accountability Timeline
            </h1>
            <p className="text-xs text-[#A89580] mt-1">
              Cross-portal clock distinguishing institution requirements vs official bureau verification tasks.
            </p>
          </div>

          <div className="flex gap-2 text-xs">
            <select
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value)}
              className="px-3 py-1.5 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-[#40372F]"
            >
              <option value="">All Responsible Parties</option>
              <option value="INSTITUTION">Institution Responsibility</option>
              <option value="OFFICIAL">AICTE Official Responsibility</option>
            </select>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm p-6 shadow-xs space-y-4">
          {loading ? (
            <div className="p-8 text-center text-xs text-[#A89580]">Loading unified obligation timeline...</div>
          ) : obligations.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#A89580]">No active obligations recorded.</div>
          ) : (
            <div className="space-y-6">
              {obligations.map((ob, idx) => {
                const isOverdue = ob.status === 'OVERDUE';
                const isOfficial = ob.party_responsible === 'OFFICIAL';

                return (
                  <div key={ob.id} className="relative pl-7 pb-4 border-l-2 border-[#D6C5AE] last:border-0 text-xs">
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                      isOverdue ? 'bg-[#B33A3A]' : isOfficial ? 'bg-[#263B50]' : 'bg-[#8B3A3A]'
                    }`}>
                      {idx + 1}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#8B3A3A]">{ob.obligation_code}</span>
                        <span className="font-bold text-sm text-[#40372F]">{ob.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-xs font-bold ${
                          isOfficial ? 'bg-[#263B50] text-white' : 'bg-[#E8DED0] text-[#40372F]'
                        }`}>
                          {ob.party_responsible}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-xs font-bold ${
                          isOverdue ? 'bg-[#B33A3A] text-white' : 'bg-[#48745A]/15 text-[#48745A]'
                        }`}>
                          {ob.status}
                        </span>
                      </div>

                      <div className="font-semibold text-xs text-[#A89580]">
                        Due: {new Date(ob.due_date).toLocaleDateString()}
                      </div>
                    </div>

                    <p className="text-[#40372F] mt-1">{ob.description}</p>

                    <div className="mt-2 p-2.5 bg-[#FAF7F2] border border-[#D6C5AE] rounded-xs text-[11px] flex flex-wrap gap-x-4 gap-y-1">
                      <span><strong>Responsible Role:</strong> {ob.responsible_role}</span>
                      {ob.application_code && <span><strong>Application:</strong> {ob.application_code}</span>}
                      {ob.institution_name && <span><strong>Campus:</strong> {ob.institution_name}</span>}
                      {ob.completion_conditions && <span><strong>Criteria:</strong> {ob.completion_conditions}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

