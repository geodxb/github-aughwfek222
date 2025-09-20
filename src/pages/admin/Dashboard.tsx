import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import TradingViewChart from '../../components/common/TradingViewChart';
import TradingViewTickerTape from '../../components/common/TradingViewTickerTape';
import InvestorOnboardingFlow from '../../components/onboarding/InvestorOnboardingFlow';
import { useInvestors, useWithdrawalRequests, useTransactions } from '../../hooks/useFirestore';
import { 
  Settings,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, setGlobalLoading } = useAuth();
  const [onboardingFlowOpen, setOnboardingFlowOpen] = useState(false);
  const { investors } = useInvestors();
  const { withdrawalRequests } = useWithdrawalRequests();
  const { transactions } = useTransactions();
  
  // Calculate metrics from real data
  // Calculate total AUM from current balances (this reflects all deposits, earnings, and withdrawals)
  const totalAssets = investors.reduce((sum, investor) => sum + (investor.currentBalance || 0), 0);
  const totalInvestors = investors.length;
  const activeInvestors = investors.filter(inv => !inv.accountStatus?.includes('Closed')).length;
  const pendingWithdrawals = withdrawalRequests.filter(req => req.status === 'Pending').length;
  const pendingWithdrawalAmount = withdrawalRequests
    .filter(req => req.status === 'Pending')
    .reduce((sum, req) => sum + req.amount, 0);
  
  // Calculate transaction-based totals for verification
  const totalWithdrawalsProcessed = Math.abs(transactions
    .filter(tx => tx.type === 'Withdrawal' && tx.status === 'Completed')
    .reduce((sum, tx) => sum + tx.amount, 0));
  
  const totalDeposits = transactions
    .filter(tx => tx.type === 'Deposit' && tx.status === 'Completed')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  // Calculate total earnings from transactions
  const totalEarnings = investors.reduce((sum, investor) => {
    const earnings = investor.currentBalance - investor.initialDeposit;
    return sum + (earnings > 0 ? earnings : 0);
  }, 0);
  
  // Verify AUM calculation consistency
  console.log(`📊 AUM Verification: Current balances total = $${totalAssets.toLocaleString()}`);
  console.log(`📊 Transaction verification: Deposits = $${totalDeposits.toLocaleString()}, Withdrawals = $${totalWithdrawalsProcessed.toLocaleString()}`);
  console.log(`📊 Net flow = $${(totalDeposits - totalWithdrawalsProcessed).toLocaleString()}`);
  
  const averageROI = totalDeposits > 0 ? ((totalEarnings / totalDeposits) * 100) : 0;
  
  // Performance metrics for circular charts
  const profitableInvestors = investors.filter(inv => inv.currentBalance > inv.initialDeposit).length;
  const unprofitableInvestors = totalInvestors - profitableInvestors;
  const profitablePercentage = totalInvestors > 0 ? (profitableInvestors / totalInvestors) * 100 : 0;
  
  // Earnings statistics
  const totalEarningsTransactions = transactions.filter(tx => tx.type === 'Earnings').length;
  const totalDepositTransactions = transactions.filter(tx => tx.type === 'Deposit').length;
  const earningsPercentage = (totalEarningsTransactions + totalDepositTransactions) > 0 ? 
    (totalEarningsTransactions / (totalEarningsTransactions + totalDepositTransactions)) * 100 : 0;
  
  // Withdrawal statistics
  const approvedWithdrawals = withdrawalRequests.filter(req => req.status === 'Approved').length;
  const totalWithdrawalRequests = withdrawalRequests.length;
  const withdrawalSuccessRate = totalWithdrawalRequests > 0 ? (approvedWithdrawals / totalWithdrawalRequests) * 100 : 0;
  
  // Rejected withdrawal statistics
  const rejectedWithdrawals = withdrawalRequests.filter(req => req.status === 'Rejected').length;
  const rejectedPercentage = totalWithdrawalRequests > 0 ? (rejectedWithdrawals / totalWithdrawalRequests) * 100 : 0;

  // Circular progress component
  const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, color = '#374151' }: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative border-2 border-gray-800 bg-gray-100" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#9CA3AF"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="butt"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900 font-mono">{percentage.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="Dashboard">
      {/* Key Statistics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-200 border-4 border-gray-400" style={{
          borderTopColor: '#ffffff',
          borderLeftColor: '#ffffff',
          borderRightColor: '#808080',
          borderBottomColor: '#808080',
          boxShadow: 'inset 1px 1px 0px #ffffff, inset -1px -1px 0px #808080'
        }}>
          <div className="bg-gray-300 px-3 py-1 border-b-2 border-gray-600 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 border border-gray-700"></div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">HOLDINGS.EXE</h3>
            </div>
            <div className="flex space-x-1">
              <div className="w-4 h-4 bg-gray-400 border border-gray-600"></div>
              <div className="w-4 h-4 bg-gray-400 border border-gray-600"></div>
              <div className="w-4 h-4 bg-red-500 border border-gray-700"></div>
            </div>
          </div>
          <div className="p-4 bg-gray-100">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-1 border-b border-gray-400">
                <span className="text-gray-800 text-xs font-bold uppercase tracking-wide">ASSET CLASS</span>
                <span className="text-gray-800 text-xs font-bold uppercase tracking-wide">MARKET VALUE</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-800 mr-2"></div>
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">CASH</span>
                </div>
                <span className="font-bold text-gray-900 font-mono text-sm">${totalAssets.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t-2 border-gray-600 font-bold">
                <span className="text-xs uppercase tracking-wide text-gray-900">TOTAL</span>
                <span className="text-gray-900 font-mono text-sm">${totalAssets.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-200 border-4 border-gray-400" style={{
          borderTopColor: '#ffffff',
          borderLeftColor: '#ffffff',
          borderRightColor: '#808080',
          borderBottomColor: '#808080',
          boxShadow: 'inset 1px 1px 0px #ffffff, inset -1px -1px 0px #808080'
        }}>
          <div className="bg-gray-300 px-3 py-1 border-b-2 border-gray-600 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 border border-gray-700"></div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">STATISTICS.EXE</h3>
            </div>
            <div className="flex space-x-1">
              <div className="w-4 h-4 bg-gray-400 border border-gray-600"></div>
              <div className="w-4 h-4 bg-gray-400 border border-gray-600"></div>
              <div className="w-4 h-4 bg-red-500 border border-gray-700"></div>
            </div>
          </div>
          <div className="p-4 bg-gray-100">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-800 font-bold uppercase tracking-wide">NET ASSET VALUE USD</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-900 font-mono text-sm">${totalAssets.toLocaleString()}</span>
                    <div className="w-4 h-4 bg-gray-600 border border-gray-800 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">i</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-700 grid grid-cols-3 gap-2 font-bold bg-gray-200 p-2 border border-gray-400">
                  <div>
                    <span className="block uppercase tracking-wide">OPENING</span>
                    <span className="font-bold text-gray-900 font-mono">{totalDeposits.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block uppercase tracking-wide">CHANGE</span>
                    <span className="font-bold text-gray-900 font-mono">+{totalEarnings.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block uppercase tracking-wide">PERCENT</span>
                    <span className="font-bold text-gray-900 font-mono">{averageROI.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t-2 border-gray-600 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-800 font-bold uppercase tracking-wide">DEPOSITS & WITHDRAWALS USD</span>
                </div>
                <div className="text-xs text-gray-700 grid grid-cols-3 gap-2 mt-2 font-bold bg-gray-200 p-2 border border-gray-400">
                  <div>
                    <span className="block uppercase tracking-wide">DEPOSITS</span>
                    <span className="font-bold text-gray-900 font-mono">{totalDeposits.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block uppercase tracking-wide">WITHDRAWALS</span>
                    <span className="font-bold text-gray-900 font-mono">{totalWithdrawalsProcessed.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block uppercase tracking-wide">NET</span>
                    <span className="font-bold text-gray-900 font-mono">{(totalDeposits - totalWithdrawalsProcessed).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-200 border-4 border-gray-400" style={{
          borderTopColor: '#ffffff',
          borderLeftColor: '#ffffff',
          borderRightColor: '#808080',
          borderBottomColor: '#808080',
          boxShadow: 'inset 1px 1px 0px #ffffff, inset -1px -1px 0px #808080'
        }}>
          <div className="bg-gray-300 px-3 py-1 border-b-2 border-gray-600 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 border border-gray-700"></div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">UPDATES.EXE</h3>
            </div>
            <div className="flex space-x-1">
              <div className="w-4 h-4 bg-gray-400 border border-gray-600"></div>
              <div className="w-4 h-4 bg-gray-400 border border-gray-600"></div>
              <div className="w-4 h-4 bg-red-500 border border-gray-700"></div>
            </div>
          </div>
          <div className="p-4 bg-gray-100">
            <div className="space-y-3 max-h-64 overflow-y-auto" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#6B7280 #E5E7EB'
            }}>
              {/* Latest Updates */}
              <div className="border-l-4 border-purple-800 bg-purple-100 p-3 border border-gray-400">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-800 mt-1"></div>
                  <div>
                    <h4 className="font-bold text-purple-900 text-xs uppercase tracking-wide">ENHANCED: DYNAMIC WITHDRAWAL PROGRESS TRACKING</h4>
                    <p className="text-purple-800 text-xs mt-1 uppercase tracking-wide font-medium">
                      REAL-TIME WITHDRAWAL STATUS TRACKING WITH BUSINESS DAY CALCULATIONS
                    </p>
                    <p className="text-purple-700 text-xs mt-1 font-mono">RECENTLY UPDATED</p>
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-amber-800 bg-amber-100 p-3 border border-gray-400">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-amber-800 mt-1"></div>
                  <div>
                    <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wide">ENHANCED: MODAL AND FORM CONSISTENCY</h4>
                    <p className="text-amber-800 text-xs mt-1 uppercase tracking-wide font-medium">
                      ALL MODALS AND FORMS NOW FOLLOW CONSISTENT INDUSTRIAL DESIGN PATTERNS
                    </p>
                    <p className="text-amber-700 text-xs mt-1 font-mono">RECENTLY UPDATED</p>
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-gray-800 bg-gray-200 p-3 border border-gray-400">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-gray-800 mt-1"></div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wide">NEW: COMPLETE INVESTOR ONBOARDING FLOW</h4>
                    <p className="text-gray-800 text-xs mt-1 uppercase tracking-wide font-medium">
                      MULTI-STEP ONBOARDING PROCESS WITH IDENTITY VERIFICATION
                    </p>
                    <p className="text-gray-700 text-xs mt-1 font-mono">RECENTLY UPDATED</p>
                    <button
                      onClick={() => setOnboardingFlowOpen(true)}
                      className="mt-2 px-2 py-1 bg-gray-800 text-white text-xs font-bold border-2 border-gray-600 hover:bg-gray-700 transition-colors uppercase tracking-wide"
                      style={{
                        borderTopColor: '#ffffff',
                        borderLeftColor: '#ffffff',
                        borderRightColor: '#404040',
                        borderBottomColor: '#404040'
                      }}
                    >
                      TRY NEW ONBOARDING
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-red-800 bg-red-100 p-3 border border-gray-400">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-red-800 mt-1"></div>
                  <div>
                    <h4 className="font-bold text-red-900 text-xs uppercase tracking-wide">ENHANCED: COMMISSION TRACKING SYSTEM</h4>
                    <p className="text-red-800 text-xs mt-1 uppercase tracking-wide font-medium">
                      REAL-TIME COMMISSION CALCULATIONS WITH DETAILED WITHDRAWAL ANALYTICS
                    </p>
                    <p className="text-red-700 text-xs mt-1 font-mono">RECENTLY UPDATED</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-200 border-4 border-gray-400" style={{
          borderTopColor: '#ffffff',
          borderLeftColor: '#ffffff',
          borderRightColor: '#808080',
          borderBottomColor: '#808080',
          boxShadow: 'inset 1px 1px 0px #ffffff, inset -1px -1px 0px #808080'
        }}>
          <div className="bg-gray-300 px-3 py-1 border-b-2 border-gray-600 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 border border-gray-700"></div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">PERFORMANCE.EXE</h3>
            </div>
            <div className="flex space-x-1">
              <div className="w-4 h-4 bg-gray-400 border border-gray-600"></div>
              <div className="w-4 h-4 bg-gray-400 border border-gray-600"></div>
              <div className="w-4 h-4 bg-red-500 border border-gray-700"></div>
            </div>
          </div>
          <div className="p-4 bg-gray-100">
            <div className="flex items-center justify-center mb-4">
              <CircularProgress 
                percentage={profitablePercentage} 
                size={120} 
                strokeWidth={10}
                color="#374151"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-800 border border-gray-600"></div>
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">PROFITABLE ACCOUNTS</span>
                </div>
                <span className="font-bold text-gray-900 font-mono text-sm">{profitableInvestors}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gray-500 border border-gray-600"></div>
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">UNPROFITABLE ACCOUNTS</span>
                </div>
                <span className="font-bold text-gray-900 font-mono text-sm">{unprofitableInvestors}</span>
              </div>
              <div className="pt-3 border-t-2 border-gray-600">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900 mb-1 font-mono">${totalAssets.toLocaleString()}</div>
                  <div className="text-xs text-gray-700 font-bold uppercase tracking-wide">TOTAL ASSETS UNDER MANAGEMENT</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Statistics */}
        <div className="bg-gray-200 border-4 border-gray-400" style={{
          borderTopColor: '#ffffff',
          borderLeftColor: '#ffffff',
          borderRightColor: '#808080',
          borderBottomColor: '#808080',
          boxShadow: 'inset 1px 1px 0px #ffffff, inset -1px -1px 0px #808080'
        }}>
          <div className="bg-gray-300 px-3 py-1 border-b-2 border-gray-600 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 border border-gray-700"></div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">EARNINGS.EXE</h3>
            </div>
            <div className="flex space-x-1">
              <div className="w-4 h-4 bg-gray-400 border border-gray-600"></div>
              <div className="w-4 h-4 bg-gray-400 border border-gray-600"></div>
              <div className="w-4 h-4 bg-red-500 border border-gray-700"></div>
            </div>
          </div>
          <div className="p-4 bg-gray-100">
            <div className="flex items-center justify-center mb-4">
              <CircularProgress 
                percentage={earningsPercentage} 
                size={120} 
                strokeWidth={10}
                color="#374151"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gray-800 border border-gray-600"></div>
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">EARNINGS TRANSACTIONS</span>
                </div>
                <span className="font-bold text-gray-900 font-mono text-sm">{totalEarningsTransactions}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gray-500 border border-gray-600"></div>
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">DEPOSIT TRANSACTIONS</span>
                </div>
                <span className="font-bold text-gray-900 font-mono text-sm">{totalDepositTransactions}</span>
              </div>
              <div className="pt-3 border-t-2 border-gray-600">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900 mb-1 font-mono">${totalEarnings.toLocaleString()}</div>
                  <div className="text-xs text-gray-700 font-bold uppercase tracking-wide">TOTAL PLATFORM EARNINGS</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Statistics and Rejected Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Withdrawal Statistics */}
        <div className="bg-gray-200 border-4 border-gray-400" style={{
          borderTopColor: '#ffffff',
          borderLeftColor: '#ffffff',
          borderRightColor: '#808080',
          borderBottomColor: '#808080',
          boxShadow: 'inset 1px 1px 0px #ffffff, inset -1px -1px 0px #808080'
        }}>
          <div className="bg-gray-300 px-3 py-1 border-b-2 border-gray-600 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 border border-gray-700"></div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">WITHDRAWALS.EXE</h3>
            </div>
            <div className="flex space-x-1">
              <div className="w-4 h-4 bg-gray-400 border border-gray-600"></div>
              <div className="w-4 h-4 bg-gray-400 border border-gray-600"></div>
              <div className="w-4 h-4 bg-red-500 border border-gray-700"></div>
            </div>
          </div>
          <div className="p-4 bg-gray-100">
            <div className="flex items-center justify-center mb-4">
              <CircularProgress 
                percentage={withdrawalSuccessRate} 
                size={120} 
                strokeWidth={10}
                color="#374151"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gray-800 border border-gray-600"></div>
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">APPROVED WITHDRAWALS</span>
                </div>
                <span className="font-bold text-gray-900 font-mono text-sm">{approvedWithdrawals}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-700 border border-gray-600"></div>
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">REJECTED WITHDRAWALS</span>
                </div>
                <span className="font-bold text-gray-900 font-mono text-sm">{rejectedWithdrawals}</span>
              </div>
              <div className="pt-3 border-t-2 border-gray-600">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900 mb-1 font-mono">${pendingWithdrawalAmount.toLocaleString()}</div>
                  <div className="text-xs text-gray-700 font-bold uppercase tracking-wide">PENDING WITHDRAWAL AMOUNT</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rejected Withdrawal Statistics */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Rejection Statistics</h3>
            </div>
            <div className="flex items-center justify-center mb-6">
              <CircularProgress 
                percentage={rejectedPercentage} 
                size={140} 
                strokeWidth={12}
                color="#991B1B"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-800 rounded-sm"></div>
                  <span className="text-sm font-medium text-gray-700">Rejected Requests</span>
                </div>
                <span className="font-semibold text-gray-900">{rejectedWithdrawals}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gray-300 rounded-sm"></div>
                  <span className="text-sm font-medium text-gray-700">Total Requests</span>
                </div>
                <span className="font-semibold text-gray-900">{totalWithdrawalRequests}</span>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{rejectedWithdrawals}</div>
                  <div className="text-sm text-gray-600 font-medium">Rejected Withdrawal Requests</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TradingView Chart Section - Moved to Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-200 border-4 border-gray-400" style={{
          borderTopColor: '#ffffff',
          borderLeftColor: '#ffffff',
          borderRightColor: '#808080',
          borderBottomColor: '#808080',
          boxShadow: 'inset 1px 1px 0px #ffffff, inset -1px -1px 0px #808080'
        }}>
          <div className="bg-gray-300 px-3 py-1 border-b-2 border-gray-600 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 border border-gray-700"></div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">MARKET.EXE</h3>
            </div>
            <div className="flex space-x-1">
              <div className="w-4 h-4 bg-gray-400 border border-gray-600"></div>
              <div className="w-4 h-4 bg-gray-400 border border-gray-600"></div>
              <div className="w-4 h-4 bg-red-500 border border-gray-700"></div>
            </div>
          </div>
          <div className="p-4 bg-gray-100">
            <div className="h-96">
              <TradingViewChart />
            </div>
          </div>
        </div>

        <div className="bg-gray-200 border-4 border-gray-400" style={{
          borderTopColor: '#ffffff',
          borderLeftColor: '#ffffff',
          borderRightColor: '#808080',
          borderBottomColor: '#808080',
          boxShadow: 'inset 1px 1px 0px #ffffff, inset -1px -1px 0px #808080'
        }}>
          <div className="bg-gray-300 px-3 py-1 border-b-2 border-gray-600 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 border border-gray-700"></div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">ACTIONS.EXE</h3>
            </div>
            <div className="flex space-x-1">
              <div className="w-4 h-4 bg-gray-400 border border-gray-600"></div>
              <div className="w-4 h-4 bg-gray-400 border border-gray-600"></div>
              <div className="w-4 h-4 bg-red-500 border border-gray-700"></div>
            </div>
          </div>
          <div className="p-4 bg-gray-100">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setOnboardingFlowOpen(true)}
                className="flex flex-col items-center justify-center p-4 bg-gray-300 hover:bg-gray-400 border-2 border-gray-600 transition-colors group"
                style={{
                  borderTopColor: '#ffffff',
                  borderLeftColor: '#ffffff',
                  borderRightColor: '#404040',
                  borderBottomColor: '#404040'
                }}
              >
                <Users className="w-6 h-6 text-gray-800 group-hover:text-gray-900 mb-2" />
                <span className="text-xs font-bold text-gray-800 group-hover:text-gray-900 uppercase tracking-wide">ADD INVESTOR</span>
              </button>
              
              <button
                className="flex flex-col items-center justify-center p-4 bg-gray-300 hover:bg-gray-400 border-2 border-gray-600 transition-colors group"
                style={{
                  borderTopColor: '#ffffff',
                  borderLeftColor: '#ffffff',
                  borderRightColor: '#404040',
                  borderBottomColor: '#404040'
                }}
              >
                <Settings className="w-6 h-6 text-gray-800 group-hover:text-gray-900 mb-2" />
                <span className="text-xs font-bold text-gray-800 group-hover:text-gray-900 uppercase tracking-wide">SETTINGS</span>
              </button>
              
              <button
                className="flex flex-col items-center justify-center p-4 bg-gray-300 hover:bg-gray-400 border-2 border-gray-600 transition-colors group"
                style={{
                  borderTopColor: '#ffffff',
                  borderLeftColor: '#ffffff',
                  borderRightColor: '#404040',
                  borderBottomColor: '#404040'
                }}
              >
                <TrendingUp className="w-6 h-6 text-gray-800 group-hover:text-gray-900 mb-2" />
                <span className="text-xs font-bold text-gray-800 group-hover:text-gray-900 uppercase tracking-wide">ANALYTICS</span>
              </button>
              
              <button
                className="flex flex-col items-center justify-center p-4 bg-gray-300 hover:bg-gray-400 border-2 border-gray-600 transition-colors group"
                style={{
                  borderTopColor: '#ffffff',
                  borderLeftColor: '#ffffff',
                  borderRightColor: '#404040',
                  borderBottomColor: '#404040'
                }}
              >
                <AlertTriangle className="w-6 h-6 text-gray-800 group-hover:text-gray-900 mb-2" />
                <span className="text-xs font-bold text-gray-800 group-hover:text-gray-900 uppercase tracking-wide">ALERTS</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TradingView Ticker Tape Widget */}
      <div className="bg-gray-200 border-4 border-gray-400" style={{
        borderTopColor: '#ffffff',
        borderLeftColor: '#ffffff',
        borderRightColor: '#808080',
        borderBottomColor: '#808080',
        boxShadow: 'inset 1px 1px 0px #ffffff, inset -1px -1px 0px #808080'
      }}>
        <div className="bg-gray-300 px-3 py-1 border-b-2 border-gray-600 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-500 border border-gray-700"></div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">TICKER.EXE</h3>
          </div>
          <div className="flex space-x-1">
            <div className="w-4 h-4 bg-gray-400 border border-gray-600"></div>
            <div className="w-4 h-4 bg-gray-400 border border-gray-600"></div>
            <div className="w-4 h-4 bg-red-500 border border-gray-700"></div>
          </div>
        </div>
        <div className="p-4 bg-gray-100">
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <TradingViewTickerTape 
              key="admin-dashboard-ticker"
              symbols={[
                {
                  "proName": "FX_IDC:EURUSD",
                  "title": "EUR to USD"
                },
                {
                  "proName": "BITSTAMP:BTCUSD",
                  "title": "Bitcoin"
                },
                {
                  "proName": "BITSTAMP:ETHUSD",
                  "title": "Ethereum"
                },
                {
                  "description": "XAUUSD",
                  "proName": "FOREXCOM:XAUUSD"
                },
                {
                  "description": "EURUSD",
                  "proName": "FX:EURUSD"
                },
                {
                  "description": "GBPUSD",
                  "proName": "OANDA:GBPUSD"
                }
              ]}
              showSymbolLogo={true}
              isTransparent={false}
              displayMode="adaptive"
              colorTheme="dark"
              locale="en"
            />
          </div>
        </div>
      </div>

      {/* Investor Onboarding Flow */}
      <InvestorOnboardingFlow
        isOpen={onboardingFlowOpen}
        onClose={() => setOnboardingFlowOpen(false)}
        onSuccess={() => {
          setOnboardingFlowOpen(false);
        }}
      />
    </DashboardLayout>
  );
};

export default AdminDashboard;