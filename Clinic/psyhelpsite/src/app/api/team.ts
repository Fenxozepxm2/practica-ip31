// ДОБАВИЛИ full_name
export interface JoinTeamData {
  full_name: string; 
  email: string;
  education: string;
  experience: string;
  photo: File;
}

export interface JoinTeamResponse {
  message: string;
  applicationId?: string;
}

export const teamApi = {
  async submitApplication(data: JoinTeamData): Promise<JoinTeamResponse> {
    const formData = new FormData();
    
    // ДОБАВИЛИ full_name в отправляемые данные
    formData.append('full_name', data.full_name); 
    formData.append('email', data.email);
    formData.append('education', data.education);
    formData.append('experience', data.experience);
    formData.append('photo', data.photo);

    const response = await fetch('http://127.0.0.1:8000/api/psychologists-apply/', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData 
        ? Object.values(errorData).flat().join(', ') 
        : 'Произошла ошибка на сервере при отправке заявки.';
      throw new Error(errorMessage);
    }

    const responseData = await response.json();

    return {
      message: 'Ваша заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.',
      applicationId: responseData.id,
    };
  },

  async getApplicationStatus(applicationId: string): Promise<any> {
    throw new Error('Проверка статуса пока не реализована');
  },
};