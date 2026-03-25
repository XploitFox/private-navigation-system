import { useEffect, useState } from 'react';
import { NavService, NavigationCategory } from '../services/navService';
import { AuthService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { Search, LogOut, ExternalLink, Globe, Settings, Command, Folder, Code2, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Home = () => {
  const [categories, setCategories] = useState<NavigationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await NavService.getAll();
        setCategories(data.categories);
      } catch (error) {
        console.error('Failed to fetch navigation data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const filteredCategories = categories
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.items.length > 0);

  const renderCategoryIcon = (icon?: string) => {
    if (!icon) return null;
    const cls = 'w-5 h-5 text-zinc-300';
    if (icon === 'folder') return <Folder className={cls} />;
    if (icon === 'code') return <Code2 className={cls} />;
    if (icon === 'tool') return <Wrench className={cls} />;
    return <span className="text-base text-zinc-300">{icon}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f14]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white/20"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f14] text-zinc-100 selection:bg-white/10">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-transparent" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0b0f14]/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="p-2 rounded-xl bg-white/[0.05] border border-white/10">
              <Command className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-zinc-100">私人导航页</span>
          </motion.div>

          <div className="flex items-center gap-4">
            {user && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/manage')}
                className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors border border-white/10"
                title="管理导航"
              >
                <Settings className="w-5 h-5" />
              </motion.button>
            )}
            
            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-white">{user.username}</div>
                  <div className="text-xs text-zinc-500">管理员</div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors border border-white/10"
                  title="退出登录"
                >
                  <LogOut className="w-5 h-5" />
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.08] text-white font-medium transition-colors border border-white/10"
              >
                登录
              </motion.button>
            )}
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 focus-within:ring-2 focus-within:ring-white/10 focus-within:border-white/20 transition-colors"
          >
            <Search className="w-5 h-5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索..."
              className="w-full bg-transparent border-none text-zinc-100 placeholder-zinc-500 text-base focus:ring-0 focus:outline-none"
            />
          </motion.div>
        </div>

        {/* Categories Grid */}
        <div className="space-y-16">
          {filteredCategories.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800/50 mb-4">
                <Search className="w-8 h-8 text-zinc-500" />
              </div>
              <p className="text-zinc-400 text-lg">未找到相关结果 "{searchQuery}"</p>
            </motion.div>
          ) : (
            filteredCategories.map((category, idx) => (
              <motion.div 
                key={category.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.2) }}
                className="space-y-6"
              >
                <div className="flex items-center space-x-4 border-b border-white/5 pb-4">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10">
                    {renderCategoryIcon(category.icon)}
                  </span>
                  <h2 className="text-xl font-semibold text-white tracking-tight">{category.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-xs font-medium text-zinc-400 border border-white/5">
                    {category.items.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {category.items.map((item) => (
                    <motion.a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ y: -1 }}
                      transition={{ duration: 0.15 }}
                      className="group relative block p-5 bg-white/[0.03] hover:bg-white/[0.04] rounded-2xl border border-white/[0.08] hover:border-white/[0.12] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-full bg-white/[0.05] transition-colors border border-white/10 flex items-center justify-center overflow-hidden">
                          {item.favicon ? (
                            <img
                              src={item.favicon}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-7 h-7 flex items-center justify-center ${item.favicon ? 'hidden' : ''}`}>
                            <Globe className="w-5 h-5 text-zinc-400" />
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      <div>
                        <h3 className="text-base font-semibold text-zinc-100 line-clamp-1 mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-transparent mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-zinc-600 text-sm">
            © {new Date().getFullYear()} 私人导航页
          </p>
        </div>
      </footer>
    </div>
  );
};
