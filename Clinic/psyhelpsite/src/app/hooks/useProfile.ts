import { useState } from 'react';
import { userApi, type UpdateUserData, type UpdatePasswordData } from '../api/user';
import type { User } from '../api/auth';

interface UseProfileResult {
  isLoading: boolean;
  error: string | null;
  getProfile: () => Promise<User>;
  updateProfile: (data: UpdateUserData) => Promise<User>;
  updatePassword: (data: UpdatePasswordData) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export function useProfile(): UseProfileResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProfile = async (): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      return await userApi.getProfile();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка получения профиля';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: UpdateUserData): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      return await userApi.updateProfile(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления профиля';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (data: UpdatePasswordData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await userApi.updatePassword(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка смены пароля';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await userApi.deleteAccount();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка удаления аккаунта';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    getProfile,
    updateProfile,
    updatePassword,
    deleteAccount,
  };
}
