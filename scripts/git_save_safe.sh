#!/usr/bin/env bash

#
# @file: scripts/git_save_safe.sh
# @description: Безопасный скрипт для добавления, коммита и отправки изменений в текущей ветке без pager.
# @dependencies: .git/config, удалённый origin
# @created: 2025-09-14
#

set -euo pipefail
unalias git 2>/dev/null || true
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${PATH:-}"

# Сообщение коммита из первого аргумента или дефолтное
commit_msg="${1:-chore: repo maintenance (disable pager, scripts cleanup)}"

# Отключаем pager на время выполнения
export GIT_PAGER=cat
export PAGER=cat

# Принудительно отключаем pager в локальном конфиге (не глобально)
command git config --local core.pager cat || true
command git config --local pager.log false || true
command git config --local pager.diff false || true
command git config --local pager.branch false || true
command git config --local pager.status false || true

# Текущая ветка
current_branch="$(command git rev-parse --abbrev-ref HEAD)"

echo "📦 Текущая ветка: ${current_branch}"
echo "🔧 Статус изменений:"
command git -c core.pager=cat status --short || true

echo "➕ Добавляю изменения..."
command git add -A

echo "💾 Коммит: ${commit_msg}"
if ! command git commit -m "${commit_msg}"; then
  echo "ℹ️ Нет изменений для коммита — пропускаю коммит."
fi

echo "⬆️ Пуш в origin/${current_branch}"
command git push -u origin "${current_branch}"

echo "✅ Готово."


