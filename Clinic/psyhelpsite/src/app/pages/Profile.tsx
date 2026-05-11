import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router';
import { Pencil, MessageSquare, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { FeedbackModal } from '../components/FeedbackModal';
import { useFeedback } from '../hooks/useFeedback';
import { toast } from 'sonner';
import { apiClient } from '../api/client';
import type { Session } from '../api/booking';

// Перевод частых ключей из БД на русский язык
const fieldLabels: Record<string, string> = {
  date_of_birth: 'Дата рождения',
  gender: 'Пол',
  telegram: 'Telegram',
  city: 'Город',
  address: 'Адрес',
  description: 'О себе',
  age: 'Возраст',
  experience: 'Опыт работы'
};

export function Profile() {
  const { user, isAuthenticated, updateUser } = useApp();
  const { submitFeedback, isLoading: isFeedbackLoading } = useFeedback();
  
  // Данные из БД
  const [dbData, setDbData] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // Динамическое состояние редактирования
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  // Состояние для смены пароля
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);

  // Состояния для сессий и обратной связи
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [userSessions, setUserSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      const token = apiClient.getAuthToken();
      
      if (!token) {
        setIsProfileLoading(false);
        return;
      }

      fetch('http://127.0.0.1:8000/api/profile/me/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
        .then(res => {
          if (res.status === 401) throw new Error('Сессия истекла. Пожалуйста, авторизуйтесь заново.');
          if (!res.ok) throw new Error('Ошибка загрузки данных профиля');
          return res.json();
        })
        .then(data => {
          setDbData(data);
          // Сохраняем сессии сразу из ответа профиля, без лишних запросов
          if (data.sessions) {
            setUserSessions(data.sessions);
          }
        })
        .catch(err => {
          console.error(err);
          toast.error(err.message || 'Ошибка загрузки профиля');
        })
        .finally(() => setIsProfileLoading(false));
    }
  }, [isAuthenticated]);

  const handleFeedbackSubmit = async (data: any) => {
    try {
      const response = await submitFeedback(data);
      toast.success(response.message, { duration: 5000 });
      setIsFeedbackModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка отправки обратной связи');
    }
  };

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (isProfileLoading) {
    return (
      <div className="min-h-[calc(100vh-88px)] flex items-center justify-center bg-secondary">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // --- ДИНАМИЧЕСКИЙ СБОР ВСЕХ ПОЛЕЙ ИЗ БД ---
  
  const allFields: { key: string; label: string; value: string }[] = [];

  // Разделяем логику для клиента и психолога, чтобы ключи для БД были правильными
  if (user?.role === 'client') {
    allFields.push(
      { key: 'surname', label: 'Фамилия', value: dbData?.details?.surname || dbData?.surname || '' },
      { key: 'name', label: 'Имя', value: dbData?.details?.name || dbData?.name || user?.name || '' },
      { key: 'patronymic', label: 'Отчество', value: dbData?.details?.patronymic || dbData?.patronymic || '' }
    );
  } else {
    // Для психологов и менеджеров оставляем одно поле
    allFields.push(
      { key: 'full_name', label: 'ФИО', value: dbData?.details?.full_name || dbData?.full_name || '' }
    );
  }

  allFields.push(
    { key: 'phone', label: 'Номер телефона', value: dbData?.phone || user?.phone || '' },
    { key: 'email', label: 'Электронная почта', value: dbData?.user?.email || dbData?.email || user?.email || '' }
  );

  // Ключи, которые мы уже вывели или которые не нужно показывать как текст
  const skipKeys = [
    'id', 'user', 'details', 'password', 'is_active', 'photo', 
    'name', 'full_name', 'phone', 'email', 'sessions',
    'surname', 'patronymic', 'role', 'first_name', 'last_name'
  ];

  // Добавляем все остальные плоские (текст/числа) данные из БД
  const appendExtraFields = (source: any) => {
    if (!source) return;
    Object.entries(source).forEach(([k, v]) => {
      // Исключаем пустые строки, чтобы не выводилось "Не указано", когда поля просто нет
      if (!skipKeys.includes(k) && v !== null && typeof v !== 'object' && v !== '') {
        if (!allFields.find(f => f.key === k)) {
          allFields.push({
            key: k,
            label: fieldLabels[k] || k, // Используем перевод, если есть, иначе сам ключ
            value: String(v)
          });
        }
      }
    });
  };

  appendExtraFields(dbData);
  if (dbData?.details) appendExtraFields(dbData.details);

  // --- ОБРАБОТЧИКИ РЕДАКТИРОВАНИЯ ---
  const startEditing = (key: string, currentValue: string) => {
    setEditingFields(prev => ({ ...prev, [key]: true }));
    setEditValues(prev => ({ ...prev, [key]: currentValue }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (Object.keys(editValues).length === 0) return;

    try {
      await updateUser(editValues); 
      
      // Обновляем локальный стейт, чтобы UI перерисовался сразу
      setDbData((prev: any) => {
        const next = { ...(prev || {}) };
        Object.entries(editValues).forEach(([k, v]) => {
          if (next[k] !== undefined) {
            next[k] = v;
          } else if (next.details && next.details[k] !== undefined) {
            next.details[k] = v;
          } else if (['name', 'surname', 'patronymic', 'full_name', 'phone', 'email'].includes(k)) {
            next[k] = v;
          } else {
            if (!next.details) next.details = {};
            next.details[k] = v;
          }
        });
        return next;
      });

      toast.success('Данные успешно обновлены');
      setEditingFields({});
      setEditValues({});
      setHasChanges(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка обновления');
    }
  };

  // --- СМЕНА ПАРОЛЯ ---
  const handleChangePassword = () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error('Заполните все поля');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error('Новые пароли не совпадают');
      return;
    }
    if (passwords.new.length < 6) {
      toast.error('Новый пароль должен содержать минимум 6 символов');
      return;
    }

    setIsPasswordChanging(true);
    const token = apiClient.getAuthToken();

    fetch('http://127.0.0.1:8000/api/auth/change-password/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        old_password: passwords.current,
        new_password: passwords.new
      })
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMessage = errorData.old_password?.[0] || errorData.new_password?.[0] || 'Ошибка при смене пароля';
          throw new Error(errorMessage);
        }
        
        toast.success('Пароль успешно изменен. Пожалуйста, авторизуйтесь заново.');
        setPasswords({ current: '', new: '', confirm: '' });
        
        if (typeof (apiClient as any).removeAuthToken === 'function') {
          (apiClient as any).removeAuthToken();
        } else {
          localStorage.removeItem('token');
        }
        window.location.href = '/login';
      })
      .catch((err) => {
        toast.error(err.message || 'Проверьте текущий пароль и попробуйте снова');
      })
      .finally(() => setIsPasswordChanging(false));
  };

  return (
    <div className="min-h-[calc(100vh-88px)] bg-secondary py-20 px-8">
      <div className="max-w-[1000px] mx-auto">
        <div className="bg-white rounded-lg mb-6 p-2 flex gap-2">
          <div className="flex-1 py-3 px-6 rounded-lg bg-primary text-primary-foreground text-center font-medium">
            Профиль
          </div>
          <Link 
            to="/specialists"
            className="flex-1 py-3 px-6 rounded-lg text-center text-foreground hover:bg-secondary transition-all"
          >
            Записаться на консультацию
          </Link>
        </div>

        <div className="bg-white rounded-lg p-12">
          <h2 className="mb-8">Профиль</h2>

          <div className="space-y-6 mb-8">
            {allFields.map((field) => (
              <div key={`field-${field.key}`} className="flex items-center gap-4">
                <div className="flex-1">
                  {editingFields[field.key] ? (
                    <Input
                      label={field.label}
                      value={editValues[field.key] ?? field.value}
                      onChange={(e) => setEditValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                      autoFocus
                    />
                  ) : (
                    <>
                      <label className="block mb-2 text-sm font-medium text-muted-foreground">{field.label}</label>
                      <p className="text-foreground py-3 text-lg font-medium">
                        {field.value || <span className="text-gray-400 font-normal">Не указано</span>}
                      </p>
                    </>
                  )}
                </div>
                {!editingFields[field.key] && (
                  <button
                    onClick={() => startEditing(field.key, field.value)}
                    className="mt-6 text-primary hover:text-accent transition-colors"
                  >
                    <Pencil size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={!hasChanges} size="lg">
                Сохранить изменения
              </Button>
              
              {hasChanges && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setEditingFields({});
                    setEditValues({});
                    setHasChanges(false);
                  }}
                >
                  Отменить
                </Button>
              )}
            </div>
          </div>

          {/* БЛОК СМЕНЫ ПАРОЛЯ */}
          {showPasswordForm && (
            <div className="mt-8 pt-8 border-t border-border">
              <h3 className="mb-4">Смена пароля</h3>
              <div className="space-y-4 max-w-[600px]">
                <Input 
                  label="Текущий пароль" 
                  type="password" 
                  value={passwords.current} 
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} 
                  placeholder="Введите текущий пароль" 
                />
                <Input 
                  label="Новый пароль" 
                  type="password" 
                  value={passwords.new} 
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} 
                  placeholder="Минимум 6 символов" 
                />
                <Input 
                  label="Подтверждение нового пароля" 
                  type="password" 
                  value={passwords.confirm} 
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} 
                  placeholder="Повторите новый пароль" 
                />
                <div className="flex gap-4 pt-4">
                  <Button onClick={handleChangePassword} disabled={isPasswordChanging} size="lg">
                    {isPasswordChanging && <Loader2 className="animate-spin mr-2" size={16} />}
                    Сохранить пароль
                  </Button>
                  <Button onClick={() => setShowPasswordForm(false)} variant="outline" size="lg">Отмена</Button>
                </div>
              </div>
            </div>
          )}

          {/* КНОПКИ УПРАВЛЕНИЯ */}
          {!showPasswordForm && (
            <div className="mt-8 pt-8 border-t border-border flex gap-4">
              <Button onClick={() => setShowPasswordForm(true)} variant="outline" size="lg">Изменить пароль</Button>
              {/* <Button onClick={() => setIsFeedbackModalOpen(true)} variant="outline" size="lg">
                <MessageSquare size={20} className="mr-2" /> Обратная связь
              </Button> */}
            </div>
          )}
        </div>
      </div>

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        userName={dbData?.details?.name || dbData?.name || 'Клиент'}
        sessions={userSessions}
        onSubmit={handleFeedbackSubmit}
        isLoading={isFeedbackLoading}
      />
    </div>
  );
}