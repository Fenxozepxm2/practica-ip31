import { useState, useEffect } from 'react';
import { User, Settings, Plus, X, Loader2, Calendar, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { toast } from 'sonner';
import { methodsAndTechniques, availableMethods } from '../data/methods';
import { apiClient } from '../api/client';

const MAX_NOTES_LENGTH = 10000;

export function StaffProfile() {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<'info' | 'profile' | 'booking'>('info');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [serverData, setServerData] = useState<any>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedEducation, setEditedEducation] = useState<string[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<Array<{ method: string; technique: string }>>([]);

  const [currentMethod, setCurrentMethod] = useState('');
  const [currentTechnique, setCurrentTechnique] = useState('');

  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);

  // Состояние для вкладки "Запись на консультацию"
  const [bookingClientName, setBookingClientName] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBookingSaving, setIsBookingSaving] = useState(false);
  const [bookingSessionStatus, setBookingSessionStatus] = useState<'planned' | 'done' | 'declined'>('planned');
  const [bookingPaymentStatus, setBookingPaymentStatus] = useState<'paid' | 'unpaid'>('unpaid');

  // Состояние для редактирования существующей записи
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    client_name: '',
    notes: '',
    session_status: 'planned',
    payment_status: 'unpaid',
  });

  // Состояние для удаления записи
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null);

  useEffect(() => {
    const token = apiClient.getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    fetch('http://127.0.0.1:8000/api/profile/me/', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => {
        if (res.status === 401) throw new Error('Сессия истекла. Авторизуйтесь заново.');
        if (!res.ok) throw new Error('Ошибка загрузки');
        return res.json();
      })
      .then((data) => {
        setServerData(data);

        const details = data?.details || {};
        setEditedDescription(details.experience || '');

        const eduData = details.education;
        if (typeof eduData === 'string') {
          setEditedEducation(
            eduData
              .split(',')
              .map((e: string) => e.trim())
              .filter((e: string) => e !== '')
          );
        } else {
          setEditedEducation(Array.isArray(eduData) ? eduData : []);
        }

        setSelectedMethods(Array.isArray(details.selectedMethods) ? details.selectedMethods : []);
      })
      .catch((err) => {
        console.error(err);
        toast.error(err.message || 'Не удалось загрузить профиль');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddMethod = () => {
    if (!currentMethod || !currentTechnique) {
      toast.error('Выберите метод и технику');
      return;
    }

    const exists = selectedMethods.some(
      (item) => item.method === currentMethod && item.technique === currentTechnique
    );

    if (exists) {
      toast.error('Такая комбинация уже добавлена');
      return;
    }

    setSelectedMethods([...selectedMethods, { method: currentMethod, technique: currentTechnique }]);
    setCurrentMethod('');
    setCurrentTechnique('');
    toast.success('Метод и техника добавлены');
  };

  const handleRemoveMethod = (index: number) => {
    setSelectedMethods(selectedMethods.filter((_, i) => i !== index));
  };

  const details = serverData?.details || {};
  const displayName = details.full_name || user?.name || 'Специалист';
  const displayPhone = serverData?.phone || user?.phone || '';
  const displayEmail = user?.email || '';
  const specialistId = serverData?.id || user?.id || '';

  const sessions = Array.isArray(serverData?.sessions) ? serverData.sessions : [];

  const handleSave = () => {
    setIsSaving(true);
    const token = apiClient.getAuthToken();

    const payload = {
      full_name: displayName,
      experience: editedDescription || '',
      education: Array.isArray(editedEducation) ? editedEducation.join(', ') : '',
      selectedMethods: selectedMethods || [],
    };

    fetch('http://127.0.0.1:8000/api/profile/me/', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(JSON.stringify(errData));
        }
        return res.json();
      })
      .then((updatedData) => {
        setServerData((prev: any) => ({
          ...prev,
          details: {
            ...prev?.details,
            full_name: updatedData.full_name || prev?.details?.full_name,
            experience: updatedData.experience,
            education: updatedData.education,
            selectedMethods: updatedData.selectedMethods || selectedMethods,
          },
        }));
        setIsEditing(false);
        toast.success('Профиль успешно обновлён');
      })
      .catch((err) => {
        console.error(err);
        toast.error(`Ошибка сохранения: ${err.message}`);
      })
      .finally(() => setIsSaving(false));
  };

  const handleCancel = () => {
    const details = serverData?.details || {};
    setEditedDescription(details.experience || '');

    const eduData = details.education;
    if (typeof eduData === 'string') {
      setEditedEducation(
        eduData
          .split(',')
          .map((e: string) => e.trim())
          .filter((e: string) => e !== '')
      );
    } else {
      setEditedEducation(Array.isArray(eduData) ? eduData : []);
    }

    setSelectedMethods(Array.isArray(details.selectedMethods) ? details.selectedMethods : []);
    setCurrentMethod('');
    setCurrentTechnique('');
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error('Заполните все поля');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error('Новые пароли не совпадают');
      return;
    }

    setIsPasswordChanging(true);
    const token = apiClient.getAuthToken();

    fetch('http://127.0.0.1:8000/api/auth/change-password/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        old_password: passwords.current,
        new_password: passwords.new,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMessage =
            errorData.old_password?.[0] ||
            errorData.new_password?.[0] ||
            'Ошибка при смене пароля';
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

  // ----- СОЗДАНИЕ НОВОЙ ЗАПИСИ -----
  const handleSaveBooking = async () => {
    if (!bookingClientName.trim()) {
      toast.error('Введите ФИО клиента');
      return;
    }

    try {
      setIsBookingSaving(true);
      const token = apiClient.getAuthToken();

      const payload = {
        client_name: bookingClientName,
        notes: bookingNotes,
        session_status: bookingSessionStatus,
        payment_status: bookingPaymentStatus,
      };

      const res = await fetch('http://127.0.0.1:8000/api/bookings/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.detail || data.error || JSON.stringify(data));
      }

      setServerData((prev: any) => ({
        ...prev,
        sessions: [...(prev?.sessions || []), data],
      }));

      setBookingClientName('');
      setBookingNotes('');
      setBookingSessionStatus('planned');
      setBookingPaymentStatus('unpaid');

      toast.success('Запись сохранена');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Не удалось сохранить запись');
    } finally {
      setIsBookingSaving(false);
    }
  };

  // ----- РЕДАКТИРОВАНИЕ ЗАПИСИ -----
  const handleStartEdit = (session: any) => {
    const statusMapBack: Record<string, string> = {
      'Запланирована': 'planned',
      'Проведена': 'done',
      'Отказ': 'declined',
    };

    setEditingSessionId(session.id);
    setEditFormData({
      client_name: session.client_name || '',
      notes: session.notes || '',
      session_status: statusMapBack[session.status] || 'planned',
      payment_status: 'unpaid',
    });
  };

  const handleUpdateBooking = async (id: number) => {
    if (!editFormData.client_name.trim()) {
      toast.error('Введите ФИО клиента');
      return;
    }

    try {
      setIsUpdating(true);
      const token = apiClient.getAuthToken();

      const res = await fetch(`http://127.0.0.1:8000/api/bookings/${id}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.detail || data.error || JSON.stringify(data));
      }

      const statusMapForFront: Record<string, string> = {
        'planned': 'Запланирована',
        'done': 'Проведена',
        'declined': 'Отказ',
      };

      // Правильное локальное обновление, сохраняем ключи и старые данные (id, время)
      setServerData((prev: any) => ({
        ...prev,
        sessions: (prev?.sessions || []).map((s: any) => {
          if (s.id === id) {
            return {
              ...s,
              client_name: editFormData.client_name,
              notes: editFormData.notes,
              status: statusMapForFront[editFormData.session_status] || s.status,
            };
          }
          return s;
        }),
      }));

      setEditingSessionId(null);
      toast.success('Запись успешно обновлена');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Не удалось обновить запись');
    } finally {
      setIsUpdating(false);
    }
  };

  // ----- УДАЛЕНИЕ ЗАПИСИ -----
  const handleDeleteBooking = async (id: number) => {
    const confirmed = window.confirm('Вы уверены, что хотите удалить эту запись?');
    if (!confirmed) return;

    try {
      setDeletingSessionId(id);
      const token = apiClient.getAuthToken();

      const res = await fetch(`http://127.0.0.1:8000/api/bookings/${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || data.error || 'Не удалось удалить запись');
      }

      setServerData((prev: any) => ({
        ...prev,
        sessions: (prev?.sessions || []).filter((s: any) => s.id !== id),
      }));

      // Если удаляем ту запись, которую сейчас редактируем
      if (editingSessionId === id) {
        setEditingSessionId(null);
      }

      toast.success('Запись успешно удалена');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Ошибка при удалении записи');
    } finally {
      setDeletingSessionId(null);
    }
  };

  const validEducation = Array.isArray(editedEducation)
    ? editedEducation.filter((e) => typeof e === 'string')
    : [];

  const validMethods = Array.isArray(selectedMethods) ? selectedMethods : [];

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-88px)] flex items-center justify-center bg-secondary">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-88px)] bg-secondary py-20 px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="bg-white rounded-lg p-8 mb-6">
          <h1 className="mb-2">Добро пожаловать, {displayName}</h1>
          <p className="text-muted-foreground">Панель управления специалиста</p>
        </div>

        <div className="bg-white rounded-lg mb-6 p-2 flex gap-2">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'info'
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-secondary'
            }`}
          >
            <User size={20} />
            Личная информация
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-secondary'
            }`}
          >
            <Settings size={20} />
            Профиль
          </button>

          <button
            onClick={() => setActiveTab('booking')}
            className={`flex-1 py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'booking'
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-secondary'
            }`}
          >
            <Calendar size={20} />
            Запись на консультацию
          </button>
        </div>

        {activeTab === 'info' && (
          <div className="bg-white rounded-lg p-12">
            <div className="max-w-[800px]">
              <div className="flex items-center justify-between mb-8">
                <h2>{displayName}</h2>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>Редактировать</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving && <Loader2 className="animate-spin mr-2" size={16} />}
                      Сохранить
                    </Button>
                    <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                      Отмена
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="mb-3">Образование:</h3>
                  {isEditing ? (
                    <div className="space-y-2">
                      {validEducation.map((edu, index) => (
                        <div key={`edu-edit-${index}`}>
                          <Input
                            value={edu || ''}
                            onChange={(e) => {
                              const newEducation = [...validEducation];
                              newEducation[index] = e.target.value;
                              setEditedEducation(newEducation);
                            }}
                          />
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setEditedEducation([...validEducation, ''])}>
                        + Добавить образование
                      </Button>
                    </div>
                  ) : (
                    <>
                      {validEducation.filter((e) => e.trim() !== '').length > 0 ? (
                        <ul className="space-y-2 text-foreground list-disc pl-5">
                          {validEducation
                            .filter((e) => e.trim() !== '')
                            .map((edu, index) => (
                              <li key={`edu-view-${index}`}>{edu}</li>
                            ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground text-sm">Образование не указано</p>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <h3 className="mb-3">О себе / Опыт работы:</h3>
                  {isEditing ? (
                    <textarea
                      value={editedDescription || ''}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      className="w-full min-h-[120px] p-4 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
                    />
                  ) : (
                    <>
                      {editedDescription && editedDescription.trim() !== '' ? (
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                          {editedDescription}
                        </p>
                      ) : (
                        <p className="text-muted-foreground text-sm">Информация не заполнена</p>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <h3 className="mb-3">Методы работы и техники:</h3>

                  {isEditing && (
                    <div className="mb-6 p-6 bg-secondary rounded-lg space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block mb-2 text-sm font-medium">Метод</label>
                          <select
                            value={currentMethod || ''}
                            onChange={(e) => {
                              setCurrentMethod(e.target.value);
                              setCurrentTechnique('');
                            }}
                            className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                          >
                            <option value="">Выберите метод</option>
                            {availableMethods.map((method) => (
                              <option key={`opt-method-${method}`} value={method}>
                                {method}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block mb-2 text-sm font-medium">Техника</label>
                          <select
                            value={currentTechnique || ''}
                            onChange={(e) => setCurrentTechnique(e.target.value)}
                            disabled={!currentMethod}
                            className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="">Выберите технику</option>
                            {currentMethod &&
                              methodsAndTechniques[currentMethod]?.map((technique) => (
                                <option key={`opt-tech-${technique}`} value={technique}>
                                  {technique}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      <Button onClick={handleAddMethod} disabled={!currentMethod || !currentTechnique} className="w-full">
                        <Plus size={16} className="mr-2" />
                        Добавить метод и технику
                      </Button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {validMethods.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        {isEditing ? 'Добавьте методы и техники выше' : 'Методы не добавлены'}
                      </p>
                    ) : (
                      validMethods.map((item, index) => (
                        <div
                          key={`sel-method-${index}`}
                          className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-foreground">{item?.method || ''}</p>
                            <p className="text-sm text-muted-foreground">{item?.technique || ''}</p>
                          </div>
                          {isEditing && (
                            <button
                              onClick={() => handleRemoveMethod(index)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <X size={20} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg p-12">
            <h2 className="mb-8">Настройки профиля</h2>
            <div className="space-y-6 max-w-[600px]">
              <div>
                <label className="block mb-2">ФИО</label>
                <Input value={displayName} disabled />
              </div>
              <div>
                <label className="block mb-2">Корпоративная почта</label>
                <Input value={displayEmail} disabled />
              </div>
              <div>
                <label className="block mb-2">Номер телефона</label>
                <Input value={displayPhone} disabled />
              </div>
              <div>
                <label className="block mb-2">ID специалиста</label>
                <Input value={specialistId} disabled />
              </div>
              <div>
                <label className="block mb-2">Роль</label>
                <div className="py-3 px-4 bg-primary/10 text-primary rounded-lg inline-block">Специалист клиники</div>
              </div>

              <div className="pt-6 border-t border-border mt-8">
                <h3 className="mb-4">Изменить пароль</h3>
                <div className="space-y-4">
                  <Input
                    label="Текущий пароль"
                    type="password"
                    placeholder="••••••••"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  />
                  <Input
                    label="Новый пароль"
                    type="password"
                    placeholder="••••••••"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  />
                  <Input
                    label="Подтвердите новый пароль"
                    type="password"
                    placeholder="••••••••"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  />
                  <Button size="lg" onClick={handleChangePassword} disabled={isPasswordChanging}>
                    {isPasswordChanging && <Loader2 className="animate-spin mr-2" size={16} />}
                    Сохранить пароль
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'booking' && (
          <div className="bg-white rounded-lg p-12">
            <h2 className="mb-8">Запись на консультацию</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[900px] mb-12">
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Психолог</h3>
                  <div className="py-3 px-4 bg-secondary rounded-lg text-foreground">{displayName || 'Психолог'}</div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Клиент</h3>
                  <Input
                    placeholder="Введите ФИО клиента"
                    value={bookingClientName}
                    onChange={(e) => setBookingClientName(e.target.value)}
                  />
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Сессия</h3>
                  <select
                    value={bookingSessionStatus}
                    onChange={(e) => setBookingSessionStatus(e.target.value as 'planned' | 'done' | 'declined')}
                    className="w-full py-3 px-4 bg-secondary rounded-lg text-foreground border border-input focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="planned">Запланирована</option>
                    <option value="done">Проведена</option>
                    <option value="declined">Отказ</option>
                  </select>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Платежи</h3>
                  <select
                    value={bookingPaymentStatus}
                    onChange={(e) => setBookingPaymentStatus(e.target.value as 'paid' | 'unpaid')}
                    className="w-full py-3 px-4 bg-secondary rounded-lg text-foreground border border-input focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="unpaid">Не оплачено</option>
                    <option value="paid">Оплачено</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Заметки</h3>
                  <textarea
                    value={bookingNotes}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_NOTES_LENGTH) {
                        setBookingNotes(e.target.value);
                      }
                    }}
                    placeholder="Введите заметки о клиенте (максимум 10,000 символов)"
                    className="w-full min-h-[220px] p-4 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-transparent resize-vertical"
                  />
                  <div className="mt-1 text-xs text-muted-foreground text-right">
                    {bookingNotes.length} / {MAX_NOTES_LENGTH}
                  </div>
                </div>

                <Button onClick={handleSaveBooking} disabled={isBookingSaving} className="w-full md:w-auto">
                  {isBookingSaving && <Loader2 className="animate-spin mr-2" size={16} />}
                  Сохранить
                </Button>
              </div>
            </div>

            {/* Вывод списка сохраненных заявок */}
            <div className="pt-8 border-t border-border">
              <h3 className="mb-6 text-xl font-semibold">Список клиентов</h3>

              {sessions.length === 0 ? (
                <div className="py-6 px-4 border border-input rounded-lg text-center bg-secondary/20">
                  <span className="text-muted-foreground">У вас пока нет активных заявок.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session: any) => (
                    <div
                      key={`session-${session.id}`}
                      className="p-6 border border-border rounded-lg bg-secondary/30 transition-all"
                    >
                      {editingSessionId === session.id ? (
                        /* БЛОК РЕДАКТИРОВАНИЯ СЕССИИ */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">ФИО Клиента</label>
                              <Input
                                value={editFormData.client_name}
                                onChange={(e) => setEditFormData({ ...editFormData, client_name: e.target.value })}
                              />
                            </div>
                            <div className="flex gap-4">
                              <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Статус сессии</label>
                                <select
                                  value={editFormData.session_status}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, session_status: e.target.value })
                                  }
                                  className="w-full p-2 border border-input rounded-md bg-white"
                                >
                                  <option value="planned">Запланирована</option>
                                  <option value="done">Проведена</option>
                                  <option value="declined">Отказ</option>
                                </select>
                              </div>
                              <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Статус оплаты</label>
                                <select
                                  value={editFormData.payment_status}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, payment_status: e.target.value })
                                  }
                                  className="w-full p-2 border border-input rounded-md bg-white"
                                >
                                  <option value="unpaid">Не оплачено</option>
                                  <option value="paid">Оплачено</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4 flex flex-col justify-between">
                            <div>
                              <label className="block text-sm font-medium mb-1">Заметки</label>
                              <textarea
                                value={editFormData.notes}
                                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                className="w-full min-h-[100px] p-3 border border-input rounded-md resize-vertical"
                              />
                            </div>
                            <div className="flex gap-2 justify-end mt-4">
                              <Button variant="outline" onClick={() => setEditingSessionId(null)} disabled={isUpdating}>
                                Отмена
                              </Button>
                              <Button onClick={() => handleUpdateBooking(session.id)} disabled={isUpdating}>
                                {isUpdating && <Loader2 className="animate-spin mr-2" size={16} />}
                                Сохранить
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* БЛОК ПРОСМОТРА СЕССИИ */
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-lg mb-2">{session.client_name || 'Клиент'}</h4>

                            {session.notes && (
                              <p className="text-sm text-foreground mb-4 whitespace-pre-wrap max-w-[600px] border-l-2 border-primary/20 pl-3">
                                {session.notes}
                              </p>
                            )}

                            {/* <div className="flex flex-wrap gap-3 text-sm font-medium">
                              <span className="bg-primary/10 text-primary px-3 py-1 rounded-md">
                                Дата: {session.date || 'Не указана'}
                              </span>
                              <span className="bg-primary/10 text-primary px-3 py-1 rounded-md">
                                Время: {session.time || 'Не указано'}
                              </span>
                            </div> */}
                          </div>

                          <div className="flex flex-col items-end gap-3 text-right">
                            <span className="px-4 py-2 bg-white border border-input rounded-full text-sm font-medium whitespace-nowrap">
                              Статус: {session.status || 'В ожидании'}
                            </span>
                            
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleStartEdit(session)}
                                disabled={deletingSessionId === session.id}
                                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium disabled:opacity-50"
                              >
                                <Pencil size={14} />
                                Изменить
                              </button>

                              <button
                                onClick={() => handleDeleteBooking(session.id)}
                                disabled={deletingSessionId === session.id}
                                className="text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 text-sm font-medium disabled:opacity-50"
                              >
                                {deletingSessionId === session.id ? (
                                  <Loader2 className="animate-spin" size={14} />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                                Удалить
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}