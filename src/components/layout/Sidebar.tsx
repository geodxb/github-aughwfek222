import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, DollarSign, MessageSquare, Settings, LogOut, Shield, BarChart3, FileText, TrendingUp, ChevronDown, ChevronRight, Activity, AlertTriangle, Eye, CreditCard, Building, Zap, Target, Award, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = (menuName) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  const adminMenuItems = [
    { name: 'DASHBOARD', path: '/admin', icon: Home },
    {
      name: 'USERS',
      icon: Users,
      submenu: [
        { name: 'All Users', path: '/admin/users', icon: Users },
        { name: 'Investors', path: '/admin/investors', icon: TrendingUp },
        { name: 'Governors', path: '/admin/governors', icon: Shield },
      ]
    },
    {
      name: 'ANALYTICS',
      icon: BarChart3,
      submenu: [
        { name: 'Overview', path: '/admin/analytics', icon: Activity },
        { name: 'Performance', path: '/admin/performance', icon: TrendingUp },
        { name: 'Reports', path: '/admin/reports', icon: FileText },
      ]
    },
    {
      name: 'FINANCE',
      icon: DollarSign,
      submenu: [
        { name: 'Transactions', path: '/admin/transactions', icon: CreditCard },
        { name: 'Withdrawals', path: '/admin/withdrawals', icon: DollarSign },
        { name: 'Revenue', path: '/admin/revenue', icon: TrendingUp },
      ]
    },
    { name: 'MESSAGES', path: '/admin/messages', icon: MessageSquare },
    { name: 'SETTINGS', path: '/admin/settings', icon: Settings },
  ];

  const investorMenuItems = [
    { name: 'DASHBOARD', path: '/investor', icon: Home },
    { name: 'PORTFOLIO', path: '/investor/portfolio', icon: BarChart3 },
    { name: 'INVESTMENTS', path: '/investor/investments', icon: TrendingUp },
    { name: 'TRANSACTIONS', path: '/investor/transactions', icon: CreditCard },
    { name: 'WITHDRAWALS', path: '/investor/withdrawals', icon: DollarSign },
    { name: 'MESSAGES', path: '/investor/messages', icon: MessageSquare },
    { name: 'PROFILE', path: '/investor/profile', icon: Users },
  ];

  const governorMenuItems = [
    { name: 'DASHBOARD', path: '/governor', icon: Shield },
    { name: 'INVESTORS', path: '/governor/investors', icon: Users },
    { name: 'WITHDRAWALS', path: '/governor/withdrawals', icon: DollarSign },
    { name: 'APPLICATIONS', path: '/governor/account-requests', icon: UserCheck },
    { name: 'MESSAGES', path: '/governor/messages', icon: MessageSquare },
  ];

  const getMenuItems = () => {
    switch (user?.role) {
      case 'admin':
        return adminMenuItems;
      case 'investor':
        return investorMenuItems;
      case 'governor':
        return governorMenuItems;
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isParentActive = (submenu) => {
    return submenu?.some(item => location.pathname === item.path);
  };

  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className={`bg-gradient-to-b from-gray-900 to-gray-800 text-white h-screen fixed left-0 top-0 z-50 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } shadow-2xl border-r border-gray-700`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                NEXUS
              </span>
            </motion.div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ChevronRight className={`w-5 h-5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 border-b border-gray-700"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium text-sm">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role || 'Role'}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item, index) => (
          <div key={item.name}>
            {item.submenu ? (
              <div>
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                    isParentActive(item.submenu)
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg'
                      : 'hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5" />
                    {!isCollapsed && <span className="font-medium text-sm">{item.name}</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedMenus[item.name] ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>
                
                <AnimatePresence>
                  {expandedMenus[item.name] && !isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-4 mt-2 space-y-1"
                    >
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 ${
                            isActive(subItem.path)
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg'
                              : 'hover:bg-gray-700'
                          }`}
                        >
                          <subItem.icon className="w-4 h-4" />
                          <span className="text-sm">{subItem.name}</span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg'
                    : 'hover:bg-gray-700'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {!isCollapsed && <span className="font-medium text-sm">{item.name}</span>}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-600 transition-all duration-200 text-red-400 hover:text-white"
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="font-medium text-sm">LOGOUT</span>}
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;