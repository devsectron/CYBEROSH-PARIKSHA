import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { firebaseService } from '../services/firebaseService';
import { User, Entitlement } from '../types';
import { api, setToken, removeToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  entitlements: Entitlement[];
  isLoading: boolean;
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasEntitlement: (examId?: string) => boolean;
  t: (en: string, hi?: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [language, setLanguageState] = useState<'en' | 'hi'>('en');

  useEffect(() => {
    // 1. Language preference
    const savedLang = localStorage.getItem('cyberosh_lang') as 'en' | 'hi';
    if (savedLang === 'en' || savedLang === 'hi') {
      setLanguageState(savedLang);
    }

    // 2. Bootstrap Firestore default data
    firebaseService.bootstrapFirestore().catch(() => {});

    // 3. Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDoc = await getDoc(userDocRef);

          let profile: User;
          if (userDoc.exists()) {
            profile = userDoc.data() as User;
          } else {
            profile = {
              id: fbUser.uid,
              email: fbUser.email || '',
              full_name: fbUser.displayName || 'Candidate',
              role: fbUser.email === 'devsectron@gmail.com' || fbUser.email === 'admin@cyberoshpariksha.in' ? 'admin' : 'student',
              status: 'active',
              avatar_url: fbUser.photoURL || undefined,
              target_exam_id: 'exam_bihar_stet',
              state: 'Bihar',
              streak_days: 7,
              preparation_year: 2026
            };
            await setDoc(userDocRef, profile);
          }
          setUser(profile);

          // Load entitlements from Firestore
          const entList = await firebaseService.getUserEntitlements(fbUser.uid);
          setEntitlements(entList);
        } catch (err) {
          console.warn('Error reading Firestore user profile:', err);
        }
      } else {
        // Fallback to local session if present
        loadLocalSession();
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadLocalSession = async () => {
    const token = localStorage.getItem('cyberosh_pariksha_token');
    if (!token) return;

    try {
      const res = await api.auth.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        setEntitlements(res.entitlements || []);
      } else {
        removeToken();
        setUser(null);
      }
    } catch {
      removeToken();
      setUser(null);
    }
  };

  const setLanguage = (lang: 'en' | 'hi') => {
    setLanguageState(lang);
    localStorage.setItem('cyberosh_lang', lang);
  };

  const t = (en: string, hi?: string): string => {
    if (language === 'hi' && hi && hi.trim().length > 0) {
      return hi;
    }
    return en;
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      if (fbUser) {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        let profile: User;
        if (userDoc.exists()) {
          profile = userDoc.data() as User;
        } else {
          profile = {
            id: fbUser.uid,
            email: fbUser.email || '',
            full_name: fbUser.displayName || 'Candidate',
            role: fbUser.email === 'devsectron@gmail.com' ? 'admin' : 'student',
            status: 'active',
            avatar_url: fbUser.photoURL || undefined,
            target_exam_id: 'exam_bihar_stet',
            state: 'Bihar',
            streak_days: 7,
            preparation_year: 2026
          };
          await setDoc(userDocRef, profile);
        }
        setUser(profile);
      }
    } catch (err) {
      console.error('Google Sign-in failed:', err);
      throw err;
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.auth.login(credentials);
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      setEntitlements(res.entitlements || []);

      // Mirror to Firestore user doc
      try {
        await setDoc(doc(db, 'users', res.user.id), res.user, { merge: true });
      } catch (err) {
        console.warn('Firestore user doc sync notice:', err);
      }
    }
  };

  const register = async (userData: any) => {
    const res = await api.auth.register(userData);
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      setEntitlements([]);

      try {
        await setDoc(doc(db, 'users', res.user.id), res.user, { merge: true });
      } catch (err) {
        console.warn('Firestore user doc sync notice:', err);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {}
    removeToken();
    setUser(null);
    setEntitlements([]);
  };

  const refreshUser = async () => {
    if (user?.id) {
      try {
        const entList = await firebaseService.getUserEntitlements(user.id);
        if (entList && entList.length > 0) {
          setEntitlements(entList);
        } else {
          await loadLocalSession();
        }
      } catch {
        await loadLocalSession();
      }
    }
  };

  const hasEntitlement = (examId?: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'super_admin') return true;
    if (!entitlements || entitlements.length === 0) return false;

    return entitlements.some(e => {
      const now = new Date().getTime();
      const end = new Date(e.end_date).getTime();
      if (end < now) return false;
      if (!e.exam_id) return true;
      if (examId && e.exam_id.includes(examId)) return true;
      return false;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        entitlements,
        isLoading,
        language,
        setLanguage,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshUser,
        hasEntitlement,
        t
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
