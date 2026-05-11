import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

export function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { register, isLoading } = useApp();

  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 1) return '+7';
    if (numbers.length <= 4) return `+7 (${numbers.slice(1)}`;
    if (numbers.length <= 7) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4)}`;
    if (numbers.length <= 9) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7)}`;
    return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}-${numbers.slice(9, 11)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!lastName.trim() || /\d/.test(lastName)) {
      toast.error('Фамилия обязательна и не должна содержать цифр');
      return;
    }

    if (!firstName.trim() || /\d/.test(firstName)) {
      toast.error('Имя обязательно и не должно содержать цифр');
      return;
    }
    if (middleName.trim() && /\d/.test(middleName)) {
      toast.error('Отчество не должно содержать цифр');
      return;
    }

    // if (!middleName.trim() || /\d/.test(middleName)) {
    //   toast.error('Отчество обязательно и не должно содержать цифр');
    //   return;
    // }

    const phoneNumbers = registerPhone.replace(/\D/g, '');
    if (phoneNumbers.length !== 11) {
      toast.error('Номер телефона должен содержать 11 цифр');
      return;
    }

    if (!registerEmail.includes('@') || !registerEmail.includes('.')) {
      toast.error('Некорректный формат email');
      return;
    }

    if (registerPassword.length < 6) {
      toast.error('Пароль должен содержать минимум 6 символов');
      return;
    }

    try {
      const fullName = middleName.trim() 
  ? `${lastName.trim()} ${firstName.trim()} ${middleName.trim()}`
  : `${lastName.trim()} ${firstName.trim()}`;
      // const fullName = `${lastName.trim()} ${firstName.trim()} ${middleName.trim()}`;
      await register(fullName, registerPhone, registerEmail, registerPassword);
      
      toast.success('Регистрация прошла успешно! Пожалуйста, войдите в систему.');
      
      // ИСПРАВЛЕНИЕ: Перенаправляем пользователя на страницу входа, а не в профиль
      navigate('/login');
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка регистрации');
    }
  };

  return (
    <div className="min-h-[calc(100vh-88px)] bg-secondary flex items-center justify-center py-20 px-8">
      <div className="max-w-[480px] w-full">
        <div className="bg-white rounded-lg p-12">
          <h2 className="mb-8">Регистрация</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                label="Фамилия"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Иванова"
                required
              />
              <p className="text-muted-foreground mt-2">Без цифр</p>
            </div>

            <div>
              <Input
                label="Имя"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Мария"
                required
              />
              <p className="text-muted-foreground mt-2">Без цифр</p>
            </div>

            <div>
              <Input
                label="Отчество"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="Петровна"
                // required
              />
              <p className="text-muted-foreground mt-2">Не обязательное поле ввода</p>
            </div>

            <div>
              <Input
                label="Номер телефона"
                value={registerPhone}
                onChange={(e) => setRegisterPhone(formatPhone(e.target.value))}
                placeholder="+7 (___) ___-__-__"
                required
              />
              <p className="text-muted-foreground mt-2">11 цифр с учетом кода страны</p>
            </div>

            <div>
              <Input
                label="Электронная почта"
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="example@mail.com"
                required
              />
              <p className="text-muted-foreground mt-2">Обязательно наличие @ и домена</p>
            </div>

            <div className="relative">
              <Input
                label="Пароль"
                type={showPassword ? 'text' : 'password'}
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                placeholder=""
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[44px] text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              <p className="text-muted-foreground mt-2">Минимум 6 символов</p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Зарегистрироваться
            </Button>

            <div className="text-center">
              <span className="text-muted-foreground">Уже есть аккаунт? </span>
              <Link to="/login" className="text-primary hover:underline">
                Войти
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}