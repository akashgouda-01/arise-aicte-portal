import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Building2, ShieldCheck, UserCheck2, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { availableUsers, switchRole } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole>('INSTITUTION');

  const handleLogin = (role: UserRole) => {
    switchRole(role);
    if (role === 'INSTITUTION') {
      navigate('/institution');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7F6] flex flex-col justify-between">
      {/* Top Bar */}
      <header className="w-full bg-[#123B32] text-white px-4 md:px-8 py-3 flex items-center justify-between border-b border-[#DFE6E2]/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#0B2924] border border-[#2b5349] flex items-center justify-center p-1">
            <Building2 className="w-6 h-6 text-[#E5A900]" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">
              AICTE Centralized Approval & Institutional Compliance Portal
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto w-full px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#172B26]">
            SIH26262 Demonstration & Scrutiny Portal
          </h2>
          <p className="text-xs text-[#61716B] mt-1 max-w-lg mx-auto">
            Select a verified stakeholder persona to log in and inspect the platform from their specific regulatory authority scope.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {availableUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleLogin(user.role)}
              className="bg-white p-4 rounded-lg border border-[#DFE6E2] shadow-sm hover:border-[#123B32] hover:shadow-md cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#123B32] text-white font-bold flex items-center justify-center text-sm flex-shrink-0 group-hover:bg-[#0B2924]">
                  {user.avatarInitials}
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900 group-hover:text-[#123B32]">
                    {user.name}
                  </div>
                  <div className="text-[11px] text-gray-600 font-medium">{user.designation}</div>
                  <div className="text-[10px] text-emerald-800 font-bold uppercase mt-0.5">
                    Role: {user.role.replace('_', ' ')}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#123B32] group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-[#0B2924] text-[#DFE6E2] text-center py-4 text-xs">
        <p>All India Council for Technical Education • Ministry of Education, Government of India</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Smart India Hackathon Problem Statement SIH26262 Demo Prototype</p>
      </footer>
    </div>
  );
};
