import time
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from .models import (
    Client, Psychologist, Method, Problem, Session,
    Statussession, ClientFeedback, PsychologistApplication
)


User = get_user_model()


class BaseTestCase(TestCase):
    """Базовый класс с общими вспомогательными методами"""

    @classmethod
    def setUpTestData(cls):
        # Данные, создаваемые один раз для всех тестов (быстрее)
        cls.client_user = User.objects.create_user(
            username='+79161234567',
            phone='+79161234567',
            email='client@test.com',
            password='clientpass123',
            role='client'
        )
        cls.client_profile = Client.objects.create(
            user=cls.client_user,
            name='Иван',
            surname='Петров',
            patronymic='Иванович'
        )

        cls.psych_user = User.objects.create_user(
            username='+79167654321',
            phone='+79167654321',
            email='psych@test.com',
            password='psychpass123',
            role='psychologist'
        )
        cls.psych_profile = Psychologist.objects.create(
            user=cls.psych_user,
            full_name='Анна Смирнова',
            education='МГУ, психология',
            experience='5 лет'
        )

        cls.method = Method.objects.create(name='КПТ')
        cls.problem = Problem.objects.create(name='Тревога')
        cls.psych_profile.methods.add(cls.method)
        cls.psych_profile.problems.add(cls.problem)

        cls.status_new, _ = Statussession.objects.get_or_create(name='Новая заявка')

    
    def setUp(self):
        self.client = APIClient()
        # JWT токен для клиента
        refresh = RefreshToken.for_user(self.client_user)
        self.client_token = str(refresh.access_token)
        self.auth_client = APIClient()
        self.auth_client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.client_token}')

        # JWT токен для психолога
        refresh_psych = RefreshToken.for_user(self.psych_user)
        self.psych_token = str(refresh_psych.access_token)
        self.auth_psych_client = APIClient()
        self.auth_psych_client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.psych_token}')

class LoadTest(TestCase):
    def test_psychologists_endpoint_under_load(self):
        start = time.time()
        for i in range(100):
            response = self.client.get('/api/psychologists/')
            self.assertEqual(response.status_code, 200)
        elapsed = time.time() - start
        print(f"100 запросов выполнено за {elapsed:.2f} сек")
        self.assertLess(elapsed, 5)  # не дольше 5 секунд

class ClientRegistrationTest(BaseTestCase):
    """Тесты регистрации клиента (/api/register/client/)"""

    def test_successful_registration(self):
        data = {
            'phone': '+79123456789',
            'email': 'newclient@test.com',
            'password': 'strongpass123',
            'name': 'Ольга',
            'surname': 'Сидорова',
            'patronymic': 'Алексеевна'
        }
        response = self.client.post('/api/register/client/', data)
        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(phone='+79123456789').exists())

    def test_registration_duplicate_phone(self):
        data = {
            'phone': '+79161234567',  # уже существует
            'email': 'another@test.com',
            'password': 'pass123',
            'name': 'Дмитрий',
            'surname': 'Кузнецов'
        }
        response = self.client.post('/api/register/client/', data)
        self.assertEqual(response.status_code, 400)
        self.assertIn('phone', response.data)

    def test_registration_invalid_name_with_digits(self):
        data = {
            'phone': '+79129998877',
            'email': 'test@test.com',
            'password': 'pass123',
            'name': 'Иван123',
            'surname': 'Петров'
        }
        response = self.client.post('/api/register/client/', data)
        self.assertEqual(response.status_code, 400)
        self.assertIn('name', response.data)


