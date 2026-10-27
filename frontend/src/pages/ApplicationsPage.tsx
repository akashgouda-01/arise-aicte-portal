import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Application } from '../types';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Search, ArrowUpRight, School, Building2 } from 'lucide-react';

export const ApplicationsPage: React.FC = () => {
  const { currentUser, isInstitution } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, regionFilter, stageFilter]);

  useEffect(() => {
    async function fetchApps() {
      try {
        setLoading(true);
        const params: Record<string, string> = {
          search,
          category: categoryFilter,
          stage: stageFilter,
        };

        // For institution user, strictly scope query to their own institution
        if (isInstitution) {
          params.institutionId = currentUser.institutionId || 'inst_01';
        } else if (regionFilter) {
          params.region = regionFilter;
        }

        const data = await api.getApplications(params);

        // Client-side isolation safeguard: ensure institution user cannot view other colleges
        if (isInstitution) {
          const targetInstId = currentUser.institutionId || 'inst_01';
          setApplications(data.filter((a) => a.institutionId === targetInstId));
        } else {
          setApplications(data);
        }
      } catch (err) {
        console.error('Failed to fetch applications', err);
      } finally {
        setLoading(false);
      }
    }
    fetchApps();
  }, [search, categoryFilter, regionFilter, stageFilter, isInstitution, currentUser]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded border border-[#DFE6E2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {isInstitution ? (
              <School className="w-5 h-5 text-[#123B32]" />
            ) : (
              <Building2 className="w-5 h-5 text-[#123B32]" />
            )}
            <h1 className="text-xl md:text-2xl font-bold text-[#172B26]">
              {isInstitution
                ? `My Applications — ${currentUser.organization || 'National Institute of Technology & Science (NITS Bhopal)'}`
                : 'Applications Directory'}
            </h1>
          </div>
          <p className="text-xs text-[#61716B] mt-1">
            {isInstitution
              ? 'Statutory applications and approval filings submitted by this institution for AY 2026-27.'
              : 'Central repository of all institutional approval applications across technical disciplines and regional offices.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">Academic Session: 2026-27</Badge>
          <Badge variant="progress">
            {applications.length} {applications.length === 1 ? 'Record' : 'Records'}
          </Badge>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card bodyClassName="p-4">
        <div className={`grid grid-cols-1 ${isInstitution ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-3 text-xs`}>
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={isInstitution ? 'Search by App No or Programme...' : 'Search by App No, Institute, Programme...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">All Categories</option>
              <option value="NEW_INSTITUTION">New Technical Institution</option>
              <option value="NEW_PROGRAMME">New Course / Programme Addition</option>
              <option value="EXTENSION_OF_APPROVAL">Extension of Approval (EoA)</option>
              <option value="CHANGE_MODIFICATION">Change in Site / Intake</option>
            </select>
          </div>

          {/* Region Filter - only visible for regulatory authority / officers, not institution */}
          {!isInstitution && (
            <div>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-emerald-600"
              >
                <option value="">All AICTE Regions</option>
                <option value="Central">Central (Bhopal)</option>
                <option value="Western">Western (Mumbai)</option>
                <option value="Southern">Southern (Chennai)</option>
                <option value="Eastern">Eastern (Kolkata)</option>
                <option value="Northern">Northern (Kanpur)</option>
                <option value="North-West">North-West (Chandigarh)</option>
                <option value="South-West">South-West (Bengaluru)</option>
                <option value="South-Central">South-Central (Hyderabad)</option>
              </select>
            </div>
          )}

          {/* Stage Filter */}
          <div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">All Workflow Stages</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="SCRUTINY">Digital Scrutiny</option>
              <option value="CLARIFICATION_REQUIRED">Clarification Required</option>
              <option value="RESUBMITTED">Clarification Resubmitted</option>
              <option value="EVC_REQUIRED">Marked for EVC</option>
              <option value="EVC_SCHEDULED">EVC Scheduled</option>
              <option value="REPORT_PENDING">EVC Report Pending</option>
              <option value="COMMITTEE_REVIEW">Committee Review (SHC)</option>
              <option value="DECISION_PENDING">Decision Pending</option>
              <option value="DEFICIENCY_COMMUNICATED">Deficiency Communicated</option>
              <option value="APPROVED">Approved (LoA Issued)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Applications Table */}
      <Card>
        {loading ? (
          <div className="py-12 text-center text-gray-500 text-xs">
            {isInstitution ? 'Loading institutional application dossiers...' : 'Loading applications directory...'}
          </div>
        ) : applications.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs">
            {isInstitution
              ? 'No applications found for your institution matching the selected criteria.'
              : 'No applications match the selected criteria.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DFE6E2] text-gray-500 font-semibold bg-gray-50/50">
                  <th className="py-3 px-3">Application Number</th>
                  <th className="py-3 px-3">Institution & Location</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Current Stage</th>
                  <th className="py-3 px-3">Stage Aging</th>
                  <th className="py-3 px-3">Target Date</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#123B32]">
                      <Link to={`/applications/${app.id}`} className="hover:underline">
                        {app.applicationNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-900">{app.institutionName}</div>
                      <div className="text-[10px] text-gray-500">
                        {app.district}, {app.state} ({app.region} Region)
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      <div>{app.categoryLabel}</div>
                      {app.programmeName && (
                        <div className="text-[10px] text-gray-400 truncate max-w-xs">{app.programmeName}</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={
                          app.isOverdue
                            ? 'error'
                            : app.currentStage === 'APPROVED'
                            ? 'success'
                            : app.currentStage === 'CLARIFICATION_REQUIRED'
                            ? 'warning'
                            : 'progress'
                        }
                      >
                        {app.stageLabel}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-semibold ${app.isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                        {app.daysInCurrentStage} days
                      </span>
                      {app.isOverdue && <span className="text-[10px] text-red-500 block font-bold">Overdue SLA</span>}
                    </td>
                    <td className="py-3 px-3 text-gray-600">{app.targetCompletionDate}</td>
                    <td className="py-3 px-3 text-right">
                      <Link to={`/applications/${app.id}`}>
                        <Button size="sm" variant="ghost" icon={<ArrowUpRight className="w-3.5 h-3.5" />}>
                          View Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Clean Pagination Footer */}
            {applications.length > pageSize && (
              <div className="px-4 py-3 border-t border-[#DFE6E2] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-500">
                <div>
                  Showing <span className="font-semibold text-gray-800">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-semibold text-gray-800">
                    {Math.min(currentPage * pageSize, applications.length)}
                  </span>{' '}
                  of <span className="font-semibold text-gray-800">{applications.length}</span> applications
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="px-2 py-1 font-semibold text-gray-700">
                    Page {currentPage} of {Math.ceil(applications.length / pageSize) || 1}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={currentPage === Math.ceil(applications.length / pageSize)}
                    onClick={() => setCurrentPage((p) => Math.min(Math.ceil(applications.length / pageSize), p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
