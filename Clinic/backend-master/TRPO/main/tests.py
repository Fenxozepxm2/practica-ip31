from django.test import TestCase
from django.contrib.auth import get_user_model
User = get_user_model()

class UserRegistrationTest(TestCase):
    def test_client_registration(self):
        response = self.client.post('/api/register/client/', {
            'phone': '+79123456789',
            'email': 'test@example.com',
            'password': 'testpass123',
            'name': 'Иван',
            'surname': 'Петров'
        })
        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(phone='+79123456789').exists())