#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  IndexNow — сообщить Яндексу об обновлённых страницах
#
#  Использование:
#     ./indexnow.sh https://mfandreeva.ru/rynok/
#     ./indexnow.sh https://mfandreeva.ru/ai/ https://mfandreeva.ru/rynok/
#
#  Без аргументов отправит список по умолчанию (см. ниже).
#  Файл ключа должен лежать в корне сайта, иначе Яндекс отклонит запрос.
# ─────────────────────────────────────────────────────────────

KEY="0622d0a6f7596cef5497887c864f3f33"
HOST="mfandreeva.ru"
KEYLOC="https://${HOST}/${KEY}.txt"

# Список по умолчанию, если аргументы не переданы
DEFAULT=(
  "https://mfandreeva.ru/rynok/"
  "https://mfandreeva.ru/blog/rynok-tsvetov-v-rossii-2026-tsifry-trendy-i-moj-prognoz/"
)

if [ $# -gt 0 ]; then URLS=("$@"); else URLS=("${DEFAULT[@]}"); fi

# Проверяем, доступен ли файл ключа на сервере
echo "Проверяю файл ключа…"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$KEYLOC")
if [ "$CODE" != "200" ]; then
  echo "❌ Файл ключа не найден: $KEYLOC (код $CODE)"
  echo "   Залейте ${KEY}.txt в корень сайта и повторите."
  exit 1
fi
echo "✅ Ключ на месте"

# Собираем JSON
LIST=$(printf '"%s",' "${URLS[@]}"); LIST="[${LIST%,}]"
BODY=$(cat <<EOF
{"host":"${HOST}","key":"${KEY}","keyLocation":"${KEYLOC}","urlList":${LIST}}
EOF
)

echo "Отправляю ${#URLS[@]} адрес(ов)…"
for u in "${URLS[@]}"; do echo "   · $u"; done

RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "https://yandex.com/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" -d "$BODY")

case "$RESP" in
  200|202) echo "✅ Принято Яндексом (код $RESP)" ;;
  400) echo "❌ Некорректный запрос (400)" ;;
  403) echo "❌ Ключ не подтверждён (403) — проверьте файл в корне" ;;
  422) echo "❌ URL не соответствует хосту или ключу (422)" ;;
  429) echo "⚠️  Слишком много запросов (429) — повторите позже" ;;
  *)   echo "⚠️  Ответ: $RESP" ;;
esac
