import { apiClient } from './client';
import type { User } from './auth';

// Интерфейсы данных
export interface UpdateUserData {
  [key: string]: any;
}

export interface UpdatePasswordData {
  currentPassword?: string;
  newPassword?: string;
  old_password?: string;
  new_password?: string;
}

export const userApi = {
  /**
   * Получить профиль текущего пользователя
   */
  getProfile: async (): Promise<User> => {
    // Указываем apiClient, что он вернёт объект типа User
    const response = await apiClient.get<User>('/profile/me/');
    // Достаем сам объект (apiClient.get обычно возвращает либо сами данные, либо обертку { data: User })
    return response as unknown as User;
  },

  /**
   * Обновить профиль
   */
  updateProfile: async (data: UpdateUserData): Promise<User> => {
    const token = apiClient.getAuthToken();
    if (!token) {
      throw new Error('Нет токена авторизации');
    }

    const response = await fetch('http://127.0.0.1:8000/api/profile/me/', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      let errorMessage = 'Ошибка обновления профиля';
      try {
        const errorData: Record<string, string[]> = await response.json();
        // Безопасное извлечение ошибки для TypeScript
        if (errorData.detail) {
          errorMessage = String(errorData.detail);
        } else {
          const values = Object.values(errorData);
          if (values.length > 0 && Array.isArray(values[0]) && values[0].length > 0) {
            errorMessage = String(values[0][0]);
          }
        }
      } catch (e) {
        // Оставляем дефолтную ошибку
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  },

  /**
   * Обновить пароль пользователя
   */
  updatePassword: async (data: UpdatePasswordData): Promise<void> => {
    const token = apiClient.getAuthToken();
    if (!token) {
      throw new Error('Нет токена авторизации');
    }

    const payload = {
      old_password: data.currentPassword || data.old_password,
      new_password: data.newPassword || data.new_password
    };

    const response = await fetch('http://127.0.0.1:8000/api/auth/change-password/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorMessage = 'Ошибка при смене пароля';
      try {
        // Явно указываем тип ошибки для TypeScript
        const errorData: Record<string, any> = await response.json();
        errorMessage = 
          (errorData.old_password && Array.isArray(errorData.old_password) ? errorData.old_password[0] : null) || 
          (errorData.new_password && Array.isArray(errorData.new_password) ? errorData.new_password[0] : null) || 
          errorData.detail || 
          errorMessage;
      } catch (e) {
        // Игнорируем
      }
      throw new Error(errorMessage);
    }
  },

  /**
   * Удалить аккаунт
   */
  deleteAccount: async (): Promise<void> => {
    const token = apiClient.getAuthToken();
    if (!token) return;
    
    await fetch('http://127.0.0.1:8000/api/profile/me/', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
  }
};