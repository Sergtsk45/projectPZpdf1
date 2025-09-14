#!/bin/bash
export GIT_PAGER=""
git add .
git commit -m "fix: Исправлены настройки multer"
git push origin main
echo "Done"