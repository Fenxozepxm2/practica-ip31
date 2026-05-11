import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import type { Session } from '../api/booking';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  sessions: Session[];
  onSubmit: (data: {
    userName: string;
    sessionId: string;
    sessionInfo: string;
    type: 'отзыв' | 'пожелание' | 'жалоба';
    description: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export function FeedbackModal({
  isOpen,
  onClose,
  userName,
  sessions,
  onSubmit,
  isLoading,
}: FeedbackModalProps) {
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [feedbackType, setFeedbackType] = useState<'отзыв' | 'пожелание' | 'жалоба'>('отзыв');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!isOpen) {
      // Сбрасываем форму при закрытии
      setSelectedSessionId('');
      setFeedbackType('отзыв');
      setDescription('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ИСПРАВЛЕНО: Приводим оба ID к строке, чтобы '12' совпало с '12'
    const selectedSession = sessions.find(s => String(s.id) === String(selectedSessionId));
    
    if (!selectedSession) {
      console.error("Сессия не найдена!");
      return;
    }

    // ИСПРАВЛЕНО: Используем правильное имя психолога из Django
    const sessionInfo = `${selectedSession.psychologist_name || selectedSession.specialistName || 'Специалист'} - ${selectedSession.date} ${selectedSession.time}`;

    await onSubmit({
      userName,
      sessionId: selectedSessionId,
      sessionInfo,
      type: feedbackType,
      description,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-[600px] w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold">Обратная связь</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ФИО (read-only) */}
          <div>
            <Input
              label="ФИО"
              value={userName}
              disabled
            />
          </div>

          {/* Выбор сессии */}
          <div>
            <label className="block mb-2">
              Сессия <span className="text-destructive">*</span>
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              required
              className="
                w-full
                px-4 py-3
                border border-input
                rounded-md
                bg-white
                focus:outline-none
                focus:ring-2
                focus:ring-primary
                focus:border-transparent
                transition-all
              "
            >
              <option value="">Выберите сессию</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.psychologist_name || session.specialistName || 'Специалист'} - {session.date} {session.time}
                </option>
              ))}
            </select>
            {sessions.length === 0 && (
              <p className="text-muted-foreground mt-2">
                У вас пока нет завершённых сессий
              </p>
            )}
          </div>

          {/* Тип обратной связи */}
          <div>
            <label className="block mb-2">
              Тип обратной связи <span className="text-destructive">*</span>
            </label>
            <select
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value as 'отзыв' | 'пожелание' | 'жалоба')}
              required
              className="
                w-full
                px-4 py-3
                border border-input
                rounded-md
                bg-white
                focus:outline-none
                focus:ring-2
                focus:ring-primary
                focus:border-transparent
                transition-all
              "
            >
              <option value="отзыв">Отзыв</option>
              <option value="пожелание">Пожелание</option>
              <option value="жалоба">Жалоба</option>
            </select>
          </div>

          {/* Описание */}
          <div>
            <label className="block mb-2">
              Описание <span className="text-destructive">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Расскажите подробнее о вашей обратной связи..."
              required
              rows={6}
              className="
                w-full
                px-4 py-3
                border border-input
                rounded-md
                bg-white
                resize-none
                focus:outline-none
                focus:ring-2
                focus:ring-primary
                focus:border-transparent
                transition-all
              "
            />
            <p className="text-muted-foreground mt-2">Минимум 10 символов</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              size="lg"
              disabled={isLoading || sessions.length === 0}
            >
              Отправить
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              size="lg"
              disabled={isLoading}
            >
              Отмена
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}