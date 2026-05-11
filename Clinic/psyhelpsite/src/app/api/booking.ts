import { apiClient } from './client';

export interface BookingData {
  specialistId: string;
  specialistName: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
}

export interface Session {
  id: string;
  specialistId?: string;
  specialistName?: string;
  date: string;
  time: string;
  clientName?: string;
  clientPhone?: string;
  status: string; // Изменили тип статуса, так как с бэкенда приходит строка (например: "Новая заявка")
  [key: string]: any;
}

const API_URL = 'http://127.0.0.1:8000/api';

export const bookingApi = {
  
  // 1. СОЗДАТЬ ЗАЯВКУ (POST-запрос в Django)
  async createBooking(data: BookingData): Promise<Session> {
    const token = apiClient.getAuthToken();
    if (!token) throw new Error('Необходима авторизация');

    const response = await fetch(`${API_URL}/sessions/create/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        psychologist: data.specialistId, // Django ждет ключ "psychologist"
        date: data.date,
        time: data.time
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Ошибка сервера (createBooking):', errorData);
      const errorMessage = errorData.detail 
        || errorData.psychologist?.[0] 
        || errorData.date?.[0] 
        || 'Ошибка создания записи на сервере.';
      throw new Error(errorMessage);
    }

    return response.json();
  },

  // 2. ПОЛУЧИТЬ СЕССИИ АВТОРИЗОВАННОГО ПОЛЬЗОВАТЕЛЯ
  async getUserSessions(): Promise<Session[]> {
    const token = apiClient.getAuthToken();
    if (!token) throw new Error('Необходима авторизация');

    // Эндпоинт профиля уже возвращает готовый массив сессий
    const response = await fetch(`${API_URL}/profile/me/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) throw new Error('Ошибка загрузки сессий');

    const data = await response.json();
    return data.sessions || []; // Возвращаем массив сессий из ответа
  },

  // 3. ПОЛУЧИТЬ СЕССИИ КОНКРЕТНОГО ПСИХОЛОГА (Оставим заглушку, если не используется)
  async getSpecialistSessions(specialistId: string): Promise<Session[]> {
    return [];
  },

  // 4. ОБНОВЛЕНИЕ СТАТУСА (Если у вас есть такой функционал)
  async updateSessionStatus(
    sessionId: string,
    status: 'confirmed' | 'pending' | 'cancelled' | string
  ): Promise<Session> {
    const token = apiClient.getAuthToken();
    if (!token) throw new Error('Необходима авторизация');

    const response = await fetch(`${API_URL}/sessions/${sessionId}/status/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) throw new Error('Ошибка обновления статуса');
    return response.json();
  },

  // 5. ОТМЕНА ЗАПИСИ
  async cancelSession(sessionId: string): Promise<void> {
    const token = apiClient.getAuthToken();
    if (!token) throw new Error('Необходима авторизация');

    const response = await fetch(`${API_URL}/sessions/${sessionId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Ошибка отмены записи');
  },

  // 6. ПОЛУЧИТЬ ДОСТУПНЫЕ СЛОТЫ
  async getAvailableSlots(specialistId: string, date: string): Promise<string[]> {
    // Делаем реальный GET-запрос к нашему AvailableSlotsView в Django
    const response = await fetch(`${API_URL}/psychologists/${specialistId}/available-slots/?date=${date}`);
    
    if (!response.ok) {
      console.error('Ошибка загрузки слотов');
      return [];
    }
    
    const data = await response.json();
    return data.available_slots || [];
  },
}; 