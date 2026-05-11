export interface FeedbackData {
  userName: string;
  sessionId: string;
  sessionInfo: string;
  type: 'отзыв' | 'пожелание' | 'жалоба';
  description: string;
}

export interface FeedbackResponse {
  message: string;
  feedbackId: string;
}

export const feedbackApi = {
  async submitFeedback(data: FeedbackData): Promise<FeedbackResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Validate fields
    if (!data.userName.trim()) {
      throw new Error('ФИО обязательно');
    }

    if (!data.sessionId) {
      throw new Error('Необходимо выбрать сессию');
    }

    if (!data.type) {
      throw new Error('Необходимо выбрать тип обратной связи');
    }

    if (!data.description.trim() || data.description.trim().length < 10) {
      throw new Error('Описание должно содержать минимум 10 символов');
    }

    // Mock: Save feedback to localStorage for demo
    const feedbacks = JSON.parse(
      localStorage.getItem('feedbacks') || '[]'
    );

    const newFeedback = {
      id: `feedback-${Date.now()}`,
      userName: data.userName,
      sessionId: data.sessionId,
      sessionInfo: data.sessionInfo,
      type: data.type,
      description: data.description,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };

    feedbacks.push(newFeedback);
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks));

    return {
      message: 'Ваша обратная связь успешно отправлена! Спасибо за ваше мнение.',
      feedbackId: newFeedback.id,
    };
  },

  async getAllFeedbacks(): Promise<any[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const feedbacks = JSON.parse(
      localStorage.getItem('feedbacks') || '[]'
    );

    return feedbacks;
  },
};
