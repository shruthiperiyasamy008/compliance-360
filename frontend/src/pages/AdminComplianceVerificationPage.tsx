import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { apiFetch } from '../services/api';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export const AdminComplianceVerificationPage: React.FC = () => {
  const [obligations, setObligations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchObligations = async () => {
    try {
      const res = await apiFetch('/compliance/obligations');
      setObligations(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObligations();
  }, []);

  const handleVerify = async (id: number, decision: 'VERIFIED' | 'REJECTED') => {
    const remarks = prompt(decision === 'VERIFIED' ? 'Verification remarks:' : 'Reason for rejecting evidence:');
    if (remarks === null) return;

    try {
      const formData = new FormData();
      formData.append('decision', decision);
      formData.append('remarks', remarks);

      await apiFetch(`/compliance/obligations/${id}/verify`, {
        method: 'POST',
        body: formData,
      });
      await fetchObligations();
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    }
  };

  return (
    <Layout portalType="ADMIN">
      <div className="space-y-6">
        <div className="bg-[#FFFEFC] p-6 border border-[#D6C5AE] rounded-sm shadow-xs">
          <h1 className="text-xl font-bold text-[#40372F] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#48745A]" /> Institutional Compliance Verification Desk
          </h1>
          <p className="text-xs text-[#A89580] mt-1">
            Review uploaded institutional evidence for statutory undertakings and post-approval conditions.
          </p>
        </div>

        <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm overflow-hidden shadow-xs">
          <div className="divide-y divide-[#D6C5AE]">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#A89580]">Loading obligations...</div>
            ) : obligations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#A89580]">No compliance records found.</div>
            ) : (
              obligations.map((ob) => (
                <div key={ob.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#40372F]">{ob.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-xs font-bold ${
                        ob.status === 'VERIFIED' ? 'bg-[#48745A]/15 text-[#48745A]' :
                        ob.status === 'SUBMITTED_FOR_VERIFICATION' ? 'bg-[#263B50] text-white' :
                        'bg-[#B77932]/15 text-[#B77932]'
                      }`}>
                        {ob.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#A89580]">
                      <strong>Institution:</strong> {ob.institution_name} • Due Date: {new Date(ob.due_date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-[#40372F]">
                      <strong>Evidence Required:</strong> {ob.evidence_required}
                    </div>
                    {ob.evidence_submission_notes && (
                      <div className="text-xs bg-[#FAF7F2] p-2.5 rounded-xs border border-[#D6C5AE] text-[#263B50]">
                        <strong>Institution Submission:</strong> {ob.evidence_submission_notes}
                      </div>
                    )}
                    {ob.reviewer_notes && (
                      <div className="text-[11px] text-[#48745A]">
                        Officer Remark: {ob.reviewer_notes}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {ob.status === 'SUBMITTED_FOR_VERIFICATION' && (
                      <>
                        <button
                          onClick={() => handleVerify(ob.id, 'VERIFIED')}
                          className="px-3 py-1.5 bg-[#48745A] hover:bg-[#3B604A] text-white text-xs font-semibold rounded-sm transition cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Verified
                        </button>
                        <button
                          onClick={() => handleVerify(ob.id, 'REJECTED')}
                          className="px-3 py-1.5 bg-[#B33A3A] hover:bg-[#732F2F] text-white text-xs font-semibold rounded-sm transition cursor-pointer flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject Evidence
                        </button>
                      </>
                    )}
                    {ob.status === 'VERIFIED' && (
                      <span className="text-xs font-semibold text-[#48745A] flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Condition Closed
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

