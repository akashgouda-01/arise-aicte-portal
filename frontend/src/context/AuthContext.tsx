import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { mockUsers } from '../data/mockData';

interface AuthContextType {
  currentUser: User;
  switchRole: (role: UserRole) => void;
  signOut: () => void;
  availableUsers: User[];
  isInstitution: boolean;
  isProcessingOfficer: boolean;
  isEVCMember: boolean;
  isCommitteeMember: boolean;
  isRegionalOfficer: boolean;
  isCentralOfficer: boolean;
  isDecisionMaker: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('aicte_demo_role');
    if (saved) {
      const match = mockUsers.find((u) => u.role === saved);
      if (match) return match;
    }
    return mockUsers[0]; // Default: Institution Principal Prof. Anand Verma
  });

  const switchRole = (role: UserRole) => {
    const user = mockUsers.find((u) => u.role === role);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('aicte_demo_role', role);
    }
  };

  const signOut = () => {
    localStorage.removeItem('aicte_demo_role');
    setCurrentUser(mockUsers[0]);
  };

  const isInstitution = currentUser.role === 'INSTITUTION';
  const isProcessingOfficer = currentUser.role === 'PROCESSING_OFFICER';
  const isEVCMember = currentUser.role === 'EVC_COMMITTEE_MEMBER' || currentUser.role === 'EVC_MEMBER';
  const isCommitteeMember = currentUser.role === 'EVC_COMMITTEE_MEMBER' || currentUser.role === 'COMMITTEE_MEMBER';
  const isRegionalOfficer = currentUser.role === 'REGIONAL_OFFICER';
  const isCentralOfficer = currentUser.role === 'CENTRAL_DECISION_MAKER' || currentUser.role === 'CENTRAL_OFFICER';
  const isDecisionMaker = currentUser.role === 'CENTRAL_DECISION_MAKER' || currentUser.role === 'DECISION_MAKER';
  const isAdmin = currentUser.role === 'SYSTEM_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        switchRole,
        signOut,
        availableUsers: mockUsers,
        isInstitution,
        isProcessingOfficer,
        isEVCMember,
        isCommitteeMember,
        isRegionalOfficer,
        isCentralOfficer,
        isDecisionMaker,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
