import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Building2, Key, Mail, AlertCircle, ArrowLeft } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'admin' ? 'admin' : 'institution';
  const [activeTab, setActiveTab] = useState<'institution' | 'admin'>(initialRole);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleQuickFill = (roleType: string) => {
    if (roleType === 'admin') {
      setEmail('admin@aicte.gov.in');
      setPassword('Admin@123');
    } else if (roleType === 'officer') {
      setEmail('officer@aicte.gov.in');
      setPassword('Officer@123');
    } else if (roleType === 'inst1') {
      setEmail('institution@vits.edu.in');
      setPassword('College@123');
    } else if (roleType === 'inst2') {
      setEmail('institution@apex.ac.in');
      setPassword('College@123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ detail: 'Authentication failed' }));
        throw new Error(data.detail || 'Invalid login credentials');
      }

      const data = await response.json();
      login(data.access_token, {
        id: data.user_id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        institution_id: data.institution_id,
        institution_name: data.institution_name,
      });

      if (['AICTE_ADMIN', 'AICTE_OFFICER', 'EVC_COORDINATOR', 'AUDITOR'].includes(data.role)) {
        navigate('/admin/dashboard');
      } else {
        navigate('/institution/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-[#8B3A3A] hover:underline mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to ComplianceTwin 360 Home
        </Link>
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-sm bg-[#8B3A3A] flex items-center justify-center text-white font-bold text-2xl shadow-sm">
            CT
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-[#40372F]">
          Sign in to ComplianceTwin 360
        </h2>
        <p className="mt-1 text-center text-xs text-[#A89580]">
          Authorized AICTE Approval Workflow & Compliance Monitoring Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#FFFEFC] py-8 px-6 sm:px-10 border border-[#D6C5AE] shadow-xs rounded-sm">
          {/* Dual portal selector */}
          <div className="flex border-b border-[#D6C5AE] mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('institution');
                setEmail('');
                setPassword('');
              }}
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'institution'
                  ? 'border-[#8B3A3A] text-[#8B3A3A]'
                  : 'border-transparent text-[#A89580] hover:text-[#40372F]'
              }`}
            >
              <Building2 className="w-4 h-4" /> Institution Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setEmail('');
                setPassword('');
              }}
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'admin'
                  ? 'border-[#263B50] text-[#263B50]'
                  : 'border-transparent text-[#A89580] hover:text-[#40372F]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> AICTE Admin Portal
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#B33A3A]/10 border border-[#B33A3A] rounded-sm text-xs text-[#B33A3A] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#40372F]">
                Official Email Address
              </label>
              <div className="mt-1 relative rounded-sm shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-[#A89580]" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={activeTab === 'admin' ? 'officer@aicte.gov.in' : 'institution@vits.edu.in'}
                  className="block w-full pl-9 pr-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-sm text-[#40372F] focus:outline-none focus:ring-1 focus:ring-[#8B3A3A] focus:border-[#8B3A3A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#40372F]">
                Security Password
              </label>
              <div className="mt-1 relative rounded-sm shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-4 w-4 text-[#A89580]" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-sm text-[#40372F] focus:outline-none focus:ring-1 focus:ring-[#8B3A3A] focus:border-[#8B3A3A]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-sm text-sm font-semibold text-white shadow-xs transition cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-[#263B50] hover:bg-[#1D2E3F]'
                  : 'bg-[#8B3A3A] hover:bg-[#732F2F]'
              }`}
            >
              {loading ? 'Authenticating...' : `Enter ${activeTab === 'admin' ? 'AICTE Admin Portal' : 'Institution Portal'}`}
            </button>
          </form>

          {/* Demonstration Quick Fill Credentials */}
          <div className="mt-6 pt-4 border-t border-[#D6C5AE]">
            <span className="block text-xs font-bold uppercase tracking-wider text-[#A89580] mb-2">
              Demo Credentials (Click to pre-fill)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => { setActiveTab('admin'); handleQuickFill('admin'); }}
                className="p-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] hover:bg-[#E8DED0] text-left transition cursor-pointer"
              >
                <div className="font-semibold text-[#263B50]">AICTE Admin</div>
                <div className="text-[10px] text-[#A89580]">admin@aicte.gov.in</div>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('admin'); handleQuickFill('officer'); }}
                className="p-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] hover:bg-[#E8DED0] text-left transition cursor-pointer"
              >
                <div className="font-semibold text-[#263B50]">Scrutiny Officer</div>
                <div className="text-[10px] text-[#A89580]">officer@aicte.gov.in</div>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('institution'); handleQuickFill('inst1'); }}
                className="p-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] hover:bg-[#E8DED0] text-left transition cursor-pointer"
              >
                <div className="font-semibold text-[#8B3A3A]">VITS Pune</div>
                <div className="text-[10px] text-[#A89580]">institution@vits.edu.in</div>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('institution'); handleQuickFill('inst2'); }}
                className="p-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] hover:bg-[#E8DED0] text-left transition cursor-pointer"
              >
                <div className="font-semibold text-[#8B3A3A]">Apex AI College</div>
                <div className="text-[10px] text-[#A89580]">institution@apex.ac.in</div>
              </button>
            </div>
          </div>

          {activeTab === 'institution' && (
            <div className="mt-4 text-center">
              <Link to="/register-institution" className="text-xs text-[#8B3A3A] hover:underline font-semibold">
                Register New Institution Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

