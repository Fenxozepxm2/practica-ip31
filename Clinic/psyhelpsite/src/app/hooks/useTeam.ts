import { useState } from 'react';
import { teamApi, type JoinTeamData, type JoinTeamResponse } from '../api/team';

interface UseTeamResult {
  isLoading: boolean;
  error: string | null;
  submitApplication: (data: JoinTeamData) => Promise<JoinTeamResponse>;
  getApplicationStatus: (applicationId: string) => Promise<any>;
}

export function useTeam(): UseTeamResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitApplication = async (data: JoinTeamData): Promise<JoinTeamResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      return await teamApi.submitApplication(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка отправки заявки';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getApplicationStatus = async (applicationId: string): Promise<any> => {
    setIsLoading(true);
    setError(null);
    try {
      return await teamApi.getApplicationStatus(applicationId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка получения статуса';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    submitApplication,
    getApplicationStatus,
  };
}
