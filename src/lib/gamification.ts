import { useStore, learnedCount } from './store'

export const LEVEL_TITLES: { xp: number; title: string; emoji: string }[] = [
  { xp: 0, title: 'Новичок', emoji: '🐣' },
  { xp: 50, title: 'Ученик', emoji: '🐰' },
  { xp: 150, title: 'Искатель', emoji: '🦊' },
  { xp: 300, title: 'Знаток', emoji: '🐺' },
  { xp: 500, title: 'Боец', emoji: '🐯' },
  { xp: 800, title: 'Эксперт', emoji: '🦁' },
  { xp: 1200, title: 'Мастер', emoji: '🦅' },
  { xp: 1700, title: 'Гуру', emoji: '🦉' },
  { xp: 2300, title: 'Чемпион', emoji: '🐲' },
  { xp: 3000, title: 'Легенда', emoji: '🦄' },
]

export function levelInfo(xp: number) {
  let idx = 0
  for (let i = 0; i < LEVEL_TITLES.length; i++) {
    if (xp >= LEVEL_TITLES[i].xp) idx = i
  }
  const cur = LEVEL_TITLES[idx]
  const next = LEVEL_TITLES[idx + 1]
  const progress = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1
  return { level: idx + 1, title: cur.title, emoji: cur.emoji, xp, next, progress: Math.min(1, progress) }
}

export interface Achievement {
  id: string
  emoji: string
  title: string
  desc: string
  check: (s: { answered: number; correct: number; streak: number; learned: number; stories: number }) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_word', emoji: '🌟', title: 'Первое слово', desc: 'Ответить правильно в первый раз', check: s => s.correct >= 1 },
  { id: 'w10', emoji: '🔟', title: 'Десятка', desc: 'Выучить 10 слов', check: s => s.learned >= 10 },
  { id: 'w50', emoji: '🏅', title: 'Полсотни', desc: 'Выучить 50 слов', check: s => s.learned >= 50 },
  { id: 'w100', emoji: '💯', title: 'Сотня', desc: 'Выучить 100 слов', check: s => s.learned >= 100 },
  { id: 'w200', emoji: '🚀', title: 'Двести!', desc: 'Выучить 200 слов', check: s => s.learned >= 200 },
  { id: 'w300', emoji: '👑', title: 'Вся база', desc: 'Выучить все 300 слов базы', check: s => s.learned >= 290 },
  { id: 's3', emoji: '🔥', title: 'Три дня подряд', desc: 'Заниматься 3 дня подряд', check: s => s.streak >= 3 },
  { id: 's7', emoji: '⚡', title: 'Неделя силы', desc: 'Заниматься 7 дней подряд', check: s => s.streak >= 7 },
  { id: 's30', emoji: '🌋', title: 'Месяц герой', desc: 'Заниматься 30 дней подряд', check: s => s.streak >= 30 },
  { id: 'a100', emoji: '🎯', title: 'Снайпер', desc: '100 правильных ответов', check: s => s.correct >= 100 },
  { id: 'a500', emoji: '🛡️', title: 'Танк знаний', desc: '500 правильных ответов', check: s => s.correct >= 500 },
  { id: 'story1', emoji: '📖', title: 'Первая история', desc: 'Прочитать первую микро-историю', check: s => s.stories >= 1 },
  { id: 'story5', emoji: '📚', title: 'Книжный червь', desc: 'Прочитать 5 историй', check: s => s.stories >= 5 },
]

/** Проверяет ачивки, возвращает новые id */
export function evaluateAchievements(): string[] {
  const s = useStore.getState()
  const ctx = {
    answered: s.answered,
    correct: s.correct,
    streak: s.streak,
    learned: learnedCount(s.words),
    stories: s.storiesRead.length,
  }
  const fresh: string[] = []
  for (const a of ACHIEVEMENTS) {
    if (!s.achievements.includes(a.id) && a.check(ctx)) {
      s.unlock(a.id)
      fresh.push(a.id)
    }
  }
  return fresh
}
