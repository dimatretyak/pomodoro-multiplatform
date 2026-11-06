import { stepAt, type Exercise } from './exercises.ts'

export default function BreakView({ exercise, elapsed }: { exercise: Exercise; elapsed: number }) {
  const at = stepAt(exercise, elapsed)
  const step = at ? exercise.steps[at.index] : null
  const left = at ? Math.ceil(at.left) : 0

  if (exercise.loop && step) {
    // Hold keeps the size reached by the previous step.
    const prev = exercise.steps[(at!.index - 1 + exercise.steps.length) % exercise.steps.length]
    const big = step.breath === 'in' || (step.breath === 'hold' && prev.breath === 'in')
    return (
      <div className="relative grid size-full place-items-center">
        <div
          className="breath absolute inset-[8%] rounded-full border-2 border-(--accent) bg-(--accent)/15"
          style={{ transform: `scale(${big ? 1 : 0.55})`, transitionDuration: `${step.sec}s` }}
        />
        <div className="relative">
          <div key={at!.index} className="fade-up text-2xl font-medium">{step.text}</div>
          <div className="mt-1 text-4xl font-light tabular-nums">{left}</div>
          <div className="mt-2 text-xs text-(--muted)">{exercise.title}</div>
        </div>
      </div>
    )
  }

  if (!step) {
    return (
      <div className="fade-up px-4">
        <div className="text-xl">Готово!</div>
        <div className="mt-2 text-sm text-(--muted)">Просто отдохните до конца перерыва</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center px-2">
      <div className="text-xs text-(--muted)">
        {exercise.title} · шаг {at!.index + 1} из {exercise.steps.length}
      </div>
      <div key={at!.index} className="fade-up mt-3 max-w-[24ch] text-lg leading-snug">{step.text}</div>
      <div className="mt-4 text-5xl font-light tabular-nums">{left}</div>
    </div>
  )
}
