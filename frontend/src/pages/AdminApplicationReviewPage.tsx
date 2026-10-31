import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { apiFetch } from '../services/api';
import { ApplicationDetail, DocumentItem } from '../types';
import { 
  Building2, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  UserCheck, 
  Calendar,
  Layers,
  ChevronRight,
  Bot
} from 'lucide-react';
import { AdminAIChatbox } from '../components/AdminAIChatbox';

export const AdminApplicationReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Return for correction modal
  const [selectedDocForCorrection, setSelectedDocForCorrection] = useState<DocumentItem | null>(null);
  const [deficiencyReason, setDeficiencyReason] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Transition stage modal
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [nextStage, setNextStage] = useState('EVC');
  const [nextStatus, setNextStatus] = useState('EVC_SCHEDULED');
  const [transitionRemarks, setTransitionRemarks] = useState('');

  // EVC schedule modal
  const [showEVCModal, setShowEVCModal] = useState(false);
  const [evcDate, setEvcDate] = useState('2025-06-15T10:00');
  const [panelLead, setPanelLead] = useState('Prof. A. S. Kelkar (IIT Bombay)');
  const [panelMembersText, setPanelMembersText] = useState('Prof. A. S. Kelkar, Dr. Manisha Patil (VJTI), Shri. Sanjay Nair');
  const [evcRemarks, setEvcRemarks] = useState('On-site inspection of computer laboratories and power redundancy systems.');

  const fetchApplicationDetails = async () => {
    try {
      const res = await apiFetch(`/applications/${id}`);
      setApp(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  const handleDocumentAccept = async (doc: DocumentItem) => {
    try {
      await apiFetch(`/applications/${app?.id}/documents/${doc.id}/review`, {
        method: 'POST',
        body: JSON.stringify({ decision: 'ACCEPTED' }),
      });
      await fetchApplicationDetails();
    } catch (err: any) {
      alert(err.message || 'Review failed');
    }
  };

  const handleDocumentCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForCorrection) return;

    setSubmittingReview(true);
    try {
      await apiFetch(`/applications/${app?.id}/documents/${selectedDocForCorrection.id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          decision: 'CORRECTION_REQUESTED',
          deficiency_reason: deficiencyReason,
          corrective_action_requested: correctiveAction,
        }),
      });

      setSelectedDocForCorrection(null);
      setDeficiencyReason('');
      setCorrectiveAction('');
      await fetchApplicationDetails();
    } catch (err: any) {
      alert(err.message || 'Deficiency flagging failed');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleStageTransitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`/applications/${app?.id}/transition`, {
        method: 'POST',
        body: JSON.stringify({
          next_stage: nextStage,
          next_status: nextStatus,
          remarks: transitionRemarks,
        }),
      });
      setShowTransitionModal(false);
      await fetchApplicationDetails();
    } catch (err: any) {
      alert(err.message || 'Transition failed');
    }
  };

  const handleEVCScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`/applications/${app?.id}/evc/schedule`, {
        method: 'POST',
        body: JSON.stringify({
          evc_type: 'Physical',
          scheduled_date: new Date(evcDate).toISOString(),
          panel_lead: panelLead,
          panel_members: panelMembersText.split(',').map((s) => s.trim()),
          remarks: evcRemarks,
        }),
      });
      setShowEVCModal(false);
      await fetchApplicationDetails();
    } catch (err: any) {
      alert(err.message || 'EVC scheduling failed');
    }
  };

  if (loading) {
    return (
      <Layout portalType="ADMIN">
        <div className="p-8 text-center text-[#A89580]">Loading application review file...</div>
      </Layout>
    );
  }

  if (!app) {
    return (
      <Layout portalType="ADMIN">
        <div className="p-8 text-center text-[#B33A3A]">Application record not found.</div>
      </Layout>
    );
  }

  const unverifiedCount = app.documents.filter((d) => d.is_mandatory && d.status !== 'VERIFIED').length;

  return (
    <Layout portalType="ADMIN">
      <div className="space-y-6">
        <Link to="/admin/applications" className="inline-flex items-center gap-1.5 text-xs text-[#8B3A3A] hover:underline font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Unified Application Queue
        </Link>

        {/* Case Dossier Header */}
        <div className="bg-[#FFFEFC] p-6 border border-[#D6C5AE] rounded-sm shadow-xs">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-[#8B3A3A]">{app.application_id}</span>
                <span className="px-2.5 py-0.5 rounded-xs text-xs font-bold bg-[#263B50] text-white">
                  Stage: {app.current_stage}
                </span>
                <span className="text-xs text-[#A89580]">Status: <strong>{app.status}</strong></span>
              </div>
              <h1 className="text-xl font-bold text-[#40372F] mt-1">{app.title}</h1>
              <div className="text-xs text-[#A89580] mt-1 flex flex-wrap gap-x-4">
                <span><strong>Applicant:</strong> {app.institution_name} ({app.aicte_id})</span>
                <span><strong>Region:</strong> {app.region}</span>
                <span><strong>Category:</strong> {app.category}</span>
                <span><strong>Workflow:</strong> {app.workflow_route}</span>
              </div>
            </div>

            {/* Officer Action Controls */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setShowTransitionModal(true)}
                className="px-4 py-2 bg-[#263B50] hover:bg-[#1D2E3F] text-white text-xs font-semibold rounded-sm transition cursor-pointer"
              >
                Transition Stage / Decision
              </button>
              <button
                onClick={() => setShowEVCModal(true)}
                className="px-4 py-2 bg-[#8B3A3A] hover:bg-[#732F2F] text-white text-xs font-semibold rounded-sm transition cursor-pointer flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5" /> Schedule EVC
              </button>
            </div>
          </div>

          {/* Explainable Delay Risk Bar */}
          <div className="mt-4 p-3 bg-[#FAF7F2] border border-[#D6C5AE] rounded-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
            <div>
              <span className="font-bold text-[#40372F]">Algorithmic Risk Engine Assessment: </span>
              <span className="text-[#40372F]/80">
                {app.risk_reasons?.[0] || 'Application progressing within standard turnaround times.'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold">Score: {app.risk_score}/100</span>
              <span className={`px-2 py-0.5 rounded-xs font-bold text-[10px] ${
                app.risk_level === 'HIGH' ? 'bg-[#B33A3A] text-white' :
                (app.risk_level as string) === 'MODERATE' || (app.risk_level as string) === 'MEDIUM' ? 'bg-[#B77932] text-white' :
                'bg-[#48745A] text-white'
              }`}>
                {app.risk_level} DELAY RISK
              </span>
            </div>
          </div>
        </div>

        {/* Institution Details & Specifics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#FFFEFC] p-4 border border-[#D6C5AE] rounded-sm text-xs space-y-2">
            <h3 className="font-bold text-[#40372F] uppercase tracking-wider text-[11px] border-b border-[#D6C5AE] pb-1">
              Campus Profile & Contact
            </h3>
            <div><strong>Campus Address:</strong> {app.address}, {app.state}</div>
            <div><strong>Authorized Official:</strong> {app.contact_email} • {app.contact_phone}</div>
            {app.description && <div><strong>Proposal Description:</strong> {app.description}</div>}
          </div>

          <div className="bg-[#FFFEFC] p-4 border border-[#D6C5AE] rounded-sm text-xs space-y-2">
            <h3 className="font-bold text-[#40372F] uppercase tracking-wider text-[11px] border-b border-[#D6C5AE] pb-1">
              Category Specifics
            </h3>
            {app.proposed_course_name && <div><strong>Proposed Course:</strong> {app.proposed_course_name}</div>}
            {app.proposed_intake && <div><strong>Sanctioned Intake Requested:</strong> {app.proposed_intake} seats</div>}
            {app.facility_details && <div><strong>Facility Details:</strong> {app.facility_details}</div>}
            <div><strong>Mandatory Documents Pending Verification:</strong> <span className={unverifiedCount > 0 ? 'text-[#B33A3A] font-bold' : 'text-[#48745A] font-bold'}>{unverifiedCount}</span></div>
          </div>
        </div>

        {/* Dedicated Context-Aware AI Chatbox Panel */}
        <div className="bg-[#FFFEFC] p-6 border border-[#D6C5AE] rounded-sm shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-[#D6C5AE] pb-2">
            <Bot className="w-5 h-5 text-[#8B3A3A]" />
            <h2 className="text-base font-bold text-[#40372F]">
              AI Risk & Delay Analysis: {app.application_id}
            </h2>
            <span className="text-[11px] text-[#A89580] ml-auto">
              Ask about blockers, calculated factor contributions, and SLA projections
            </span>
          </div>
          <AdminAIChatbox contextAppId={app.id} contextAppCode={app.application_id} />
        </div>

        {/* Document Scrutiny & Verification Table */}
        <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm shadow-xs overflow-hidden">
          <div className="p-4 bg-[#FAF7F2] border-b border-[#D6C5AE] flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-[#40372F]">Document Scrutiny Desk</h3>
              <p className="text-xs text-[#A89580]">
                Examine submitted documents. Officers may Accept or Return with mandatory deficiency reasons.
              </p>
            </div>
          </div>

          <div className="divide-y divide-[#D6C5AE]">
            {app.documents.map((doc) => {
              const isVerified = doc.status === 'VERIFIED';
              const isCorrectionRequired = doc.status === 'CORRECTION_REQUIRED';
              const hasFile = doc.file_name !== null && doc.file_name !== undefined;

              return (
                <div key={doc.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#40372F]">{doc.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-xs font-bold ${
                        isVerified ? 'bg-[#48745A]/15 text-[#48745A]' :
                        isCorrectionRequired ? 'bg-[#B33A3A] text-white' :
                        hasFile ? 'bg-[#263B50] text-white' :
                        'bg-[#E8DED0] text-[#40372F]'
                      }`}>
                        {doc.status}
                      </span>
                      {doc.is_mandatory && (
                        <span className="text-[10px] text-[#8B3A3A] font-semibold bg-[#FAF7F2] px-1.5 py-0.2 border border-[#D6C5AE] rounded-xs">
                          MANDATORY
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#A89580]">{doc.description}</p>

                    {hasFile ? (
                      <div className="text-xs text-[#40372F] flex items-center gap-3 mt-1">
                        <span className="font-mono bg-[#FAF7F2] px-2 py-0.5 border border-[#D6C5AE] rounded-xs">
                          {doc.file_name} (Version {doc.version})
                        </span>
                        <span className="text-[#A89580]">{doc.file_size_kb || 450} KB</span>
                        {doc.submitted_at && (
                          <span className="text-[#A89580]">
                            Uploaded: {new Date(doc.submitted_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-[#A89580] italic">Awaiting institution upload</div>
                    )}

                    {isCorrectionRequired && (
                      <div className="p-2.5 bg-[#B33A3A]/10 border border-[#B33A3A] rounded-xs text-xs text-[#B33A3A] mt-2">
                        <strong>Deficiency Raised:</strong> {doc.deficiency_reason}
                      </div>
                    )}
                  </div>

                  {/* Officer Decision Buttons */}
                  <div className="shrink-0 flex items-center gap-2">
                    {hasFile && !isVerified && (
                      <>
                        <button
                          onClick={() => handleDocumentAccept(doc)}
                          className="px-3 py-1.5 bg-[#48745A] hover:bg-[#3B604A] text-white text-xs font-semibold rounded-sm transition cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button
                          onClick={() => setSelectedDocForCorrection(doc)}
                          className="px-3 py-1.5 bg-[#B33A3A] hover:bg-[#732F2F] text-white text-xs font-semibold rounded-sm transition cursor-pointer flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Return with Deficiency
                        </button>
                      </>
                    )}
                    {isVerified && (
                      <span className="text-xs font-semibold text-[#48745A] flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Verified by Officer
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Return with Deficiency Modal */}
        {selectedDocForCorrection && (
          <div className="fixed inset-0 z-50 bg-[#40372F]/50 flex items-center justify-center p-4">
            <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm max-w-lg w-full p-6 shadow-lg">
              <div className="flex justify-between items-start border-b border-[#D6C5AE] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#B33A3A]">Raise Deficiency & Return for Correction</h3>
                  <p className="text-xs text-[#A89580] mt-0.5">{selectedDocForCorrection.name}</p>
                </div>
                <button onClick={() => setSelectedDocForCorrection(null)} className="text-sm font-bold text-[#A89580]">✕</button>
              </div>

              <form onSubmit={handleDocumentCorrectionSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#40372F]">
                    Specific Deficiency Reason (Mandatory) *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={deficiencyReason}
                    onChange={(e) => setDeficiencyReason(e.target.value)}
                    placeholder="e.g. Floor area diagram lacks emergency exit corridors and server power earthing layout..."
                    className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-xs text-[#40372F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#40372F]">
                    Corrective Action Requested from Institution *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={correctiveAction}
                    onChange={(e) => setCorrectiveAction(e.target.value)}
                    placeholder="e.g. Upload architect endorsed blueprint marking dual exit doors with 1.5m clearance."
                    className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-xs text-[#40372F]"
                  />
                </div>

                <div className="text-[11px] text-[#A89580]">
                  Returning this document will immediately transition the entire application status to <strong>CORRECTION_REQUIRED</strong> and notify the institution portal.
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#D6C5AE]">
                  <button
                    type="button"
                    onClick={() => setSelectedDocForCorrection(null)}
                    className="px-4 py-2 border border-[#D6C5AE] rounded-sm text-xs font-semibold text-[#40372F]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-4 py-2 bg-[#B33A3A] hover:bg-[#732F2F] text-white rounded-sm text-xs font-semibold cursor-pointer"
                  >
                    {submittingReview ? 'Submitting...' : 'Confirm Return for Correction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stage Transition Modal */}
        {showTransitionModal && (
          <div className="fixed inset-0 z-50 bg-[#40372F]/50 flex items-center justify-center p-4">
            <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm max-w-md w-full p-6 shadow-lg">
              <div className="flex justify-between items-start border-b border-[#D6C5AE] pb-3">
                <h3 className="text-base font-bold text-[#40372F]">Transition Workflow Stage</h3>
                <button onClick={() => setShowTransitionModal(false)} className="text-sm font-bold text-[#A89580]">✕</button>
              </div>

              <form onSubmit={handleStageTransitionSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#40372F]">Target Stage</label>
                  <select
                    value={nextStage}
                    onChange={(e) => {
                      setNextStage(e.target.value);
                      if (e.target.value === 'EVC') setNextStatus('EVC_SCHEDULED');
                      if (e.target.value === 'SAC/SHC Review') setNextStatus('SAC_SHC_REVIEW');
                      if (e.target.value === 'Decision') setNextStatus('APPROVED');
                    }}
                    className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-xs text-[#40372F]"
                  >
                    <option value="Scrutiny">Scrutiny</option>
                    <option value="EVC">EVC (Expert Visit Committee)</option>
                    <option value="SAC/SHC Review">SAC / SHC Review</option>
                    <option value="Decision">Decision</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#40372F]">Target Status</label>
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-xs text-[#40372F]"
                  >
                    <option value="UNDER_SCRUTINY">UNDER_SCRUTINY</option>
                    <option value="EVC_SCHEDULED">EVC_SCHEDULED</option>
                    <option value="EVC_COMPLETED">EVC_COMPLETED</option>
                    <option value="SAC_SHC_REVIEW">SAC_SHC_REVIEW</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#40372F]">Officer Transition Remarks</label>
                  <textarea
                    rows={2}
                    value={transitionRemarks}
                    onChange={(e) => setTransitionRemarks(e.target.value)}
                    placeholder="e.g. Scrutiny cleared successfully. Case forwarded to regional EVC convenor."
                    className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-xs text-[#40372F]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#D6C5AE]">
                  <button
                    type="button"
                    onClick={() => setShowTransitionModal(false)}
                    className="px-4 py-2 border border-[#D6C5AE] rounded-sm text-xs font-semibold text-[#40372F]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#263B50] hover:bg-[#1D2E3F] text-white rounded-sm text-xs font-semibold cursor-pointer"
                  >
                    Confirm Transition
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EVC Scheduling Modal */}
        {showEVCModal && (
          <div className="fixed inset-0 z-50 bg-[#40372F]/50 flex items-center justify-center p-4">
            <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm max-w-lg w-full p-6 shadow-lg">
              <div className="flex justify-between items-start border-b border-[#D6C5AE] pb-3">
                <h3 className="text-base font-bold text-[#40372F]">Schedule Expert Visit Committee (EVC)</h3>
                <button onClick={() => setShowEVCModal(false)} className="text-sm font-bold text-[#A89580]">✕</button>
              </div>

              <form onSubmit={handleEVCScheduleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#40372F]">Inspection Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={evcDate}
                    onChange={(e) => setEvcDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-xs text-[#40372F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#40372F]">Panel Lead Expert</label>
                  <input
                    type="text"
                    required
                    value={panelLead}
                    onChange={(e) => setPanelLead(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-xs text-[#40372F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#40372F]">Expert Panel Members (Comma Separated)</label>
                  <input
                    type="text"
                    required
                    value={panelMembersText}
                    onChange={(e) => setPanelMembersText(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-xs text-[#40372F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#40372F]">Inspection Mandate / Remarks</label>
                  <textarea
                    rows={2}
                    value={evcRemarks}
                    onChange={(e) => setEvcRemarks(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-xs text-[#40372F]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#D6C5AE]">
                  <button
                    type="button"
                    onClick={() => setShowEVCModal(false)}
                    className="px-4 py-2 border border-[#D6C5AE] rounded-sm text-xs font-semibold text-[#40372F]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#8B3A3A] hover:bg-[#732F2F] text-white rounded-sm text-xs font-semibold cursor-pointer"
                  >
                    Confirm & Dispatch Notice
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

