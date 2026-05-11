import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isStaff, logout } = useApp();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-[1440px] mx-auto px-8 py-6 flex items-center justify-between">
          <Link to="/" className="text-foreground hover:text-primary transition-colors">
            <h1 className="text-[32px]">Клиника</h1>
          </Link>
          
          <nav className="flex items-center gap-8">
            <Link 
              to="/#about" 
              className="text-foreground hover:text-primary transition-colors"
            >
              О клинике
            </Link>
            <Link 
              to="/specialists" 
              className="text-foreground hover:text-primary transition-colors"
            >
              Специалисты
            </Link>
            {isAuthenticated ? (
              <>
                <Link 
                  to={isStaff ? "/staff-profile" : "/profile"} 
                  className="text-foreground hover:text-primary transition-colors"
                >
                  {isStaff ? "Панель специалиста" : "Личный кабинет"}
                </Link>
                <button 
                  onClick={handleLogout}
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Выход
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className="text-foreground hover:text-primary transition-colors"
              >
                Вход
              </Link>
            )}
            {!isStaff && (
              <Link 
                to="/join-team" 
                className="text-foreground hover:text-primary transition-colors"
              >
                Для психологов
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}