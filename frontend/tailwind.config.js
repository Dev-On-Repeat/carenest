/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    /* ============ DESIGN SYSTEM TOKENS ============
       Authentication defaults: forest and paper, Newsreader and DM Sans.
       The authenticated .cn-app theme supplies its own colour and type variables.
       Hard bans: gradient fills, glassmorphism, emoji icons, nested card stacks.
    */
    screens: { xs: '420px', sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' },
    extend: {
      colors: {
        ink: { DEFAULT: 'rgb(var(--cn-color-ink, 36 62 52) / <alpha-value>)', deep: 'rgb(var(--cn-color-ink-deep, 23 56 45) / <alpha-value>)', soft: 'rgb(var(--cn-color-ink-soft, 72 96 85) / <alpha-value>)', mute: 'rgb(var(--cn-color-ink-mute, 101 115 106) / <alpha-value>)', faint: 'rgb(var(--cn-color-ink-faint, 119 129 119) / <alpha-value>)' },
        line: { DEFAULT: 'rgb(var(--cn-color-line, 222 223 211) / <alpha-value>)', strong: 'rgb(var(--cn-color-line-strong, 207 201 189) / <alpha-value>)' },
        paper: { DEFAULT: 'rgb(var(--cn-color-paper, 247 246 240) / <alpha-value>)', cool: 'rgb(var(--cn-color-paper-cool, 254 253 249) / <alpha-value>)', sunken: 'rgb(var(--cn-color-paper-sunken, 238 239 229) / <alpha-value>)' },
        teal: { DEFAULT: 'rgb(var(--cn-color-teal, 49 94 73) / <alpha-value>)', deep: 'rgb(var(--cn-color-teal-deep, 36 74 56) / <alpha-value>)', soft: 'rgb(var(--cn-color-teal-soft, 145 168 133) / <alpha-value>)', wash: 'rgb(var(--cn-color-teal-wash, 235 239 226) / <alpha-value>)', tint: 'rgb(var(--cn-color-teal-tint, 243 245 235) / <alpha-value>)' },
        mint: { DEFAULT: 'rgb(var(--cn-color-mint, 207 231 220) / <alpha-value>)', pale: 'rgb(var(--cn-color-mint-pale, 234 244 238) / <alpha-value>)' },
        brass: { DEFAULT: 'rgb(var(--cn-color-brass, 168 118 44) / <alpha-value>)', wash: 'rgb(var(--cn-color-brass-wash, 247 239 224) / <alpha-value>)' },
        coral: { DEFAULT: 'rgb(var(--cn-color-coral, 192 57 43) / <alpha-value>)', deep: 'rgb(var(--cn-color-coral-deep, 156 44 32) / <alpha-value>)', wash: 'rgb(var(--cn-color-coral-wash, 251 238 235) / <alpha-value>)' },
        leaf: { DEFAULT: 'rgb(var(--cn-color-leaf, 47 125 91) / <alpha-value>)', wash: 'rgb(var(--cn-color-leaf-wash, 233 243 237) / <alpha-value>)' },
      },
      fontFamily: {
        sans: ['var(--cn-font-sans, "DM Sans")', 'system-ui', 'sans-serif'],
        display: ['var(--cn-font-display, Newsreader)', 'Georgia', 'serif'],
      },
      fontSize: {
        eyebrow: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.14em' }],
        micro: ['var(--cn-type-small, 0.75rem)', { lineHeight: 'var(--cn-line-small, 1.05rem)' }],
        body: ['var(--cn-type-body, 0.9375rem)', { lineHeight: 'var(--cn-line-body, 1.55rem)' }],
        lead: ['1.0625rem', { lineHeight: '1.7rem' }],
        section: ['1.5rem', { lineHeight: '1.9rem', letterSpacing: '-0.015em' }],
        hero: ['clamp(2rem, 3vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        digit: ['2.75rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
      },
      borderRadius: { panel: 'var(--cn-radius-panel, 20px)', control: 'var(--cn-radius-control, 10px)', pill: '9999px' },
      boxShadow: {
        panel: '0 1px 2px rgba(18, 44, 69, 0.04), 0 8px 24px -12px rgba(18, 44, 69, 0.10)',
        raised: '0 2px 4px rgba(18, 44, 69, 0.05), 0 18px 40px -16px rgba(18, 44, 69, 0.16)',
        press: '0 2px 0 #244A38',
        'press-coral': '0 3px 0 #9C2C20',
      },
      transitionTimingFunction: { out: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    },
  },
  plugins: [],
}
