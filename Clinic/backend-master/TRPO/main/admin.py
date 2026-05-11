from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (User, Psychologist, Session, ClientFeedback, Client, Manager, 
                    Method, Platezhi, Problem, Statusfeedbaack, Statusplatezh,
                    Statussession, Technika, Type, PsychologistMethod, PsychologistProblem, 
                    PsychologistApplication)


class MethodInline(admin.TabularInline):
    model = PsychologistMethod
    extra = 1


class ProblemInline(admin.TabularInline):
    model = PsychologistProblem
    extra = 1


@admin.register(Psychologist)
class PsychologistAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'education', 'experience', 'photo')
    fields = ('user', 'full_name', 'education', 'experience', 'photo', 'qlick_url')
    inlines = [MethodInline, ProblemInline]


@admin.register(PsychologistApplication)
class PsychologistApplicationAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'is_processed', 'created_at')
    fields = ('full_name', 'email', 'education', 'experience', 'is_processed')
    list_editable = ('is_processed',)
    ordering = ('-created_at',)


class MyUserAdmin(UserAdmin):
    list_display = ('username', 'phone', 'role', 'is_active', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        ('Дополнительная информация', {'fields': ('phone', 'role')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Дополнительная информация', {'fields': ('phone', 'role')}),
    )


admin.site.register(User, MyUserAdmin)
admin.site.register(Session)
admin.site.register(ClientFeedback) # ИСПРАВЛЕНО: Теперь регистрируем ClientFeedback
admin.site.register(Client)
admin.site.register(Manager)
admin.site.register(Method)
admin.site.register(Platezhi)
admin.site.register(Problem)
admin.site.register(PsychologistMethod)
admin.site.register(PsychologistProblem)
admin.site.register(Statusfeedbaack)
admin.site.register(Statusplatezh)
admin.site.register(Statussession)
admin.site.register(Technika)
admin.site.register(Type)