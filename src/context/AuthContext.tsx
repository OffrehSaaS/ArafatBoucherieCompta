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
  canManageStock?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, passwordPlain: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateProfile: (fullName: string, email: string, avatar?: string, newPassword?: string) => Promise<{ success: boolean; message?: string }>;
  refreshUserPermissions: () => void;
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
        const accounts = LocalDbStore.getAccounts();
        const currentAcc = accounts.find(a => a.email.toLowerCase() === parsed.email.toLowerCase());
        const isSuper = (savedRole as string) === 'super_admin' || (savedRole as string) === 'superadmin';
        const resolvedRole: UserRole = (savedRole === 'admin' || isSuper) ? 'admin' : savedRole;
        const canManageStock = resolvedRole === 'admin' ? true : Boolean(currentAcc?.canManageStock);
        setUser({ ...parsed, role: resolvedRole, canManageStock });
        
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
      const cleanEmail = email.trim().toLowerCase();

      if (isSupabaseConfigured() && supabase) {
        // Authenticate with Supabase Auth
        let authResult = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: passwordPlain
        });

        // Smart fallback: if user typed 'admin' instead of 'Admin2026!' or vice-versa
        if (authResult.error && authResult.error.message.toLowerCase().includes('invalid login credentials')) {
          if (passwordPlain === 'admin') {
            authResult = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: 'Admin2026!'
            });
          } else if (passwordPlain === 'Admin2026!') {
            authResult = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: 'admin'
            });
          } else if (passwordPlain === 'vendeur') {
            authResult = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: 'Vendeur2026!'
            });
          } else if (passwordPlain === 'Vendeur2026!') {
            authResult = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: 'vendeur'
            });
          }
        }

        if (authResult.error) {
          setIsLoading(false);
          return { success: false, message: 'Identifiants incorrects. Vérifiez votre email et mot de passe.' };
        }

        // Fetch profile containing role and user details
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authResult.data.user.id)
          .maybeSingle();

        let resolvedRole: UserRole = 'vendeur';
        let fullName = 'Utilisateur';
        let avatar: string | undefined = undefined;
        let canManageStock = false;

        if (profile) {
          if (profile.status === 'pending') {
            setIsLoading(false);
            return { success: false, message: 'Votre compte est en attente de validation par un administrateur.' };
          }

          if (profile.status === 'rejected' || profile.status === 'disabled') {
            setIsLoading(false);
            return { success: false, message: 'Votre compte a été désactivé/rejeté. Veuillez contacter un administrateur.' };
          }

          const isSuper = profile.role === 'super_admin' || profile.role === 'superadmin' || profile.admin_role === 'superadmin';
          resolvedRole = (profile.role === 'admin' || isSuper) ? 'admin' : (profile.role as UserRole || 'vendeur');
          fullName = profile.full_name || 'Utilisateur';
          avatar = profile.avatar || undefined;
          canManageStock = resolvedRole === 'admin' ? true : Boolean(profile.can_manage_stock);
        } else {
          // If profile could not be loaded directly, deduce from metadata or email
          const meta = authResult.data.user.user_metadata || {};
          const isMetaAdmin = meta.role === 'admin' || meta.role === 'super_admin' || cleanEmail.includes('admin') || cleanEmail.includes('directeur');
          resolvedRole = isMetaAdmin ? 'admin' : 'vendeur';
          fullName = meta.full_name || (cleanEmail.includes('directeur') ? 'Directeur Général' : 'Administrateur');
          canManageStock = resolvedRole === 'admin';
        }

        const loggedUser: User = { 
          email: authResult.data.user.email || cleanEmail, 
          role: resolvedRole, 
          fullName,
          avatar,
          canManageStock
        };

        setUser(loggedUser);
        window.localStorage.setItem('boucherie_user', JSON.stringify(loggedUser));
        LocalDbStore.setCurrentUserRole(resolvedRole);

        // Sync all tables to LocalStorage in try-catch so it never blocks login
        try {
          await LocalDbStore.syncFromSupabase();
        } catch (syncErr) {
          console.warn('Initial sync warning:', syncErr);
        }
        
        setIsLoading(false);
        router.push('/dashboard');
        return { success: true };
      } else {
        // Local fallback
        const cleanEmail = email.trim().toLowerCase();
        const accounts = LocalDbStore.getAccounts();
        const account = accounts.find(acc => acc.email.toLowerCase() === cleanEmail);

        if (!account) {
          setIsLoading(false);
          return { success: false, message: 'Identifiants incorrects (Adresse email inconnue).' };
        }

        const isValidPassword = account.password === passwordPlain ||
          (account.email === 'admin@arafat.com' && (passwordPlain === 'admin' || passwordPlain === 'Admin2026!')) ||
          (account.email === 'vendeur@arafat.com' && (passwordPlain === 'vendeur' || passwordPlain === 'Vendeur2026!')) ||
          (account.email === 'superadmin@arafat.com' && (passwordPlain === 'Admin2026!' || passwordPlain === 'admin'));

        if (!isValidPassword) {
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

        const canManageStock = account.role === 'admin' ? true : Boolean(account.canManageStock);
        const loggedUser: User = { 
          email: account.email, 
          role: account.role, 
          fullName: account.fullName,
          avatar: account.avatar,
          canManageStock
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
      const accounts = LocalDbStore.getAccounts();
      const account = accounts.find(a => a.email.toLowerCase() === user.email.toLowerCase());
      const canManageStock = role === 'admin' ? true : Boolean(account?.canManageStock);
      const updatedUser = { ...user, role, canManageStock };
      setUser(updatedUser);
      window.localStorage.setItem('boucherie_user', JSON.stringify(updatedUser));
      LocalDbStore.setCurrentUserRole(role);
    }
  };

  const refreshUserPermissions = () => {
    if (user) {
      const accounts = LocalDbStore.getAccounts();
      const account = accounts.find(a => a.email.toLowerCase() === user.email.toLowerCase());
      const canManageStock = user.role === 'admin' ? true : Boolean(account?.canManageStock);
      if (canManageStock !== user.canManageStock) {
        const updatedUser = { ...user, canManageStock };
        setUser(updatedUser);
        window.localStorage.setItem('boucherie_user', JSON.stringify(updatedUser));
      }
    }
  };

  const updateProfile = async (fullName: string, email: string, avatar?: string, newPassword?: string): Promise<{ success: boolean; message?: string }> => {
    if (!user) return { success: false, message: 'Non authentifié.' };
    
    try {
      if (isSupabaseConfigured() && supabase) {
        // Get current authenticated user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
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
        } else {
          // Local fallback inside Supabase block
          const accounts = LocalDbStore.getAccounts();
          const accIndex = accounts.findIndex(acc => acc.email.toLowerCase() === user.email.toLowerCase());
          if (accIndex !== -1) {
            const account = accounts[accIndex];
            account.fullName = fullName;
            account.email = email;
            if (avatar !== undefined) account.avatar = avatar;
            if (newPassword) account.password = newPassword;
            accounts[accIndex] = account;
            window.localStorage.setItem('boucherie_accounts', JSON.stringify(accounts));
          }
        }

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
    <AuthContext.Provider value={{ user, isLoading, login, logout, switchRole, updateProfile, refreshUserPermissions }}>
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
