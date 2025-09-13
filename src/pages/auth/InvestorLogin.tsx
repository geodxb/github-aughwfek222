import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, User, Lock } from 'lucide-react';

const InvestorLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<'admin' | 'affiliate'>('affiliate');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      console.log('🔐 Starting investor login process...');
      const success = await login(email, password);
      if (success) {
        console.log('✅ Investor login successful, navigating...');
        navigate('/investor');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const primaryColor = userType === 'admin' ? 'blue' : 'red';
  
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ease-in-out ${
      userType === 'admin' ? 'bg-blue-50' : 'bg-red-600'
    }`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        {/* Interactive Brokers Logo */}
        <div className="text-center mb-8">
          <img 
            src="/Screenshot 2025-06-07 024813.png" 
            alt="Interactive Brokers" 
            className="h-8 w-auto object-contain mx-auto mb-6"
          />
          
          {/* Blue line under logo */}
          <div className={`w-full h-1 mb-8 ${
            userType === 'admin' ? 'bg-blue-600' : 'bg-red-600'
          }`}></div>
          
          {/* Admin/Affiliate Toggle Switch */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative bg-gray-200 rounded-full p-1 w-48 h-10">
              {/* Sliding background */}
              <div 
                className={`absolute top-1 left-1 w-[calc(50%-4px)] h-8 rounded-full transition-all duration-500 ease-in-out transform ${
                  userType === 'admin' 
                    ? 'translate-x-0 bg-blue-600' 
                    : 'translate-x-full bg-red-600'
                }`}
              ></div>
              
              {/* Toggle buttons */}
              <div className="relative flex">
                <button
                  type="button"
                  onClick={() => setUserType('admin')}
                  className={`flex-1 py-2 px-4 text-sm font-medium transition-all duration-300 ease-in-out z-10 ${
                    userType === 'admin'
                      ? 'text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('affiliate')}
                  className={`flex-1 py-2 px-4 text-sm font-medium transition-all duration-300 ease-in-out z-10 ${
                    userType === 'affiliate'
                      ? 'text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Affiliate
                </button>
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Login</h1>
        </div>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div>
            <div className="relative">
              <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 transition-all duration-300 ease-in-out ${
                  userType === 'admin' 
                    ? 'focus:ring-blue-500 focus:border-blue-500' 
                    : 'focus:ring-red-500 focus:border-red-500'
                }`}
                placeholder="Username"
                required
              />
            </div>
          </div>
          
          {/* Password Field */}
          <div>
            <div className="relative">
              <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 transition-all duration-300 ease-in-out ${
                  userType === 'admin' 
                    ? 'focus:ring-blue-500 focus:border-blue-500' 
                    : 'focus:ring-red-500 focus:border-red-500'
                }`}
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff size={20} className="text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye size={20} className="text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>
          
          {/* Need help link */}
          <div className="text-right">
            <a href="#" className={`text-sm hover:underline ${
              userType === 'admin' ? 'text-blue-600' : 'text-red-600'
            } transition-colors duration-300 ease-in-out`}>
              Need help?
            </a>
          </div>
          
          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed ${
              userType === 'admin'
                ? 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                : 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Login'
            )}
          </button>
        </form>
        
        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            Interactive Brokers LLC | Regulated by SEC, FINRA, CFTC
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default InvestorLogin;