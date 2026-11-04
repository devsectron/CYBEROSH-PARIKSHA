import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Search,
  Globe,
  Flame,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  ShieldAlert,
  Menu,
  X,
  BookOpen,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenSearch
}) => {
  const { user, logout, language, setLanguage, t } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'exams', label: t('All Exams', 'सभी परीक्षाएं') },
    { id: 'mock-tests', label: t('Mock Tests (CBT)', 'मॉक टेस्ट (CBT)') },
    { id: 'materials', label: t('Study Library', 'अध्ययन सामग्री') },
    { id: 'papers', label: t('Model Papers & PYQs', 'मॉडल पेपर और PYQ') },
    { id: 'daily-quiz', label: t('Daily Quiz', 'दैनिक क्विज़') },
    { id: 'current-affairs', label: t('Current Affairs', 'करेंट अफेयर्स') },
    { id: 'pricing', label: t('Plans & Passes', 'पास और मूल्य') }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Top micro banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 px-4 py-1 text-xs text-slate-950 font-semibold text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        <span>
          {t(
            'Special Bihar State & National Exam Series 2026: STET, BPSC TRE 4.0, JEE Main & NEET Open Tests Available!',
            'बिहार STET, BPSC TRE 4.0, JEE Main व NEET 2026 के नवीनतम मॉक टेस्ट और नोट्स अब लाइव हैं!'
          )}
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 group text-left focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-lg sm:text-xl text-white">
                  CYBEROSH
                </span>
                <span className="font-extrabold tracking-tight text-lg sm:text-xl text-amber-400">
                  PARIKSHA
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider font-medium uppercase hidden sm:block">
                Prepare Smart. Practice More. Succeed.
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1 text-sm font-medium">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  currentView === link.id
                    ? 'text-amber-400 bg-slate-800/80 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Action Section */}
          <div className="flex items-center gap-2.5">
            {/* Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Search examinations, notes, and tests"
            >
              <Search className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Search</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 text-slate-200 transition-colors"
              title="Toggle English / हिंदी"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            {/* User Profile or Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 transition-colors"
                >
                  <img
                    src={user.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                    alt={user.full_name}
                    className="w-7 h-7 rounded-lg object-cover border border-amber-400/40"
                  />
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold leading-tight text-white max-w-[120px] truncate">
                      {user.full_name}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                      <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{user.streak_days || 1} {t('Day Streak', 'दिन स्ट्रीक')}</span>
                    </div>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="font-semibold text-white truncate">{user.full_name}</p>
                      <p className="text-slate-400 text-[11px] truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-400/10 text-amber-400">
                        {user.role}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('student-dashboard');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-slate-800 flex items-center gap-2.5 text-slate-200"
                    >
                      <LayoutDashboard className="w-4 h-4 text-blue-400" />
                      <span>{t('Student Dashboard', 'छात्र डैशबोर्ड')}</span>
                    </button>

                    {(user.role === 'admin' || user.role === 'super_admin' || user.role === 'content_manager') && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('admin-dashboard');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-800 flex items-center gap-2.5 text-amber-400 font-semibold"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>{t('Admin Management', 'एडमिन पैनल')}</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-red-500/10 text-red-400 flex items-center gap-2.5 border-t border-slate-800 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('Sign Out', 'लॉग आउट')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  {t('Sign In', 'लॉग इन')}
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
                >
                  {t('Start Free', 'निःशुल्क शुरू करें')}
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-6 space-y-1">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate(link.id);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                currentView === link.id
                  ? 'bg-amber-500/10 text-amber-400 font-semibold'
                  : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              {link.label}
            </button>
          ))}

          {user && (
            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('student-dashboard');
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-blue-400 hover:bg-slate-900 flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{t('My Dashboard', 'मेरा डैशबोर्ड')}</span>
              </button>
              {(user.role === 'admin' || user.role === 'super_admin') && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('admin-dashboard');
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-amber-400 hover:bg-slate-900 flex items-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>{t('Admin Management', 'एडमिन पैनल')}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
