'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LocalDbStore, UserRole } from '@/lib/db/store';
import { supabase, isSupabaseConfigured } from '@/lib/db/client';

interface User {
  email: string;
  role: UserRole;
  fullName: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, passwordPlain: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateProfile: (fullName: string, email: string, avatar?: string, newPassword?: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      // Load session from localStorage
      const savedUser = window.localStorage.getItem('boucherie_user');
      const savedRole = LocalDbStore.getCurrentUserRole();

      if (savedUser) {
        const parsed = JSON.parse(savedUser) as User;
        setUser({ ...parsed, role: savedRole });
        
        // Perform background sync from Supabase if configured and wait for it to complete
        if (isSupabaseConfigured()) {
          try {
            await LocalDbStore.syncFromSupabase();
          } catch (err) {
            console.error('Initial database sync failed:', err);
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, passwordPlain: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    
    try {
      if (isSupabaseConfigured() && supabase) {
        // Authenticate with Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: passwordPlain
        });

        if (error) {
          setIsLoading(false);
          return { success: false, message: error.message };
        }

        // Fetch profile containing role and user details
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile) {
          setIsLoading(false);
          return { success: false, message: 'Impossible de charger le profil de cet utilisateur.' };
        }

        if (profile.status === 'pending') {
          setIsLoading(false);
          return { success: false, message: 'Votre compte est en attente de validation par un administrateur.' };
        }

        if (profile.status === 'rejected') {
          setIsLoading(false);
          return { success: false, message: 'Votre compte a été désactivé/rejeté. Veuillez contacter un administrateur.' };
        }

        const loggedUser: User = { 
          email: profile.email, 
          role: profile.role as UserRole, 
          fullName: profile.full_name || 'Utilisateur',
          avatar: profile.avatar || undefined
        };

        setUser(loggedUser);
        window.localStorage.setItem('boucherie_user', JSON.stringify(loggedUser));
        LocalDbStore.setCurrentUserRole(profile.role as UserRole);

        // Sync all tables to LocalStorage
        await LocalDbStore.syncFromSupabase();
        
        setIsLoading(false);
        router.push('/dashboard');
        return { success: true };
      } else {
        // Local fallback
        const accounts = LocalDbStore.getAccounts();
        const account = accounts.find(acc => acc.email.toLowerCase() === email.toLowerCase());

        if (!account) {
          setIsLoading(false);
          return { success: false, message: 'Identifiants incorrects (Adresse email inconnue).' };
        }

        if (account.password !== passwordPlain) {
          setIsLoading(false);
          return { success: false, message: 'Identifiants incorrects (Mot de passe erroné).' };
        }

        if (account.status === 'pending') {
          setIsLoading(false);
          return { success: false, message: 'Votre compte est en attente de validation par un administrateur.' };
        }

        if (account.status === 'rejected') {
          setIsLoading(false);
          return { success: false, message: 'Votre compte a été désactivé/rejeté. Veuillez contacter un administrateur.' };
        }

        const loggedUser: User = { 
          email: account.email, 
          role: account.role, 
          fullName: account.fullName,
          avatar: account.avatar
        };

        setUser(loggedUser);
        window.localStorage.setItem('boucherie_user', JSON.stringify(loggedUser));
        LocalDbStore.setCurrentUserRole(account.role);
        setIsLoading(false);
        
        router.push('/dashboard');
        return { success: true };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, message: err.message || 'Une erreur est survenue lors de la connexion.' };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    window.localStorage.removeItem('boucherie_user');
    router.push('/');
  };

  const switchRole = (role: UserRole) => {
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      window.localStorage.setItem('boucherie_user', JSON.stringify(updatedUser));
      LocalDbStore.setCurrentUserRole(role);
    }
  };

  const updateProfile = async (fullName: string, email: string, avatar?: string, newPassword?: string): Promise<{ success: boolean; message?: string }> => {
    if (!user) return { success: false, message: 'Non authentifié.' };
    
    try {
      if (isSupabaseConfigured() && supabase) {
        // Get current authenticated user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return { success: false, message: 'Utilisateur introuvable.' };

        // Update auth user if password/email changed
        const updateData: any = {};
        if (email !== user.email) updateData.email = email;
        if (newPassword) updateData.password = newPassword;

        if (Object.keys(updateData).length > 0) {
          const { error: authError } = await supabase.auth.updateUser(updateData);
          if (authError) return { success: false, message: authError.message };
        }

        // Update public.profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            email: email,
            avatar: avatar || null
          })
          .eq('id', authUser.id);

        if (profileError) return { success: false, message: profileError.message };

        const updatedUser: User = {
          ...user,
          fullName,
          email,
          avatar: avatar || user.avatar
        };
        
        setUser(updatedUser);
        window.localStorage.setItem('boucherie_user', JSON.stringify(updatedUser));

        // Sync again
        await LocalDbStore.syncFromSupabase();
        return { success: true };
      } else {
        // Local fallback
        const accounts = LocalDbStore.getAccounts();
        const accIndex = accounts.findIndex(acc => acc.email.toLowerCase() === user.email.toLowerCase());
        if (accIndex === -1) {
          return { success: false, message: 'Compte introuvable.' };
        }
        
        const account = accounts[accIndex];
        account.fullName = fullName;
        account.email = email;
        if (avatar !== undefined) {
          account.avatar = avatar;
        }
        if (newPassword) {
          account.password = newPassword;
        }
        
        accounts[accIndex] = account;
        window.localStorage.setItem('boucherie_accounts', JSON.stringify(accounts));
        
        const updatedUser: User = {
          ...user,
          fullName,
          email,
          avatar: avatar !== undefined ? avatar : user.avatar
        };
        
        setUser(updatedUser);
        window.localStorage.setItem('boucherie_user', JSON.stringify(updatedUser));
        
        return { success: true };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Erreur lors de la mise à jour.' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, switchRole, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
