/** Правила чтения — вторая изюминка: учим логику английских букв и звуков */

export interface ReadingRule {
  id: string
  icon: string
  title: string
  sound: string
  desc: string
  words: string[]
}

export const READING_RULES: ReadingRule[] = [
  {
    id: 'th', icon: '👅', title: 'TH — язык между зубами', sound: '[θ] и [ð]',
    desc: 'Высуни кончик языка чуть-чуть между зубами и подуй. Звука «з/с» в русском нет — это нормально, что звучит непривычно!',
    words: ['three', 'thank you', 'this', 'with', 'mother'],
  },
  {
    id: 'sh', icon: '🤫', title: 'SH — как «ш»', sound: '[ʃ]',
    desc: 'Самое простое правило: SH всегда звучит как русское «ш». Ship = «шип».',
    words: ['she', 'shop', 'fish', 'wash', 'shirt'],
  },
  {
    id: 'ch', icon: '🚂', title: 'CH — как «ч»', sound: '[tʃ]',
    desc: 'CH звучит как «ч». Запомни: учитель (teacher) и стул (chair) — с «ч».',
    words: ['teacher', 'chair', 'kitchen', 'lunch'],
  },
  {
    id: 'ck', icon: '🧩', title: 'CK — просто «к»', sound: '[k]',
    desc: 'Две буквы — один короткий звук «к». Никакого «кк»!',
    words: ['black', 'duck', 'socks'],
  },
  {
    id: 'ng', icon: '🔔', title: 'NG — как «нг»', sound: '[ŋ]',
    desc: 'Носовой звук: скажи «н», но не открывай рот в конце — воздух идёт через нос.',
    words: ['sing', 'song', 'strong', 'morning'],
  },
  {
    id: 'oo', icon: '👀', title: 'OO — «у» и короткое «у»', sound: '[uː] и [ʊ]',
    desc: 'Два «о» = звук «у». Длинное в moon (луна), короткое в book (книга). Слушай и сравни!',
    words: ['moon', 'food', 'book', 'look', 'good'],
  },
  {
    id: 'ee', icon: '🌳', title: 'EE — долгое «и»', sound: '[iː]',
    desc: 'EE — это долгая «ииии»: как пчела жужжит. Three = «фри».',
    words: ['tree', 'three', 'sleep', 'green'],
  },
  {
    id: 'ea', icon: '🍵', title: 'EA — обманщица', sound: '[iː] и [e]',
    desc: 'Обычно EA = «ии» (tea, sea), но в bread — «э»! Такое слово надо запомнить.',
    words: ['tea', 'eat', 'sea', 'bread'],
  },
  {
    id: 'magic-e', icon: '🪄', title: 'Магическая E на конце', sound: '[eɪ] [aɪ] [əʊ]',
    desc: 'Если слово кончается на «согласная + e», эта E не читается, но делает гласную длинной: cake = «кэйк», bike = «байк».',
    words: ['cake', 'bike', 'home', 'five', 'nine'],
  },
  {
    id: 'ir-er-ur', icon: '🔍', title: 'IR, ER, UR — один звук', sound: '[ɜː]',
    desc: 'Три разные тройки букв — один и тот же звук, что-то среднее между «о» и «э». Слушай внимательно!',
    words: ['bird', 'girl', 'her', 'teacher', 'turn'],
  },
  {
    id: 'ar', icon: '🚗', title: 'AR — чёткое «а»', sound: '[ɑː]',
    desc: 'AR звучит как долгое «а-а»: car = «ка-а-р».',
    words: ['car', 'star', 'park', 'garden'],
  },
  {
    id: 'or', icon: '🐴', title: 'OR — долгое «о»', sound: '[ɔː]',
    desc: 'OR = «о-о» с круглым ртом, как «о» в слове «зОнт».',
    words: ['for', 'short', 'horse', 'morning'],
  },
  {
    id: 'ow', icon: '🦉', title: 'OW — два звука', sound: '[əʊ] и [aʊ]',
    desc: 'В window — «оу», в cow — «ау»! Смысл подскажет: снег (snow) — мягкий, корова (cow) — громкая.',
    words: ['window', 'snow', 'yellow', 'down', 'cow'],
  },
  {
    id: 'ai-ay', icon: '☔', title: 'AI, AY — как «эй»', sound: '[eɪ]',
    desc: 'AI в середине слова, AY на конце — оба дают «эй»: rain = «рэйн», day = «дэй».',
    words: ['day', 'play', 'say', 'train', 'rain'],
  },
]
