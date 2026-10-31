import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { apiFetch } from '../services/api';
import { AlertItem } from '../types';
import { AdminAIChatbox } from '../components/AdminAIChatbox';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Sliders, 
  Layers, 
  Filter, 
  Eye, 
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  RotateCcw
} from 'lucide-react';

export const AlertIntelligenceCentrePage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'alerts' | 'policies' | 'simulator' | 'chat'>('alerts');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Alert for Details Modal
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);

  // Policy Simulator inputs
  const [draftName, setDraftName] = useState('Proposal: 5-Day Scrutiny SLA Fast-Track');
  const [proposedChange, setProposedChange] = useState('Reduce scrutiny target SLA from 7 to 5 days');
  const [simScrutinyDays, setSimScrutinyDays] = useState(5.0);
  const [simResult, setSimResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  const fetchAlertsAndPolicies = async () => {
    try {
      let q = '?';
      if (categoryFilter) q += `category=${encodeURIComponent(categoryFilter)}&`;
      if (severityFilter) q += `severity=${encodeURIComponent(severityFilter)}&`;
      if (statusFilter) q += `status=${encodeURIComponent(statusFilter)}&`;

      const [alertsRes, policiesRes] = await Promise.all([
        apiFetch(`/alerts${q}`),
        apiFetch('/alerts/policies')
      ]);
      setAlerts(alertsRes);
      setPolicies(policiesRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsAndPolicies();
  }, [categoryFilter, severityFilter, statusFilter]);

  const handleAcknowledge = async (alertId: number) => {
    try {
      await apiFetch(`/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({ notes: 'Acknowledged by duty officer' })
      });
      fetchAlertsAndPolicies();
      setSelectedAlert(null);
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleResolve = async (alertId: number) => {
    const reason = prompt('Enter resolution notes:');
    if (!reason) return;

    try {
      await apiFetch(`/alerts/${alertId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution_notes: reason })
      });
      fetchAlertsAndPolicies();
      setSelectedAlert(null);
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleRunPolicySimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    try {
      const res = await apiFetch('/intelligence/policy-simulator', {
        method: 'POST',
        body: JSON.stringify({
          draft_name: draftName,
          proposed_change: proposedChange,
          new_scrutiny_days: simScrutinyDays
        })
      });
      setSimResult(res);
    } catch (err: any) {
      alert(err.message || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <Layout portalType="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-[#FFFEFC] p-6 border border-[#D6C5AE] rounded-sm shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#40372F]">Alert Intelligence Centre</h1>
              <span className="px-2.5 py-0.5 rounded-sm bg-[#8B3A3A] text-xs font-semibold text-white">
                Live Monitoring Engine
              </span>
            </div>
            <p className="text-xs text-[#A89580] mt-1">
              Automated surveillance of workflow deadlines, EVC schedules, institutional compliance, and configurable escalations.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => fetchAlertsAndPolicies()}
              className="px-3.5 py-2 border border-[#D6C5AE] bg-[#FFFEFC] hover:bg-[#E8DED0] text-xs font-semibold text-[#40372F] rounded-sm transition cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Run Monitor Cycle
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="border-b border-[#D6C5AE] flex gap-2 overflow-x-auto text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`pb-2.5 px-4 border-b-2 transition cursor-pointer ${
              activeTab === 'alerts' ? 'border-[#8B3A3A] text-[#8B3A3A]' : 'border-transparent text-[#A89580] hover:text-[#40372F]'
            }`}
          >
            Live Monitored Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`pb-2.5 px-4 border-b-2 transition cursor-pointer ${
              activeTab === 'policies' ? 'border-[#8B3A3A] text-[#8B3A3A]' : 'border-transparent text-[#A89580] hover:text-[#40372F]'
            }`}
          >
            Escalation & SLA Policies ({policies.length})
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`pb-2.5 px-4 border-b-2 transition cursor-pointer ${
              activeTab === 'chat' ? 'border-[#8B3A3A] text-[#8B3A3A]' : 'border-transparent text-[#A89580] hover:text-[#40372F]'
            }`}
          >
            Ask the Pipeline (AI Assistant)
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`pb-2.5 px-4 border-b-2 transition cursor-pointer ${
              activeTab === 'simulator' ? 'border-[#8B3A3A] text-[#8B3A3A]' : 'border-transparent text-[#A89580] hover:text-[#40372F]'
            }`}
          >
            Policy Change Impact Simulator
          </button>
        </div>

        {/* TAB 1: LIVE ALERTS LIST */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-[#FFFEFC] p-4 border border-[#D6C5AE] rounded-sm flex flex-col md:flex-row gap-3 text-xs">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-[#40372F]"
              >
                <option value="">All Categories</option>
                <option value="APPLICATION_WORKFLOW">Application Workflow</option>
                <option value="EVC_SCHEDULING">EVC Scheduling</option>
                <option value="COMPLIANCE">Institutional Compliance</option>
                <option value="DOCUMENT_VALIDITY">Document Validity</option>
                <option value="OPERATIONAL">Operational Monitoring</option>
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3 py-1.5 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-[#40372F]"
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MODERATE">Moderate</option>
                <option value="LOW">Low</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-[#40372F]"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="ESCALATED">Escalated</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>

            {/* Alerts Table */}
            <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm overflow-hidden shadow-xs">
              <table className="min-w-full divide-y divide-[#D6C5AE] text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#40372F] font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Alert Title & Category</th>
                    <th className="py-3 px-4">Entity / Target Role</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6C5AE] text-[#40372F]">
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-8 text-[#A89580]">Loading live alerts...</td></tr>
                  ) : alerts.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-[#A89580]">No active alerts matching filter.</td></tr>
                  ) : (
                    alerts.map((al) => {
                      const isCritical = al.severity === 'CRITICAL';
                      const isHigh = al.severity === 'HIGH';

                      return (
                        <tr key={al.id} className="hover:bg-[#FAF7F2]">
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-xs font-bold text-[10px] ${
                              isCritical ? 'bg-[#B33A3A] text-white' :
                              isHigh ? 'bg-[#B77932] text-white' :
                              'bg-[#E8DED0] text-[#40372F]'
                            }`}>
                              {al.severity}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-sm text-[#40372F]">{al.title}</div>
                            <div className="text-[11px] text-[#A89580]">
                              {al.category} • Policy: <span className="font-mono">{al.policy_code}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-[#40372F]">{al.application_code || al.institution_name || 'System Wide'}</div>
                            <div className="text-[11px] text-[#A89580]">Target: {al.target_role}</div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-[#A89580]">
                            {al.due_date ? new Date(al.due_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-xs font-bold text-[10px] ${
                              al.status === 'ESCALATED' ? 'bg-[#B33A3A] text-white' :
                              al.status === 'OPEN' ? 'bg-[#B77932]/15 text-[#B77932]' :
                              al.status === 'ACKNOWLEDGED' ? 'bg-[#263B50]/15 text-[#263B50]' :
                              'bg-[#48745A]/15 text-[#48745A]'
                            }`}>
                              {al.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedAlert(al)}
                              className="px-3 py-1 bg-[#263B50] hover:bg-[#1D2E3F] text-white rounded-sm text-xs font-medium cursor-pointer"
                            >
                              Inspect Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: POLICIES */}
        {activeTab === 'policies' && (
          <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm shadow-xs overflow-hidden">
            <div className="p-4 bg-[#FAF7F2] border-b border-[#D6C5AE]">
              <h3 className="text-sm font-bold text-[#40372F]">Configurable SLA & Escalation Hierarchy</h3>
              <p className="text-xs text-[#A89580]">
                Official statutory deadlines, administrative warning thresholds, and multi-tier escalation delays.
              </p>
            </div>

            <div className="divide-y divide-[#D6C5AE] text-xs">
              {policies.map((pol) => (
                <div key={pol.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#8B3A3A]">{pol.policy_code}</span>
                      <span className="font-semibold text-sm text-[#40372F]">{pol.name}</span>
                      {pol.is_statutory && (
                        <span className="text-[10px] bg-[#48745A]/15 text-[#48745A] px-1.5 py-0.2 rounded-xs font-bold">
                          STATUTORY
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#40372F]">
                      Warning Window: <strong>{pol.warning_days_before} days prior</strong> • Escalation Delay: <strong>{pol.escalation_delay_hours}h</strong>
                    </div>
                    <div className="text-[11px] text-[#A89580]">
                      Primary Responsible Role: <span className="font-semibold text-[#263B50]">{pol.responsible_role}</span> → Next Escalation Level: <span className="font-semibold text-[#8B3A3A]">{pol.next_escalation_role || 'None'}</span>
                    </div>
                  </div>

                  <div className="text-xs font-medium text-[#48745A]">
                    {pol.is_active ? '● Active Rule' : '○ Disabled'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: REAL AI CHATBOX */}
        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto">
            <AdminAIChatbox />
          </div>
        )}

        {/* TAB 4: POLICY SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm p-6 shadow-xs space-y-6">
            <div className="border-b border-[#D6C5AE] pb-3">
              <h2 className="text-base font-bold text-[#40372F] flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#8B3A3A]" /> Policy Change Impact Simulator
              </h2>
              <p className="text-xs text-[#A89580] mt-0.5">
                Test proposed administrative SLA shifts against active applications without changing any live workflow states.
              </p>
            </div>

            <form onSubmit={handleRunPolicySimulation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#40372F]">Draft Policy Name</label>
                  <input
                    type="text"
                    required
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-xs text-[#40372F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#40372F]">Proposed Scrutiny SLA Target (Days)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="2"
                    max="15"
                    value={simScrutinyDays}
                    onChange={(e) => setSimScrutinyDays(parseFloat(e.target.value))}
                    className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-xs text-[#40372F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#40372F]">Proposed Policy Rationale</label>
                <textarea
                  rows={2}
                  value={proposedChange}
                  onChange={(e) => setProposedChange(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-xs text-[#40372F]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={simulating}
                  className="px-6 py-2.5 bg-[#8B3A3A] hover:bg-[#732F2F] text-white rounded-sm text-xs font-semibold transition cursor-pointer"
                >
                  {simulating ? 'Calculating Impact...' : 'Simulate Policy Impact'}
                </button>
              </div>
            </form>

            {simResult && (
              <div className="p-4 bg-[#FAF7F2] border border-[#D6C5AE] rounded-sm space-y-3 text-xs">
                <div className="font-bold text-sm text-[#263B50]">
                  Simulation Findings: {simResult.draft_name}
                </div>
                <p className="text-[#40372F]">{simResult.summary_impact}</p>

                {simResult.affected_applications?.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <span className="font-semibold text-[#8B3A3A]">Potentially Impacted Live Applications:</span>
                    <ul className="list-disc pl-4 space-y-1">
                      {simResult.affected_applications.map((app: any, idx: number) => (
                        <li key={idx}>
                          <strong>{app.application_id}</strong> ({app.title}) — {app.impact_reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-2 bg-[#E8DED0] rounded-xs text-[11px] text-[#40372F]">
                  <strong>Official Notice:</strong> {simResult.simulation_disclaimer}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Alert Details Modal */}
        {selectedAlert && (
          <div className="fixed inset-0 z-50 bg-[#40372F]/50 flex items-center justify-center p-4">
            <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm max-w-lg w-full p-6 shadow-lg space-y-4 text-xs">
              <div className="flex justify-between items-start border-b border-[#D6C5AE] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#8B3A3A]">{selectedAlert.policy_code}</span>
                    <span className="px-2 py-0.5 rounded-xs font-bold text-[10px] bg-[#B33A3A] text-white">
                      {selectedAlert.severity}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#40372F] mt-1">{selectedAlert.title}</h3>
                </div>
                <button onClick={() => setSelectedAlert(null)} className="text-sm font-bold text-[#A89580]">✕</button>
              </div>

              <div>
                <strong>Description:</strong>
                <p className="text-[#40372F] mt-0.5">{selectedAlert.description}</p>
              </div>

              <div>
                <strong>Trigger Reason:</strong>
                <p className="text-[#8B3A3A] font-mono mt-0.5">{selectedAlert.trigger_reason}</p>
              </div>

              {selectedAlert.recommended_action && (
                <div className="p-2.5 bg-[#48745A]/10 border border-[#48745A] rounded-xs text-[#48745A]">
                  <strong>Recommended Next Action:</strong> {selectedAlert.recommended_action}
                </div>
              )}

              {selectedAlert.escalation_events && selectedAlert.escalation_events.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-[#D6C5AE]">
                  <span className="font-bold text-[#B33A3A] uppercase tracking-wider block">
                    Escalation History:
                  </span>
                  {selectedAlert.escalation_events.map((e) => (
                    <div key={e.id} className="p-2 bg-[#FAF7F2] border border-[#D6C5AE] rounded-xs text-[11px]">
                      <div>Escalated from <strong>{e.previous_role}</strong> to <strong>{e.new_role}</strong></div>
                      <div className="text-[#A89580]">{e.reason} ({new Date(e.timestamp).toLocaleString()})</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#D6C5AE]">
                {selectedAlert.status !== 'ACKNOWLEDGED' && selectedAlert.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleAcknowledge(selectedAlert.id)}
                    className="px-3 py-1.5 bg-[#263B50] hover:bg-[#1D2E3F] text-white rounded-sm font-semibold cursor-pointer"
                  >
                    Acknowledge Alert
                  </button>
                )}
                {selectedAlert.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleResolve(selectedAlert.id)}
                    className="px-3 py-1.5 bg-[#48745A] hover:bg-[#3B604A] text-white rounded-sm font-semibold cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                )}
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="px-3 py-1.5 border border-[#D6C5AE] rounded-sm text-[#40372F] font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

