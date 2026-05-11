import { useState, useEffect } from 'react';
import { SpecialistCard } from '../components/SpecialistCard';
// Удаляем импорт локальных заглушек '../data/specialists'

export function Specialists() {
  // Создаем хранилище для психологов из базы
  const [psychologists, setPsychologists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Используем useEffect, чтобы сделать запрос к серверу один раз при загрузке страницы
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/psychologists/')
      .then(response => {
        if (!response.ok) {
          throw new Error('Ошибка при загрузке специалистов');
        }
        return response.json();
      })
      .then(data => {
        setPsychologists(data); // Сохраняем полученные данные
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-[calc(100vh-88px)] bg-secondary py-20 px-8">
      <div className="max-w-[1440px] mx-auto">
        <h2 className="mb-12">Наши специалисты</h2>
        
        {/* Показываем статус загрузки */}
        {loading && <p>Загрузка специалистов...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && psychologists.length === 0 && <p>В базе пока нет ни одного специалиста.</p>}

        <div className="grid grid-cols-3 gap-8">
          {psychologists.map((specialist: any) => (
            <SpecialistCard key={specialist.id} specialist={specialist} />
          ))}
        </div>
      </div>
    </div>
  );
}