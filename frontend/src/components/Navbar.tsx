import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Film, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2 text-2xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 bg-clip-text text-transparent transform transition hover:scale-105 tracking-tighter">
              <Film className="w-8 h-8 text-red-500" />
              <span>ScreenFlix</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/profile" className="flex items-center gap-2 text-gray-300 hover:text-white transition">
                  <User size={18} />
                  <span>{user.name}</span>
                </Link>
                {(user.role === 'super_admin' || user.role === 'theater_admin') && (
                  <Link to="/admin/dashboard" className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 transition text-sm">
                    Dashboard
                  </Link>
                )}
                <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 transition rounded-full hover:bg-gray-700/50">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link to="/login" className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition font-medium text-white shadow-lg shadow-red-500/30">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
