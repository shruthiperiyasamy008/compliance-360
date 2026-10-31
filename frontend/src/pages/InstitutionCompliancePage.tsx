import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { apiFetch } from '../services/api';
import { ComplianceObligation } from '../types';
import { CheckCircle2, Clock, Upload, AlertCircle, FileText } from 'lucide-react';

export const InstitutionCompliancePage: React.FC = () => {
  const [obligations, setObligations] = useState<ComplianceObligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOb, setSelectedOb] = useState<ComplianceObligation | null>(null);
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOb) return;

    setSubmitting(true);
    setMessage(null);

    try {
      await apiFetch(`/compliance/obligations/${selectedOb.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ evidence_notes: evidenceNotes }),
      });

      setMessage('Evidence successfully submitted! Awaiting official officer verification.');
      setSelectedOb(null);
      setEvidenceNotes('');
      await fetchObligations();
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout portalType="INSTITUTION">
      <div className="space-y-6">
        <div className="bg-[#FFFEFC] p-6 border border-[#D6C5AE] rounded-sm shadow-xs">
          <h1 className="text-xl font-bold text-[#40372F] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#48745A]" /> Post-Approval Compliance & Undertakings
          </h1>
          <p className="text-xs text-[#A89580] mt-1">
            Track mandatory regulatory conditions, submit evidence documents, and monitor approval status verified by AICTE officials.
          </p>
        </div>

        {message && (
          <div className="p-4 bg-[#48745A]/15 border border-[#48745A] text-xs text-[#48745A] rounded-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm overflow-hidden shadow-xs">
          <div className="divide-y divide-[#D6C5AE]">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#A89580]">Loading obligations...</div>
            ) : obligations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#A89580]">No active compliance obligations found.</div>
            ) : (
              obligations.map((ob) => {
                const isOverdue = new Date(ob.due_date) < new Date() && ob.status === 'PENDING';
                return (
                  <div key={ob.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#40372F]">{ob.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-xs font-bold ${
                          ob.status === 'VERIFIED' ? 'bg-[#48745A]/15 text-[#48745A]' :
                          ob.status === 'SUBMITTED_FOR_VERIFICATION' ? 'bg-[#263B50]/15 text-[#263B50]' :
                          isOverdue ? 'bg-[#B33A3A] text-white' :
                          'bg-[#B77932]/15 text-[#B77932]'
                        }`}>
                          {isOverdue ? 'OVERDUE' : ob.status}
                        </span>
                      </div>
                      <div className="text-xs text-[#A89580]">
                        Source: <span className="text-[#40372F]">{ob.source_condition}</span> • Due Date: {new Date(ob.due_date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-[#40372F]">
                        <strong>Required Evidence:</strong> {ob.evidence_required}
                      </div>
                      {ob.evidence_submission_notes && (
                        <div className="text-[11px] text-[#263B50] bg-[#FAF7F2] p-2 rounded-xs border border-[#D6C5AE]">
                          <strong>Submitted Proof:</strong> {ob.evidence_submission_notes}
                        </div>
                      )}
                      {ob.reviewer_notes && (
                        <div className="text-[11px] text-[#48745A] bg-[#48745A]/10 p-2 rounded-xs border border-[#48745A]">
                          <strong>Bureau Review:</strong> {ob.reviewer_notes}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      {ob.status !== 'VERIFIED' ? (
                        <button
                          onClick={() => setSelectedOb(ob)}
                          className="px-3.5 py-1.5 bg-[#8B3A3A] hover:bg-[#732F2F] text-white text-xs font-semibold rounded-sm transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" /> Submit Evidence
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-[#48745A] flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Condition Satisfied
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Evidence Submission Modal */}
        {selectedOb && (
          <div className="fixed inset-0 z-50 bg-[#40372F]/50 flex items-center justify-center p-4">
            <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm max-w-lg w-full p-6 shadow-lg">
              <div className="flex justify-between items-start border-b border-[#D6C5AE] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#40372F]">Submit Compliance Evidence</h3>
                  <p className="text-xs text-[#A89580] mt-0.5">{selectedOb.title}</p>
                </div>
                <button onClick={() => setSelectedOb(null)} className="text-sm font-bold text-[#A89580]">✕</button>
              </div>

              <form onSubmit={handleSubmitEvidence} className="mt-4 space-y-4">
                <div className="text-xs text-[#40372F]">
                  <strong>Prescribed Requirement:</strong> {selectedOb.evidence_required}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#40372F]">
                    Evidence Notes & Reference Numbers *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={evidenceNotes}
                    onChange={(e) => setEvidenceNotes(e.target.value)}
                    placeholder="Provide official notification number, resolution links, installation details, or verification URLs..."
                    className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-xs text-[#40372F]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#D6C5AE]">
                  <button
                    type="button"
                    onClick={() => setSelectedOb(null)}
                    className="px-4 py-2 border border-[#D6C5AE] rounded-sm text-xs font-semibold text-[#40372F]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[#8B3A3A] hover:bg-[#732F2F] text-white rounded-sm text-xs font-semibold cursor-pointer"
                  >
                    {submitting ? 'Submitting...' : 'Confirm Submission'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

