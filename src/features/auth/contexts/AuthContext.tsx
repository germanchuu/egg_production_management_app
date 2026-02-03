/**
 * Auth Context
 *
 * Provides authentication state management using React Context.
 * Tracks current user and auth status throughout the app.
 *
 * Features:
 * - Load session on app start from expo-secure-store
 * - Track current authenticated user
 * - Provide login/logout methods
 * - Background session validation when online
 * - Handle revoked users and device removals
 *
 * Usage:
 * ```tsx
 * const { user, isAuthenticated, isLoading, login, logout } = useAuth();
 * ```
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import type { User, SessionData } from '@/shared/types/entities';
import {
  AuthService,
  type SessionValidationResult,
} from '../services/AuthService';
import { UserService } from '../services/UserService';
import { getDatabase } from '@/shared/database';

/* -------------------------------------------------------------------------- */
/*                              Context Types                                 */
/* -------------------------------------------------------------------------- */

interface AuthContextValue {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Methods
  login: (user: User, deviceName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  validateSession: () => Promise<SessionValidationResult>;
}

/* -------------------------------------------------------------------------- */
/*                              Context                                       */
/* -------------------------------------------------------------------------- */

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/*                              Provider Props                                */
/* -------------------------------------------------------------------------- */

interface AuthProviderProps {
  children: ReactNode;
}

/* -------------------------------------------------------------------------- */
/*                              Provider                                      */
/* -------------------------------------------------------------------------- */

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);

  const isAuthenticated = user !== null;

  /**
   * Load user from local database using stored session
   */
  const loadUser = useCallback(
    async (session: SessionData): Promise<User | null> => {
      try {
        const { UserServiceProvider } =
          await import('../services/UserServiceProvider');
        const service = await UserServiceProvider.getUserService();
        const loadedUser = await service.getUser(session.userId);
        return loadedUser;
      } catch (error) {
        console.error('Error loading user from database:', error);
        return null;
      }
    },
    []
  );

  /**
   * Initialize auth state on app start
   * Loads session from secure storage and fetches user from local DB
   */
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if there's a stored session
      const session = await AuthService.getStoredSession();

      if (!session) {
        // No session found
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Load user from local database
      const loadedUser = await loadUser(session);

      if (!loadedUser) {
        // User not found in local DB, clear session
        await AuthService.logout();
        setUser(null);
        setError('Sesión inválida. Por favor inicia sesión de nuevo.');
      } else {
        setUser(loadedUser);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setError('Error al inicializar autenticación');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [loadUser]);

  /**
   * Login user (called after accepting invitation)
   */
  const login = useCallback(async (newUser: User, deviceName: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await AuthService.acceptInvitation(newUser, deviceName);

      if (!result.success) {
        setError(result.error || 'Error al iniciar sesión');
        return;
      }

      setUser(newUser);
    } catch (error) {
      console.error('Error during login:', error);
      setError('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await AuthService.logout();
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Error during logout:', error);
      setError('Error al cerrar sesión');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh user data from local database
   */
  const refreshUser = useCallback(async () => {
    if (!user) return;

    try {
      const session = await AuthService.getStoredSession();
      if (!session) {
        setUser(null);
        return;
      }

      const updatedUser = await loadUser(session);
      if (updatedUser) {
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, [user, loadUser]);

  /**
   * Validate session with Firestore (when online)
   * Checks if user is still authorized and not revoked
   */
  const validateSession =
    useCallback(async (): Promise<SessionValidationResult> => {
      // Don't validate too frequently (max once per minute)
      if (lastValidation && Date.now() - lastValidation.getTime() < 60000) {
        return { valid: true };
      }

      try {
        const result = await AuthService.validateSession(
          async (userId: string) => {
            // Fetch user from Firestore
            // TODO: Implement Firestore fetch when online
            // For now, return local user
            const { UserServiceProvider } =
              await import('../services/UserServiceProvider');
            const service = await UserServiceProvider.getUserService();
            return await service.getUser(userId);
          }
        );

        setLastValidation(new Date());

        if (!result.valid) {
          // Handle validation failure
          if (result.error === 'revoked' || result.error === 'device_removed') {
            await logout();
            setError(result.message || 'Tu acceso ha sido revocado');
          }
        }

        return result;
      } catch (error) {
        console.error('Error validating session:', error);
        return {
          valid: false,
          error: 'network_error',
          message: 'Error de red al validar sesión',
        };
      }
    }, [lastValidation, logout]);

  /**
   * Initialize auth on mount
   */
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  /**
   * Validate session when app comes to foreground
   */
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isAuthenticated) {
        // Check network connectivity
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
          // Validate session in background
          validateSession();
        }
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, validateSession]);

  /**
   * Validate session periodically when online
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(
      async () => {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
          await validateSession();
        }
      },
      5 * 60 * 1000
    ); // Every 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, validateSession]);

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
    validateSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* -------------------------------------------------------------------------- */
/*                              Hook                                          */
/* -------------------------------------------------------------------------- */

/**
 * Hook to access auth context
 *
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
