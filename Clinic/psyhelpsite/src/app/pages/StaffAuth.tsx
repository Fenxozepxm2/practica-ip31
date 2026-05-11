import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

export function StaffAuth() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { loginStaff, isLoading } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.includes('@') || !email.includes('.')) {
      toast.error('Некорректный формат email');
      return;
    }

    if (password.length < 6) {
      toast.error('Пароль должен содержать минимум 6 символов');
      return;
    }

    try {
      await loginStaff(email, password);
      toast.success('Вход выполнен успешно');
      navigate('/staff-profile');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка входа');
    }
  };

  return (
    <div className="min-h-[calc(100vh-88px)] bg-secondary flex items-center justify-center py-20 px-8">
      <div className="max-w-[500px] w-full">
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-primary hover:text-accent transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Вход для пациентов
        </Link>

        <div className="bg-white rounded-lg p-12">
          <h2 className="mb-2">Вход для сотрудников</h2>
          <p className="text-muted-foreground mb-8">
            Доступ только для специалистов клиники
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Корпоративная почта"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="specialist@clinic.com"
              required
            />

            <div className="relative">
              <Input
                label="Пароль"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          </form>

          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-muted-foreground text-center">
              Для входа используйте корпоративную почту
            </p>
            <p className="text-muted-foreground text-center mt-2">
              Пример: anna.petrova@clinic.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}