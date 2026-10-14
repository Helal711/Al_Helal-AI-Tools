import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { auth as firebaseAuth } from '../firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isSupport: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass?: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, pass?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  toggleAdminRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const current = firebaseAuth.getCurrentUser();
    if (current) {
      return {
        uid: current.uid,
        email: current.email,
        displayName: current.displayName,
        photoURL: current.photoURL,
        createdAt: current.createdAt,
        role: current.role,
        preferences: current.settings || {
          theme: 'light',
          autoEnhance: true,
          defaultFormat: 'png',
        },
      };
    }
    return null;
  });

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((fbUser) => {
      if (fbUser) {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
          createdAt: fbUser.createdAt,
          role: fbUser.role,
          preferences: fbUser.settings || {
            theme: 'light',
            autoEnhance: true,
            defaultFormat: 'png',
          },
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const fbUser = await firebaseAuth.signInWithGoogle();
    setUser({
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
      createdAt: fbUser.createdAt,
      role: fbUser.role,
      preferences: fbUser.settings || {
        theme: 'light',
        autoEnhance: true,
        defaultFormat: 'png',
      },
    });
  };

  const loginWithEmail = async (email: string, pass?: string) => {
    const fbUser = await firebaseAuth.signInWithEmail(email, pass);
    setUser({
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
      createdAt: fbUser.createdAt,
      role: fbUser.role,
      preferences: fbUser.settings || {
        theme: 'light',
        autoEnhance: true,
        defaultFormat: 'png',
      },
    });
  };

  const signUpWithEmail = async (name: string, email: string, pass?: string) => {
    const fbUser = await firebaseAuth.signUpWithEmail(name, email, pass);
    setUser({
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
      createdAt: fbUser.createdAt,
      role: fbUser.role,
      preferences: fbUser.settings || {
        theme: 'light',
        autoEnhance: true,
        defaultFormat: 'png',
      },
    });
  };

  const logout = async () => {
    await firebaseAuth.signOut();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    await firebaseAuth.updateProfile({
      displayName: updates.displayName,
      photoURL: updates.photoURL,
      settings: updates.preferences as any,
    });
    setUser({ ...user, ...updates });
  };

  const toggleAdminRole = () => {
    firebaseAuth.toggleAdminRole();
  };

  const isSuperAdmin = Boolean(
    user?.role === 'SUPER_ADMIN' ||
    user?.email?.toLowerCase() === 'alhelal711@gmail.com'
  );
  const isAdmin = Boolean(
    isSuperAdmin ||
    user?.role === 'admin' ||
    user?.role === 'ADMIN'
  );
  const isSupport = Boolean(user?.role === 'SUPPORT' || isAdmin);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin,
        isSuperAdmin,
        isSupport,
        loginWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        logout,
        updateProfile,
        toggleAdminRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
