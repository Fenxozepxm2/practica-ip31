import re
from rest_framework import serializers
from .models import Psychologist, Session, User, Client, Method, Problem, PsychologistApplication
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# Специально для изменения данных обычного клиента
class ClientEditSerializer(serializers.ModelSerializer):
    # Добавляем поля из таблицы User
    email = serializers.EmailField(source='user.email', required=False)
    phone = serializers.CharField(source='user.phone', required=False)

    class Meta:
        model = Client
        fields = ['name', 'surname', 'patronymic', 'email', 'phone']

    def update(self, instance, validated_data):
        # 1. Достаем данные пользователя (email, phone), если они есть
        user_data = validated_data.pop('user', {})
        
        # 2. Обновляем саму модель Client (name, surname, patronymic)
        instance.name = validated_data.get('name', instance.name)
        instance.surname = validated_data.get('surname', instance.surname)
        instance.patronymic = validated_data.get('patronymic', instance.patronymic)
        instance.save()

        # 3. Обновляем модель User (телефон и почту)
        if user_data:
            user = instance.user
            if 'email' in user_data:
                user.email = user_data['email']
            if 'phone' in user_data:
                user.phone = user_data['phone']
                user.username = user_data['phone']  # Так как USERNAME_FIELD = 'phone'
            user.save()

        return instance

# Редактирование ЛК психолога
class PsychologistEditSerializer(serializers.ModelSerializer):
    methods = serializers.PrimaryKeyRelatedField(many=True, queryset=Method.objects.all(), required=False)
    problems = serializers.PrimaryKeyRelatedField(many=True, queryset=Problem.objects.all(), required=False)
    
    # связываем поле camelCase из React со snake_case из модели
    selectedMethods = serializers.JSONField(source='selected_methods', required=False)

    class Meta:
        model = Psychologist
        fields = ['full_name', 'education', 'experience', 'photo', 'methods', 'problems', 'selectedMethods']

    def update(self, instance, validated_data):
        # 1. Извлекаем связи Many-to-Many из пришедших данных
        methods_data = validated_data.pop('methods', None)
        problems_data = validated_data.pop('problems', None)
        
        # Извлекаем JSON-поле (благодаря source='selected_methods', ключ будет в snake_case)
        selected_methods_data = validated_data.pop('selected_methods', None)

        # 2. Обновляем все остальные обычные поля (имя, образование, опыт, фото)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if selected_methods_data is not None:
            instance.selected_methods = selected_methods_data

        instance.save()

        # 3. ПРИНУДИТЕЛЬНО перезаписываем связи. 
        # Метод .set() сам удалит из БД снятые галочки и добавит новые.
        if methods_data is not None:
            instance.methods.set(methods_data)
            
        if problems_data is not None:
            instance.problems.set(problems_data)

        return instance

# Профиль пользователя (для /api/profile/me/)
class UserProfileSerializer(serializers.ModelSerializer):
    details = serializers.SerializerMethodField()
    sessions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'phone', 'email', 'role', 'details', 'sessions']

    def get_details(self, obj):
        if obj.role == 'client' and hasattr(obj, 'client'):
            return {
                "name": obj.client.name,
                "surname": obj.client.surname,
                "patronymic": obj.client.patronymic,
            }
        elif obj.role == 'psychologist' and hasattr(obj, 'psychologist'):
            return {
                "full_name": obj.psychologist.full_name,
                "education": obj.psychologist.education,
                "experience": obj.psychologist.experience,
                "photo": obj.psychologist.photo.url if obj.psychologist.photo else None,
                "problems": [prob.name for prob in obj.psychologist.problems.all()],
                "methods": [meth.name for meth in obj.psychologist.methods.all()],
                "selectedMethods": obj.psychologist.selected_methods,
            }
        elif obj.role == 'manager':
            profile = getattr(obj, 'manager', None)
            if profile:
                return {"full_name": profile.full_name, "type": "Администрация"}
        return {"info": "Дополнительный профиль не заполнен"}

    def get_sessions(self, obj):
        try:
            if obj.role == 'client' and hasattr(obj, 'client'):
                qs = Session.objects.filter(client=obj.client).select_related('psychologist', 'statussession')
            elif obj.role == 'psychologist' and hasattr(obj, 'psychologist'):
                qs = Session.objects.filter(psychologist=obj.psychologist).select_related('client__user', 'statussession')
            else:
                return []
                
            return [{
                "id": s.id,
                "status": s.statussession.name,
                "date": s.date,
                "time": s.time.strftime('%H:%M') if s.time else None,
                "client_name": f"{s.client.surname} {s.client.name}",
                "client_phone": s.client.user.phone if hasattr(s.client, 'user') else "",
                "notes": s.notes
            } for s in qs]
        except Exception as e:
            print(e)
            return []

    # ДОБАВЛЕНО: Этот метод принудительно перезаписывает данные в связанных таблицах (Client / Psychologist)
    def update(self, instance, validated_data):
        # 1. Обновляем основные поля User (например, email)
        instance.email = validated_data.get('email', instance.email)
        if 'phone' in validated_data:
            instance.phone = validated_data.get('phone', instance.phone)
        instance.save()

        # 2. Достаем сырые данные от React (так как DRF отсекает поля, которых нет в Meta.fields)
        request = self.context.get('request')
        if request and hasattr(request, 'data'):
            data = request.data

            # 3. Если это Клиент - обновляем таблицу Client
            if instance.role == 'client' and hasattr(instance, 'client'):
                client = instance.client
                if 'name' in data:
                    client.name = data['name']
                if 'surname' in data:
                    client.surname = data['surname']
                if 'patronymic' in data:
                    client.patronymic = data['patronymic']
                client.save()

            # 4. Если это Психолог - обновляем таблицу Psychologist
            elif instance.role == 'psychologist' and hasattr(instance, 'psychologist'):
                psychologist = instance.psychologist
                if 'full_name' in data:
                    psychologist.full_name = data['full_name']
                psychologist.save()

        return instance

