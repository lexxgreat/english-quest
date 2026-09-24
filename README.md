# English Quest 🦊

Тренажёр английских слов для детей (PWA). Ставится на телефон как приложение, работает офлайн.

## Что внутри

- **325 слов** в 5 уровнях: транскрипция, перевод, пример предложения
- **Умный урок дня**: новые слова + интервальные повторения (система Лейтнера)
- **5 режимов**: карточки «звук → текст», выбор перевода, наоборот, аудирование, правописание
- **🧩 Игра «Найди пару»** и **📖 микро-истории** из выученных слов (изюминка!)
- **🔤 Правила чтения**: 14 правил с озвученными примерами
- **Геймификация**: XP, 10 уровней, серии дней, 13 ачивок
- **Озвучка** через Web Speech API (обычная и замедленная) — без аудиофайлов
- **Прогресс**: localStorage + опциональная синхронизация в Firebase по коду восстановления
- **Для родителей**: статистика точности, ящики памяти, экспорт/импорт

## Технологии

React 18 · Vite · TypeScript · Tailwind CSS 4 · vite-plugin-pwa · Zustand · Firebase (опционально)

## Разработка

```bash
npm install
npm run dev        # дев-сервер
npm run build      # сборка в dist/ (включая генерацию words.ts из data/words-l*.txt)
npm run preview    # предпросмотр сборки
```

## Слова

База хранится в `data/words-l1.txt … words-l5.txt` (по строке на слово:
`en|ipa|ru|pos|topic|example_en|example_ru`) и компилируется скриптом
`scripts/build-words.mjs` в `src/data/words.ts`.

## Firebase (опционально)

Впиши `firebaseConfig` в `src/firebase/config.ts` — включится анонимная
синхронизация прогресса в Firestore (коллекция `progress`, документ = код
восстановления). Правила:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /progress/{code} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Деплой

Пуш в `main` → GitHub Actions собирает и публикует на GitHub Pages автоматически.
