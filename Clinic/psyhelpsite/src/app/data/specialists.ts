export interface SpecialistCardProps {
  id: string;
  name: string;
  experience: string;
  photo: string;
  education: string[];
  description: string;
  methods: string[];
  availableSlots?: { date: string; times: string[] }[];
}

export const specialists: SpecialistCardProps[] = [
  {
    id: '1',
    name: 'Анна Петрова',
    experience: 'Стаж 8 лет',
    photo:
      'https://images.unsplash.com/photo-1715618964920-5ff08c514f35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBwc3ljaG9sb2dpc3QlMjBwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzE2ODEwNDN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    education: [
      'МГУ им. М.В. Ломоносова, факультет психологии',
      'Институт Гештальт-терапии',
    ],
    description:
      'Специализируюсь на работе с тревожными расстройствами, депрессией и проблемами в отношениях. Помогаю клиентам найти внутренние ресурсы и обрести гармонию.',
    methods: ['Гештальт-терапия', 'КПТ', 'Работа с тревогой'],
    availableSlots: [
      { date: '2026-02-24', times: ['10:00', '12:00', '15:00'] },
      { date: '2026-02-25', times: ['11:00', '14:00', '16:00'] },
      { date: '2026-02-26', times: ['09:00', '13:00', '17:00'] },
    ],
  },
  {
    id: '2',
    name: 'Иван Сидоров',
    experience: 'Стаж 12 лет',
    photo:
      'https://images.unsplash.com/photo-1621533463370-837f20c6c889?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwdGhlcmFwaXN0JTIwcHJvZmVzc2lvbmFsJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNTY5NTk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    education: [
      'СПбГУ, клиническая психология',
      'Институт когнитивно-поведенческой терапии',
    ],
    description:
      'Работаю с кризисными состояниями, стрессом и эмоциональным выгоранием. Использую научно обоснованные методы для достижения устойчивых результатов.',
    methods: ['КПТ', 'Работа со стрессом', 'Кризисная терапия'],
    availableSlots: [
      { date: '2026-02-24', times: ['09:00', '11:00', '14:00'] },
      { date: '2026-02-25', times: ['10:00', '13:00', '15:00'] },
      { date: '2026-02-27', times: ['12:00', '16:00', '18:00'] },
    ],
  },
  {
    id: '3',
    name: 'Мария Кузнецова',
    experience: 'Стаж 6 лет',
    photo:
      'https://images.unsplash.com/photo-1736939666660-d4c776e0532c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGNvdW5zZWxvciUyMGJ1c2luZXNzJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcxNjgxMDQ0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    education: [
      'ВШЭ, психология',
      'Институт телесно-ориентированной терапии',
    ],
    description:
      'Помогаю восстановить связь с телом и эмоциями. Специализируюсь на работе с психосоматическими проявлениями и травмами.',
    methods: [
      'Телесно-ориентированная терапия',
      'Работа с травмой',
      'Психосоматика',
    ],
    availableSlots: [
      { date: '2026-02-23', times: ['10:00', '13:00', '16:00'] },
      { date: '2026-02-24', times: ['11:00', '14:00', '17:00'] },
      { date: '2026-02-25', times: ['09:00', '12:00', '15:00'] },
    ],
  },
  {
    id: '4',
    name: 'Дмитрий Волков',
    experience: 'Стаж 10 лет',
    photo:
      'https://images.unsplash.com/photo-1685612275726-0682a6f300fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwc3ljaG90aGVyYXBpc3QlMjBvZmZpY2UlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzE2ODEwNDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    education: [
      'МГППУ, консультативная психология',
      'Институт системной семейной терапии',
    ],
    description:
      'Специализируюсь на семейной и парной терапии. Помогаю выстроить здоровые отношения и преодолеть кризисы в семье.',
    methods: ['Семейная терапия', 'Парная терапия', 'Системный подход'],
    availableSlots: [
      { date: '2026-02-22', times: ['10:00', '14:00', '16:00'] },
      { date: '2026-02-24', times: ['09:00', '12:00', '15:00'] },
      { date: '2026-02-26', times: ['11:00', '13:00', '17:00'] },
    ],
  },
];