import { useState } from 'react';
import { bookingApi, type Session, type BookingData } from '../api/booking';

interface UseBookingsResult {
  isLoading: boolean;
  error: string | null;
  createBooking: (data: BookingData) => Promise<Session>;
  getUserSessions: () => Promise<Session[]>;
  getSpecialistSessions: (specialistId: string) => Promise<Session[]>;
  updateSessionStatus: (sessionId: string, status: 'confirmed' | 'pending' | 'cancelled') => Promise<Session>;
  cancelSession: (sessionId: string) => Promise<void>;
  getAvailableSlots: (specialistId: string, date: string) => Promise<string[]>;
}

export function useBookings(): UseBookingsResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBooking = async (data: BookingData): Promise<Session> => {
    setIsLoading(true);
    setError(null);
    try { 
      return await bookingApi.createBooking(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка создания записи';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getUserSessions = async (): Promise<Session[]> => {
    setIsLoading(true);
    setError(null);
    try {
      return await bookingApi.getUserSessions();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки сессий';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getSpecialistSessions = async (specialistId: string): Promise<Session[]> => {
    setIsLoading(true);
    setError(null);
    try {
      return await bookingApi.getSpecialistSessions(specialistId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки записей';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSessionStatus = async (
    sessionId: string,
    status: 'confirmed' | 'pending' | 'cancelled'
  ): Promise<Session> => {
    setIsLoading(true);
    setError(null);
    try {
      return await bookingApi.updateSessionStatus(sessionId, status);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления статуса';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSession = async (sessionId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await bookingApi.cancelSession(sessionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка отмены записи';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableSlots = async (specialistId: string, date: string): Promise<string[]> => {
    setIsLoading(true);
    setError(null);
    try {
      return await bookingApi.getAvailableSlots(specialistId, date);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки слотов';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    createBooking,
    getUserSessions,
    getSpecialistSessions,
    updateSessionStatus,
    cancelSession,
    getAvailableSlots,
  };createBooking
}
