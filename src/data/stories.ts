/** Микро-истории — ИЗЮМИНКА приложения.
 *  Составлены ТОЛЬКО из слов базы (325 слов), поэтому каждое слово в истории
 *  интерактивно: тап → озвучка + перевод. Покрытие считается по прогрессу.
 */

export interface Story {
  id: string
  title: string
  emoji: string
  minLevel: 1 | 2 | 3
  lines: { en: string; ru: string }[]
}

export const STORIES: Story[] = [
  {
    id: 'house', title: 'Мой дом', emoji: '🏠', minLevel: 1,
    lines: [
      { en: 'This is my house.', ru: 'Это мой дом.' },
      { en: 'My mum and dad live here with me.', ru: 'Здесь со мной живут мама и папа.' },
      { en: 'My house has a red door.', ru: 'У моего дома красная дверь.' },
      { en: 'My room is small but nice.', ru: 'Моя комната маленькая, но уютная.' },
      { en: 'I have a cat and a fish.', ru: 'У меня есть кот и рыбка.' },
      { en: 'My cat likes to sleep on my bed.', ru: 'Мой кот любит спать на моей кровати.' },
      { en: 'Good night, cat!', ru: 'Спокойной ночи, кот!' },
    ],
  },
  {
    id: 'rex', title: 'Рекс и мяч', emoji: '🐕', minLevel: 1,
    lines: [
      { en: 'This is my dog. His name is Rex.', ru: 'Это моя собака. Его зовут Рекс.' },
      { en: 'Rex is big and strong.', ru: 'Рекс большой и сильный.' },
      { en: 'He likes to play with a red ball.', ru: 'Он любит играть с красным мячом.' },
      { en: 'I take the ball and run.', ru: 'Я беру мяч и бегу.' },
      { en: 'Rex runs and jumps.', ru: 'Рекс бегает и прыгает.' },
      { en: 'Rex is my good friend.', ru: 'Рекс — мой хороший друг.' },
    ],
  },
  {
    id: 'lunch', title: 'Обед в школе', emoji: '🍎', minLevel: 1,
    lines: [
      { en: 'I go to school in the morning.', ru: 'Я иду в школу утром.' },
      { en: 'I have a bag with books.', ru: 'У меня есть сумка с книгами.' },
      { en: 'In class we read and write.', ru: 'На уроке мы читаем и пишем.' },
      { en: 'We sing songs too.', ru: 'Мы ещё и поём песни.' },
      { en: 'At lunch I eat bread and an apple.', ru: 'На обед я ем хлеб и яблоко.' },
      { en: 'After school I go home.', ru: 'После школы я иду домой.' },
    ],
  },
  {
    id: 'rain', title: 'Дождливый день', emoji: '🌧️', minLevel: 2,
    lines: [
      { en: 'The sky is cloudy today.', ru: 'Небо сегодня в облаках.' },
      { en: 'It rains and rains.', ru: 'Дождь идёт и идёт.' },
      { en: 'I sit at home with my cat.', ru: 'Я сижу дома со своим котом.' },
      { en: 'We look out of the window.', ru: 'Мы смотрим в окно.' },
      { en: 'The cat wants to play.', ru: 'Кот хочет играть.' },
      { en: 'We play with a ball and laugh.', ru: 'Мы играем с мячом и смеёмся.' },
      { en: 'Now the rain is my friend too!', ru: 'Теперь дождь — тоже мой друг!' },
    ],
  },
  {
    id: 'summer', title: 'Летний день', emoji: '🌞', minLevel: 2,
    lines: [
      { en: 'It is a sunny day.', ru: 'Солнечный день.' },
      { en: 'The sky is blue and the grass is green.', ru: 'Небо голубое, а трава зелёная.' },
      { en: 'We go to the river with dad.', ru: 'Мы идём с папой к реке.' },
      { en: 'I can swim very well.', ru: 'Я умею очень хорошо плавать.' },
      { en: 'Mum sits on the grass.', ru: 'Мама сидит на траве.' },
      { en: 'We eat apples and bread.', ru: 'Мы едим яблоки и хлеб.' },
      { en: 'What a nice day!', ru: 'Какой хороший день!' },
    ],
  },
  {
    id: 'school1', title: 'Первый день в школе', emoji: '🎒', minLevel: 2,
    lines: [
      { en: 'It is the first day of school.', ru: 'Это первый день в школе.' },
      { en: 'I have a new bag.', ru: 'У меня новый портфель.' },
      { en: 'My teacher says: "Hello! What is your name?"', ru: 'Мой учитель говорит: «Привет! Как тебя зовут?»' },
      { en: 'I say my name.', ru: 'Я называю своё имя.' },
      { en: 'Our class is big and nice.', ru: 'Наш класс большой и красивый.' },
      { en: 'We read, write and draw.', ru: 'Мы читаем, пишем и рисуем.' },
      { en: 'School is good!', ru: 'В школе здорово!' },
    ],
  },
  {
    id: 'bird', title: 'Птичка у окна', emoji: '🐦', minLevel: 2,
    lines: [
      { en: 'A small bird sits at my window.', ru: 'Маленькая птичка сидит у моего окна.' },
      { en: 'It sings a song.', ru: 'Она поёт песню.' },
      { en: 'I give it some bread.', ru: 'Я даю ей немного хлеба.' },
      { en: 'The bird eats and looks at me.', ru: 'Птичка ест и смотрит на меня.' },
      { en: 'Every morning it comes here.', ru: 'Каждое утро она прилетает сюда.' },
      { en: 'Now it is my friend.', ru: 'Теперь она мой друг.' },
    ],
  },
  {
    id: 'birthday', title: 'День рождения', emoji: '🎂', minLevel: 3,
    lines: [
      { en: 'Today is my birthday.', ru: 'Сегодня мой день рождения.' },
      { en: 'I am ten years old.', ru: 'Мне десять лет.' },
      { en: 'My family is at the table.', ru: 'Моя семья за столом.' },
      { en: 'There is a big cake on the table.', ru: 'На столе большой торт.' },
      { en: 'Mum gives me a present.', ru: 'Мама дарит мне подарок.' },
      { en: 'It is a new bike!', ru: 'Это новый велосипед!' },
      { en: 'I am very happy.', ru: 'Я очень счастлив.' },
      { en: 'All my friends sing a song for me.', ru: 'Все мои друзья поют для меня песню.' },
    ],
  },
  {
    id: 'football', title: 'Футбол в парке', emoji: '⚽', minLevel: 3,
    lines: [
      { en: 'We play football in the park.', ru: 'Мы играем в футбол в парке.' },
      { en: 'Tom plays with me.', ru: 'Том играет со мной.' },
      { en: 'He runs very fast.', ru: 'Он бегает очень быстро.' },
      { en: 'I say: "Give me the ball!"', ru: 'Я говорю: «Дай мне мяч!»' },
      { en: 'Tom gives me the ball.', ru: 'Том даёт мне мяч.' },
      { en: 'I take it and run.', ru: 'Я беру его и бегу.' },
      { en: 'What a good game!', ru: 'Какая хорошая игра!' },
    ],
  },
  {
    id: 'stars', title: 'Ночь и звёзды', emoji: '🌙', minLevel: 3,
    lines: [
      { en: 'It is night.', ru: 'Сейчас ночь.' },
      { en: 'The sky is black.', ru: 'Небо чёрное.' },
      { en: 'I look out of the window.', ru: 'Я смотрю в окно.' },
      { en: 'I see the moon and stars.', ru: 'Я вижу луну и звёзды.' },
      { en: 'The stars are yellow and white.', ru: 'Звёзды жёлтые и белые.' },
      { en: 'I want to fly to the moon one day.', ru: 'Однажды я хочу полететь на луну.' },
      { en: 'Good night, stars!', ru: 'Спокойной ночи, звёзды!' },
    ],
  },
  {
    id: 'mouse', title: 'Умная мышка', emoji: '🐭', minLevel: 3,
    lines: [
      { en: 'A small mouse lives in our house.', ru: 'В нашем доме живёт маленькая мышка.' },
      { en: 'My cat wants to play with it.', ru: 'Мой кот хочет с ней поиграть.' },
      { en: 'The mouse runs very fast.', ru: 'Мышка бегает очень быстро.' },
      { en: 'It goes under the table.', ru: 'Она забегает под стол.' },
      { en: 'The cat waits and waits.', ru: 'Кот ждёт и ждёт.' },
      { en: 'Then the mouse runs out.', ru: 'Потом мышка выбегает наружу.' },
      { en: 'It takes a big apple.', ru: 'Она берёт большое яблоко.' },
      { en: 'What a clever mouse!', ru: 'Какая умная мышка!' },
    ],
  },
  {
    id: 'train', title: 'Поездка к бабушке', emoji: '🚂', minLevel: 3,
    lines: [
      { en: 'We go to grandma on a big train.', ru: 'Мы едем к бабушке на большом поезде.' },
      { en: 'I look out of the window.', ru: 'Я смотрю в окно.' },
      { en: 'I see houses, trees and the sun.', ru: 'Я вижу дома, деревья и солнце.' },
      { en: 'Grandma meets us at her house.', ru: 'Бабушка встречает нас у своего дома.' },
      { en: 'She makes a big cake for us.', ru: 'Она делает для нас большой торт.' },
      { en: 'Her garden is big and beautiful.', ru: 'Её сад большой и красивый.' },
      { en: 'I love my grandma.', ru: 'Я люблю свою бабушку.' },
    ],
  },
]

/** Вспомогательный глоссарий: слова-исключения и имена (нижний регистр) */
export const STORY_EXT: Record<string, string> = {
  rex: 'Рекс (имя собаки)', tom: 'Том (имя)',
  years: 'лет', rains: 'идёт дождь', laughs: 'смеётся',
  shines: 'светит', flies: 'летает', runs: 'бежит', jumps: 'прыгает',
  sings: 'поёт', eats: 'ест', looks: 'смотрит', gives: 'даёт',
  makes: 'делает', likes: 'любит', wants: 'хочет', lives: 'живёт',
  waits: 'ждёт', takes: 'берёт', says: 'говорит', comes: 'приходит',
  meets: 'встречает', sees: 'видит', goes: 'идёт', plays: 'играет',
}
