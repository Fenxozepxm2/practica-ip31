from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from main.views import (PsychologistListView, PsychologistDetailView,  # добавили PsychologistDetailView
                        ClientRegisterView, MethodListView, ProblemListView, 
                        ApplyAsPsychologistView, BookingRetrieveUpdateDestroyView, BookingCreateView, FeedbackCreateView, MyProfileView, ChangePasswordView, MyTokenObtainPairView, SessionCreateView, AvailableSlotsView)

from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/psychologists/', PsychologistListView.as_view()),
    path('api/psychologists/<int:pk>/', PsychologistDetailView.as_view()),
    path('api/method/', MethodListView.as_view()),
    path('api/problem/', ProblemListView.as_view()),
    path('api/register/client/', ClientRegisterView.as_view(), name='client_register'),
    path('api/psychologists-apply/', ApplyAsPsychologistView.as_view(), name='psych_apply'),
    path('api/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/profile/me/', MyProfileView.as_view()),
    path('api/sessions/create/', SessionCreateView.as_view(), name='session-create'),
    path('api/psychologists/<int:pk>/available-slots/', AvailableSlotsView.as_view(), name='available-slots'),
    path('api/feedback/', FeedbackCreateView.as_view(), name='create-feedback'),
    path('api/bookings/', BookingCreateView.as_view(), name='booking-create'),
    path('api/auth/change-password/', ChangePasswordView.as_view(), name='change-password'),
path('api/bookings/', BookingCreateView.as_view(), name='booking-create'),
    path('api/bookings/<int:pk>/', BookingRetrieveUpdateDestroyView.as_view(), name='booking-detail'),
    ]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)