# Логин
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'phone'

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        return token


# Для заявки психолога
class PsychologistApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PsychologistApplication
        fields = ['full_name', 'email', 'education', 'experience', 'photo']


# Регистрация клиента
class ClientRegisterSerializer(serializers.ModelSerializer):
    name = serializers.CharField(write_only=True)
    surname = serializers.CharField(write_only=True)
    patronymic = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=6)
    email = serializers.EmailField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['phone', 'email', 'password', 'name', 'surname', 'patronymic']

    def validate_name(self, value):
        if any(char.isdigit() for char in value):
            raise serializers.ValidationError("Имя не может содержать цифры.")
        return value

    def validate_surname(self, value):
        if any(char.isdigit() for char in value):
            raise serializers.ValidationError("Фамилия не может содержать цифры.")
        return value

    def validate_patronymic(self, value):
        if value and any(char.isdigit() for char in value):
            raise serializers.ValidationError("Отчество не может содержать цифры.")
        return value

    def validate_phone(self, value):
        digits = re.sub(r'\D', '', value)
        if len(digits) != 11:
            raise serializers.ValidationError("Номер телефона должен содержать 11 цифр.")
        return value
    
    def create(self, validated_data):
        name = validated_data.pop('name')
        surname = validated_data.pop('surname')
        patronymic = validated_data.pop('patronymic', '')
        password = validated_data.pop('password')
        email = validated_data.pop('email')
        phone = validated_data['phone']

        if User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError(
                {"phone": "Пользователь с таким номером телефона уже существует."}
            )

        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError(
                {"email": "Пользователь с такой электронной почтой уже существует."}
            )

        user = User(
            username=phone,
            phone=phone,
            email=email,
            role='client',
        )
        user.set_password(password)
        user.save()

        Client.objects.create(
            user=user,
            name=name,
            surname=surname,
            patronymic=patronymic
        )

        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email']


class PsychologistSerializer(serializers.ModelSerializer):
    methods = serializers.SerializerMethodField()
    problems = serializers.SerializerMethodField()
    # ДОБАВЛЕНО: поле для вывода методов и техник, которые специалист указал в ЛК
    selectedMethods = serializers.JSONField(source='selected_methods', read_only=True)

    class Meta:
        model = Psychologist
        # ДОБАВЛЕНО: 'selectedMethods' добавлен в список полей, qlick_url если нужно
        fields = ['id', 'full_name', 'education', 'experience', 'photo', 'methods', 'problems', 'selectedMethods', 'qlick_url']

    def get_methods(self, obj):
        return [{'id': m.id, 'name': m.name} for m in obj.methods.all()]

    def get_problems(self, obj):
        return [{'id': p.id, 'name': p.name} for p in obj.problems.all()]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if data.get('photo') and not data['photo'].startswith('http'):
            # Защита от дублирования хоста
            data['photo'] = f"http://127.0.0.1:8000{data['photo']}"
        return data

class MethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Method
        fields = ['id', 'name']


class ProblemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Problem
        fields = ['id', 'name']

from rest_framework import serializers
from .models import Session, Client, Psychologist, Statussession, Statusplatezh, Platezhi, User

class SessionCreateSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(write_only=True)
    session_status = serializers.ChoiceField(
        choices=['planned', 'done', 'declined'],
        write_only=True,
        default='planned'
    )
    payment_status = serializers.ChoiceField(
        choices=['paid', 'unpaid'],
        write_only=True,
        default='unpaid'
    )
    notes = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Session
        fields = ['client_name', 'notes', 'session_status', 'payment_status', 'date', 'time']

    def create(self, validated_data):
        request = self.context['request']
        user = request.user

        try:
            psychologist = user.psychologist
        except Psychologist.DoesNotExist:
            raise serializers.ValidationError({
                "detail": "У текущего пользователя нет профиля психолога."
            })

        client_name = validated_data.pop('client_name').strip()
        session_status_code = validated_data.pop('session_status', 'planned')
        payment_status_code = validated_data.pop('payment_status', 'unpaid')

        parts = client_name.split()
        surname = parts[0] if len(parts) > 0 else ''
        name = parts[1] if len(parts) > 1 else client_name
        patronymic = parts[2] if len(parts) > 2 else ''

        client = Client.objects.filter(
            surname=surname,
            name=name,
            patronymic=patronymic
        ).first()

        if not client:
            import uuid
            client_user = User.objects.create(
                username=f'client_{uuid.uuid4().hex[:8]}',
                phone=f'temp_{uuid.uuid4().hex[:10]}',
                role='client'
            )
            client = Client.objects.create(
                user=client_user,
                surname=surname,
                name=name,
                patronymic=patronymic
            )

        status_map = {
            'planned': 'Запланирована',
            'done': 'Проведена',
            'declined': 'Отказ'
        }

        payment_map = {
            'paid': 'Оплачено',
            'unpaid': 'Не оплачено'
        }

        status_name = status_map.get(session_status_code)
        payment_name = payment_map.get(payment_status_code)

        if not status_name:
            raise serializers.ValidationError({
                "session_status": "Недопустимый статус сессии."
            })

        if not payment_name:
            raise serializers.ValidationError({
                "payment_status": "Недопустимый статус платежа."
            })

        statussession, _ = Statussession.objects.get_or_create(name=status_name)
        payment_status, _ = Statusplatezh.objects.get_or_create(name=payment_name)

        session = Session.objects.create(
            client=client,
            psychologist=psychologist,
            statussession=statussession,
            date=validated_data.get('date'),
            time=validated_data.get('time'),
            notes=validated_data.get('notes', '')
        )

        Platezhi.objects.create(
            session=session,
            statusplatezh=payment_status,
            amount='0'
        )

        return session

    def update(self, instance, validated_data):
        # 1. Обновляем прямые поля сессии
        instance.notes = validated_data.get('notes', instance.notes)
        if 'date' in validated_data:
            instance.date = validated_data.get('date')
        if 'time' in validated_data:
            instance.time = validated_data.get('time')

        # 2. Обновляем ФИО клиента
        client_name = validated_data.get('client_name')
        if client_name:
            client_name = client_name.strip()
            parts = client_name.split()
            surname = parts[0] if len(parts) > 0 else ''
            name = parts[1] if len(parts) > 1 else client_name
            patronymic = parts[2] if len(parts) > 2 else ''
            
            # Обновляем связанного клиента
            client = instance.client
            client.surname = surname
            client.name = name
            client.patronymic = patronymic
            client.save()

        # 3. Обновляем статус сессии
        session_status_code = validated_data.get('session_status')
        if session_status_code:
            status_map = {
                'planned': 'Запланирована',
                'done': 'Проведена',
                'declined': 'Отказ'
            }
            status_name = status_map.get(session_status_code)
            if status_name:
                statussession, _ = Statussession.objects.get_or_create(name=status_name)
                instance.statussession = statussession

        # 4. Обновляем статус платежа
        payment_status_code = validated_data.get('payment_status')
        if payment_status_code:
            payment_map = {
                'paid': 'Оплачено',
                'unpaid': 'Не оплачено'
            }
            payment_name = payment_map.get(payment_status_code)
            if payment_name:
                payment_status, _ = Statusplatezh.objects.get_or_create(name=payment_name)
                
                # Ищем связанный платеж
                platezh = Platezhi.objects.filter(session=instance).first()
                if platezh:
                    platezh.statusplatezh = payment_status
                    platezh.save()
                else:
                    # Если платежа почему-то нет, создаем его
                    Platezhi.objects.create(
                        session=instance,
                        statusplatezh=payment_status,
                        amount='0'
                    )

        # Сохраняем саму сессию с обновленными foreign keys и текстами
        instance.save()
        
        return instance

# Этот класс можно удалить, так как Djoser использует свой механизм смены пароля, 
# но если он где-то еще используется, я оставил его без изменений
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

from .models import ClientFeedback

class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientFeedback
        fields = ['session', 'feedback_type', 'description']
    