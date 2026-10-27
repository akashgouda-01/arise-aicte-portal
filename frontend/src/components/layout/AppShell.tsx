import React, { useState } from 'react';
import { TopNavBar } from './TopNavBar';
import { SideNavBar } from './SideNavBar';
import { Breadcrumbs } from './Breadcrumbs';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-[#F5F7F6] overflow-hidden">
      <TopNavBar onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)} />
      <div className="flex-1 flex overflow-hidden relative">
        <SideNavBar
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />
        <main className="flex-1 overflow-y-auto px-2.5 sm:px-4 md:px-8 py-3.5 sm:py-6">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

