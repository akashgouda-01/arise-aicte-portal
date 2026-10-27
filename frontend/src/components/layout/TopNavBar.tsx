import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  Bell,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  UserCheck,
  Sun,
  Building2,
  FileText,
  UserCheck2,
  LogOut,
  Menu,
} from 'lucide-react';

interface TopNavBarProps {
  onToggleMobileNav?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({ onToggleMobileNav }) => {
  const { currentUser, switchRole, availableUsers, signOut } = useAuth();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  const handleRoleSwitch = (role: UserRole) => {
    switchRole(role);
    setIsRoleModalOpen(false);
    if (role === 'INSTITUTION') navigate('/institution');
    else if (role === 'PROCESSING_OFFICER') navigate('/processing');
    else if (role === 'EVC_COMMITTEE_MEMBER' || role === 'EVC_MEMBER' || role === 'COMMITTEE_MEMBER') navigate('/inspections');
    else if (role === 'REGIONAL_OFFICER') navigate('/regional-management');
    else if (role === 'CENTRAL_DECISION_MAKER' || role === 'CENTRAL_OFFICER' || role === 'DECISION_MAKER') navigate('/central-oversight');
    else if (role === 'SYSTEM_ADMIN') navigate('/settings');
  };

  const getDashboardTag = (role: UserRole) => {
    switch (role) {
      case 'INSTITUTION':
        return 'Dashboard 1: Institution Portal';
      case 'PROCESSING_OFFICER':
        return 'Dashboard 2: Processing Workspace';
      case 'EVC_COMMITTEE_MEMBER':
      case 'EVC_MEMBER':
      case 'COMMITTEE_MEMBER':
        return 'Dashboard 3: Inspection & Committee (EVC + SAC/SHC)';
      case 'REGIONAL_OFFICER':
        return 'Dashboard 4: Regional Management';
      case 'CENTRAL_DECISION_MAKER':
      case 'CENTRAL_OFFICER':
      case 'DECISION_MAKER':
        return 'Dashboard 5: Central Oversight & Decision Authority';
      default:
        return 'Admin & Configuration';
    }
  };

  const toggleContrast = () => {
    setHighContrast(!highContrast);
    document.documentElement.classList.toggle('high-contrast');
  };

  return (
    <>
      {/* National Master Top Bar & Institutional Masthead */}
      <header className="w-full bg-[#123B32] text-white border-b border-[#DFE6E2]/20 shadow-sm z-30">
        {/* Utility Layer */}
        <div className="w-full bg-[#0B2924] px-3 sm:px-4 md:px-8 py-1 text-[10px] sm:text-[11px] text-[#DFE6E2] flex items-center justify-between border-b border-[#173830]">
          <div className="flex items-center gap-1.5 sm:gap-3 truncate">
            <span className="font-semibold text-white">Govt. of India</span>
            <span className="text-[#7da599]">|</span>
            <span className="hidden sm:inline font-medium">Ministry of Education</span>
            <span className="hidden sm:inline text-[#7da599]">|</span>
            <span className="text-neutral-300 truncate">AICTE Approval Portal</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <button
              onClick={toggleContrast}
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              <Sun className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">High Contrast</span>
            </button>
            <span className="text-[#7da599]">|</span>
            <span className="inline-flex items-center gap-1 text-emerald-300 font-mono text-[9px] sm:text-[10px]">
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">DSC Service: </span>Online
            </span>
          </div>
        </div>

        {/* Main Portal Header */}
        <div className="w-full px-3 sm:px-4 md:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Navigation Toggle Button */}
            {onToggleMobileNav && (
              <button
                type="button"
                onClick={onToggleMobileNav}
                className="md:hidden p-1.5 rounded hover:bg-[#0B2924] text-white transition-colors flex-shrink-0"
                aria-label="Open navigation menu"
                title="Open menu"
              >
                <Menu className="w-5 h-5 text-[#E5A900]" />
              </button>
            )}

            {/* Emblem */}
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-[#0B2924] border border-[#2b5349] flex items-center justify-center p-1 shadow-inner flex-shrink-0 cursor-pointer"
              onClick={() => navigate('/institution')}
            >
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#E5A900]" />
            </div>

            {/* Brand Title */}
            <div className="cursor-pointer min-w-0" onClick={() => navigate('/institution')}>
              <div className="text-xs sm:text-sm md:text-base font-bold text-white tracking-tight leading-tight truncate">
                AICTE Approval & Institutional Compliance Portal
              </div>
              <div className="hidden sm:block text-[10px] text-emerald-200 font-medium">
                Autonomous Apex Regulatory System • SIH26262
              </div>
            </div>
          </div>

          {/* Trailing User Actions & Switcher */}
          <div className="flex items-center gap-3 md:gap-5">
            <div className="hidden lg:flex items-center gap-3 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded bg-[#0B2924] text-[#ffdea3] border border-[#2b5349] font-medium">
                AY 2026-27
              </span>
              <span className="text-[#c1ecde] hover:text-white cursor-pointer px-1.5 py-1 transition-colors">
                Help & Support
              </span>
              <span className="text-[#c1ecde] hover:text-white cursor-pointer px-1.5 py-1 transition-colors">
                National Directory
              </span>
            </div>

            <div className="h-6 w-px bg-white/20 hidden lg:block"></div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 text-[#c1ecde] hover:text-white hover:bg-[#0B2924] rounded transition-colors relative"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping"></span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full"></span>
              </button>

              {/* Quick Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-2xl border border-gray-200 z-50 text-gray-800 p-3 text-xs">
                  <div className="font-semibold text-gray-900 border-b pb-2 mb-2 flex justify-between items-center">
                    <span>Recent Statutory Alerts</span>
                    <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">2 Urgent</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 bg-red-50 border-l-2 border-red-500 rounded text-gray-700">
                      <p className="font-semibold text-red-900">EVC Report Overdue (11 Days)</p>
                      <p className="text-[11px] text-gray-600 mt-0.5">R.K. Pharmacy Academy visit report awaiting lead expert upload.</p>
                    </div>
                    <div className="p-2 bg-amber-50 border-l-2 border-amber-500 rounded text-gray-700">
                      <p className="font-semibold text-amber-900">Fire Safety NOC Expiring</p>
                      <p className="text-[11px] text-gray-600 mt-0.5">NITS Bhopal Fire NOC expires in 18 days (2026-11-12).</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Authenticated Profile Block & Role Switcher Button */}
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="flex items-center gap-2 bg-[#0B2924] hover:bg-[#153e34] px-3 py-1.5 rounded border border-[#2b5349] transition-colors text-left"
              title="Click to switch role"
            >
              <div className="w-7 h-7 rounded-full bg-[#c9e9e1] text-[#00251d] font-bold flex items-center justify-center text-xs flex-shrink-0">
                {currentUser.avatarInitials}
              </div>
              <div className="hidden sm:block">
                <div className="text-[12px] font-semibold text-white leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-[#7da599] leading-tight">
                  {currentUser.designation}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-300 ml-1" />
            </button>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 bg-[#0B2924] hover:bg-[#184238] text-[#e0ece8] hover:text-white px-2.5 sm:px-3 py-1.5 rounded border border-[#2b5349] transition-colors text-xs font-semibold shadow-sm"
              title="Sign Out to Public Homepage"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Demo Role Switcher Modal (Consolidated 5 Stakeholder Roles) */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Simulated Role Switcher (5 Consolidated Roles)"
        subtitle="Per official Stakeholder Wise Analysis, the 8 operational stakeholders are consolidated into 5 primary role workspaces."
        maxWidth="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
          {availableUsers.map((user) => {
            const isSelected = user.role === currentUser.role;
            return (
              <div
                key={user.id}
                onClick={() => handleRoleSwitch(user.role)}
                className={`p-3.5 rounded border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#123B32] bg-emerald-50 ring-2 ring-[#123B32]/30 shadow-sm'
                    : 'border-gray-200 hover:border-emerald-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-[#123B32] text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {user.avatarInitials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-gray-900 leading-snug">{user.name}</div>
                    <div className="text-[11px] text-gray-600 font-medium leading-tight mt-0.5">{user.designation}</div>
                    <div className="text-[10px] text-gray-500 truncate mt-0.5">{user.organization}</div>
                    <div className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded inline-block mt-2">
                      {getDashboardTag(user.role)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Sign Out Footer */}
        <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-gray-500">Want to exit authenticated workspace?</span>
          <Button
            variant="outline"
            size="sm"
            icon={<LogOut className="w-4 h-4 text-rose-600" />}
            onClick={() => {
              setIsRoleModalOpen(false);
              handleSignOut();
            }}
            className="text-rose-700 border-rose-300 hover:bg-rose-50"
          >
            Sign Out to Home Page
          </Button>
        </div>
      </Modal>
    </>
  );
};
