import { useState } from 'react';
import { Upload, X, Image } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useTeam } from '../hooks/useTeam';
import { toast } from 'sonner';

export function JoinTeam() {
  const [fullName, setFullName] = useState(''); // Добавили состояние для ФИО
  const [email, setEmail] = useState('');
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { submitApplication, isLoading } = useTeam();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Неподдерживаемый формат изображения');
        return;
      }

      if (selectedFile.size > maxSize) {
        toast.error('Размер файла превышает 5 МБ');
        return;
      }

      setPhoto(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (fullName.trim().length < 2) {
      toast.error('Пожалуйста, введите ваше ФИО');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      toast.error('Некорректный формат email');
      return;
    }

    if (education.trim().length < 10) {
      toast.error('Пожалуйста, укажите информацию об образовании (минимум 10 символов)');
      return;
    }

    if (experience.trim().length < 10) {
      toast.error('Пожалуйста, укажите информацию об опыте работы (минимум 10 символов)');
      return;
    }

    if (!photo) {
      toast.error('Пожалуйста, загрузите ваше фото');
      return;
    }

    try {
      const response = await submitApplication({ 
        full_name: fullName, // Передаем ФИО в функцию отправки
        email, 
        education, 
        experience, 
        photo 
      });
      toast.success(response.message, {
        duration: 5000
      });

      // Reset form
      setFullName(''); // Очищаем ФИО после успешной отправки
      setEmail('');
      setEducation('');
      setExperience('');
      setPhoto(null);
      setPhotoPreview(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка отправки заявки');
    }
  };

  return (
    <div className="min-h-[calc(100vh-88px)] bg-secondary py-20 px-8">
      <div className="max-w-[800px] mx-auto">
        <div className="bg-white rounded-lg p-12">
          <h2 className="mb-6">Стать частью команды</h2>
          
          <p className="text-foreground leading-relaxed mb-8">
            Мы ищем опытных психологов с высшим профильным образованием и стажем работы от 3 лет. 
            Наши специалисты регулярно проходят супервизию, участвуют в профессиональных сообществах 
            и придерживаются этических стандартов психотерапии. Мы предлагаем конкурентные условия, 
            гибкий график и поддержку коллег. Если вы разделяете наши ценности и хотите помогать людям 
            в комфортной профессиональной среде, отправьте заявку.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Новое поле ФИО */}
            <div>
              <Input
                label="ФИО"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Иванов Иван Иванович"
                required
              />
            </div>

            <div>
              <Input
                label="Электронная почта"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                required
              />
              <p className="text-muted-foreground mt-2">Обязательно наличие @ и домена</p>
            </div>

            {/* Поле образования */}
            <div>
              <label className="block mb-2">
                Образование <span className="text-destructive">*</span>
              </label>
              <textarea
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="Укажите ваше образование, университет, специальность, год окончания, дополнительные курсы и сертификаты..."
                required
                rows={4}
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

            {/* Поле опыта работы */}
            <div>
              <label className="block mb-2">
                Опыт работы <span className="text-destructive">*</span>
              </label>
              <textarea
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Опишите ваш опыт работы, места работы, специализацию, количество лет практики, методы работы..."
                required
                rows={5}
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

            {/* Поле загрузки фото */}
            <div>
              <label className="block mb-2">
                Ваше фото <span className="text-destructive">*</span>
              </label>
              
              {!photoPreview ? (
                <label className="
                  flex flex-col items-center justify-center
                  w-full h-40
                  border-2 border-dashed border-border
                  rounded-lg
                  cursor-pointer
                  hover:border-primary hover:bg-secondary
                  transition-all
                ">
                  <Image size={32} className="text-muted-foreground mb-2" />
                  <span className="text-foreground mb-1">Выбрать фото</span>
                  <span className="text-muted-foreground">или перетащите сюда</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handlePhotoChange}
                  />
                </label>
              ) : (
                <div className="
                  relative
                  w-40 h-40
                  border border-border
                  rounded-lg
                  overflow-hidden
                ">
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="
                      absolute top-2 right-2
                      bg-white
                      rounded-full
                      p-1
                      text-destructive
                      hover:bg-destructive
                      hover:text-white
                      transition-colors
                      shadow-md
                    "
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              
              <p className="text-muted-foreground mt-2">
                Поддерживаемые форматы: JPG, PNG, WEBP. Максимальный размер: 5 МБ
              </p>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              Отправить заявку
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}