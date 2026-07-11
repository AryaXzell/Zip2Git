/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { Layout } from './layouts/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { SettingsPage } from './pages/Settings';
import { ActiveSession } from './pages/ActiveSession';
import { AboutPage } from './pages/About';
import { LegalPage } from './pages/Legal';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sesi" element={<ActiveSession />} />
            <Route path="/tentang" element={<AboutPage />} />
            <Route path="/pengaturan" element={<SettingsPage />} />
            <Route path="/legal" element={<LegalPage />} />
            {/* Fallback to Home if unknown route */}
            <Route path="*" element={<Home />} />
          </Routes>
        </Layout>
      </HashRouter>
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          className: 'dark:bg-slate-900 dark:text-white dark:border dark:border-slate-800 text-sm font-sans',
          duration: 3500,
        }} 
      />
    </AppProvider>
  );
}
