// App.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { HostelManagement } from './components/HostelManagement';
import { TenantManagement } from './components/TenantManagement';
import { ReportGenerator } from './components/ReportGenerator';
import { PaymentHistory } from './components/PaymentHistory';
import { RecordPayment } from './components/RecordPayment';
import { Vacancy } from './components/Vacancy';
import { AuditLog } from './components/AuditLog';
import { Login } from './components/Login';
import { dataService } from './services/storageService';
import { AppData, View } from './types';
import { Toast } from './components/common/Toast';
import { User } from 'firebase/auth';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [data, setData] = useState<AppData>({ hostels: {}, tenants: {}, payments: {}, auditLogs: [], reportHistory: {} });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auth state listener will handle setting the user
    const unsubscribe = dataService.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribe = dataService.listenToData((newData) => {
        if (newData) {
          setData(newData);
        } else {
           // Initialize data if null
           dataService.saveInitialDataStructure(user.email || 'system');
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSignOut = async () => {
    try {
      await dataService.signOut();
      setUser(null);
      setData({ hostels: {}, tenants: {}, payments: {}, auditLogs: [], reportHistory: {} });
    } catch (error) {
      showToast('Failed to sign out.', 'error');
    }
  };

  const renderView = () => {
    if (!user) return null;
    const props = { data, showToast, user };
    switch (currentView) {
      case 'dashboard':
        return <Dashboard data={data} />;
      case 'hostels':
        return <HostelManagement {...props} />;
      case 'tenants':
        return <TenantManagement {...props} />;
      case 'vacancy':
        return <Vacancy data={data} />;
      case 'reports':
        return <ReportGenerator {...props} />;
      case 'payments':
        return <PaymentHistory data={data} />;
      case 'record-payment':
        return <RecordPayment {...props} />;
      case 'audit':
        return <AuditLog data={data} />;
      default:
        return <Dashboard data={data} />;
    }
  };
  
  const NavLink: React.FC<{ view: View; label: string; icon: React.ReactElement }> = ({ view, label, icon }) => (
      <button
          onClick={() => setCurrentView(view)}
          className={`flex items-center w-full px-4 py-3 text-left transition-colors duration-200 rounded-lg ${
              currentView === view
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
      >
          {icon}
          <span className="ml-3">{label}</span>
      </button>
  );
  
  if (loading) {
      return <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">Loading...</div>;
  }

  return (
    <>
      {user ? (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
          <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r dark:border-gray-700 p-4 flex flex-col justify-between">
            <div>
                <div className="flex items-center mb-8">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1zm1 1v2h3V5H5zm8 0h3a1 1 0 011 1v2a1 1 0 01-1 1h-3a1 1 0 01-1-1V5a1 1 0 011-1zm1 1v2h3V5h-3zM4 11h3a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2a1 1 0 011-1zm1 1v2h3v-2H5zm8 0h3a1 1 0 011 1v2a1 1 0 01-1 1h-3a1 1 0 01-1-1v-2a1 1 0 011-1zm1 1v2h3v-2h-3z" clipRule="evenodd" />
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM2 10a8 8 0 1116 0 8 8 0 01-16 0z" />
                    </svg>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white ml-2">Hostel Hive</h1>
                </div>
                <nav className="space-y-2">
                     <NavLink view="dashboard" label="Dashboard" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>} />
                    <NavLink view="hostels" label="Hostel Mgmt" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
                    <NavLink view="tenants" label="Tenant Mgmt" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                    <NavLink view="vacancy" label="Vacancy" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>} />
                    <NavLink view="record-payment" label="Record Payment" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 8h6m-5 4h.01M4.93 19.07A10 10 0 1119.07 4.93 10 10 0 014.93 19.07zM15 9H9v6h6V9z" /></svg>} />
                    <NavLink view="payments" label="Payment History" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6a2 2 0 012-2h14a2 2 0 012 2v2H3V6z" /></svg>} />
                    <NavLink view="reports" label="AI Reports" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
                    <NavLink view="audit" label="Audit Log" icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
                </nav>
            </div>
            <div className="space-y-4">
                <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                    <p>Logged in as</p>
                    <p className="font-medium text-gray-700 dark:text-gray-200 truncate">{user.email}</p>
                </div>
                <button onClick={handleSignOut} className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 rounded-lg hover:bg-red-200 dark:hover:bg-red-800">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sign Out
                </button>
            </div>
          </aside>
          <main className="flex-1 p-6 md:p-8 overflow-y-auto relative">
            {renderView()}
          </main>
        </div>
      ) : (
        <Login />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
};

export default App;