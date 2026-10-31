import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  FileCheck, 
  Activity, 
  Clock, 
  Layers, 
  Scale, 
  BookOpen
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#40372F] flex flex-col font-sans">
      {/* 1. Navigation Bar */}
      <nav className="bg-[#FFFEFC] border-b border-[#D6C5AE] sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-[#8B3A3A] flex items-center justify-center text-white font-bold text-xl shadow-xs">
                CT
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-[#40372F]">
                  ComplianceTwin 360
                </span>
                <span className="block text-xs uppercase tracking-wider text-[#A89580] font-semibold">
                  AICTE Integrated Approval & Compliance Engine
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <a href="#problem" className="hover:text-[#8B3A3A] transition">The Problem</a>
              <a href="#solution" className="hover:text-[#8B3A3A] transition">Our Solution</a>
              <a href="#features" className="hover:text-[#8B3A3A] transition">Key Features</a>
              <a href="#how-it-works" className="hover:text-[#8B3A3A] transition">How It Works</a>
              <Link 
                to="/login"
                className="px-4 py-2 border border-[#8B3A3A] text-[#8B3A3A] hover:bg-[#8B3A3A] hover:text-white rounded-sm transition font-semibold"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-[#FAF7F2] to-[#F5F0E8] border-b border-[#D6C5AE]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8DED0] border border-[#D6C5AE] text-xs font-semibold text-[#40372F] uppercase tracking-wider mb-6">
            <ShieldCheck className="w-4 h-4 text-[#8B3A3A]" /> AICTE Hackathon Prototype
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#40372F] leading-tight">
            Transforming AICTE Approvals Through Intelligent Workflow Automation
          </h1>
          
          <p className="mt-6 text-lg sm:text-xl text-[#40372F]/80 max-w-3xl mx-auto leading-relaxed">
            One connected platform to manage approval workflows, institutional compliance, EVC coordination, document validity, deadlines, and administrative decision-making.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/login?role=admin"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#8B3A3A] text-white font-semibold rounded-sm shadow-sm hover:bg-[#732F2F] transition text-base"
            >
              <ShieldCheck className="w-5 h-5" />
              Enter AICTE Admin Portal
            </Link>
            <Link
              to="/login?role=institution"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#263B50] text-[#FFFEFC] font-semibold rounded-sm shadow-sm hover:bg-[#1D2E3F] transition text-base"
            >
              <Building2 className="w-5 h-5 text-[#D6C5AE]" />
              Enter Institution Portal
            </Link>
          </div>

          <div className="mt-8 text-xs text-[#A89580]">
            Seamless bidirectional database sync: actions in the institution portal reflect instantly in the administrative bureau.
          </div>
        </div>
      </section>

      {/* 3. The Problem */}
      <section id="problem" className="py-16 bg-[#FFFEFC] border-b border-[#D6C5AE]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs uppercase tracking-widest text-[#8B3A3A] font-bold">Administrative Challenges</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#40372F] mt-2">
              The Real Bottlenecks in Higher Technical Education Approvals
            </h3>
            <p className="mt-3 text-sm text-[#40372F]/70">
              Technical institutions and council officials navigate complex regulatory requirements across disconnected channels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Multi-Stage Pendency",
                desc: "Applications traversing scrutiny, EVC, and SAC/SHC without clear status visibility."
              },
              {
                title: "Manual Deficiencies",
                desc: "Repeated physical visits and delayed communication over document format issues."
              },
              {
                title: "EVC Delay Accumulation",
                desc: "Scheduling friction, unassigned expert panels, and prolonged inspection report submissions."
              },
              {
                title: "Expiring Regulatory Documents",
                desc: "Critical land lease deeds and fire safety NOCs expiring unnoticed mid-cycle."
              }
            ].map((prob, i) => (
              <div key={i} className="p-5 bg-[#FAF7F2] border border-[#D6C5AE] rounded-sm">
                <div className="w-8 h-8 rounded-sm bg-[#E8DED0] flex items-center justify-center text-[#8B3A3A] font-bold text-sm mb-3">
                  0{i + 1}
                </div>
                <h4 className="font-bold text-[#40372F] text-base">{prob.title}</h4>
                <p className="mt-2 text-xs text-[#40372F]/70 leading-relaxed">{prob.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Our Solution */}
      <section id="solution" className="py-16 bg-[#F5F0E8] border-b border-[#D6C5AE]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-[#FFFEFC] border border-[#D6C5AE] p-8 sm:p-10 rounded-sm shadow-xs">
            <div className="text-xs uppercase tracking-widest text-[#48745A] font-bold">The Connected Architecture</div>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#40372F] mt-2">
              A Unified Single-Source Digital Governance Platform
            </h3>
            <p className="mt-4 text-[#40372F]/80 leading-relaxed text-sm sm:text-base">
              ComplianceTwin 360 binds the technical college and the regulatory body into a single persistent database. When an institution registers a new course or facility proposal, Council Officers instantly examine verified documents. Deficiencies raised with precise statutory justifications enable institution resubmissions with strict version history — eliminating procedural delays.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#D6C5AE] pt-6">
              <div>
                <div className="text-2xl font-bold text-[#8B3A3A]">100%</div>
                <div className="text-xs text-[#A89580] mt-1">Live Institutional Audit Trail</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#263B50]">0 Silos</div>
                <div className="text-xs text-[#A89580] mt-1">Synchronized Portal Backend</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#48745A]">Explainable</div>
                <div className="text-xs text-[#A89580] mt-1">Delay-Risk & What-If Simulation</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Key Capabilities */}
      <section id="features" className="py-16 bg-[#FAF7F2] border-b border-[#D6C5AE]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs uppercase tracking-widest text-[#263B50] font-bold">Key Capabilities</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#40372F] mt-2">
              Engineered for Official Regulatory Precision
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Configurable Approval Workflows",
                desc: "Custom stage pipelines for New Courses, Facility Expansion, EoA, and New Institutions.",
                icon: Layers
              },
              {
                title: "Document Versioning & Resubmission",
                desc: "Immutable record of returned documents, deficiency reasons, and replacement version trails.",
                icon: FileCheck
              },
              {
                title: "EVC Inspection Coordination",
                desc: "Panel member composition, scheduled visit tracking, and electronic recommendation recording.",
                icon: Clock
              },
              {
                title: "Post-Approval Compliance Obligations",
                desc: "Continuous monitoring of regulatory undertakings with evidence upload and officer verification.",
                icon: CheckCircle2
              },
              {
                title: "Document Validity & Lease Expiry",
                desc: "Proactive tracking of land deeds, fire NOCs, and building fitness certificates.",
                icon: Scale
              },
              {
                title: "Explainable Delay Risk & Simulation",
                desc: "Algorithmic bottleneck discovery and scenario simulation for administrative decision makers.",
                icon: Activity
              }
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="bg-[#FFFEFC] p-6 border border-[#D6C5AE] rounded-sm">
                  <div className="w-10 h-10 rounded-sm bg-[#E8DED0] flex items-center justify-center text-[#263B50] mb-4">
                    <Icon className="w-5 h-5 text-[#8B3A3A]" />
                  </div>
                  <h4 className="font-bold text-[#40372F] text-base">{f.title}</h4>
                  <p className="mt-2 text-xs text-[#40372F]/70 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. How It Works */}
      <section id="how-it-works" className="py-16 bg-[#FFFEFC] border-b border-[#D6C5AE]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs uppercase tracking-widest text-[#8B3A3A] font-bold">Process Lifecycle</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#40372F] mt-2">
              From Registration to Official Post-Approval Monitoring
            </h3>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center">
            {[
              { step: "1", title: "Registration", desc: "Category selection & document checklist submission" },
              { step: "2", title: "Bureau Scrutiny", desc: "Document verification or deficiency return" },
              { step: "3", title: "Resubmission", desc: "Targeted correction without re-entering application" },
              { step: "4", title: "EVC & Committee", desc: "Expert inspection & SAC/SHC review if applicable" },
              { step: "5", title: "Official Decision", desc: "Sanction letter and post-approval compliance tracking" }
            ].map((st, i) => (
              <div key={i} className="flex-1 bg-[#FAF7F2] p-4 border border-[#D6C5AE] rounded-sm w-full">
                <div className="w-7 h-7 mx-auto rounded-full bg-[#8B3A3A] text-white flex items-center justify-center text-xs font-bold mb-2">
                  {st.step}
                </div>
                <div className="text-sm font-bold text-[#40372F]">{st.title}</div>
                <div className="text-xs text-[#40372F]/70 mt-1">{st.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="bg-[#E8DED0] border-t border-[#D6C5AE] py-8 text-[#40372F] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <div className="font-bold text-base">ComplianceTwin 360</div>
            <div className="text-xs text-[#A89580] mt-0.5">
              AICTE Hackathon 2025 Prototype Platform
            </div>
            <div className="text-xs text-[#40372F]/70 mt-2 max-w-md">
              Disclaimer: This application is a hackathon prototype demonstrating integrated approval workflow automation. It does not represent an officially deployed AICTE production portal.
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-medium">
            <Link to="/login?role=admin" className="hover:text-[#8B3A3A]">AICTE Admin Login</Link>
            <Link to="/login?role=institution" className="hover:text-[#8B3A3A]">Institution Login</Link>
            <Link to="/register-institution" className="hover:text-[#8B3A3A]">New Institution Registration</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

