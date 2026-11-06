---
name: Pastel Ledger
colors:
  surface: '#fff8f8'
  surface-dim: '#ffcce0'
  surface-bright: '#fff8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff0f4'
  surface-container: '#ffe8ef'
  surface-container-high: '#ffe0eb'
  surface-container-highest: '#ffd8e6'
  on-surface: '#2f1220'
  on-surface-variant: '#564147'
  inverse-surface: '#472635'
  inverse-on-surface: '#ffecf1'
  outline: '#897177'
  outline-variant: '#dcbfc7'
  surface-tint: '#a72f65'
  primary: '#982359'
  on-primary: '#ffffff'
  primary-container: '#b83d72'
  on-primary-container: '#ffe7ed'
  inverse-primary: '#ffb0ca'
  secondary: '#6f5862'
  on-secondary: '#ffffff'
  secondary-container: '#f9dbe7'
  on-secondary-container: '#755e68'
  tertiary: '#41546f'
  on-tertiary: '#ffffff'
  tertiary-container: '#596c89'
  on-tertiary-container: '#e4edff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9e3'
  primary-fixed-dim: '#ffb0ca'
  on-primary-fixed: '#3e001f'
  on-primary-fixed-variant: '#88144d'
  secondary-fixed: '#f9dbe7'
  secondary-fixed-dim: '#dbbfcb'
  on-secondary-fixed: '#27171f'
  on-secondary-fixed-variant: '#56414b'
  tertiary-fixed: '#d4e3ff'
  tertiary-fixed-dim: '#b4c8e8'
  on-tertiary-fixed: '#061c35'
  on-tertiary-fixed-variant: '#354862'
  background: '#fff8f8'
  on-background: '#2f1220'
  surface-variant: '#ffd8e6'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 24px
  amount-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.03em
  amount-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.02em
  amount-card:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.25rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system blends soft, empathetic warmth with disciplined financial utility. Designed for personal expense tracking and budgeting on mobile web platforms, it strips away the cold, intimidating aura of traditional banking apps in favor of an inviting, reassuring, and playful aesthetic.

Key brand attributes:
- **Gentle & Supportive:** Financial tracking should reduce anxiety. Soft rose tints and airy card containers evoke comfort and encouragement.
- **Precise & Legible:** Numerical data remains authoritative and scannable without looking institutional.
- **Tactile Softness:** Elements mimic high-end editorial stationery—subtle diffuse rose-tinted shadows, curved containers, and pill-shaped touch surfaces.

## Colors

The palette balances gentle, pastel tones with high-contrast text and purposeful semantic markers to guarantee accessibility (WCAG AA) while keeping the visual temperature warm.

### Core Canvas & Surfaces
- **Global Canvas:** `#FFF5F8` (Ultra-soft blush canvas across all screen backdrops)
- **Surface / Card Container:** `#FFFFFF` (Pure white for raised cards, floating sheets, and modals)
- **Surface Subdued / Accent Light:** `#FADCE8` (Soft blossom pink for tag backgrounds, category chip fills, and subtle borders)

### Brand & Interactive Accents
- **Primary Accent:** `#B83D72` (Deep rose pink; reserved for primary buttons, active bottom navigation states, and primary KPI callouts)
- **Secondary Neutral / Counterbalance:** `#4F627E` (Cool slate-blue; anchors positive inflows/incomes to prevent pink-fatigue and convey fiscal stability)
- **Warning & Overbudget:** `#A52C48` (Vibrant crimson-berry; alerts users to budget overruns and negative cash-flow states)

### Text & Icon Contrast Tiers
- **Text Primary:** `#4A2938` (Deep plum-charcoal; used for all bold financial metrics, headings, and primary labels)
- **Text Secondary:** `#795366` (Muted mauve-slate; used for timestamps, category descriptions, transaction metadata, and secondary actions)

### Soft Category Accents
- **Peach Whisper:** `#FFB7B2` (Food & beverage, lifestyle badges)
- **Custard Cream:** `#FFEAA7` (Leisure, travel, subscriptions)
- **Lilac Mist:** `#E2D4F0` (Personal care, education, investments)

## Typography

The design system implements **Plus Jakarta Sans** for headlines, quantitative figures, and body copy. Its rounded geometry matches the visual softness, while its vertical metrics provide crisp legibility for multi-digit financial sums.

Key rules:
- **Numerical Formatting:** Currency signs (`¥` / `$`) are styled at 65% scale relative to the currency amount, baseline-aligned or slightly raised, preventing symbols from visually overwhelming the figures.
- **Tabular Figures:** Always render monetary metrics and timestamps with `font-feature-settings: "tnum" 1` to prevent layout jittering during balance recalculations.
- **Contrast Pairing:** All major figures use `#4A2938` for optimum optical contrast; secondary descriptors never drop below `#795366`.

## Layout & Spacing

A strict 8px spatial grid underpins all components, with a 4px half-step (`space-xs`) reserved for tight interior padding such as badges and icon-text pairings.

