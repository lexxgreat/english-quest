import { WORDS_DB } from '../data/words'

export interface Example { en: string; ru: string }
export interface Word {
  id: number
  level: 1 | 2 | 3 | 4 | 5
  levelName: string
  en: string
  ipa: string
  ru: string
  pos: string
  topic: string
  ex: Example[]
}

export const WORDS: Word[] = WORDS_DB as Word[]
export const WORD_BY_ID = new Map<number, Word>(WORDS.map(w => [w.id, w]))

export const LEVELS = [
  { n: 1, name: 'Первые слова', emoji: '🌱' },
  { n: 2, name: 'Дом и семья', emoji: '🏠' },
  { n: 3, name: 'Школа и время', emoji: '🎒' },
  { n: 4, name: 'Мир вокруг', emoji: '🌍' },
  { n: 5, name: 'Тело и веселье', emoji: '🎉' },
] as const

export const TOPIC_RU: Record<string, string> = {
  basics: 'Основы', family: 'Семья', people: 'Люди', home: 'Дом',
  animals: 'Животные', food: 'Еда', school: 'Школа', time: 'Время',
  verbs: 'Действия', world: 'Мир', weather: 'Погода', colors: 'Цвета',
  transport: 'Транспорт', body: 'Тело', clothes: 'Одежда', fun: 'Игры и веселье',
  adjectives: 'Прилагательные',
}

export const POS_RU: Record<string, string> = {
  art: 'артикль', conj: 'союз', pron: 'местоимение', v: 'глагол',
  n: 'существительное', adj: 'прилагательное', adv: 'наречие',
  num: 'числительное', prep: 'предлог', phr: 'фраза',
}

export function wordById(id: number): Word | undefined {
  return WORD_BY_ID.get(id)
}

/** Нормализация текста для проверки правописания */
export function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[.,!?;:'"()]+/g, '').replace(/\s+/g, ' ')
}

/** Служебные слова для подсветки в историях */
const SERVICE = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'to', 'of', 'in', 'on', 'at', 'is', 'are', 'am', 'was', 'were', 'be', 'has', 'have', 'had', 'do', 'does', 'did', 'it', 'its', "it's"])
export function isServiceWord(w: string): boolean {
  return SERVICE.has(w.toLowerCase())
}

/** Разбивка предложения на слова для интерактивных историй */
export function splitSentence(sentence: string): { token: string; clean: string; isWord: boolean }[] {
  return sentence.split(/(\s+)/).map(token => {
    const clean = token.toLowerCase().replace(/[^a-z']/g, '')
    return { token, clean, isWord: /^[A-Za-z]/.test(token) && clean.length > 0 }
  })
}

/** Случайная выборка без повторов */
export function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  const out: T[] = []
  while (copy.length && out.length < n) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0])
  }
  return out
}

export function shuffle<T>(arr: T[]): T[] {
  return sample(arr, arr.length)
}
