import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppShell } from './components/layout/AppShell';

import { CentralOversightPage } from './pages/CentralOversightPage';
import { RegionalManagementPage } from './pages/RegionalManagementPage';
import { InstitutionPortalPage } from './pages/InstitutionPortalPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { ApplicationDetailPage } from './pages/ApplicationDetailPage';
import { ProcessingPage } from './pages/ProcessingPage';
import { InspectionsPage } from './pages/InspectionsPage';
import { CompliancePage } from './pages/CompliancePage';
import { RegulatoryChangesPage } from './pages/RegulatoryChangesPage';
import { AlertsPage } from './pages/AlertsPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { NewApplicationPage } from './pages/NewApplicationPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Government Landing Page */}
            <Route path="/" element={<HomePage />} />

            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Create New Application Workflow */}
            <Route
              path="/institution/applications/new"
              element={
                <AppShell>
                  <NewApplicationPage />
                </AppShell>
              }
            />

            {/* Dashboard 1 — Institution Portal */}
            <Route
              path="/institution"
              element={
                <AppShell>
                  <InstitutionPortalPage />
                </AppShell>
              }
            />

            {/* Dashboard 2 — Application Processing Workspace */}
            <Route
              path="/processing"
              element={
                <AppShell>
                  <ProcessingPage />
                </AppShell>
              }
            />

            {/* Dashboard 3 — Inspection & Committee Workspace */}
            <Route
              path="/inspections"
              element={
                <AppShell>
                  <InspectionsPage />
                </AppShell>
              }
            />

            {/* Dashboard 4 — Regional Management Dashboard */}
            <Route
              path="/regional-management"
              element={
                <AppShell>
                  <RegionalManagementPage />
                </AppShell>
              }
            />
            <Route
              path="/regional-oversight"
              element={
                <AppShell>
                  <RegionalManagementPage />
                </AppShell>
              }
            />

            {/* Dashboard 5 — Central Oversight & Decision Workspace */}
            <Route
              path="/central-oversight"
              element={
                <AppShell>
                  <CentralOversightPage />
                </AppShell>
              }
            />
            <Route
              path="/dashboard"
              element={
                <AppShell>
                  <CentralOversightPage />
                </AppShell>
              }
            />

            {/* Supporting Area — Admin & Configuration */}
            <Route
              path="/settings"
              element={
                <AppShell>
                  <SettingsPage />
                </AppShell>
              }
            />

            {/* Advanced Novelty & Core Systems */}
            <Route
              path="/applications"
              element={
                <AppShell>
                  <ApplicationsPage />
                </AppShell>
              }
            />
            <Route
              path="/applications/:id"
              element={
                <AppShell>
                  <ApplicationDetailPage />
                </AppShell>
              }
            />

            <Route
              path="/compliance"
              element={
                <AppShell>
                  <CompliancePage />
                </AppShell>
              }
            />
            <Route
              path="/compliance/:id"
              element={
                <AppShell>
                  <CompliancePage />
                </AppShell>
              }
            />

            <Route
              path="/regulatory-changes"
              element={
                <AppShell>
                  <RegulatoryChangesPage />
                </AppShell>
              }
            />

            <Route
              path="/alerts"
              element={
                <AppShell>
                  <AlertsPage />
                </AppShell>
              }
            />

            <Route
              path="/audit-trail"
              element={
                <AppShell>
                  <AuditTrailPage />
                </AppShell>
              }
            />

            {/* Default fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
