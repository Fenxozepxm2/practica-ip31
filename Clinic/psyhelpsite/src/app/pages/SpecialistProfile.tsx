import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';
import { useBookings } from '../hooks/useBookings';
import { toast } from 'sonner';

export function SpecialistProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useApp();
  const { createBooking, isLoading } = useBookings();

  const [specialist, setSpecialist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Загрузка данных специалиста
  useEffect(() => {
    if (!id) return;
    fetch(`http://127.0.0.1:8000/api/psychologists/${id}/`)
      .then(res => {
        if (!res.ok) throw new Error('Специалист не найден');
        return res.json();
      })
      .then(data => {
        setSpecialist(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const getPhotoUrl = (photoUrl?: string, fullName?: string) => {
    if (!photoUrl) {
      const name = fullName ? encodeURIComponent(fullName) : 'П';
      return `https://ui-avatars.com/api/?name=${name}&background=f3f4f6&color=6b7280&size=400&font-size=0.33`;
    }
    if (photoUrl.startsWith('http')) return photoUrl;
    return `http://127.0.0.1:8000${photoUrl}`;
  };

  //  ФУНКЦИЯ ЗАПИСИ С ПРОВЕРКОЙ АВТОРИЗАЦИИ
  const handleBooking = async () => {
    // 🔒 Проверка: только авторизованные пользователи могут записаться
    if (!isAuthenticated || !user) {
      toast.error('Для записи необходимо авторизоваться', {
        description: 'Пожалуйста, войдите в систему или зарегистрируйтесь',
        duration: 5000
      });
      
      // Сохраняем текущий путь, чтобы вернуться после входа
      navigate('/login', { 
        state: { from: `/specialist/${id}` } 
      });
      return;
    }

    try {
      await createBooking({
        specialistId: specialist.id,
        specialistName: specialist.full_name,
        date: null as unknown as string,
        time: null as unknown as string,
        clientName: (user as any).details?.name || user.name || 'Клиент', 
        clientPhone: user.phone,
      });
    } catch (error) {
      console.error("Не удалось сохранить в БД:", error);
    }


    const targetUrl = specialist.qlick_url || `https://qlick.io/ru/specialist/${specialist.id}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');

    // Показываем уведомление об успехе
    toast.success('Переход к выбору времени консультации', {
      description: 'Вы будете перенаправлены на платформу бронирования',
      duration: 3000
    });
  };

  if (loading) return <div className="min-h-[calc(100vh-88px)] flex items-center justify-center"><p>Загрузка...</p></div>;
  if (!specialist) return <div className="min-h-[calc(100vh-88px)] flex items-center justify-center"><p>Специалист не найден</p></div>;

  return (
    <div className="min-h-[calc(100vh-88px)] bg-secondary py-20 px-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-2 gap-12">

          {/* Фото специалиста */}
          <div className="bg-white rounded-lg overflow-hidden h-fit">
            <img
              src={getPhotoUrl(specialist.photo, specialist.full_name)}
              alt={specialist.full_name}
              className="w-full aspect-[3/4] object-cover"
            />
          </div>

          {/* Информация о специалисте */}
          <div className="bg-white rounded-lg p-12 h-fit">
            <h2 className="mb-6">{specialist.full_name}</h2>

            <div className="space-y-6">
              
              {/* Образование */}
              {specialist.education && (
                <div>
                  <h3 className="mb-3">Образование</h3>
                  <div className="text-foreground">
                    {typeof specialist.education === 'string' && specialist.education.includes(',') ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {specialist.education.split(',').map((edu: string, idx: number) => (
                          edu.trim() ? <li key={`edu-list-${idx}`}>{edu.trim()}</li> : null
                        ))}
                      </ul>
                    ) : (
                      <p>{specialist.education}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Опыт работы */}
              {specialist.experience && (
                <div>
                  <h3 className="mb-3">О себе и опыт работы</h3>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {specialist.experience}
                  </p>
                </div>
              )}

              {/* Методы работы */}
              {specialist.selectedMethods && specialist.selectedMethods.length > 0 ? (
                <div>
                  <h3 className="mb-3">Методы работы и техники</h3>
                  <div className="space-y-3">
                    {specialist.selectedMethods.map((item: any, index: number) => (
                      <div key={`sel-meth-${index}`} className="p-4 bg-secondary rounded-lg">
                        <p className="font-medium text-foreground">{item.method}</p>
                        <p className="text-sm text-muted-foreground">{item.technique}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                specialist.methods && specialist.methods.length > 0 && (
                  <div>
                    <h3 className="mb-3">Подходы в работе</h3>
                    <div className="flex flex-wrap gap-2">
                      {specialist.methods.map((method: any, index: number) => (
                        <span
                          key={`base-meth-${index}`}
                          className="px-4 py-2 bg-secondary text-foreground rounded-full text-sm"
                        >
                          {typeof method === 'object' ? method.name : method}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              )}
              
              {/* 🔐 КНОПКА ЗАПИСИ С ПРОВЕРКОЙ АВТОРИЗАЦИИ */}
              <div className="pt-6 border-t">
                <Button 
                  size="lg" 
                  onClick={handleBooking}  // 👈 вызываем функцию с проверкой
                  loading={isLoading}
                  className="w-full"
                >
                  Записаться к специалисту
                </Button>
                {/* Подсказка для неавторизованных пользователей */}
                {!isAuthenticated && (
                  <p className="text-muted-foreground text-sm mt-2 text-center">
                    Для записи необходимо <button onClick={() => navigate('/login')} className="text-primary hover:underline">войти в систему</button>
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}