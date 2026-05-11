import { apiClient } from './client';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'client' | 'staff';
  specialistId?: string;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface StaffLoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  phone: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export const authApi = {
  // Логин клиента (по телефону и паролю)
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch('http://127.0.0.1:8000/api/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: credentials.phone,
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      throw new Error('Неверный телефон или пароль');
    }

    const data = await response.json();

    // Сохраняем токен
    apiClient.setAuthToken(data.access);
    localStorage.setItem('refresh_token', data.refresh);

    // Получаем профиль пользователя
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Ошибка получения профиля');

    return { user, token: data.access };
  },

  // Логин психолога/менеджера (по email)
  async loginStaff(credentials: StaffLoginCredentials): Promise<LoginResponse> {
    // Сначала найдем телефон по email через профиль — 
    // но так как Django авторизует по телефону, используем тот же эндпоинт
    const response = await fetch('http://127.0.0.1:8000/api/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: credentials.email, // Django примет email как username
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      throw new Error('Неверный email или пароль');
    }

    const data = await response.json();

    apiClient.setAuthToken(data.access);
    localStorage.setItem('refresh_token', data.refresh);

    const user = await this.getCurrentUser();
    if (!user) throw new Error('Ошибка получения профиля');

    return { user, token: data.access };
  },

  // Регистрация нового клиента
  async register(data: RegisterData): Promise<LoginResponse> {
    // Разбиваем полное имя на части (Фамилия Имя Отчество)
    const nameParts = data.name.trim().split(' ');
    const surname = nameParts[0] || '';
    const name = nameParts[1] || '';
    const patronymic = nameParts[2] || '';

    const response = await fetch('http://127.0.0.1:8000/api/register/client/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: data.phone,
        email: data.email,
        password: data.password,
        name: name,
        surname: surname,
        patronymic: patronymic,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData
        ? Object.values(errorData).flat().join(', ')
        : 'Ошибка регистрации';
      throw new Error(errorMessage);
    }

    // После регистрации сразу логиним пользователя
    return await this.login({
      phone: data.phone,
      password: data.password,
    });
  },

  // Выход из системы
  async logout(): Promise<void> {
    apiClient.clearAuthToken();
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('currentUser');
  },

  // Получение текущего пользователя по токену
  async getCurrentUser(): Promise<User | null> {
    const token = apiClient.getAuthToken();
    if (!token) return null;

    const response = await fetch('http://127.0.0.1:8000/api/profile/me/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      apiClient.clearAuthToken();
      return null;
    }

    const data = await response.json();

    // Приводим данные из Django к формату User в React
    const user: User = {
      id: String(data.id || data.user_id || ''),
      name: data.full_name || data.name || '',
      phone: data.phone || '',
      email: data.email || '',
      role: data.role === 'psychologist' || data.role === 'manager' ? 'staff' : 'client',
      specialistId: data.specialist_id ? String(data.specialist_id) : undefined,
    };

    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  },

  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('Нет токена обновления');

    const response = await fetch('http://127.0.0.1:8000/api/token/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) throw new Error('Unauthorized');

    const data = await response.json();
    apiClient.setAuthToken(data.access);
    return data.access;
  },
};