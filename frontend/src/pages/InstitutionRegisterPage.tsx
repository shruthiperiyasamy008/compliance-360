import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle2, AlertCircle } from 'lucide-react';

export const InstitutionRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    aicte_id: '',
    institution_name: '',
    category: 'Engineering & Technology',
    region: 'Western',
    state: 'Maharashtra',
    address: '',
    email: '',
    password: '',
    full_name: '',
    contact_phone: '',
    head_of_institution: '',
    established_year: 2012,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register-institution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Registration failed' }));
        throw new Error(data.detail || 'Could not complete registration');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login?role=institution');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] py-12 px-4 sm:px-6 lg:px-8 font-sans text-[#40372F]">
      <div className="max-w-2xl mx-auto">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-[#8B3A3A] hover:underline mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
        </Link>
        
        <div className="bg-[#FFFEFC] p-8 border border-[#D6C5AE] rounded-sm shadow-xs">
          <div className="flex items-center gap-3 mb-6 border-b border-[#D6C5AE] pb-4">
            <div className="w-10 h-10 rounded-sm bg-[#8B3A3A] flex items-center justify-center text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">New Institution Registration</h2>
              <p className="text-xs text-[#A89580]">
                Register official technical institution details for AICTE Approval Workflow access
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#B33A3A]/10 border border-[#B33A3A] rounded-sm text-xs text-[#B33A3A] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-[#48745A]/10 border border-[#48745A] rounded-sm text-sm text-[#48745A] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Institution account created! Redirecting to login portal...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#40372F] uppercase">Permanent AICTE ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1-893049112"
                  value={formData.aicte_id}
                  onChange={(e) => setFormData({ ...formData, aicte_id: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#40372F] uppercase">Institution Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-sm"
                >
                  <option value="Engineering & Technology">Engineering & Technology</option>
                  <option value="Technical Campus">Technical Campus</option>
                  <option value="Management">Management</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Architecture & Planning">Architecture & Planning</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#40372F] uppercase">Institution Name *</label>
              <input
                type="text"
                required
                placeholder="Full official institute name"
                value={formData.institution_name}
                onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#40372F] uppercase">AICTE Region *</label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-sm"
                >
                  <option value="Western">Western Region</option>
                  <option value="Northern">Northern Region</option>
                  <option value="Southern">Southern Region</option>
                  <option value="Eastern">Eastern Region</option>
                  <option value="Central">Central Region</option>
                  <option value="South-Western">South-Western Region</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#40372F] uppercase">State *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maharashtra"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#40372F] uppercase">Official Campus Address *</label>
              <textarea
                required
                rows={2}
                placeholder="Full address with pin code"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-sm"
              />
            </div>

            <div className="border-t border-[#D6C5AE] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#40372F] uppercase">Head of Institution / Principal</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. R. S. Patil"
                  value={formData.head_of_institution}
                  onChange={(e) => setFormData({ ...formData, head_of_institution: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#40372F] uppercase">Contact Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 20 2345 6789"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-sm"
                />
              </div>
            </div>

            <div className="border-t border-[#D6C5AE] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#40372F] uppercase">Account Authorized Person Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Principal or Registrar Name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#40372F] uppercase">Official Email (Username) *</label>
                <input
                  type="email"
                  required
                  placeholder="principal@college.edu.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#40372F] uppercase">Portal Access Password *</label>
              <input
                type="password"
                required
                placeholder="Choose a strong password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-2.5 px-4 bg-[#8B3A3A] hover:bg-[#732F2F] text-white font-semibold rounded-sm text-sm transition cursor-pointer"
            >
              {loading ? 'Registering Institution...' : 'Submit Institutional Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

