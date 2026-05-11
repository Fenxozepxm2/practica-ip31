from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class PhoneOrEmailBackend(ModelBackend):
    def authenticate(self, request, phone=None, password=None, **kwargs):
        if not phone:
            return None

        user = None

        # Ищем по телефону
        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            pass

        # Ищем по email
        if not user:
            try:
                user = User.objects.get(email=phone)
            except User.DoesNotExist:
                pass

        # Ищем по username
        if not user:
            try:
                user = User.objects.get(username=phone)
            except User.DoesNotExist:
                pass

        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user

        return None 