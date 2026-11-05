import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, User as UserIcon, Phone, GraduationCap, CheckCircle, ArrowRight, Shield } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess
}) => {
  const { login, loginWithGoogle, register, t } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [targetExamId, setTargetExamId] = useState('exam_bihar_stet');
  const [stateName, setStateName] = useState('Bihar');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register' && password.length < 8) {
      setError(t('Password must be at least 8 characters.', 'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।'));
      return;
    }
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({
          email,
          password,
          full_name: fullName,
          phone,
          target_exam_id: targetExamId,
          state: stateName
        });
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = async (role: 'student' | 'admin') => {
    setError(null);
    setIsSubmitting(true);
    try {
      if (role === 'student') {
        await login({ email: 'student@cyberoshpariksha.in', password: 'Student@123' });
      } else {
        await login({ email: 'admin@cyberoshpariksha.in', password: 'Admin@123' });
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20">
            <GraduationCap className="w-7 h-7 text-slate-950" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white">
            {mode === 'login' ? t('Welcome Back Aspirant', 'पुनः स्वागत है!') : t('Create Your Free Account', 'नया छात्र खाता बनाएं')}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login'
              ? t('Sign in to access your mock tests and study progress', 'अपने मॉक टेस्ट और प्रगति तक पहुंचने के लिए साइन इन करें')
              : t('Start preparing for Bihar & All-India examinations today', 'आज ही बिहार व राष्ट्रीय परीक्षाओं की तैयारी शुरू करें')}
          </p>
        </div>

        {/* Quick Demo Login Buttons & Google Auth */}
        <div className="mb-6 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs space-y-2.5">
          <button
            type="button"
            onClick={async () => {
              setError(null);
              setIsSubmitting(true);
              try {
                await loginWithGoogle();
                onClose();
                if (onSuccess) onSuccess();
              } catch (err: any) {
                setError(err.message || 'Google sign-in failed.');
              } finally {
                setIsSubmitting(false);
              }
            }}
            disabled={isSubmitting}
            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{t('Continue with Google (Firebase Auth)', 'Google से लॉगिन करें (Firebase Auth)')}</span>
          </button>

          {import.meta.env.DEV && (
          <div>
            <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              {t('Instant Demo Access (One-Click)', 'त्वरित डेमो लॉगिन (एक क्लिक)')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('student')}
                disabled={isSubmitting}
                className="py-1.5 px-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-semibold border border-blue-500/30 text-center transition-colors truncate"
              >
                Demo Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                disabled={isSubmitting}
                className="py-1.5 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/30 text-center transition-colors truncate"
              >
                Demo Admin
              </button>
            </div>
          </div>
          )}
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex border-b border-slate-800 mb-5">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 pb-3 text-xs font-semibold text-center transition-colors border-b-2 ${
              mode === 'login'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('Sign In', 'लॉग इन')}
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 pb-3 text-xs font-semibold text-center transition-colors border-b-2 ${
              mode === 'register'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('Register', 'पंजीकरण')}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t('Full Name', 'पूरा नाम')}
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t('Email Address', 'ईमेल पता')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t('Password', 'पासवर्ड')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('Target Examination', 'लक्ष्य परीक्षा')}
                </label>
                <select
                  value={targetExamId}
                  onChange={e => setTargetExamId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                >
                  <option value="exam_bihar_stet">Bihar STET (Paper 1 / 2)</option>
                  <option value="exam_bpsc_tre">Bihar BPSC TRE 4.0 Teacher</option>
                  <option value="exam_bpsc_cce">BPSC 71st Combined Prelims</option>
                  <option value="exam_jee_main">JEE Main 2026</option>
                  <option value="exam_neet_ug">NEET UG 2026</option>
                  <option value="exam_rrb_ntpc">RRB NTPC & Group D</option>
                  <option value="exam_ibps_po">IBPS / SBI Banking</option>
                  <option value="exam_ssc_cgl">SSC CGL / CHSL</option>
                  <option value="exam_bihar_police">Bihar Police Constable</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('State', 'राज्य')}
                </label>
                <select
                  value={stateName}
                  onChange={e => setStateName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                >
                  <option value="Bihar">Bihar</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Delhi">Delhi NCR</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Other">Other State</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 mt-4"
          >
            <span>{isSubmitting ? t('Please wait...', 'कृपया प्रतीक्षा करें...') : mode === 'login' ? t('Sign In', 'लॉग इन करें') : t('Create Account', 'खाता बनाएं')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
