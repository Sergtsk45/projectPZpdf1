#!/bin/bash

echo "🔄 Сохранение изменений в основную ветку GitHub..."

# Добавляем все изменения
echo "📁 Добавляем файлы..."
git add .

# Создаем коммит
echo "💾 Создаем коммит..."
git commit -m "fix: Исправлены настройки multer для правильного именования файлов

- Изменен filename в multer с template_<timestamp> на temp_<timestamp>
- Теперь файлы корректно переименовываются в template_<templateId>.pdf
- Улучшена система fallback для поиска файлов шаблонов
- Исправлена генерация PDF с правильным выбором файла шаблона"

# Переключаемся на main ветку
echo "🔄 Переключаемся на main ветку..."
git checkout main

# Мержим изменения из текущей ветки
echo "🔀 Мержим изменения..."
git merge --no-ff -

# Пушим в основную ветку
echo "⬆️ Пушим в основную ветку..."
git push origin main

# Удаляем локальные ветки (кроме main)
echo "🗑️ Удаляем локальные ветки..."
git branch | grep -v "main" | xargs -r git branch -D

# Удаляем удаленные ветки
echo "🗑️ Удаляем удаленные ветки..."
git branch -r | grep -v "main" | sed 's/origin\///' | xargs -r git push origin --delete

echo "✅ Готово! Все изменения сохранены в основную ветку main"
