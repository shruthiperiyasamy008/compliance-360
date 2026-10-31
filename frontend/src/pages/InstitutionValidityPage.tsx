import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { apiFetch } from '../services/api';
import { ValidityDoc } from '../types';
import { AlertTriangle, CheckCircle2, ShieldAlert, Clock, RefreshCw } from 'lucide-react';

export const InstitutionValidityPage: React.FC = () => {
  const [docs, setDocs] = useState<ValidityDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    try {
      const res = await apiFetch('/validity/documents');
      setDocs(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  return (
    <Layout portalType="INSTITUTION">
      <div className="space-y-6">
        <div className="bg-[#FFFEFC] p-6 border border-[#D6C5AE] rounded-sm shadow-xs">
          <h1 className="text-xl font-bold text-[#40372F] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#B77932]" /> Document Validity & Regulatory Expiry Monitoring
          </h1>
          <p className="text-xs text-[#A89580] mt-1">
            Proactive tracking of land deeds, fire NOCs, and building fitness certificates to prevent mid-cycle regulatory invalidations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm">
            <div className="text-xs text-[#A89580] font-semibold uppercase">Total Tracked Prescriptions</div>
            <div className="text-2xl font-bold text-[#40372F] mt-1">{docs.length}</div>
          </div>
          <div className="p-4 bg-[#FFFEFC] border border-[#B77932] rounded-sm bg-[#B77932]/5">
            <div className="text-xs text-[#B77932] font-semibold uppercase">Expiring in 60 Days</div>
            <div className="text-2xl font-bold text-[#B77932] mt-1">
              {docs.filter(d => d.status === 'EXPIRING_SOON').length}
            </div>
          </div>
          <div className="p-4 bg-[#FFFEFC] border border-[#48745A] rounded-sm bg-[#48745A]/5">
            <div className="text-xs text-[#48745A] font-semibold uppercase">Fully Valid</div>
            <div className="text-2xl font-bold text-[#48745A] mt-1">
              {docs.filter(d => d.status === 'VALID').length}
            </div>
          </div>
        </div>

        <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm overflow-hidden shadow-xs">
          <table className="min-w-full divide-y divide-[#D6C5AE] text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[#40372F] font-semibold uppercase">
              <tr>
                <th className="py-3 px-4">Prescribed Document Type</th>
                <th className="py-3 px-4">Issuing Authority</th>
                <th className="py-3 px-4">Reference No.</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Current Validity</th>
                <th className="py-3 px-4 text-right">Renewal Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6C5AE] text-[#40372F]">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-6 text-[#A89580]">Loading validity records...</td></tr>
              ) : docs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-6 text-[#A89580]">No documents registered.</td></tr>
              ) : (
                docs.map((doc) => {
                  const isExpiring = doc.status === 'EXPIRING_SOON';
                  const isExpired = doc.status === 'EXPIRED';

                  return (
                    <tr key={doc.id} className="hover:bg-[#FAF7F2]">
                      <td className="py-3.5 px-4 font-semibold text-sm">{doc.document_type}</td>
                      <td className="py-3.5 px-4 text-[#A89580]">{doc.issuing_authority}</td>
                      <td className="py-3.5 px-4 font-mono">{doc.reference_number}</td>
                      <td className="py-3.5 px-4 font-semibold">
                        {new Date(doc.expiry_date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-xs font-bold text-[10px] ${
                          isExpired ? 'bg-[#B33A3A] text-white' :
                          isExpiring ? 'bg-[#B77932] text-white' :
                          'bg-[#48745A]/15 text-[#48745A]'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-[11px] text-[#A89580] font-medium">{doc.renewal_status}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

