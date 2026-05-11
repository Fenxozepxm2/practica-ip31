from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.files.base import ContentFile
import uuid


class User(AbstractUser):
    ROLE_CHOICES = (
        ('client', 'Клиент'),
        ('psychologist', 'Психолог'),
        ('manager', 'Менеджер'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')
    phone = models.CharField(max_length=20, blank=True, null=True, unique=True)

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class PsychologistApplication(models.Model):
    full_name = models.CharField(max_length=150, verbose_name="ФИО")
    email = models.EmailField(unique=True, verbose_name="Электронная почта")
    education = models.CharField(max_length=255, verbose_name="Образование")
    experience = models.CharField(max_length=255, verbose_name="Опыт работы")
    photo = models.BinaryField(blank=True, null=True, verbose_name="Фото (бинарные данные)")

    is_processed = models.BooleanField(default=False, verbose_name="Рассмотрена")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата подачи")

    class Meta:
        managed = True
        db_table = 'psychologist_application'
        verbose_name = "Заявка от психолога"
        verbose_name_plural = "Заявки от психологов"

    def __str__(self):
        return f"Кандидат: {self.full_name} ({self.email})"


class Client(models.Model):
    user = models.OneToOneField('User', on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    surname = models.CharField(max_length=50)
    patronymic = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(max_length=254, blank=True, null=True, verbose_name="Электронная почта")

    class Meta:
        managed = True
        db_table = 'client'

    def __str__(self):
        return f"{self.surname} {self.name}"


class Manager(models.Model):
    user = models.OneToOneField('User', on_delete=models.CASCADE)
    full_name = models.CharField(max_length=150)

    class Meta:
        managed = True
        db_table = 'manager'


class Method(models.Model):
    name = models.CharField(max_length=50)

    class Meta:
        managed = True
        db_table = 'method'

    def __str__(self):
        return self.name


class MethodTechnika(models.Model):
    # ИСПРАВЛЕНО: CASCADE вместо DO_NOTHING
    method = models.ForeignKey(Method, on_delete=models.CASCADE)
    technika = models.ForeignKey('Technika', on_delete=models.CASCADE)

    class Meta:
        managed = True
        db_table = 'method_technika'
        unique_together = (('method', 'technika'),)

    def __str__(self):
        return str(self.method)


class Platezhi(models.Model):
    # ИСПРАВЛЕНО: CASCADE вместо DO_NOTHING для удаления вместе с сессией
    session = models.ForeignKey('Session', on_delete=models.CASCADE, related_name='platezhi_session')
    
    # ИСПРАВЛЕНО: SET_NULL вместо DO_NOTHING, чтобы при удалении статуса платежи оставались
    statusplatezh = models.ForeignKey(
        'Statusplatezh',
        on_delete=models.SET_NULL,
        null=True,
        db_column='statusPlatezh_id'
    )
    amount = models.TextField()

    class Meta:
        managed = True
        db_table = 'platezhi'

    def __str__(self):
        return f"Статус: {self.statusplatezh}"


class Problem(models.Model):
    name = models.CharField(max_length=50)

    class Meta:
        managed = True
        db_table = 'problem'

    def __str__(self):
        return self.name


class Psychologist(models.Model):
    user = models.OneToOneField('User', on_delete=models.CASCADE, blank=True, null=True)
    full_name = models.CharField(max_length=150)
    qlick_url = models.URLField(max_length=255, blank=True, null=True, verbose_name="Ссылка на qlick.io")
    
    education = models.TextField(blank=True, null=True)
    experience = models.TextField(blank=True, null=True)
    photo = models.ImageField(upload_to='Psychologist/', blank=True, null=True)

    selected_methods = models.JSONField(default=list, blank=True, verbose_name="Методы и техники (JSON)")

    problems = models.ManyToManyField(
        'Problem',
        through='PsychologistProblem',
        related_name='psychologists'
    )
    methods = models.ManyToManyField(
        'Method',
        through='PsychologistMethod',
        related_name='psychologists'
    )

    class Meta:
        managed = True
        db_table = 'psychologist'

    def __str__(self):
        return self.full_name


class PsychologistMethod(models.Model):
    id = models.AutoField(primary_key=True)
    # ИСПРАВЛЕНО: CASCADE вместо DO_NOTHING
    psychologist = models.ForeignKey(Psychologist, on_delete=models.CASCADE)
    method = models.ForeignKey(Method, on_delete=models.CASCADE)

    class Meta:
        managed = True
        db_table = 'psychologist_method'

    def __str__(self):
        return f"{self.psychologist} - {self.method}"


class PsychologistProblem(models.Model):
    id = models.AutoField(primary_key=True) 
    psychologist = models.ForeignKey(Psychologist, on_delete=models.CASCADE)
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE)

    class Meta:
        managed = True
        db_table = 'psychologist_problem'
        
    def __str__(self):
        return f"{self.psychologist} - {self.problem}"


class Statusfeedbaack(models.Model):
    name = models.CharField(max_length=50)

    class Meta:
        managed = True
        db_table = 'statusFeedbaack'

    def __str__(self):
        return self.name


class Statusplatezh(models.Model):
    name = models.CharField(max_length=50)

    class Meta:
        managed = True
        db_table = 'statusPlatezh'

    def __str__(self):
        return self.name


class Statussession(models.Model):
    name = models.CharField(max_length=50)

    class Meta:
        managed = True
        db_table = 'statusSession'

    def __str__(self):
        return self.name


class Session(models.Model):
    client = models.ForeignKey('Client', on_delete=models.CASCADE, db_column='client_id')
    psychologist = models.ForeignKey('Psychologist', on_delete=models.CASCADE, db_column='psychologist_id')
    
    # ИСПРАВЛЕНО: SET_NULL, чтобы удаление статуса не стирало все сессии
    statussession = models.ForeignKey(
        'Statussession',
        on_delete=models.SET_NULL,
        null=True,
        db_column='statusSession_id',
        default=1,
        related_name='session_status_rel'
    )
    
    date = models.DateField(blank=True, null=True, verbose_name="Дата сессии")
    time = models.TimeField(blank=True, null=True, verbose_name="Время сессии")

    platezhi = models.ForeignKey(
        'Platezhi', on_delete=models.SET_NULL, null=True, blank=True,
        db_column='platezhi_id', related_name='session_platezhi_rel'
    )
    
    feedback = models.ForeignKey(
        'ClientFeedback', on_delete=models.SET_NULL, null=True, blank=True,
        db_column='feedback_id', related_name='session_feedback_rel'
    )
    notes = models.CharField(max_length=300, blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'session'

    def __str__(self):
        return f"Сессия {self.date} {self.time}: {self.client} — {self.psychologist}"


class Technika(models.Model):
    name = models.CharField(max_length=50)

    class Meta:
        managed = True
        db_table = 'technika'

    def __str__(self):
        return self.name


class Type(models.Model):
    name = models.CharField(max_length=50)

    class Meta:
        managed = True
        db_table = 'type'

    def __str__(self):
        return self.name


# --- ЕДИНСТВЕННАЯ ПРАВИЛЬНАЯ МОДЕЛЬ FEEDBACK ---

class ClientFeedback(models.Model):
    TYPES = (
        ('отзыв', 'Отзыв'),
        ('пожелание', 'Пожелание'),
        ('жалоба', 'Жалоба'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Пользователь")
    session = models.ForeignKey(
        Session, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='client_feedback_set',
        verbose_name="Сессия"
    )
    
    feedback_type = models.CharField(max_length=20, choices=TYPES, verbose_name="Тип обратной связи")
    description = models.TextField(verbose_name="Текст")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")

    class Meta:
        managed = True
        db_table = 'client_feedback'
        verbose_name = "Обратная связь от клиента"
        verbose_name_plural = "Обратная связь от клиентов"

    def __str__(self):
        return f"{self.feedback_type} от {self.user.username}"


@receiver(post_save, sender=PsychologistApplication)
def create_psychologist_automatically(sender, instance, created, **kwargs):
    if created:
        return

    if not instance.is_processed:
        return

    if User.objects.filter(username=instance.email).exists():
        return

    fake_phone = f"temp_{uuid.uuid4().hex[:10]}"

    new_user = User.objects.create(
        username=instance.email,
        phone=fake_phone,
        role='psychologist',
        is_active=True
    )

    new_psychologist = Psychologist.objects.create(
        user=new_user,
        full_name=instance.full_name,
        education=instance.education,
        experience=instance.experience,
    )

    if instance.photo:
        file_name = f"psych_{uuid.uuid4().hex[:8]}.jpg"
        new_psychologist.photo.save(file_name, ContentFile(instance.photo), save=True)

    first_method = Method.objects.first()
    first_problem = Problem.objects.first()

    if first_method:
        new_psychologist.methods.add(first_method)

    if first_problem:
        new_psychologist.problems.add(first_problem)