import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { apiFetch } from '../services/api';
import { Activity, TrendingUp, Sliders, AlertCircle, CheckCircle2 } from 'lucide-react';

export const IntelligenceCentrePage: React.FC = () => {
  const [bottlenecks, setBottlenecks] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Simulation form inputs
  const [additionalApps, setAdditionalApps] = useState<number>(25);
  const [scrutinyCapacity, setScrutinyCapacity] = useState<number>(0);
  const [evcDelay, setEvcDelay] = useState<number>(7);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simulating, setSimulating] = useState<boolean>(false);

  const fetchBottlenecks = async () => {
    try {
      const res = await apiFetch('/intelligence/bottlenecks');
      setBottlenecks(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBottlenecks();
    runSimulation(25, 0, 7);
  }, []);

  const runSimulation = async (apps: number, capacity: number, delay: number) => {
    setSimulating(true);
    try {
      const res = await apiFetch('/intelligence/simulate', {
        method: 'POST',
        body: JSON.stringify({
          additional_applications_pct: apps,
          scrutiny_capacity_change_pct: capacity,
          evc_delay_days: delay,
        }),
      });
      setSimulationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSimulation(additionalApps, scrutinyCapacity, evcDelay);
  };

  return (
    <Layout portalType="ADMIN">
      <div className="space-y-6">
        <div className="bg-[#FFFEFC] p-6 border border-[#D6C5AE] rounded-sm shadow-xs">
          <h1 className="text-xl font-bold text-[#40372F] flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#8B3A3A]" /> Intelligence Centre: Bottleneck Analysis & What-If Simulation
          </h1>
          <p className="text-xs text-[#A89580] mt-1">
            Data-driven pendency insights and prescriptive simulation models to test approval turnaround times under policy or capacity shifts.
          </p>
        </div>

        {/* Bottleneck Analysis Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#FFFEFC] border border-[#D6C5AE] p-6 rounded-sm shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#40372F] uppercase tracking-wider border-b border-[#D6C5AE] pb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#263B50]" /> Stage Dwell Time (Average Days)
            </h2>

            <div className="space-y-3">
              {bottlenecks && Object.entries(bottlenecks.average_stage_dwell_days || {}).map(([stage, days]: any) => (
                <div key={stage} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#40372F]">{stage}</span>
                    <span className="text-[#8B3A3A] font-bold">{days} Days</span>
                  </div>
                  <div className="w-full bg-[#E8DED0] h-2 rounded-xs overflow-hidden">
                    <div 
                      className="bg-[#263B50] h-full"
                      style={{ width: `${Math.min((days / 30) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-[#FAF7F2] border border-[#D6C5AE] rounded-sm text-xs">
              <strong>Identified Critical Bottleneck: </strong>
              <span className="text-[#8B3A3A] font-bold">{bottlenecks?.primary_bottleneck_stage}</span>
              <p className="text-[#A89580] mt-0.5">
                Applications experience the longest idle queue time in this stage before progressing to decision.
              </p>
            </div>
          </div>

          {/* Frequent Deficiencies */}
          <div className="bg-[#FFFEFC] border border-[#D6C5AE] p-6 rounded-sm shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#40372F] uppercase tracking-wider border-b border-[#D6C5AE] pb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#B33A3A]" /> Primary Deficiency Triggers
            </h2>

            <p className="text-xs text-[#A89580]">
              Most frequent document types returned to institutions by scrutiny officers:
            </p>

            <div className="space-y-2">
              {bottlenecks && Object.entries(bottlenecks.common_deficiency_documents || {}).length === 0 ? (
                <div className="text-xs text-[#A89580]">No repeat deficiencies logged yet.</div>
              ) : (
                bottlenecks && Object.entries(bottlenecks.common_deficiency_documents || {}).map(([docName, count]: any) => (
                  <div key={docName} className="p-3 bg-[#FAF7F2] border border-[#D6C5AE] rounded-sm flex justify-between items-center text-xs">
                    <span className="font-semibold text-[#40372F]">{docName}</span>
                    <span className="px-2 py-0.5 bg-[#B33A3A] text-white font-bold rounded-xs">
                      {count} Flagged
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* What-If Simulation Engine */}
        <div className="bg-[#FFFEFC] border border-[#D6C5AE] p-6 rounded-sm shadow-xs space-y-6">
          <div className="border-b border-[#D6C5AE] pb-3">
            <h2 className="text-base font-bold text-[#40372F] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#8B3A3A]" /> What-If Process Simulation Engine
            </h2>
            <p className="text-xs text-[#A89580] mt-0.5">
              Simulate hypothetical policy adjustments, surge volumes, and peer panel capacity shifts to forecast pendency.
            </p>
          </div>

          <form onSubmit={handleSimulateSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-[#40372F] uppercase">
                Application Surge Volume (+{additionalApps}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={additionalApps}
                onChange={(e) => setAdditionalApps(parseInt(e.target.value))}
                className="w-full mt-2"
              />
              <div className="flex justify-between text-[10px] text-[#A89580]">
                <span>0% Surge</span>
                <span>+100% Surge</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#40372F] uppercase">
                Scrutiny Review Capacity Shift ({scrutinyCapacity}%)
              </label>
              <input
                type="range"
                min="-50"
                max="50"
                step="5"
                value={scrutinyCapacity}
                onChange={(e) => setScrutinyCapacity(parseInt(e.target.value))}
                className="w-full mt-2"
              />
              <div className="flex justify-between text-[10px] text-[#A89580]">
                <span>-50% Staffing</span>
                <span>+50% Staffing</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#40372F] uppercase">
                Simulated EVC Panel Delay ({evcDelay} Days)
              </label>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={evcDelay}
                onChange={(e) => setEvcDelay(parseInt(e.target.value))}
                className="w-full mt-2"
              />
              <div className="flex justify-between text-[10px] text-[#A89580]">
                <span>0 Days</span>
                <span>20 Days</span>
              </div>
            </div>

            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={simulating}
                className="px-6 py-2.5 bg-[#8B3A3A] hover:bg-[#732F2F] text-white font-semibold text-xs rounded-sm transition cursor-pointer"
              >
                {simulating ? 'Running Simulation...' : 'Calculate Simulated Outcome'}
              </button>
            </div>
          </form>

          {/* Simulation Output Dashboard */}
          {simulationResult && (
            <div className="p-6 bg-[#FAF7F2] border border-[#D6C5AE] rounded-sm space-y-4">
              <div className="text-xs font-bold text-[#263B50] uppercase tracking-wider">
                Simulated Governance Projection
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm">
                  <div className="text-[11px] text-[#A89580] uppercase font-semibold">Simulated Total Volume</div>
                  <div className="text-2xl font-bold text-[#40372F] mt-1">
                    {simulationResult.projected_outcome.projected_application_volume} Applications
                  </div>
                  <div className="text-[10px] text-[#A89580] mt-1">
                    Baseline: {simulationResult.baseline.current_volume} cases
                  </div>
                </div>

                <div className="p-4 bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm">
                  <div className="text-[11px] text-[#A89580] uppercase font-semibold">Projected Average Processing SLA</div>
                  <div className="text-2xl font-bold text-[#8B3A3A] mt-1">
                    {simulationResult.projected_outcome.projected_average_days} Days
                  </div>
                  <div className="text-[10px] text-[#A89580] mt-1">
                    Baseline SLA: {simulationResult.baseline.average_processing_days} days
                  </div>
                </div>

                <div className="p-4 bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm">
                  <div className="text-[11px] text-[#A89580] uppercase font-semibold">Pendency Shift</div>
                  <div className={`text-2xl font-bold mt-1 ${
                    simulationResult.projected_outcome.pendency_shift_pct > 0 ? 'text-[#B33A3A]' : 'text-[#48745A]'
                  }`}>
                    {simulationResult.projected_outcome.pendency_shift_pct > 0 ? '+' : ''}
                    {simulationResult.projected_outcome.pendency_shift_pct}%
                  </div>
                  <div className="text-[10px] text-[#A89580] mt-1">Relative to current baseline</div>
                </div>
              </div>

              <div className="p-4 bg-[#FFFEFC] border border-[#263B50] rounded-sm text-xs">
                <strong className="text-[#263B50]">Prescriptive Administrative Recommendation: </strong>
                <span className="text-[#40372F]">{simulationResult.projected_outcome.recommended_mitigation}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

