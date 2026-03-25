import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { KeyRound, ArrowRight, Command } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login = () => {
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await AuthService.login({ key: accessKey });
      setAuth(data.user, data.accessToken);
      navigate('/');
    } catch (err: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined;
      setError(message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f14] text-zinc-100 px-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-transparent" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-8 sm:p-10">
          <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-16 h-16 bg-white/[0.06] rounded-2xl mx-auto flex items-center justify-center border border-white/10 mb-6"
            >
              <Command className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              欢迎回来
            </h2>
            <p className="text-zinc-500 mt-2 text-sm">登录以管理您的私人导航</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white/[0.04] border border-white/10 text-zinc-200 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">访问密钥</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    className="pn-input block w-full pl-11 pr-4 py-3"
                    placeholder="请输入访问密钥"
                  />
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-white/[0.08] hover:bg-white/[0.10] text-white font-medium rounded-xl border border-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>登录中...</span>
                </>
              ) : (
                <>
                  <span>立即登录</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>
        </div>
        
        <p className="text-center text-zinc-600 text-xs mt-8">私人导航页</p>
      </motion.div>
    </div>
  );
};
