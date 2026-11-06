import type { L } from './i18n.ts'

export type Category = 'breath' | 'eyes' | 'body'
export type Breath = 'in' | 'hold' | 'out'

export interface Step {
  text: L
  sec: number
  breath?: Breath
}

export interface Exercise {
  id: string
  category: Category
  title: L
  steps: Step[]
  loop?: boolean // repeat steps until the break ends (breathing)
}

export const categories: Record<Category, L> = {
  breath: ['Дыхание', 'Breathing'],
  eyes: ['Глаза', 'Eyes'],
  body: ['Спина и шея', 'Back & neck'],
}

const inhale = (sec: number): Step => ({ text: ['Вдох', 'Breathe in'], sec, breath: 'in' })
const hold = (sec: number): Step => ({ text: ['Задержка', 'Hold'], sec, breath: 'hold' })
const exhale = (sec: number): Step => ({ text: ['Выдох', 'Breathe out'], sec, breath: 'out' })

export const exercises: Exercise[] = [
  { id: 'box', category: 'breath', title: ['Квадратное дыхание 4-4-4-4', 'Box breathing 4-4-4-4'], loop: true, steps: [inhale(4), hold(4), exhale(4), hold(4)] },
  { id: '478', category: 'breath', title: ['Дыхание 4-7-8', '4-7-8 breathing'], loop: true, steps: [inhale(4), hold(7), exhale(8)] },
  { id: 'coherent', category: 'breath', title: ['Ровное дыхание 5-5', 'Coherent breathing 5-5'], loop: true, steps: [inhale(5), exhale(5)] },

  {
    id: 'rule-20', category: 'eyes', title: ['Правило 20-20-20', '20-20-20 rule'],
    steps: [
      { text: ['Посмотрите на предмет минимум в 6 метрах от вас', 'Look at something at least 6 m (20 ft) away'], sec: 20 },
      { text: ['Часто и легко поморгайте', 'Blink often and gently'], sec: 10 },
      { text: ['Закройте глаза и расслабьте лицо', 'Close your eyes and relax your face'], sec: 20 },
    ],
  },
  {
    id: 'eye-moves', category: 'eyes', title: ['Гимнастика для глаз', 'Eye exercises'],
    steps: [
      { text: ['Медленно переводите взгляд вверх и вниз', 'Slowly look up and down'], sec: 15 },
      { text: ['Переводите взгляд влево и вправо', 'Look left and right'], sec: 15 },
      { text: ['Рисуйте глазами круги по часовой стрелке', 'Trace circles with your eyes clockwise'], sec: 15 },
      { text: ['Теперь против часовой стрелки', 'Now counterclockwise'], sec: 15 },
      { text: ['Разотрите ладони и накройте ими закрытые глаза', 'Rub your palms and cup them over closed eyes'], sec: 30 },
    ],
  },
  {
    id: 'eye-focus', category: 'eyes', title: ['Близко — далеко', 'Near and far'],
    steps: [
      { text: ['Смотрите на кончик пальца в 15 см от лица', 'Look at your fingertip 15 cm from your face'], sec: 10 },
      { text: ['Переведите взгляд на дальний предмет', 'Shift your gaze to a distant object'], sec: 10 },
      { text: ['Снова на палец', 'Back to your finger'], sec: 10 },
      { text: ['Снова вдаль', 'Far away again'], sec: 10 },
      { text: ['Закройте глаза и отдохните', 'Close your eyes and rest'], sec: 15 },
    ],
  },

  {
    id: 'neck', category: 'body', title: ['Разминка шеи', 'Neck stretch'],
    steps: [
      { text: ['Наклоните голову к правому плечу, плечи опущены', 'Tilt your head toward your right shoulder, shoulders down'], sec: 20 },
      { text: ['Теперь к левому плечу', 'Now toward your left shoulder'], sec: 20 },
      { text: ['Подбородок к груди, почувствуйте затылок', 'Chin to chest, feel the back of your neck'], sec: 20 },
      { text: ['Медленно поворачивайте голову влево-вправо', 'Slowly turn your head left and right'], sec: 20 },
    ],
  },
  {
    id: 'shoulders', category: 'body', title: ['Плечи и лопатки', 'Shoulders'],
    steps: [
      { text: ['Вращайте плечами назад', 'Roll your shoulders back'], sec: 15 },
      { text: ['Вращайте плечами вперёд', 'Roll your shoulders forward'], sec: 15 },
      { text: ['Сведите лопатки и задержитесь', 'Squeeze your shoulder blades and hold'], sec: 20 },
      { text: ['Руки в замок над головой, тянитесь вверх', 'Interlace your fingers overhead and reach up'], sec: 20 },
    ],
  },
  {
    id: 'back', category: 'body', title: ['Спина стоя', 'Standing back stretch'],
    steps: [
      { text: ['Встаньте, мягко наклонитесь вперёд, руки свободно висят', 'Stand up and fold forward gently, arms hanging loose'], sec: 20 },
      { text: ['Руки на колени: округлите спину, затем прогнитесь', 'Hands on knees: round your back, then arch it'], sec: 30 },
      { text: ['Сидя: скрутитесь вправо, держась за спинку стула', 'Seated: twist right, holding the chair back'], sec: 20 },
      { text: ['Теперь скрутитесь влево', 'Now twist left'], sec: 20 },
      { text: ['Пройдитесь и выпейте воды', 'Walk around and drink some water'], sec: 30 },
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
