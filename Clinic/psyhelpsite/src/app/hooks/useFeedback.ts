import { useState } from 'react';
import { apiClient } from '../api/client';

export function useFeedback() {
  const [isLoading, setIsLoading] = useState(false);

  const submitFeedback = async (data: {
    sessionId: string;
    type: 'отзыв' | 'пожелание' | 'жалоба';
    description: string;
  }) => {
    setIsLoading(true);
    
    try {
      const token = apiClient.getAuthToken();
      if (!token) throw new Error('Необходима авторизация');

      const response = await fetch('http://127.0.0.1:8000/api/feedback/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          session: data.sessionId,
          feedback_type: data.type,
          description: data.description
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.description?.[0] || 'Не удалось отправить обратную связь');
      }

      return { message: 'Спасибо за вашу обратную связь!' };
    } finally {
      setIsLoading(false);
    }
  };

  return { submitFeedback, isLoading };
}