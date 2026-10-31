import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { apiFetch } from '../services/api';
import { FileText, ArrowRight, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const NewApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>('Introduction of a New Course or Programme');
  const [title, setTitle] = useState<string>('Introduction of M.Tech in Cyber Security');
  const [academicYear, setAcademicYear] = useState<string>('2025-2026');
  const [description, setDescription] = useState<string>('Proposal for commencing a postgraduate program with 24 seats in response to regional industry demand.');
  const [programme, setProgramme] = useState<string>('Engineering & Technology');
  const [courseName, setCourseName] = useState<string>('M.Tech in Cyber Security');
  const [intake, setIntake] = useState<number>(24);
  const [facilityDetails, setFacilityDetails] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handlePredefinedScenario = (scenarioType: string) => {
    if (scenarioType === 'new_course') {
      setCategory('Introduction of a New Course or Programme');
      setTitle('Introduction of B.Tech in Data Science');
      setProgramme('Engineering & Technology');
      setCourseName('B.Tech in Data Science');
      setIntake(60);
      setDescription('Proposal to introduce a 4-year undergraduate B.Tech program in Data Science with modern computing laboratories.');
      setFacilityDetails('');
    } else if (scenarioType === 'facility') {
      setCategory('Infrastructure or Facility Request');
      setTitle('Proposed Central Robotics & AI Lab Setup');
      setProgramme('Engineering & Technology');
      setCourseName('');
      setIntake(0);
      setDescription('Proposal for constructing and outfitting a high-performance robotics laboratory in Block B.');
      setFacilityDetails('2,800 sq ft dedicated laboratory with 60 industrial simulation workstations and high-speed fiber backbone.');
    } else if (scenarioType === 'eoa') {
      setCategory('Extension of Approval');
      setTitle('Extension of Approval for Existing Degree Programs (2025-26)');
      setProgramme('Technical Campus');
      setCourseName('');
      setIntake(0);
      setDescription('Annual extension request confirming adherence to faculty cadre, pay scale, and campus safety norms.');
      setFacilityDetails('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        category,
        academic_year: academicYear,
        title,
        description,
        programme,
        proposed_course_name: category.includes('Course') ? courseName : undefined,
        proposed_intake: category.includes('Course') || category.includes('Intake') ? intake : undefined,
        facility_details: category.includes('Facility') ? facilityDetails : undefined,
      };

      const res = await apiFetch('/applications', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Redirect immediately to application details to view checklist
      navigate(`/institution/applications/${res.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout portalType="INSTITUTION">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-[#FFFEFC] p-6 border border-[#D6C5AE] rounded-sm shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-[#40372F] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#8B3A3A]" /> Register New AICTE Application
              </h1>
              <p className="text-xs text-[#A89580] mt-1">
                Submissions automatically initialize the regulatory checklist and appear directly in the AICTE Admin Bureau queue.
              </p>
            </div>
          </div>

          {/* Quick Scenario Fill Buttons */}
          <div className="mt-4 p-3 bg-[#FAF7F2] border border-[#D6C5AE] rounded-sm">
            <span className="block text-xs font-bold uppercase tracking-wider text-[#A89580] mb-2">
              Demonstration Scenarios (Click to auto-fill realistic AICTE applications):
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => handlePredefinedScenario('new_course')}
                className="px-3 py-1.5 bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm hover:bg-[#E8DED0] text-[#40372F] font-semibold transition cursor-pointer"
              >
                1. New Course: B.Tech Data Science
              </button>
              <button
                type="button"
                onClick={() => handlePredefinedScenario('facility')}
                className="px-3 py-1.5 bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm hover:bg-[#E8DED0] text-[#40372F] font-semibold transition cursor-pointer"
              >
                2. Facility Request: Central Robotics & AI Lab
              </button>
              <button
                type="button"
                onClick={() => handlePredefinedScenario('eoa')}
                className="px-3 py-1.5 bg-[#FFFEFC] border border-[#D6C5AE] rounded-sm hover:bg-[#E8DED0] text-[#40372F] font-semibold transition cursor-pointer"
              >
                3. Extension of Approval (EoA 2025-26)
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-[#B33A3A]/10 border border-[#B33A3A] rounded-sm text-xs text-[#B33A3A] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#FFFEFC] p-8 border border-[#D6C5AE] rounded-sm shadow-xs space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-[#40372F]">Application Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-sm text-[#40372F] focus:outline-none focus:ring-1 focus:ring-[#8B3A3A]"
              >
                <option value="Introduction of a New Course or Programme">Introduction of a New Course or Programme</option>
                <option value="Infrastructure or Facility Request">Infrastructure or Facility Request</option>
                <option value="Extension of Approval">Extension of Approval</option>
                <option value="Increase in Intake">Increase in Intake</option>
                <option value="New Institution">New Institution</option>
              </select>
              <span className="text-[11px] text-[#A89580] mt-1 block">
                Workflow route and mandatory document checklists will configure dynamically.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-[#40372F]">Academic Year *</label>
              <input
                type="text"
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="mt-1.5 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-sm text-[#40372F]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-[#40372F]">Application Proposal Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Introduction of B.Tech in Computer Science & Engineering"
              className="mt-1.5 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-sm text-[#40372F]"
            />
          </div>

          {/* Category-Specific Dynamic Fields */}
          {category === 'Introduction of a New Course or Programme' && (
            <div className="p-4 bg-[#FAF7F2] border border-[#D6C5AE] rounded-sm space-y-4">
              <div className="text-xs font-bold text-[#263B50] uppercase tracking-wider">
                New Course Proposal Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#40372F]">Proposed Course Name *</label>
                  <input
                    type="text"
                    required
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FFFEFC] text-sm text-[#40372F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#40372F]">Proposed Sanctioned Intake *</label>
                  <input
                    type="number"
                    required
                    min={15}
                    max={240}
                    value={intake}
                    onChange={(e) => setIntake(parseInt(e.target.value) || 0)}
                    className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FFFEFC] text-sm text-[#40372F]"
                  />
                </div>
              </div>
            </div>
          )}

          {category === 'Infrastructure or Facility Request' && (
            <div className="p-4 bg-[#FAF7F2] border border-[#D6C5AE] rounded-sm space-y-2">
              <div className="text-xs font-bold text-[#263B50] uppercase tracking-wider">
                Proposed Infrastructure Specifications
              </div>
              <label className="block text-xs font-semibold text-[#40372F]">
                Laboratory or Facility Floor Plan & Equipment Specs *
              </label>
              <textarea
                required
                rows={3}
                value={facilityDetails}
                onChange={(e) => setFacilityDetails(e.target.value)}
                placeholder="Detail the room area, planned workstations, network topology, and electrical safety installations..."
                className="mt-1 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FFFEFC] text-sm text-[#40372F]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-[#40372F]">General Description & Rationale</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full px-3 py-2 border border-[#D6C5AE] rounded-sm bg-[#FAF7F2] text-sm text-[#40372F]"
            />
          </div>

          <div className="border-t border-[#D6C5AE] pt-4">
            <div className="flex items-start gap-2 text-xs text-[#A89580] mb-4">
              <Info className="w-4 h-4 text-[#263B50] shrink-0 mt-0.5" />
              <span>
                By submitting this form, a unique Application ID is generated in PostgreSQL. The system will initialize your category-specific document checklist where you can upload verified files.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#8B3A3A] hover:bg-[#732F2F] text-white font-semibold rounded-sm text-sm transition cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Creating Application...' : 'Register Application & Open Document Checklist'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

