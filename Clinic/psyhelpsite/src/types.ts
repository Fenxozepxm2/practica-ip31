// src/types.ts

// Статус сессии на фронтенде — строгий union для контроля значений
export type SessionStatus = 'confirmed' | 'pending' | 'cancelled';

/**
 * Модель сессии, используемая на фронтенде.
 * Соответствует данным, которые возвращает API после нормализации.
 */
export interface Session {
  id: string;
  date: string;
  time: string;

  specialistId: string;
  specialistName: string;

  /**
   * Эти поля нужны в интерфейсе специалиста при просмотре заявок.
   * Со стороны клиента (личный кабинет клиента) они избыточны,
   * поэтому помечены как optional.
   */
  clientName?: string;
  clientPhone?: string;

  status: SessionStatus;
}

/**
 * Данные, которые фронтенд отправляет при создании новой заявки.
 * Это “сырой” объект для bookingApi.createBooking.
 */
export interface BookingData {
  specialistId: string;
  specialistName: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
}

/**
 * Пропсы карточки специалиста.
 * Оборачиваем объект в поле `specialist`, так как компонент
 * объявлен как SpecialistCard({ specialist }: SpecialistCardProps).
 */
export interface SpecialistCardProps {
  specialist: {
    id: number | string;
    full_name: string;   // поле Django full_name
    experience: string;
    photo?: string;
    education?: string;
  };
}