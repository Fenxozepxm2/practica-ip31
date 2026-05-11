import os
import sys
import django
import asyncio
from asgiref.sync import sync_to_async

# --- 1. НАСТРОЙКА ОКРУЖЕНИЯ DJANGO ---
# Определяем путь к корню проекта (папка TRPO)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Указываем файл настроек (папка core)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Инициализируем Django
try:
    django.setup()
except RuntimeError:
    pass

# --- 2. ИМПОРТ МОДЕЛЕЙ И БИБЛИОТЕК ---
from main.models import User, Client, Psychologist, Method
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder

# --- 3. НАСТРОЙКИ БОТА ---
API_TOKEN = '8033818914:AAFauKsh078AnIS-iWPXg9Ju6L8-1fuoQ8c'
bot = Bot(token=API_TOKEN)
dp = Dispatcher()
@sync_to_async
def get_all_methods():
    return list(Method.objects.all())

@sync_to_async
def get_psychologists_by_method(method_id):
    # Фильтруем и сразу забираем данные, чтобы в асинхронном коде не было ошибок
    psychs = Psychologist.objects.filter(methods__id=method_id).prefetch_related('methods')
    results = []
    for p in psychs:
        # Собираем данные в словари, так как обращение к ManyToMany (methods) в async упадет
        results.append({
            "full_name": p.full_name,
            "education": p.education,
            "experience": p.experience,
            "qlick_url": p.qlick_url,
            "photo_path": p.photo.path if p.photo else None
        })
    return results

# --- 4. ЛОГИКА ДИАЛОГОВОГО ИНТЕРФЕЙСА ---

# Команда /start - приветствие и главная кнопка
@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    # Создаем обычную кнопку внизу экрана
    kb = ReplyKeyboardBuilder()
    kb.button(text="🔍 Найти психолога")
    
    await message.answer(
        f"Здравствуйте, {message.from_user.first_name}!\n"
        "Я бот федеральной службы психологической помощи.\n"
        "Помогу вам подобрать специалиста прямо здесь.",
        reply_markup=kb.as_markup(resize_keyboard=True)
    )

# Обработка нажатия на "Найти психолога"
@dp.message(F.text == "🔍 Найти психолога")
async def show_methods(message: types.Message):
    # Получаем уже ГОТОВЫЙ список (благодаря list() внутри get_all_methods)
    methods = await get_all_methods()
    
    # Вместо exists() используем обычную проверку списка
    #if not methods: 
        #await message.answer("В базе пока нет направлений.")
        #return

    builder = InlineKeyboardBuilder()
    for m in methods:
        builder.button(text=m.name, callback_data=f"meth_{m.id}")
    
    builder.adjust(2)
    await message.answer("Выберите метод работы:", reply_markup=builder.as_markup())

# Обработка выбора конкретного метода
@dp.callback_query(F.data.startswith("meth_"))
async def filter_psychologists(callback: types.CallbackQuery):
    # Вытаскиваем ID метода из колбэка
    method_id = int(callback.data.split("_")[1])
    
    # Вызываем асинхронную функцию
    psychs = await get_psychologists_by_method(method_id)
    
    if not psychs:
        await callback.message.answer("К сожалению, по выбранному методу пока нет ведущих психологов.")
    else:
        for p in psychs:
            text = (
                f"👤 {p['full_name']}\n"
                f"🎓 {p['education'] or 'Информация уточняется'}\n"
                f"💼 Опыт: {p['experience'] or 'Не указан'}\n"
                f"🔗 Запись: {p['qlick_url'] if p['qlick_url'] else 'через администратора'}"
            )
            
            if p['photo_path']:
                try:
                    photo_file = types.FSInputFile(p['photo_path'])
                    await callback.message.answer_photo(photo_file, caption=text)
                except Exception:
                    await callback.message.answer(text)
            else:
                await callback.message.answer(text)
                
    await callback.answer()


# --- 5. ЗАПУСК ---
async def main():
    print("Бот включен")
    await dp.start_polling(bot)

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Бот выключен")