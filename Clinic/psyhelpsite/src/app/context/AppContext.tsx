import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../api/auth';
import type { Session } from '../api/booking';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useBookings } from '../hooks/useBookings';

interface AppContextType {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  isStaff: boolean;
  
  // Auth actions
  login: (phone: string, password: string) => Promise<void>;
  loginStaff: (email: string, password: string) => Promise<void>;
  register: (name: string, phone: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Profile actions
  updateUser: (updates: Partial<User>) => Promise<void>;
  updatePassword: (email: string, currentPassword: string, newPassword: string) => Promise<void>;
  
  // Sessions state and actions
  sessions: Session[];
  addSession: (session: Omit<Session, 'id' | 'status'>) => Promise<void>;
  getStaffAppointments: (specialistId: string) => Session[];
  refreshSessions: () => Promise<void>;
  
  // Loading states
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const auth = useAuth();
  const profile = useProfile();
  const bookings = useBookings();

  // Initialize user from storage on mount
  useEffect(() => {
    const initUser = async () => {
      try {
        const currentUser = await auth.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          // Load sessions if user is authenticated
          const userSessions = await bookings.getUserSessions();
          setSessions(userSessions);
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initUser();
  }, []);

  const login = async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      const loggedInUser = await auth.login({ phone, password });
      setUser(loggedInUser);
      
      // Load user sessions after login
      const userSessions = await bookings.getUserSessions();
      setSessions(userSessions);
    } finally {
      setIsLoading(false);
    }
  };

  const loginStaff = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const loggedInUser = await auth.loginStaff({ email, password });
      setUser(loggedInUser);
      
      // Load staff sessions after login
      if (loggedInUser.specialistId) {
        const staffSessions = await bookings.getSpecialistSessions(loggedInUser.specialistId);
        setSessions(staffSessions);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ИСПРАВЛЕНИЕ: Убрали setUser(newUser), чтобы после регистрации пользователь оставался разлогиненным
  const register = async (name: string, phone: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      await auth.register({ name, phone, email, password });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await auth.logout();
      setUser(null);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const updatedUser = await profile.updateProfile(updates);
      setUser(updatedUser);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (email: string, currentPassword: string, newPassword: string) => {
    if (!user) return;
    
    // Verify email matches current user
    if (user.email !== email) {
      throw new Error('Email не совпадает с текущим пользователем');
    }
    
    setIsLoading(true);
    try {
      await profile.updatePassword({ currentPassword, newPassword });
    } finally {
      setIsLoading(false);
    }
  };

  const addSession = async (sessionData: Omit<Session, 'id' | 'status'>) => {
    setIsLoading(true);
    try {
      const newSession = await bookings.createBooking(sessionData);
      setSessions(prev => [...prev, newSession]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSessions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      if (user.role === 'staff' && user.specialistId) {
        const staffSessions = await bookings.getSpecialistSessions(user.specialistId);
        setSessions(staffSessions);
      } else {
        const userSessions = await bookings.getUserSessions();
        setSessions(userSessions);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStaffAppointments = (specialistId: string): Session[] => {
    return sessions.filter(session => session.specialistId === specialistId);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isStaff: user?.role === 'staff',
        login,
        loginStaff,
        register,
        logout,
        updateUser,
        updatePassword,
        sessions,
        addSession,
        getStaffAppointments,
        refreshSessions,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}