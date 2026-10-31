import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  LogOut, 
  FileText, 
  Layers, 
  AlertTriangle, 
  Activity,
  CheckCircle,
  FileCheck,
  Bell,
  Clock,
  Bot
} from 'lucide-react';
import { FloatingAIChatWidget } from './FloatingAIChatWidget';

interface LayoutProps {
  children: React.ReactNode;
  portalType: 'ADMIN' | 'INSTITUTION';
}

export const Layout: React.FC<LayoutProps> = ({ children, portalType }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = portalType === 'ADMIN';

  const institutionLinks = [
    { name: 'Dashboard', path: '/institution/dashboard', icon: Layers },
    { name: 'New Application', path: '/institution/new-application', icon: FileText },
    { name: 'My Applications', path: '/institution/applications', icon: Building2 },
    { name: 'Notifications & Alerts', path: '/institution/notifications', icon: Bell },
    { name: 'Compliance & Undertakings', path: '/institution/compliance', icon: CheckCircle },
    { name: 'Document Validity & Expiry', path: '/institution/validity', icon: AlertTriangle },
  ];

  const adminLinks = [
    { name: 'Admin Dashboard', path: '/admin/dashboard', icon: Layers },
    { name: 'Unified Applications', path: '/admin/applications', icon: FileCheck },
    { name: 'Alert Intelligence Centre', path: '/admin/alerts', icon: Bell },
    { name: 'Unified Obligation Clock', path: '/admin/obligations', icon: Clock },
    { name: 'Compliance Verification', path: '/admin/compliance', icon: CheckCircle },
    { name: 'Document Validity Records', path: '/admin/validity', icon: AlertTriangle },
    { name: 'Intelligence & Simulation', path: '/admin/intelligence', icon: Activity },
  ];

  const links = isAdmin ? adminLinks : institutionLinks;

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col font-sans text-[#40372F]">
      {/* Top Header */}
      <header className="bg-[#FFFEFC] border-b border-[#D6C5AE] shadow-xs sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-sm bg-[#8B3A3A] flex items-center justify-center text-white font-bold text-xl shadow-xs">
                  CT
                </div>
                <div>
                  <span className="text-xl font-bold tracking-tight text-[#40372F] group-hover:text-[#8B3A3A] transition">
                    ComplianceTwin 360
                  </span>
                  <span className="block text-xs uppercase tracking-wider text-[#A89580] font-semibold">
                    {isAdmin ? 'AICTE Approval Bureau & Alert Intelligence' : 'Institutional Compliance Portal'}
                  </span>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm font-semibold text-[#40372F]">{user?.full_name || 'Active User'}</span>
                <span className="text-xs text-[#A89580]">
                  {isAdmin 
                    ? `Role: ${user?.role || 'AICTE Authority'}` 
                    : (user?.institution_name ? `${user.institution_name} (${user?.aicte_id || ''})` : 'Institution Member')}
                </span>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#D6C5AE] rounded-sm text-sm font-medium text-[#40372F] hover:bg-[#E8DED0] transition cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4 text-[#8B3A3A]" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Primary Navigation Ribbon */}
        <nav className="bg-[#263B50] text-[#E8DED0] px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-2 overflow-x-auto py-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path || location.pathname.startsWith(`${link.path}/`);
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-t-sm text-sm font-medium transition cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#F5F0E8] text-[#40372F] font-semibold border-t-2 border-[#8B3A3A]'
                      : 'text-[#E8DED0] hover:bg-[#1D2E3F] hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#8B3A3A]' : 'text-[#A89580]'}`} />
                  {link.name}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Floating AI Chat Assistant for Admin/Officer Portal */}
      <FloatingAIChatWidget />

      {/* Standard Footer */}
      <footer className="bg-[#E8DED0] border-t border-[#D6C5AE] py-4 text-center text-xs text-[#40372F] mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© 2025-2026 AICTE Hackathon Prototype — ComplianceTwin 360 Digital Governance Platform.</p>
          <div className="flex gap-4 text-[#40372F]/70">
            <span>Single Source Database (PostgreSQL / SQLite Core)</span>
            <span>•</span>
            <span>Live Escalation Engine & Grounded AI Intelligence</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
