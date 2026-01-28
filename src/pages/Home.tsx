import { useEffect, useState } from 'react';
import { NavService, NavigationCategory } from '../services/navService';
import { AuthService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../hooks/useTheme';
import { Search, Moon, Sun, LogOut, ExternalLink, Globe, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Home = () => {
  const [categories, setCategories] = useState<NavigationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-800 shadow-sm sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white hidden sm:block">
              Private Nav
            </h1>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-zinc-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full sm:w-64 pl-10 pr-3 py-1.5 border border-zinc-300 dark:border-zinc-600 rounded-md leading-5 bg-gray-50 dark:bg-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/manage')}
              className="p-2 rounded-md text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 focus:outline-none"
              title="Manage Navigation"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 focus:outline-none"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hidden sm:block">
                {user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 focus:outline-none"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500 dark:text-zinc-400 text-lg">No results found for "{searchQuery}"</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredCategories.map((category) => (
              <div key={category.id}>
                <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-2">
                  {category.name}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {category.items.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block p-4 bg-white dark:bg-zinc-800 rounded-lg shadow-sm hover:shadow-md border border-zinc-200 dark:border-zinc-700 transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {item.favicon ? (
                            <img
                              src={item.favicon}
                              alt={item.title}
                              className="h-8 w-8 rounded bg-gray-50"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`h-8 w-8 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center ${item.favicon ? 'hidden' : ''}`}>
                             <Globe className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {item.title}
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-zinc-300 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
