import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, Menu, X, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { useState } from 'react';

const navItems = [
  { to: '/quiz', label: 'Quiz', description: 'Discover your interests and strengths' },
  { to: '/results', label: 'Careers', description: 'Browse AI-matched career paths' },
  { to: '/roadmap', label: 'Roadmap', description: 'Your personalized learning plan' },
  { to: '/study-tools', label: 'Study', description: 'AI-generated flashcards and tools' },
  { to: '/documents', label: 'Documents', description: 'Summarize and analyze documents' },
  { to: '/profile', label: 'Profile', description: 'View your progress and achievements' },
];

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const NavItem = ({ to, label, description, isActive, badge }: { to: string; label: string; description: string; isActive: boolean; badge?: number }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Link to={to} className="relative text-sm py-1 transition-colors duration-200">
        <span className={isActive ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}>
          {label}
        </span>
        {badge && badge > 0 ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-4 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
          >
            {badge}
          </motion.span>
        ) : null}
        {isActive && (
          <motion.div
            layoutId="nav-indicator"
            className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-primary"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
      </Link>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="text-xs">
      {description}
    </TooltipContent>
  </Tooltip>
);

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const { unviewedBadgeCount } = useUserData();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getBadge = (to: string) => to === '/profile' ? unviewedBadgeCount : undefined;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border backdrop-blur-xl bg-background/80">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <Compass className="h-7 w-7 text-primary" />
          <span className="gradient-text">AI Career Compass</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {isAuthenticated && navItems.map(item => (
            <NavItem key={item.to} {...item} isActive={location.pathname === item.to} badge={getBadge(item.to)} />
          ))}
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-secondary transition-colors" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-5 w-5 text-accent" /> : <Moon className="h-5 w-5 text-muted-foreground" />}
          </button>
          {isAuthenticated ? (
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          ) : (
            <Link to="/auth" className="gradient-bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            {theme === 'dark' ? <Sun className="h-5 w-5 text-accent" /> : <Moon className="h-5 w-5 text-muted-foreground" />}
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
      {mobileOpen && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="md:hidden border-t border-border bg-background px-4 py-4 space-y-1 overflow-hidden">
          {isAuthenticated ? (
            <>
              {navItems.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`relative block text-sm py-2 px-3 rounded-lg transition-colors ${location.pathname === item.to ? 'text-foreground bg-primary/10 font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                >
                  {item.label}
                  {getBadge(item.to) ? (
                    <span className="ml-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {getBadge(item.to)}
                    </span>
                  ) : null}
                </Link>
              ))}
              <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="block w-full text-left text-sm py-2 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary">Logout</button>
            </>
          ) : (
            <Link to="/auth" onClick={() => setMobileOpen(false)} className="block gradient-bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium text-center">Sign In</Link>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
