#!/bin/bash
export GIT_PAGER=""
git add .
git commit -m "fix: Исправлены настройки multer для правильного именования файлов"
git push origin main
echo "Готово!"
