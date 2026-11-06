export type Lang = 'ru' | 'en'
export const langs: Lang[] = ['ru', 'en']
/** A string in both languages: [ru, en]. */
export type L = readonly [ru: string, en: string]

// ponytail: module-level language set by App on every render. Works because App
// re-renders the whole tree on a settings change; move to context if memoization appears.
let lang: Lang = 'ru'
export const setLang = (l: Lang) => void (lang = l)
export const getLang = () => lang

export const t = (ru: string, en: string) => (lang === 'en' ? en : ru)
export const tr = (l: L) => t(l[0], l[1])

const rules = { ru: new Intl.PluralRules('ru'), en: new Intl.PluralRules('en') }
export function plural(n: number, ru: [one: string, few: string, many: string], en: [one: string, other: string]) {
  const c = rules[lang].select(n)
  if (lang === 'en') return c === 'one' ? en[0] : en[1]
  return c === 'one' ? ru[0] : c === 'few' ? ru[1] : ru[2]
}
export const sessionsWord = (n: number) => plural(n, ['сессия', 'сессии', 'сессий'], ['session', 'sessions'])

export const browserLang = (): Lang => (typeof navigator !== 'undefined' && !navigator.language?.toLowerCase().startsWith('ru') ? 'en' : 'ru')
