import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { apiFetch } from '../services/api';
import { ValidityDoc } from '../types';
import { AlertTriangle, Clock } from 'lucide-react';

export const AdminValidityRecordsPage: React.FC = () => {
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
    <Layout portalType="ADMIN">
      <div className="space-y-6">
        <div className="bg-[#FFFEFC] p-6 border border-[#D6C5AE] rounded-sm shadow-xs">
          <h1 className="text-xl font-bold text-[#40372F] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#B77932]" /> Central Document Validity Registry
          </h1>
          <p className="text-xs text-[#A89580] mt-1">
            Council-wide registry of institutional land lease deeds, building safety certificates, and fire safety endorsements.
          </p>
        </div>

        <div className="bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm overflow-hidden shadow-xs">
          <table className="min-w-full divide-y divide-[#D6C5AE] text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[#40372F] font-semibold uppercase">
              <tr>
                <th className="py-3 px-4">Institution Name</th>
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Issuing Authority</th>
                <th className="py-3 px-4">Ref Number</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4 text-right">Validity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6C5AE] text-[#40372F]">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-6 text-[#A89580]">Loading validity records...</td></tr>
              ) : docs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-6 text-[#A89580]">No documents registered.</td></tr>
              ) : (
                docs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#FAF7F2]">
                    <td className="py-3.5 px-4 font-semibold text-sm">{doc.institution_name}</td>
                    <td className="py-3.5 px-4">{doc.document_type}</td>
                    <td className="py-3.5 px-4 text-[#A89580]">{doc.issuing_authority}</td>
                    <td className="py-3.5 px-4 font-mono">{doc.reference_number}</td>
                    <td className="py-3.5 px-4 font-medium">{new Date(doc.expiry_date).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded-xs font-bold text-[10px] ${
                        doc.status === 'EXPIRED' ? 'bg-[#B33A3A] text-white' :
                        doc.status === 'EXPIRING_SOON' ? 'bg-[#B77932] text-white' :
                        'bg-[#48745A]/15 text-[#48745A]'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