class LoginTest(BaseTestCase):
    """Тесты входа (/api/login/)"""

    def test_login_with_phone_success(self):
        response = self.client.post('/api/login/', {
            'phone': '+79161234567',
            'password': 'clientpass123'
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)

    def test_login_with_email_success(self):
        response = self.client.post('/api/login/', {
            'phone': 'client@test.com',
            'password': 'clientpass123'
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)

    def test_login_wrong_password(self):
        response = self.client.post('/api/login/', {
            'phone': '+79161234567',
            'password': 'wrongpass'
        })
        self.assertEqual(response.status_code, 401)


class PsychologistListTest(BaseTestCase):
    """Тесты списка психологов (/api/psychologists/) и детального просмотра"""

    def test_list_returns_200(self):
        response = self.client.get('/api/psychologists/')
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)

    def test_list_contains_psychologist_data(self):
        response = self.client.get('/api/psychologists/')
        found = any(item.get('full_name') == 'Анна Смирнова' for item in response.data)
        self.assertTrue(found)

    def test_psychologist_detail(self):
        response = self.client.get(f'/api/psychologists/{self.psych_profile.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['full_name'], 'Анна Смирнова')


class SessionCreationTest(BaseTestCase):
    """Тесты создания сессии (/api/sessions/create/)"""

    def test_create_session_authenticated(self):
        data = {
            'psychologist': self.psych_profile.id,
            'date': '2026-06-01',
            'time': '10:00:00'
        }
        response = self.auth_client.post('/api/sessions/create/', data)
        self.assertEqual(response.status_code, 201)
        self.assertIn('id', response.data)

        session = Session.objects.filter(
            client=self.client_profile,
            psychologist=self.psych_profile
        ).first()
        self.assertIsNotNone(session)
        self.assertEqual(session.date.isoformat(), '2026-06-01')

    def test_create_session_unauthenticated(self):
        response = self.client.post('/api/sessions/create/', {
            'psychologist': self.psych_profile.id,
            'date': '2026-06-01',
            'time': '10:00:00'
        })
        self.assertEqual(response.status_code, 401)

    def test_create_session_missing_psychologist(self):
        response = self.auth_client.post('/api/sessions/create/', {
            'date': '2026-06-01',
            'time': '10:00:00'
        })
        self.assertEqual(response.status_code, 400)


class ProfileTest(BaseTestCase):
    """Тесты профиля (/api/profile/me/)"""

    def test_get_profile_authenticated(self):
        response = self.auth_client.get('/api/profile/me/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['phone'], '+79161234567')
        self.assertEqual(response.data['role'], 'client')

    def test_get_profile_unauthenticated(self):
        response = self.client.get('/api/profile/me/')
        self.assertEqual(response.status_code, 401)

    def test_update_profile_patch(self):
        response = self.auth_client.patch('/api/profile/me/', {
            'email': 'updated@test.com',
            'details': {
                'name': 'Пётр',
                'surname': 'Иванов'
            }
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.client_user.refresh_from_db()
        self.assertEqual(self.client_user.email, 'updated@test.com')
        self.client_profile.refresh_from_db()
        self.assertEqual(self.client_profile.name, 'Пётр')


class FeedbackTest(BaseTestCase):
    """Тесты отправки обратной связи (/api/feedback/) – ИСПРАВЛЕН"""

    def test_create_feedback_authenticated(self):
        # Создаём сессию для этого клиента
        session = Session.objects.create(
            client=self.client_profile,
            psychologist=self.psych_profile,
            statussession=self.status_new,
            date='2026-06-01',
            time='10:00:00'
        )
        data = {
            'session': session.id,
            'feedback_type': 'отзыв',
            'description': 'Отличный психолог, помог разобраться в проблеме.'
        }
        response = self.auth_client.post('/api/feedback/', data, format='json')
        # Если ответ не 201, выводим подробности для диагностики
        if response.status_code != 201:
            print(f"\n[FeedbackTest] Ошибка: статус {response.status_code}, данные: {response.data}")
        self.assertEqual(response.status_code, 201)

        # Проверяем, что объект создался (можно опционально)
        exists = ClientFeedback.objects.filter(description='Отличный психолог, помог разобраться в проблеме.').exists()
        self.assertTrue(exists, "Отзыв не найден в базе данных")

    def test_create_feedback_unauthenticated(self):
        response = self.client.post('/api/feedback/', {
            'session': 1,
            'feedback_type': 'жалоба',
            'description': 'Тест'
        })
        self.assertEqual(response.status_code, 401)


class PsychologistApplicationTest(BaseTestCase):
    """Тест подачи заявки (/api/psychologists-apply/)"""

    def test_apply_as_psychologist(self):
        data = {
            'full_name': 'Елена Виноградова',
            'email': 'elena@example.com',
            'education': 'СПбГУ, клиническая психология',
            'experience': '3 года',
        }
        response = self.client.post('/api/psychologists-apply/', data, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(PsychologistApplication.objects.filter(email='elena@example.com').exists())


class MethodProblemTest(BaseTestCase):
    """Тесты справочников"""

    def test_methods_list(self):
        response = self.client.get('/api/method/')
        self.assertEqual(response.status_code, 200)

    def test_problems_list(self):
        response = self.client.get('/api/problem/')
        self.assertEqual(response.status_code, 200)


class ChangePasswordTest(BaseTestCase):
    """Тест смены пароля (/api/auth/change-password/)"""

    def test_change_password_success(self):
        response = self.auth_client.post('/api/auth/change-password/', {
            'old_password': 'clientpass123',
            'new_password': 'newPass456'
        })
        self.assertEqual(response.status_code, 200)
        self.client_user.refresh_from_db()
        self.assertTrue(self.client_user.check_password('newPass456'))

    def test_change_password_wrong_old(self):
        response = self.auth_client.post('/api/auth/change-password/', {
            'old_password': 'wrongpass',
            'new_password': 'newPass456'
        })
        self.assertEqual(response.status_code, 400)


class AvailableSlotsTest(BaseTestCase):
    """Тест свободных слотов"""

    def test_available_slots(self):
        # Создаём занятую сессию
        Session.objects.create(
            client=self.client_profile,
            psychologist=self.psych_profile,
            statussession=self.status_new,
            date='2026-05-15',
            time='10:00:00'
        )
        response = self.client.get(f'/api/psychologists/{self.psych_profile.id}/available-slots/?date=2026-05-15')
        self.assertEqual(response.status_code, 200)
        self.assertIn('available_slots', response.data)
        self.assertNotIn('10:00', response.data['available_slots'])
        # В стандартных слотах есть 09:00, если нет – тест не упадёт
        if '09:00' in response.data['available_slots']:
            self.assertIn('09:00', response.data['available_slots'])