- **Mobile Canvas Bounds:** The app prioritizes mobile viewport widths (360px–430px) locked within a centered container on wider screens (max-width `480px` on desktop/tablet views) to maintain an app-like presence.
- **Screen Margins:** Standard horizontal padding is 16px (`1rem`), widening to 20px (`1.25rem`) on larger handsets.
- **Bottom Navigation Clearance:** All scroll views implement an explicit bottom padding spacer of `calc(76px + env(safe-area-inset-bottom))` to prevent the floating navigation deck from obscuring transaction records.

## Elevation & Depth

To avoid murky gray drop shadows that undermine the pastel atmosphere, this system utilizes chromatic, diffused rose shadows.

- **Level 0 (Flat Canvas):** `#FFF5F8` background with no elevation.
- **Level 1 (Default White Card):** Background `#FFFFFF`, box-shadow: `0 4px 16px -2px rgba(184, 61, 114, 0.06), 0 2px 6px -1px rgba(74, 41, 56, 0.03)`.
- **Level 2 (Interactive Floating Card / Dropdown):** Background `#FFFFFF`, box-shadow: `0 8px 24px -4px rgba(184, 61, 114, 0.10), 0 3px 8px -2px rgba(74, 41, 56, 0.05)`.
- **Level 3 (Quick-Add Modal / Central Navigation Action):** Background `#FFFFFF` or `#B83D72`, box-shadow: `0 12px 28px -4px rgba(184, 61, 114, 0.28)`.
- **Subtle Partitioning:** Borders are avoided when elevation suffices; when necessary, cards feature a soft 1px perimeter border rendered in `rgba(184, 61, 114, 0.08)`.

## Shapes

The geometric signature is soft, friendly, and tactile.

- **Content Cards & Modules:** Strictly `20px` corner radius. This large radius softens financial reports and visual summaries.
- **Controls & Form Elements:** Buttons, text fields, and segmented tabs use a uniform `12px` corner radius.
- **Tags & Floating Badges:** Pill-shaped (`9999px`) for quick visual scanning.
- **Category Icon Avatars:** 44px squircle (`14px` radius) or perfect circles (`50%`), giving individual expense buckets a soft sticker-like feel.

## Components

### Buttons
- **Primary Button:** Height 48px, background `#B83D72`, text `#FFFFFF`, border-radius 12px, font-weight 600. Active tap state introduces `transform: scale(0.98)` with shadow contraction.
- **Secondary Button:** Height 48px, background `#FADCE8`, text `#B83D72`, border-radius 12px.
- **Ghost/Tertiary Action:** Height 40px, transparent background, text `#795366`, active fill `rgba(250, 220, 232, 0.5)`.

### Cards & Financial Containers
- Built on pure white (`#FFFFFF`) with 20px radius and Level 1 rose-tinted shadows.
- Inner card padding is fixed to 16px or 20px. 
- Overspent budgets alter the card perimeter with a 1.5px stroke of `#A52C48` at 40% opacity and an icon tint in `#A52C48`.

### Input Fields & Keypad
- **Inputs:** Height 52px, filled background `#FFFFFF` with a 1px border in `#FADCE8`. In focus, border shifts to `#B83D72` with an ambient glow (`box-shadow: 0 0 0 3px rgba(184, 61, 114, 0.15)`). Placeholder text in `#795366` at 50% opacity.
- **Numeric Keypad ("Record Expense"):** White surface with rounded 12px keypad tiles, elevated numbers in `#4A2938` (`font-size: 22px`, semi-bold).

### Chips & Category Selectors
- **Unselected:** Background `#FFF5F8`, border `1px solid #FADCE8`, text `#795366`.
- **Selected:** Background `#FADCE8`, border `1.5px solid #B83D72`, text `#B83D72`, font-weight 600.
- Category icons display inside 40px round containers tinted with pastel accents (`#FFB7B2`, `#FFEAA7`, `#E2D4F0`, `#FADCE8`).

### Transaction List Items
- Height 64px, row alignment. Left icon: 40px category squircle. Center: transaction merchant/title (`#4A2938`, 15px) stacked above date/note (`#795366`, 12px). Right: monetary value (`amount-card`). Expenses default to `#4A2938` with a `-` prefix; incomes render in `#4F627E` with a `+` prefix.

### Checkboxes & Radios
- 20px rounded elements with a 2px border in `#FADCE8`. Selected state fills with `#B83D72` featuring a white micro-check icon.

### Bottom Navigation Bar (5-slot Floating Dock)
- **Bar Shell:** Fixed bottom height 64px, background `#FFFFFF` with `backdrop-filter: blur(12px)`. Border-top: `1px solid rgba(184, 61, 114, 0.08)`.
- **Layout:** 5 slots symmetrically spaced:
  1. **Home (首页):** Icon + label in `#795366` (active `#B83D72`).
  2. **Details (明细):** Icon + label in `#795366` (active `#B83D72`).
  3. **Record Expense (记一笔 - Center Highlight):** 52px floating circular button centered over the bar, raised by -16px vertically. Background `#B83D72`, icon in `#FFFFFF`, with elevation Level 3.
  4. **Analytics (统计):** Icon + label in `#795366` (active `#B83D72`).
  5. **Settings (设置):** Icon + label in `#795366` (active `#B83D72`).