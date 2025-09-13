import { Routes, Route, Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { FirestoreService } from './services/firestoreService';
import LoadingScreen from './components/common/LoadingScreen';
import PinEntryScreen from './pages/auth/PinEntryScreen';
import { AlertTriangle } from 'lucide-react';

// Import components directly to avoid lazy loading issues
import AdminLogin from './pages/auth/AdminLogin';
import InvestorLogin from './pages/auth/InvestorLogin';
import AffiliateLogin from './pages/auth/AffiliateLogin';
import AdminDashboard from './pages/admin/Dashboard';
import InvestorDashboard from './pages/investor/Dashboard';
import WithdrawalsPage from './pages/admin/WithdrawalsPage';
import InvestorsListPage from './pages/admin/InvestorsList';
import MessagesPage from './pages/admin/MessagesPage';
import SettingsPage from './pages/admin/SettingsPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import CommissionsPage from './pages/admin/CommissionsPage';
import TransactionsPage from './pages/admin/TransactionsPage';
import PerformanceReportsPage from './pages/admin/PerformanceReportsPage';
import InvestorProfile from './pages/admin/InvestorProfile';
import ProtectedRoute from './components/auth/ProtectedRoute';
import GovernorDashboard from './pages/governor/Dashboard';
import GovernorInvestorsPage from './pages/governor/InvestorsPage';
import GovernorWithdrawalsPage from './pages/governor/WithdrawalsPage';
import GovernorInvestorProfile from './pages/governor/InvestorProfile';
import GovernorMessagesPage from './pages/governor/MessagesPage';
import AccountCreationRequests from './pages/governor/AccountCreationRequests';
import GovernorSecurityPage from './pages/governor/SecurityPage';
import GovernorLogsPage from './pages/governor/LogsPage';
import GovernorConfigPage from './pages/governor/ConfigPage';
import GovernorAccountManagementPage from './pages/governor/AccountManagementPage';
import GovernorDeletionApprovalsPage from './pages/governor/DeletionApprovalsPage';
import GovernorDatabasePage from './pages/governor/DatabasePage';
import GovernorSystemMonitoringPage from './pages/governor/SystemMonitoringPage';
import GovernorSystemControlsPage from './pages/governor/SystemControlsPage';
import GovernorSupportTicketsPage from './pages/governor/SupportTicketsPage';
import ShadowBanCheck from './components/investor/ShadowBanCheck';
import EnhancedMessagesPage from './pages/admin/EnhancedMessagesPage';
import GovernorEnhancedMessagesPage from './pages/governor/EnhancedMessagesPage';

function App() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // ALL HOOKS MUST BE DECLARED AT THE TOP LEVEL - NO CONDITIONAL HOOKS
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [pinAuthenticated, setPinAuthenticated] = useState(false);
  const [loginRedirectPath, setLoginRedirectPath] = useState<string>('');
  
  console.log('🔄 App rendering - User:', user?.email || 'Not logged in', 'Loading:', isLoading);

  // Check if PIN has been entered (stored in sessionStorage)
  useEffect(() => {
    const pinAuth = sessionStorage.getItem('pin_authenticated');
    const redirectPath = sessionStorage.getItem('login_redirect_path');
    if (pinAuth === 'true') {
      setPinAuthenticated(true);
      if (redirectPath) {
        setLoginRedirectPath(redirectPath);
        sessionStorage.removeItem('login_redirect_path'); // Clean up after use
      }
    }
  }, []);

  // Load system settings to check maintenance mode
  useEffect(() => {
    const loadSystemSettings = async () => {
      try {
        console.log('🔧 Loading system settings for maintenance check...');
        const settings = await FirestoreService.getSystemSettings();
        console.log('🔧 System settings loaded:', settings);
        setSystemSettings(settings);
      } catch (error) {
        console.error('Error loading system settings:', error);
        // Set default settings if loading fails
        setSystemSettings({ maintenanceMode: false });
      } finally {
        setSettingsLoading(false);
      }
    };

    // Load settings immediately, don't wait for auth
    loadSystemSettings();
  }, []);

  // Set up real-time listener for system settings
  useEffect(() => {
    console.log('🔄 Setting up real-time listener for system settings...');
    const unsubscribe = FirestoreService.subscribeToSystemSettings((settings) => {
      console.log('🔄 Real-time update: System settings changed:', settings);
      setSystemSettings(settings);
    });

    return () => {
      console.log('🔄 Cleaning up system settings listener');
      unsubscribe();
    };
  }, []);

  // Handle redirect after PIN authentication
  useEffect(() => {
    if (pinAuthenticated && loginRedirectPath) {
      console.log('🔄 Redirecting to:', loginRedirectPath);
      // Use window.location for more reliable navigation
      window.location.href = loginRedirectPath;
    }
  }, [pinAuthenticated, loginRedirectPath, navigate]);

  // Show loading screen while auth is initializing
  if (isLoading || settingsLoading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  // Show PIN entry screen if not authenticated
  // Check sessionStorage directly here to ensure state is always in sync with persistence
  const isPinAuthenticatedInSession = sessionStorage.getItem('pin_authenticated') === 'true';

  if (!pinAuthenticated && !isPinAuthenticatedInSession) {
    return <PinEntryScreen onAuthenticated={(targetPath) => {
      setPinAuthenticated(true);
      if (targetPath) {
        setLoginRedirectPath(targetPath);
        sessionStorage.setItem('login_redirect_path', targetPath);
      }
    }} />;
  }

  // Show maintenance screen for non-Governor users when maintenance mode is active
  if (systemSettings?.maintenanceMode && user?.role !== 'governor') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-gray-300 shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 border border-red-300 rounded-lg flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
            SYSTEM MAINTENANCE
          </h1>
          <p className="text-gray-700 mb-6 uppercase tracking-wide text-sm font-medium">
            {systemSettings.maintenanceMessage || 'System is under maintenance. Please try again later.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide"
          >
            REFRESH PAGE
          </button>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-100">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            user ? (
              user.role === 'governor' ? <Navigate to="/governor" replace /> :
              user.role === 'admin' ? <Navigate to="/admin" replace /> : 
              user.role === 'investor' ? <Navigate to="/investor" replace /> :
              <AdminLogin />
            ) : (
              <AdminLogin />
            )
          } />
        
          <Route path="/investor-login" element={
            user ? (
              user.role === 'governor' ? <Navigate to="/governor" replace /> :
              user.role === 'admin' ? <Navigate to="/admin" replace /> : 
              user.role === 'investor' ? <Navigate to="/investor" replace /> :
              <InvestorLogin />
            ) : (
              <InvestorLogin />
            )
          } />
        
          <Route path="/affiliate-login" element={
            user ? (
              user.role === 'governor' ? <Navigate to="/governor" replace /> :
              user.role === 'admin' ? <Navigate to="/admin" replace /> : 
              user.role === 'investor' ? <Navigate to="/investor" replace /> :
              <AffiliateLogin />
            ) : (
              <AffiliateLogin />
            )
          } />
        
          {/* Protected admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
        
          <Route path="/admin/withdrawals" element={
            <ProtectedRoute role="admin">
              <WithdrawalsPage />
            </ProtectedRoute>
          } />
        
          <Route path="/admin/investors" element={
            <ProtectedRoute role="admin">
              <InvestorsListPage />
            </ProtectedRoute>
          } />
        
          <Route path="/admin/messages" element={
            <ProtectedRoute role="admin">
              <EnhancedMessagesPage />
            </ProtectedRoute>
          } />
        
          <Route path="/admin/settings" element={
            <ProtectedRoute role="admin">
              <SettingsPage />
            </ProtectedRoute>
          } />
        
          <Route path="/admin/analytics" element={
            <ProtectedRoute role="admin">
              <AnalyticsPage />
            </ProtectedRoute>
          } />
        
          <Route path="/admin/commissions" element={
            <ProtectedRoute role="admin">
              <CommissionsPage />
            </ProtectedRoute>
          } />
        
          <Route path="/admin/transactions" element={
            <ProtectedRoute role="admin">
              <TransactionsPage />
            </ProtectedRoute>
          } />
        
          <Route path="/admin/performance-reports" element={
            <ProtectedRoute role="admin">
              <PerformanceReportsPage />
            </ProtectedRoute>
          } />
        
          <Route path="/admin/investor/:id" element={
            <ProtectedRoute role="admin">
              <InvestorProfile />
            </ProtectedRoute>
          } />
        
          {/* Protected governor routes */}
          <Route path="/governor" element={
            <ProtectedRoute role="governor">
              <GovernorDashboard />
            </ProtectedRoute>
          } />
        
          <Route path="/governor/investors" element={
            <ProtectedRoute role="governor">
              <GovernorInvestorsPage />
            </ProtectedRoute>
          } />
        
          <Route path="/governor/withdrawals" element={
            <ProtectedRoute role="governor">
              <GovernorWithdrawalsPage />
            </ProtectedRoute>
          } />
        
          <Route path="/governor/messages" element={
            <ProtectedRoute role="governor">
              <GovernorEnhancedMessagesPage />
            </ProtectedRoute>
          } />
        
          <Route path="/governor/account-requests" element={
            <ProtectedRoute role="governor">
              <AccountCreationRequests />
            </ProtectedRoute>
          } />
        
          <Route path="/governor/security" element={
            <ProtectedRoute role="governor">
              <GovernorSecurityPage />
            </ProtectedRoute>
          } />
        
          <Route path="/governor/logs" element={
            <ProtectedRoute role="governor">
              <GovernorLogsPage />
            </ProtectedRoute>
          } />
        
          <Route path="/governor/config" element={
            <ProtectedRoute role="governor">
              <GovernorConfigPage />
            </ProtectedRoute>
          } />
        
          <Route path="/governor/deletion-approvals" element={
            <ProtectedRoute role="governor">
              <GovernorDeletionApprovalsPage />
            </ProtectedRoute>
          } />
        
          <Route path="/governor/account-management" element={
            <ProtectedRoute role="governor">
              <GovernorAccountManagementPage />
            </ProtectedRoute>
          } />
        
          <Route path="/governor/database" element={
            <ProtectedRoute role="governor">
              <GovernorDatabasePage />
            </ProtectedRoute>
          } />
        
          <Route path="/governor/system-monitoring" element={
            <ProtectedRoute role="governor">
              <GovernorSystemMonitoringPage />
            </ProtectedRoute>
          } />
        
          <Route path="/governor/system-controls" element={
            <ProtectedRoute role="governor">
              <GovernorSystemControlsPage />
            </ProtectedRoute>
          } />
        
          <Route path="/governor/support-tickets" element={
            <ProtectedRoute role="governor">
              <GovernorSupportTicketsPage />
            </ProtectedRoute>
          } />
        
          <Route path="/governor/investor/:id" element={
            <ProtectedRoute role="governor">
              <GovernorInvestorProfile />
            </ProtectedRoute>
          } />
        
          {/* Protected investor routes */}
          <Route path="/investor" element={
            <ProtectedRoute role="investor">
              <ShadowBanCheck>
                <InvestorDashboard />
              </ShadowBanCheck>
            </ProtectedRoute>
          } />
        
          {/* Root redirect */}
          <Route path="/" element={
            !pinAuthenticated ? (
              <PinEntryScreen onAuthenticated={(targetPath) => {
                setPinAuthenticated(true);
                if (targetPath) {
                  setLoginRedirectPath(targetPath);
                  sessionStorage.setItem('login_redirect_path', targetPath);
                }
              }} />
            ) : user ? (
              user.role === 'governor' ? <Navigate to="/governor" replace /> :
              user.role === 'admin' ? <Navigate to="/admin" replace /> : 
              user.role === 'investor' ? <Navigate to="/investor" replace /> :
              <Navigate to="/login" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } />
        
          {/* Catch-all route */}
          <Route path="*" element={
            !pinAuthenticated ? (
              <PinEntryScreen onAuthenticated={(targetPath) => {
                setPinAuthenticated(true);
                if (targetPath) {
                  setLoginRedirectPath(targetPath);
                  sessionStorage.setItem('login_redirect_path', targetPath);
                }
              }} />
            ) : user ? (
              user.role === 'governor' ? <Navigate to="/governor" replace /> :
              user.role === 'admin' ? <Navigate to="/admin" replace /> : 
              user.role === 'investor' ? <Navigate to="/investor" replace /> :
              <Navigate to="/login" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } />
        </Routes>
      </div>
  );
}

export default App;