import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<'client' | 'staff'>('client');
  const navigate = useNavigate();
  const { login, loginStaff, isLoading } = useApp();

  // Client login
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Staff login
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 1) return '+7';
    if (numbers.length <= 4) return `+7 (${numbers.slice(1)}`;
    if (numbers.length <= 7) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4)}`;
    if (numbers.length <= 9) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7)}`;
    return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}-${numbers.slice(9, 11)}`;
  };

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginPhone, loginPassword);
      toast.success('Вход выполнен успешно');
      navigate('/profile');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка входа');
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!staffEmail.includes('@') || !staffEmail.includes('.')) {
      toast.error('Некорректный формат email');
      return;
    }

    if (staffPassword.length < 6) {
      toast.error('Пароль должен содержать минимум 6 символов');
      return;
    }

    try {
      await loginStaff(staffEmail, staffPassword);
      toast.success('Вход выполнен успешно');
      navigate('/staff-profile');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка входа');
    }
  };

  return (
    <div className="min-h-[calc(100vh-88px)] bg-secondary flex items-center justify-center py-20 px-8">
      <div className="max-w-[480px] w-full">
        <div className="bg-white rounded-lg p-12">
          {/* Переключатель типа входа */}
          <div className="flex gap-2 mb-8 p-1 bg-secondary rounded-lg">
            <button
              type="button"
              onClick={() => setLoginType('client')}
              className={`
                flex-1 py-2 px-4 rounded-md transition-all text-sm font-medium
                ${loginType === 'client'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              Для пациентов
            </button>
            <button
              type="button"
              onClick={() => setLoginType('staff')}
              className={`
                flex-1 py-2 px-4 rounded-md transition-all text-sm font-medium
                ${loginType === 'staff'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              Для сотрудников
            </button>
          </div>

          <h2 className="mb-2">
            {loginType === 'client' ? 'Вход' : 'Вход для сотрудников'}
          </h2>
          {loginType === 'staff' && (
            <p className="text-muted-foreground mb-8">
              Доступ только для специалистов клиники
            </p>
          )}

          {/* Форма для пациентов */}
          {loginType === 'client' && (
            <form onSubmit={handleClientSubmit} className="space-y-6">
              <div className="relative">
                <Input
                  label="Номер телефона"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(formatPhone(e.target.value))}
                  placeholder="+7 (___) ___-__-__"
                  required
                />
              </div>
              
              <div className="relative">
                <Input
                  label="Пароль"
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
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
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                Войти
              </Button>

              <div className="text-center">
                <span className="text-muted-foreground">Нет аккаунта? </span>
                <Link to="/register" className="text-primary hover:underline">
                  Зарегистрироваться
                </Link>
              </div>
            </form>
          )}

          {/* Форма для сотрудников */}
          {loginType === 'staff' && (
            <form onSubmit={handleStaffSubmit} className="space-y-6">
              <Input
                label="Корпоративная почта"
                type="email"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                placeholder="specialist@clinic.com"
                required
              />

              <div className="relative">
                <Input
                  label="Пароль"
                  type={showPassword ? 'text' : 'password'}
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
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
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                Войти в систему
              </Button>

              <div className="pt-6 border-t border-border">
                <p className="text-muted-foreground text-center text-sm">
                  Для входа используйте корпоративную почту
                </p>
                <p className="text-muted-foreground text-center mt-1 text-sm">
                  Пример: anna.petrova@clinic.com
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}