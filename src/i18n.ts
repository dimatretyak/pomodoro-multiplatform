import es from './locales/es.ts'
import de from './locales/de.ts'
import fr from './locales/fr.ts'
import pt from './locales/pt.ts'
import it from './locales/it.ts'
import zh from './locales/zh.ts'
import ja from './locales/ja.ts'

export type Lang = 'ru' | 'en' | 'es' | 'de' | 'fr' | 'pt' | 'it' | 'zh' | 'ja'
export const langs: Lang[] = ['ru', 'en', 'es', 'de', 'fr', 'pt', 'it', 'zh', 'ja']
export const langNames: Record<Lang, string> = {
  ru: 'Русский', en: 'English', es: 'Español', de: 'Deutsch', fr: 'Français', pt: 'Português', it: 'Italiano', zh: '中文', ja: '日本語',
}
/** A string in Russian and English: [ru, en]. Other languages look it up by the English text. */
export type L = readonly [ru: string, en: string]

// Russian and English live inline in the code; other languages are dictionaries keyed by
// the English string (src/locales). A test checks every dictionary covers every string.
const dicts: Partial<Record<Lang, Record<string, string>>> = { es, de, fr, pt, it, zh, ja }

// ponytail: module-level language set by App on every render. Works because App
// re-renders the whole tree on a settings change; move to context if memoization appears.
let lang: Lang = 'ru'
export const setLang = (l: Lang) => void (lang = l)
export const getLang = () => lang

const pick = (ru: string, en: string) => (lang === 'ru' ? ru : lang === 'en' ? en : dicts[lang]?.[en] ?? en)
/** t('По-русски {n}', 'In English {n}', { n: 3 }) */
export const t = (ru: string, en: string, vars?: Record<string, string | number>) =>
  vars ? pick(ru, en).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? '')) : pick(ru, en)
export const tr = (l: L) => t(l[0], l[1])

const rules = new Map<Lang, Intl.PluralRules>()
/** Russian needs three forms; the others use one/other or none (zh, ja); English forms are the dictionary keys. */
export function plural(n: number, ru: [one: string, few: string, many: string], en: [one: string, other: string]) {
  if (!rules.has(lang)) rules.set(lang, new Intl.PluralRules(lang))
  const c = rules.get(lang)!.select(n)
  if (lang === 'ru') return c === 'one' ? ru[0] : c === 'few' ? ru[1] : ru[2]
  const f = c === 'one' ? en[0] : en[1]
  return lang === 'en' ? f : dicts[lang]?.[f] ?? f
}
export const sessionsWord = (n: number) => plural(n, ['сессия', 'сессии', 'сессий'], ['session', 'sessions'])

export const browserLang = (): Lang => {
  const code = (typeof navigator !== 'undefined' && navigator.language?.slice(0, 2).toLowerCase()) || 'en'
  return (langs as string[]).includes(code) ? (code as Lang) : 'en'
}
