# API Documentation

Это документация к mock API слою приложения психологической клиники. Все API вызовы имитируют работу с реальным сервером с задержками и валидацией.

## Структура

### API Client (`/src/app/api/client.ts`)
Базовый клиент для всех API запросов с поддержкой auth токенов.

- Управление токенами авторизации
- Автоматическое добавление auth заголовков
- Имитация сетевых задержек (800ms)

### Auth API (`/src/app/api/auth.ts`)
API для авторизации и регистрации.

**Endpoints:**
- `login(credentials)` - Вход пользователя
- `loginStaff(credentials)` - Вход сотрудника
- `register(data)` - Регистрация нового пользователя
- `logout()` - Выход из системы
- `getCurrentUser()` - Получение текущего пользователя
- `refreshToken()` - Обновление токена

**Mock данные для тестирования:**
- Клиент: `+7 (999) 123-45-67` / `123456`
- Сотрудник: `anna.petrova@clinic.com` / `123456`

### User API (`/src/app/api/user.ts`)
API для управления профилем пользователя.

**Endpoints:**
- `getProfile()` - Получение профиля
- `updateProfile(data)` - Обновление профиля
- `updatePassword(data)` - Смена пароля
- `deleteAccount()` - Удаление аккаунта

### Booking API (`/src/app/api/booking.ts`)
API для записи на консультации.

**Endpoints:**
- `createBooking(data)` - Создание новой записи
- `getUserSessions()` - Получение записей пользователя
- `getSpecialistSessions(specialistId)` - Получение записей специалиста
- `updateSessionStatus(sessionId, status)` - Обновление статуса записи
- `cancelSession(sessionId)` - Отмена записи
- `getAvailableSlots(specialistId, date)` - Получение доступных слотов

### Team API (`/src/app/api/team.ts`)
API для заявок на присоединение к команде.

**Endpoints:**
- `submitApplication(data)` - Отправка заявки
- `getApplicationStatus(applicationId)` - Получение статуса заявки

## Хуки

### `useAuth()`
Хук для работы с авторизацией.

```tsx
const { login, loginStaff, register, logout, isLoading, error } = useAuth();
```

### `useProfile()`
Хук для работы с профилем.

```tsx
const { getProfile, updateProfile, updatePassword, isLoading, error } = useProfile();
```

### `useBookings()`
Хук для работы с записями.

```tsx
const { 
  createBooking, 
  getUserSessions, 
  getSpecialistSessions,
  updateSessionStatus,
  cancelSession,
  getAvailableSlots,
  isLoading, 
  error 
} = useBookings();
```

### `useTeam()`
Хук для отправки заявок.

```tsx
const { submitApplication, getApplicationStatus, isLoading, error } = useTeam();
```

## Хранилище данных

Все данные хранятся в `localStorage`:
- `authToken` - JWT токен авторизации
- `currentUser` - Данные текущего пользователя
- `mockSessions` - Записи на консультации
- `teamApplications` - Заявки на присоединение к команде

## Токены

Mock JWT токены генерируются в формате:
```
header.payload.signature
```

Где payload содержит:
- `userId` - ID пользователя
- `role` - Роль ('client' | 'staff')
- `exp` - Время истечения (24 часа)

## Валидация

Все API методы включают валидацию данных:
- Проверка формата email
- Проверка длины пароля (минимум 6 символов)
- Проверка формата телефона (11 цифр)
- Проверка формата ФИО (минимум 2 слова, без цифр)
- Проверка размера файлов (максимум 5MB для резюме)

## Обработка ошибок

Все ошибки выбрасываются как `Error` с понятными сообщениями на русском языке.

Пример использования:
```tsx
try {
  await login(phone, password);
  toast.success('Вход выполнен успешно');
} catch (error) {
  toast.error(error instanceof Error ? error.message : 'Ошибка входа');
}
```
