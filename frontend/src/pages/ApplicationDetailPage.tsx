import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { apiFetch, getAuthToken } from '../services/api';
import { ApplicationDetail, DocumentItem } from '../types';
import { 
  Building2, 
  ArrowLeft, 
  FileCheck, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  History, 
  AlertTriangle,
  User,
  ExternalLink
} from 'lucide-react';

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'history' | 'evc' | 'audit'>('documents');

  // Upload modal / state
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadRemarks, setUploadRemarks] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

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

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !uploadFile) return;

    setUploading(true);
    setError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (uploadRemarks) {
        formData.append('remarks', uploadRemarks);
      }

      await apiFetch(`/applications/${app?.id}/documents/${selectedDoc.id}/upload`, {
        method: 'POST',
        body: formData,
      });

      setUploadSuccess(`Successfully uploaded document: ${uploadFile.name}`);
      setSelectedDoc(null);
      setUploadFile(null);
      setUploadRemarks('');
      await fetchApplicationDetails();
    } catch (err: any) {
      setError(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Layout portalType="INSTITUTION">
        <div className="p-8 text-center text-[#A89580]">Loading application record...</div>
      </Layout>
    );
  }

  if (!app) {
    return (
      <Layout portalType="INSTITUTION">
        <div className="p-8 text-center text-[#B33A3A]">Application record not found.</div>
      </Layout>
    );
  }

  // Visual workflow stages
  const workflowStages = ['Submitted', 'Scrutiny', 'EVC Inspection', 'SAC / Committee', 'Official Decision'];
  const getStageIndex = (stage: string) => {
    if (stage.toLowerCase().includes('scrutiny')) return 1;
    if (stage.toLowerCase().includes('evc')) return 2;
    if (stage.toLowerCase().includes('sac') || stage.toLowerCase().includes('committee')) return 3;
    if (stage.toLowerCase().includes('decision')) return 4;
    return 0;
  };
  const currentStageIdx = getStageIndex(app.current_stage);

  return (
    <Layout portalType="INSTITUTION">
      <div className="space-y-6">
        <Link to="/institution/applications" className="inline-flex items-center gap-1.5 text-xs text-[#8B3A3A] hover:underline font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Applications
        </Link>

        {/* Top Header Card */}
        <div className="bg-[#FFFEFC] p-6 border border-[#D6C5AE] rounded-sm shadow-xs">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-[#8B3A3A]">{app.application_id}</span>
                <span className={`px-2.5 py-0.5 rounded-xs text-xs font-bold ${
                  app.status === 'APPROVED' ? 'bg-[#48745A]/15 text-[#48745A]' :
                  app.status === 'CORRECTION_REQUIRED' ? 'bg-[#B33A3A]/15 text-[#B33A3A]' :
                  'bg-[#E8DED0] text-[#40372F]'
                }`}>
                  {app.status}
                </span>
                <span className="text-xs text-[#A89580]">• Category: {app.category}</span>
              </div>
              <h1 className="text-xl font-bold text-[#40372F] mt-1">{app.title}</h1>
              <p className="text-xs text-[#A89580] mt-0.5">
                Submitted on {new Date(app.submitted_at).toLocaleDateString()} • Assigned: {app.assigned_officer}
              </p>
            </div>

            {/* Explainable Delay Risk Pill */}
            <div className="p-3 bg-[#FAF7F2] border border-[#D6C5AE] rounded-sm text-right shrink-0">
              <div className="text-[10px] uppercase font-bold text-[#A89580]">Risk Engine Score</div>
              <div className="flex items-center justify-end gap-2 mt-0.5">
                <span className="text-lg font-bold text-[#40372F]">{app.risk_score} / 100</span>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-xs ${
                  app.risk_level === 'HIGH' ? 'bg-[#B33A3A] text-white' :
                  (app.risk_level as string) === 'MODERATE' || (app.risk_level as string) === 'MEDIUM' ? 'bg-[#B77932] text-white' :
                  'bg-[#48745A] text-white'
                }`}>
                  {app.risk_level} RISK
                </span>
              </div>
              <div className="text-[10px] text-[#A89580] mt-0.5">
                {app.risk_reasons?.[0] || 'On-track processing'}
              </div>
            </div>
          </div>

          {/* Dynamic Workflow Tracker Visualizer */}
          <div className="mt-6 pt-6 border-t border-[#D6C5AE]">
            <div className="text-xs font-bold uppercase tracking-wider text-[#A89580] mb-3">
              Application Progress Tracker ({app.workflow_route})
            </div>
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {workflowStages.map((stageName, idx) => {
                const isPassed = idx < currentStageIdx;
                const isCurrent = idx === currentStageIdx;
                return (
                  <div key={idx} className="relative">
                    <div className={`p-2.5 rounded-sm border font-semibold ${
                      isCurrent ? 'bg-[#263B50] text-white border-[#263B50]' :
                      isPassed ? 'bg-[#48745A]/15 text-[#48745A] border-[#48745A]' :
                      'bg-[#FAF7F2] text-[#A89580] border-[#D6C5AE]'
                    }`}>
                      {stageName}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {uploadSuccess && (
          <div className="p-4 bg-[#48745A]/15 border border-[#48745A] text-xs text-[#48745A] rounded-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-[#D6C5AE] flex gap-2">
          <button
            onClick={() => setActiveTab('documents')}
            className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === 'documents'
                ? 'border-[#8B3A3A] text-[#8B3A3A]'
                : 'border-transparent text-[#A89580] hover:text-[#40372F]'
            }`}
          >
            Prescribed Documents & Checklist ({app.documents.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === 'history'
                ? 'border-[#8B3A3A] text-[#8B3A3A]'
                : 'border-transparent text-[#A89580] hover:text-[#40372F]'
            }`}
          >
            Stage Movement History ({app.stage_histories.length})
          </button>
          <button
            onClick={() => setActiveTab('evc')}
            className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === 'evc'
                ? 'border-[#8B3A3A] text-[#8B3A3A]'
                : 'border-transparent text-[#A89580] hover:text-[#40372F]'
            }`}
          >
            EVC Inspection Details ({app.evc_schedules.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === 'audit'
                ? 'border-[#8B3A3A] text-[#8B3A3A]'
                : 'border-transparent text-[#A89580] hover:text-[#40372F]'
            }`}
          >
            Digital Audit Trail ({app.audit_events.length})
          </button>
        </div>

        {/* Tab 1: Documents & Replacement Upload */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm overflow-hidden shadow-xs">
              <div className="p-4 bg-[#FAF7F2] border-b border-[#D6C5AE] flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-[#40372F]">Prescribed Regulatory Checklist</h3>
                  <p className="text-xs text-[#A89580]">
                    Upload certified files. If returned with deficiencies by AICTE scrutiny officers, submit replacements directly here.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-[#D6C5AE]">
                {app.documents.map((doc) => {
                  const needsCorrection = doc.status === 'CORRECTION_REQUIRED';
                  const isVerified = doc.status === 'VERIFIED';
                  const isSubmitted = doc.status === 'SUBMITTED';

                  return (
                    <div key={doc.id} className={`p-5 transition ${needsCorrection ? 'bg-[#B33A3A]/5' : ''}`}>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-[#40372F]">{doc.name}</span>
                            {doc.is_mandatory && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-[#E8DED0] text-[#8B3A3A] font-bold rounded-xs">
                                MANDATORY
                              </span>
                            )}
                            <span className={`text-[10px] px-2 py-0.5 rounded-xs font-bold ${
                              isVerified ? 'bg-[#48745A]/15 text-[#48745A]' :
                              needsCorrection ? 'bg-[#B33A3A] text-white' :
                              isSubmitted ? 'bg-[#263B50]/15 text-[#263B50]' :
                              'bg-[#FAF7F2] text-[#A89580] border border-[#D6C5AE]'
                            }`}>
                              {doc.status}
                            </span>
                          </div>
                          
                          <p className="text-xs text-[#A89580] mt-1">{doc.description}</p>

                          {doc.file_name && (
                            <div className="mt-2 text-xs flex items-center gap-3 text-[#40372F]">
                              <span className="font-mono bg-[#FAF7F2] px-2 py-0.5 rounded-xs border border-[#D6C5AE]">
                                {doc.file_name} (v{doc.version})
                              </span>
                              <span className="text-[#A89580]">{doc.file_size_kb || 450} KB</span>
                              {doc.submitted_at && (
                                <span className="text-[#A89580]">
                                  Uploaded: {new Date(doc.submitted_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Deficiency Box if Returned */}
                          {needsCorrection && (
                            <div className="mt-3 p-3 bg-[#B33A3A]/10 border border-[#B33A3A] rounded-sm text-xs">
                              <div className="font-bold text-[#B33A3A] flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4" /> AICTE Officer Deficiency Observation:
                              </div>
                              <p className="text-[#40372F] mt-1 font-medium">{doc.deficiency_reason}</p>
                              {doc.corrective_action_requested && (
                                <div className="mt-1 text-[#8B3A3A] font-medium">
                                  <strong>Corrective Action Required:</strong> {doc.corrective_action_requested}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="shrink-0 flex items-center gap-2">
                          {needsCorrection ? (
                            <button
                              onClick={() => setSelectedDoc(doc)}
                              className="px-3.5 py-1.5 bg-[#8B3A3A] hover:bg-[#732F2F] text-white font-semibold text-xs rounded-sm shadow-xs transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Upload className="w-3.5 h-3.5" /> Upload Replacement (v{doc.version + 1})
                            </button>
                          ) : doc.status === 'NOT_SUBMITTED' ? (
                            <button
                              onClick={() => setSelectedDoc(doc)}
                              className="px-3 py-1.5 bg-[#263B50] hover:bg-[#1D2E3F] text-white font-semibold text-xs rounded-sm transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Upload className="w-3.5 h-3.5" /> Upload Document
                            </button>
                          ) : (
                            <span className="text-xs text-[#48745A] font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Version History Accordion if multiple versions exist */}
                      {doc.versions && doc.versions.length > 1 && (
                        <div className="mt-3 pt-2 border-t border-[#D6C5AE]/40 text-xs">
                          <span className="font-semibold text-[#A89580] text-[11px] uppercase">
                            Document Version Audit Trail:
                          </span>
                          <div className="space-y-1 mt-1">
                            {doc.versions.map((v) => (
                              <div key={v.version_number} className="text-[#40372F] text-[11px] flex gap-3">
                                <span className="font-mono font-semibold">v{v.version_number}</span>
                                <span>{v.file_name}</span>
                                <span className="text-[#A89580]">{new Date(v.uploaded_at).toLocaleDateString()}</span>
                                <span className="text-[#A89580]">({v.remarks || 'Uploaded'})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Stage Movement History */}
        {activeTab === 'history' && (
          <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#40372F] border-b border-[#D6C5AE] pb-2">
              Official Workflow Stage Transitions
            </h3>
            <div className="space-y-4">
              {app.stage_histories.map((hist, i) => (
                <div key={hist.id} className="relative pl-6 pb-4 border-l-2 border-[#D6C5AE] last:border-0">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#8B3A3A] text-white flex items-center justify-center text-[9px] font-bold">
                    {i + 1}
                  </div>
                  <div className="text-xs font-bold text-[#40372F] flex items-center gap-2">
                    <span>{hist.stage_name}</span>
                    <span className="text-[10px] text-[#A89580]">[{hist.status_entered}]</span>
                    <span className="text-[#A89580] font-normal">
                      • {new Date(hist.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-[#263B50] mt-0.5">{hist.action_taken}</div>
                  {hist.remarks && <p className="text-xs text-[#40372F]/80 mt-1">{hist.remarks}</p>}
                  <div className="text-[10px] text-[#A89580] mt-1">Action logged by: {hist.actor_name} ({hist.actor_role})</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: EVC Details */}
        {activeTab === 'evc' && (
          <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#40372F] border-b border-[#D6C5AE] pb-2">
              Expert Visit Committee (EVC) Inspection Records
            </h3>
            {app.evc_schedules.length === 0 ? (
              <p className="text-xs text-[#A89580]">No EVC inspection scheduled yet for this application.</p>
            ) : (
              app.evc_schedules.map((evc) => (
                <div key={evc.id} className="p-4 bg-[#FAF7F2] border border-[#D6C5AE] rounded-sm space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-[#40372F]">{evc.evc_type} Inspection</span>
                    <span className="px-2 py-0.5 rounded-xs font-bold bg-[#B77932]/15 text-[#B77932]">
                      {evc.inspection_status}
                    </span>
                  </div>
                  <div><strong>Scheduled Date & Time:</strong> {new Date(evc.scheduled_date).toLocaleString()}</div>
                  <div><strong>Inspection Panel Lead:</strong> {evc.panel_lead}</div>
                  <div>
                    <strong>Panel Members:</strong> {evc.panel_members?.join(', ') || 'AICTE Nominated Experts'}
                  </div>
                  {evc.recommendation && (
                    <div className="p-2 bg-[#48745A]/10 border border-[#48745A] rounded-xs font-semibold text-[#48745A]">
                      Committee Recommendation: {evc.recommendation}
                    </div>
                  )}
                  {evc.remarks && <div><strong>Observations:</strong> {evc.remarks}</div>}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Audit Trail */}
        {activeTab === 'audit' && (
          <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm p-6">
            <h3 className="text-sm font-bold text-[#40372F] border-b border-[#D6C5AE] pb-2 mb-4">
              Immutable Digital Audit Trail
            </h3>
            <div className="space-y-2 text-xs">
              {app.audit_events.map((ev) => (
                <div key={ev.id} className="p-2.5 bg-[#FAF7F2] border border-[#D6C5AE] rounded-sm flex justify-between items-start">
                  <div>
                    <span className="font-mono font-bold text-[#8B3A3A]">{ev.action}</span>
                    <div className="text-[11px] text-[#40372F] mt-0.5">
                      Actor: {ev.actor_name} ({ev.actor_role})
                    </div>
                    {ev.details && (
                      <div className="text-[10px] text-[#A89580] mt-0.5 font-mono">
                        {JSON.stringify(ev.details)}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-[#A89580] shrink-0">
                    {new Date(ev.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document Upload Modal */}
        {selectedDoc && (
          <div className="fixed inset-0 z-50 bg-[#40372F]/50 flex items-center justify-center p-4">
            <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm max-w-lg w-full p-6 shadow-lg">
              <div className="flex justify-between items-start border-b border-[#D6C5AE] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#40372F]">
                    {selectedDoc.status === 'CORRECTION_REQUIRED' ? 'Upload Replacement Document' : 'Upload Document'}
                  </h3>
                  <p className="text-xs text-[#A89580] mt-0.5">{selectedDoc.name}</p>
                </div>
                <button 
                  onClick={() => setSelectedDoc(null)}
                  className="text-sm font-bold text-[#A89580] hover:text-[#40372F]"
                >
                  ✕
                </button>
              </div>

              {selectedDoc.status === 'CORRECTION_REQUIRED' && (
                <div className="mt-3 p-3 bg-[#B33A3A]/10 border border-[#B33A3A] rounded-sm text-xs text-[#40372F]">
                  <strong>Deficiency to address:</strong> {selectedDoc.deficiency_reason}
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#40372F]">
                    Select Certified PDF / Document File *
                  </label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="mt-1 w-full text-xs text-[#40372F] file:mr-3 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-[#8B3A3A] file:text-white hover:file:bg-[#732F2F] cursor-pointer"
                  />
                  <span className="text-[10px] text-[#A89580] block mt-1">Accepted: PDF, DOCX (Max 15MB)</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#40372F]">
                    Institutional Remarks / Explanations
                  </label>
                  <textarea
                    rows={2}
                    value={uploadRemarks}
                    onChange={(e) => setUploadRemarks(e.target.value)}
                    placeholder="e.g. Revised architectural plan with dual exit fire escapes incorporated."
                    className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-xs text-[#40372F]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#D6C5AE]">
                  <button
                    type="button"
                    onClick={() => setSelectedDoc(null)}
                    className="px-4 py-2 border border-[#D6C5AE] rounded-sm text-xs font-semibold text-[#40372F] hover:bg-[#E8DED0]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !uploadFile}
                    className="px-4 py-2 bg-[#8B3A3A] hover:bg-[#732F2F] text-white rounded-sm text-xs font-semibold transition cursor-pointer"
                  >
                    {uploading ? 'Uploading...' : 'Confirm & Submit to Bureau'}
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

