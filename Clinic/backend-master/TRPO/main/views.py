from datetime import datetime
from django.shortcuts import render
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView

# Импортируем модели
from .models import (
    Psychologist, Method, Problem, PsychologistApplication, 
    Session, Statussession, Client
)

# Импортируем сериализаторы
from .serializers import (
    MyTokenObtainPairSerializer, PsychologistSerializer, ClientRegisterSerializer, 
    MethodSerializer, ProblemSerializer, PsychologistApplicationSerializer,
    UserProfileSerializer, PsychologistEditSerializer, ClientEditSerializer,
    SessionCreateSerializer, ChangePasswordSerializer
)


class AvailableSlotsView(APIView):
    permission_classes = [permissions.AllowAny] # Можно оставить доступным для всех, чтобы видеть расписание до логина

    def get(self, request, pk):
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({'error': 'Не указана дата (date)'}, status=400)
        
        # 1. Задаем стандартные рабочие часы (например, с 9:00 до 18:00, каждый час)
        all_slots = [
            '09:00', '10:00', '11:00', '12:00', '13:00', 
            '14:00', '15:00', '16:00', '17:00', '18:00'
        ]
        
        # 2. Ищем все уже занятые сессии для этого психолога на эту дату
        booked_sessions = Session.objects.filter(
            psychologist_id=pk,
            date=date_str
        ).values_list('time', flat=True)
        
        # 3. Преобразуем занятое время из формата БД (datetime.time) в строки 'HH:MM'
        booked_slots = [t.strftime('%H:%M') for t in booked_sessions if t]
        
        # 4. Вычитаем занятые слоты из всех слотов
        available_slots = [slot for slot in all_slots if slot not in booked_slots]
        
        return Response({'available_slots': available_slots})


class MyProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        return self._update_profile(request)

    def put(self, request):
        return self._update_profile(request)

    def _update_profile(self, request):
        try:
            user = request.user
            data = request.data
            
            # Защита от null (если details пришел как null, делаем его пустым словарем)
            details = data.get('details') or {}
            
            def get_val(key):
                if key in data:
                    return data[key]
                if isinstance(details, dict) and key in details:
                    return details[key]
                return None

            # 1. Обновляем телефон и почту
            if get_val('email') is not None:
                user.email = get_val('email')
            if get_val('phone') is not None:
                user.phone = get_val('phone')
                user.username = get_val('phone')
            user.save()

            # 2. Если это КЛИЕНТ
            if user.role == 'client':
                # Добавляем defaults, чтобы база не ругалась на пустые поля при создании
                client, created = Client.objects.get_or_create(
                    user=user, 
                    defaults={'name': 'Не указано', 'surname': 'Не указано'}
                )
                
                if get_val('name') is not None:
                    client.name = get_val('name')
                if get_val('surname') is not None:
                    client.surname = get_val('surname')
                if get_val('patronymic') is not None:
                    client.patronymic = get_val('patronymic')
                client.save()

            # 3. Если это ПСИХОЛОГ
            elif user.role == 'psychologist':
                psychologist, created = Psychologist.objects.get_or_create(
                    user=user,
                    defaults={'full_name': 'Не указано'}
                )
                if get_val('full_name') is not None:
                    psychologist.full_name = get_val('full_name')
                if get_val('education') is not None:
                    psychologist.education = get_val('education')
                if get_val('experience') is not None:
                    psychologist.experience = get_val('experience')
                if get_val('selectedMethods') is not None:
                    psychologist.selected_methods = get_val('selectedMethods')
                
                psychologist.save()

                if get_val('methods') is not None:
                    psychologist.methods.set(get_val('methods'))
                if get_val('problems') is not None:
                    psychologist.problems.set(get_val('problems'))

            serializer = UserProfileSerializer(user, context={'request': request})
            return Response(serializer.data)

        except Exception as e:
            # Если сервер снова упадет, мы поймаем ошибку и вернем ее прямо в React!
            import traceback
            traceback.print_exc() # Распечатает красную ошибку в терминал Django
            return Response(
                {"detail": f"Внутренняя ошибка сервера: {str(e)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


# для заявки психолога
class ApplyAsPsychologistView(generics.CreateAPIView):
    queryset = PsychologistApplication.objects.all()
    serializer_class = PsychologistApplicationSerializer
    permission_classes = [permissions.AllowAny]


class PsychologistListView(generics.ListAPIView):
    # Только психологи с активным аккаунтом
    queryset = Psychologist.objects.filter(user__isnull=False, user__is_active=True)
    serializer_class = PsychologistSerializer
 

# регистрация клиента
class ClientRegisterView(generics.CreateAPIView):
    serializer_class = ClientRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Клиент успешно зарегистрирован"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        

# выводит методы
class MethodListView(generics.ListAPIView):
    queryset = Method.objects.all()
    serializer_class = MethodSerializer


# выводит проблемы
class ProblemListView(generics.ListAPIView):
    queryset = Problem.objects.all()
    serializer_class = ProblemSerializer


# Выводит одного психолога по ID (для страницы "Подробнее")
class PsychologistDetailView(generics.RetrieveAPIView):
    queryset = Psychologist.objects.all()
    serializer_class = PsychologistSerializer


# ИСПРАВЛЕНО: Добавлен метод perform_create для статуса

class SessionCreateView(APIView):
    # Используем базовый APIView для полного контроля над процессом
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            # 1. Проверяем, есть ли у пользователя профиль клиента
            user = request.user
            if not hasattr(user, 'client'):
                return Response(
                    {'detail': 'Ошибка: Записываться могут только пользователи с ролью "Клиент".'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            client = user.client

            # 2. Проверяем, передан ли психолог
            psychologist_id = request.data.get('psychologist')
            if not psychologist_id:
                return Response(
                    {'detail': 'Ошибка: Не передан ID психолога.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Ищем психолога в базе
            psychologist = Psychologist.objects.get(id=psychologist_id)

            # 3. Берем дату и время из React
            date = request.data.get('date')
            time = request.data.get('time')

            # 4. Создаем или получаем статус "Новая заявка" без жесткой привязки к id=1
            default_status, _ = Statussession.objects.get_or_create(name='Новая заявка')

            # 5. Вручную создаем сессию в базе данных!
            session = Session.objects.create(
                client=client,
                psychologist=psychologist,
                statussession=default_status,
                date=date,
                time=time
            )

            return Response({'id': session.id, 'detail': 'Успешно'}, status=status.HTTP_201_CREATED)
            
        except Psychologist.DoesNotExist:
            return Response({'detail': 'Ошибка: Психолог с таким ID не найден.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            # Если база данных снова выдаст FOREIGN KEY constraint failed, мы отправим это прямо в React
            import traceback
            traceback.print_exc() # Выведет красную ошибку в терминале Django
            return Response({'detail': f'Критическая ошибка БД: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            user = request.user
            
            # Проверяем правильность текущего пароля
            if not user.check_password(serializer.data.get("old_password")):
                return Response(
                    {"old_password": ["Неверный текущий пароль."]}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Хешируем и сохраняем новый пароль в базу данных
            user.set_password(serializer.data.get("new_password"))
            user.save()
            
            return Response(
                {"detail": "Пароль успешно изменен."}, 
                status=status.HTTP_200_OK
            )
from rest_framework import generics
from .models import ClientFeedback
from .serializers import FeedbackSerializer
from rest_framework.permissions import IsAuthenticated

class FeedbackCreateView(generics.CreateAPIView):
    queryset = ClientFeedback.objects.all() # Изменили queryset
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .serializers import SessionCreateSerializer
class BookingCreateView(generics.CreateAPIView):
    serializer_class = SessionCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        session = serializer.save()

        return Response({
            "id": session.id,
            "status": session.statussession.name if session.statussession else None,
            "date": session.date,
            "time": session.time.strftime('%H:%M') if session.time else None,
            "client_name": f"{session.client.surname} {session.client.name}",
            "client_phone": session.client.user.phone if hasattr(session.client, 'user') else "",
            "notes": session.notes,
        }, status=201)

from rest_framework import generics, permissions
from .models import Session
from .serializers import SessionCreateSerializer

class BookingRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SessionCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'psychologist'):
            return Session.objects.filter(psychologist=user.psychologist)
        return Session.objects.none()