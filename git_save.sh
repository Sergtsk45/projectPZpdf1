#!/bin/bash
git add .
git commit -m "fix: Исправлены настройки multer"
git checkout main
git merge --no-ff -
git push origin main
echo "Done"
