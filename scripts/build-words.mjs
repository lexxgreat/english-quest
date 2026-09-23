import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = dirname(fileURLToPath(import.meta.url)) + '/..'
const LEVEL_NAMES = {
  1: 'Первые слова',
  2: 'Дом и семья',
  3: 'Школа и время',
  4: 'Мир вокруг',
  5: 'Тело и веселье',
}

const seen = new Map()
const out = []
let id = 1
let total = 0

for (let level = 1; level <= 5; level++) {
  const file = join(root, `data/words-l${level}.txt`)
  const lines = readFileSync(file, 'utf8').split('\n').map(l => l.trim()).filter(Boolean)
  for (const line of lines) {
    const parts = line.split('|')
    if (parts.length !== 7) {
      throw new Error(`L${level}: строка из ${parts.length} полей (нужно 7): ${line}`)
    }
    const [en, ipa, ru, pos, topic, exEn, exRu] = parts.map(s => s.trim())
    if (!en || !ipa || !ru || !exEn || !exRu) throw new Error(`L${level}: пустое поле: ${line}`)
    if (!ipa.startsWith('[')) throw new Error(`L${level}: IPA без скобок: ${line}`)
    const key = en.toLowerCase()
    if (seen.has(key)) {
      throw new Error(`Дубликат "${en}" — уже на уровне ${seen.get(key)}`)
    }
    seen.set(key, level)
    out.push({ id, level, levelName: LEVEL_NAMES[level], en, ipa, ru, pos, topic, ex: [{ en: exEn, ru: exRu }] })
    id++
    total++
  }
}

mkdirSync(join(root, 'src/data'), { recursive: true })
const header = `// Автогенерировано scripts/build-words.mjs — не редактировать руками.
// Источник: data/words-l*.txt
export const WORDS_DB = `
writeFileSync(join(root, 'src/data/words.ts'), header + JSON.stringify(out) + '\n')

const perLevel = {}
for (const w of out) perLevel[w.level] = (perLevel[w.level] || 0) + 1
console.log(`OK: ${total} слов собрано в src/data/words.ts`)
console.log('  по уровням:', JSON.stringify(perLevel))
