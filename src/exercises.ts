export type Category = 'breath' | 'eyes' | 'body'
export type Breath = 'in' | 'hold' | 'out'

export interface Step {
  text: string
  sec: number
  breath?: Breath
}

export interface Exercise {
  id: string
  category: Category
  title: string
  steps: Step[]
  loop?: boolean // repeat steps until the break ends (breathing)
}

export const categories: Record<Category, string> = {
  breath: 'Дыхание',
  eyes: 'Глаза',
  body: 'Спина и шея',
}

const inhale = (sec: number): Step => ({ text: 'Вдох', sec, breath: 'in' })
const hold = (sec: number): Step => ({ text: 'Задержка', sec, breath: 'hold' })
const exhale = (sec: number): Step => ({ text: 'Выдох', sec, breath: 'out' })

export const exercises: Exercise[] = [
  { id: 'box', category: 'breath', title: 'Квадратное дыхание 4-4-4-4', loop: true, steps: [inhale(4), hold(4), exhale(4), hold(4)] },
  { id: '478', category: 'breath', title: 'Дыхание 4-7-8', loop: true, steps: [inhale(4), hold(7), exhale(8)] },
  { id: 'coherent', category: 'breath', title: 'Ровное дыхание 5-5', loop: true, steps: [inhale(5), exhale(5)] },

  {
    id: 'rule-20', category: 'eyes', title: 'Правило 20-20-20',
    steps: [
      { text: 'Посмотрите на предмет минимум в 6 метрах от вас', sec: 20 },
      { text: 'Часто и легко поморгайте', sec: 10 },
      { text: 'Закройте глаза и расслабьте лицо', sec: 20 },
    ],
  },
  {
    id: 'eye-moves', category: 'eyes', title: 'Гимнастика для глаз',
    steps: [
      { text: 'Медленно переводите взгляд вверх и вниз', sec: 15 },
      { text: 'Переводите взгляд влево и вправо', sec: 15 },
      { text: 'Рисуйте глазами круги по часовой стрелке', sec: 15 },
      { text: 'Теперь против часовой стрелки', sec: 15 },
      { text: 'Разотрите ладони и накройте ими закрытые глаза', sec: 30 },
    ],
  },
  {
    id: 'eye-focus', category: 'eyes', title: 'Близко — далеко',
    steps: [
      { text: 'Смотрите на кончик пальца в 15 см от лица', sec: 10 },
      { text: 'Переведите взгляд на дальний предмет', sec: 10 },
      { text: 'Снова на палец', sec: 10 },
      { text: 'Снова вдаль', sec: 10 },
      { text: 'Закройте глаза и отдохните', sec: 15 },
    ],
  },

  {
    id: 'neck', category: 'body', title: 'Разминка шеи',
    steps: [
      { text: 'Наклоните голову к правому плечу, плечи опущены', sec: 20 },
      { text: 'Теперь к левому плечу', sec: 20 },
      { text: 'Подбородок к груди, почувствуйте затылок', sec: 20 },
      { text: 'Медленно поворачивайте голову влево-вправо', sec: 20 },
    ],
  },
  {
    id: 'shoulders', category: 'body', title: 'Плечи и лопатки',
    steps: [
      { text: 'Вращайте плечами назад', sec: 15 },
      { text: 'Вращайте плечами вперёд', sec: 15 },
      { text: 'Сведите лопатки и задержитесь', sec: 20 },
      { text: 'Руки в замок над головой, тянитесь вверх', sec: 20 },
    ],
  },
  {
    id: 'back', category: 'body', title: 'Спина стоя',
    steps: [
      { text: 'Встаньте, мягко наклонитесь вперёд, руки свободно висят', sec: 20 },
      { text: 'Руки на колени: округлите спину, затем прогнитесь', sec: 30 },
      { text: 'Сидя: скрутитесь вправо, держась за спинку стула', sec: 20 },
      { text: 'Теперь скрутитесь влево', sec: 20 },
      { text: 'Пройдитесь и выпейте воды', sec: 30 },
    ],
  },
]

export const byId = (id: string | null) => exercises.find((e) => e.id === id) ?? null

/** Which step is active `elapsed` seconds into the exercise. null = finished. */
export function stepAt(ex: Exercise, elapsed: number) {
  const total = ex.steps.reduce((a, s) => a + s.sec, 0)
  if (!ex.loop && elapsed >= total) return null
  let t = ex.loop ? elapsed % total : elapsed
  for (let i = 0; i < ex.steps.length; i++) {
    if (t < ex.steps[i].sec) return { index: i, left: ex.steps[i].sec - t }
    t -= ex.steps[i].sec
  }
  return null
}
