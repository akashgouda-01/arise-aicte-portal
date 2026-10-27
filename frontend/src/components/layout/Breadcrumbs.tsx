import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Approval Operations Overview',
  institution: 'My Institution Portal',
  applications: 'Applications Directory',
  processing: 'Application Processing & Scrutiny',
  inspections: 'EVC & Committee Workspace',
  'regional-oversight': 'Regional & Central Oversight',
  'central-oversight': 'Central Oversight & Decision Authority',
  compliance: 'Compliance Evidence Intelligence (CEI)',
  'regulatory-changes': 'Regulatory Change Impact Engine',
  alerts: 'Alerts & Statutory Escalations',
  'audit-trail': 'National Digital Audit Trail',
  settings: 'System Configuration & Workflows',
};

export const Breadcrumbs: React.FC = () => {
  const { isInstitution } = useAuth();
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-[#61716B] mb-3">
      <Link to="/dashboard" className="flex items-center gap-1 hover:text-[#123B32] transition-colors">
        <Home className="w-3.5 h-3.5" />
        <span>AICTE Portal</span>
      </Link>
      {pathnames.map((segment, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        let label = ROUTE_LABELS[segment] || segment;
        if (segment === 'applications' && isInstitution) {
          label = 'My Applications';
        }

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-gray-400 flex-shrink-0" />
            {isLast ? (
              <span className="font-semibold text-[#172B26] truncate max-w-xs">{label}</span>
            ) : (
              <Link to={routeTo} className="hover:text-[#123B32] transition-colors truncate max-w-xs">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
