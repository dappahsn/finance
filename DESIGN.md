---
name: Warm Minimalist Finance
colors:
  surface: '#f7f4ef'
  surface-dim: '#ded4ca'
  surface-bright: '#fffdfa'
  surface-container-lowest: '#fffdfa'
  surface-container-low: '#f2ece5'
  surface-container: '#eee7df'
  surface-container-high: '#e9dfd5'
  surface-container-highest: '#e5dbd1'
  on-surface: '#302923'
  on-surface-variant: '#62574f'
  inverse-surface: '#342d28'
  inverse-on-surface: '#f3ece5'
  outline: '#887b70'
  outline-variant: '#d5c9bd'
  surface-tint: '#a45c43'
  primary: '#a45c43'
  on-primary: '#fffaf5'
  primary-container: '#bc795e'
  on-primary-container: '#fff7f1'
  inverse-primary: '#e8b59b'
  secondary: '#80533f'
  on-secondary: '#ffffff'
  secondary-container: '#e8d7c6'
  on-secondary-container: '#704331'
  tertiary: '#68745c'
  on-tertiary: '#ffffff'
  tertiary-container: '#d7ddcb'
  on-tertiary-container: '#30382c'
  error: '#a4493d'
  on-error: '#ffffff'
  error-container: '#f3d9ce'
  on-error-container: '#6e2822'
  primary-fixed: '#eed8c8'
  primary-fixed-dim: '#d5a28a'
  on-primary-fixed: '#3d2117'
  on-primary-fixed-variant: '#704331'
  secondary-fixed: '#e8d7c6'
  secondary-fixed-dim: '#d6bba4'
  on-secondary-fixed: '#3d2117'
  on-secondary-fixed-variant: '#704331'
  tertiary-fixed: '#e1e6d8'
  tertiary-fixed-dim: '#c6d0b9'
  on-tertiary-fixed: '#293126'
  on-tertiary-fixed-variant: '#45503f'
  background: '#f7f4ef'
  on-background: '#302923'
  surface-variant: '#e5dbd1'
  surface-canvas: '#f7f4ef'
  surface-card: '#fffdfa'
  text-primary: '#302923'
  text-secondary: '#6d625a'
  text-muted: '#94877b'
  income-green: '#687b5b'
  income-green-subtle: '#e9eee4'
  expense-rose: '#b66b52'
  expense-rose-subtle: '#f5e7df'
  border-subtle: '#e8dfd6'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-lg-bold:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-md-medium:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.04em
  financial-amount-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  financial-amount-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 2.5rem
---

## Brand & Style

This design system establishes an ultra-clean, trustworthy, and effortlessly modern aesthetic tailored for mobile personal finance and budgeting. Financial management often brings cognitive stress; the system counters this by presenting a breath of fresh air—clear, uncluttered, and optimistic. 

The design combines **Modern Minimalist Utility** with **Tactile Softness**. By pairing crisp typographic clarity with generous whitespace, cool slate undertones, and gentle card elevations, the interface feels structured yet approachable. It invites daily interaction without overwhelming the user with heavy data sheets. High contrast ensures readability in varied lighting conditions, while intentional semantic accents create instantaneous mental clarity around cashflow movements.

## Colors

The palette is engineered around clean clarity and fiscal discipline. 

- **Primary & Secondary (`#0D9488`, `#14B8A6`)**: Fresh teal tones anchoring brand presence, active states, key interactive indicators, and primary navigation elements. These communicate steady growth, security, and precision.
- **Deep Evergreen (`#063D35`)**: Sourced from the brand core, this deep accent anchors primary typography, selected high-emphasis badges, and hero summary banners.
- **Cool Neutrals (`#F8FAFC`, `#FFFFFF`, `#64748B`, `#0F172A`)**: The background defaults to a cool slate `#F8FAFC`, allowing pristine `#FFFFFF` surfaces to emerge organically. Text utilizes deep slate tones rather than pure black to preserve softer visual hierarchy without compromising WCAG AAA contrast ratios.
- **Semantic Accents (`#10B981`, `#F43F5E`)**: Income is designated by emerald green, while spending/alerts are conveyed by soft coral-rose. Both are paired with ultra-light tinted container backgrounds (`#ECFDF5` and `#FFF1F2`) for legible, non-aggressive transaction records.

## Typography

Plus Jakarta Sans drives the typographic system, infusing modern geometric geometry with sculpted, friendly humanist counters. Its clear numeric proportions ensure that balance metrics, transaction totals, and category figures are scanned instantaneously.

- **Monetary Values**: Utilize tabular figure variants (`tnum`) when aligning amounts in list contexts. High-level wallet balances use `financial-amount-lg` with tight tracking to command immediate attention.
- **Hierarchy Rules**: Primary labels and section titles use semi-bold (`600`) and bold (`700`) weights. Subtitles and transactional metadata fall cleanly into `body-sm` or `body-md-medium` rendered in neutral slate tints.

## Layout & Spacing

The layout is built around a mobile-first, edge-cushioned structure optimizing thumb reach and vertical scanning rhythm.

- **Canvas Gutters & Margins**: A standard mobile screen margin of `1.25rem` (20px) protects interface elements from device borders. Columns within multi-stat widgets utilize a `1rem` (16px) gutter.
- **Rhythm & Stacking**: Content flows vertically with a predictable 8pt rhythm. Dense financial listings leverage `space-xs` (8px) and `space-sm` (12px) internal gaps, while major module separations apply `space-xl` (24px) or `space-2xl` (32px).
- **Responsive Handling**: On wider viewports (tablets or desktop dashboards), the canvas restricts to a centered maximum width (480px for focused mobile views, up to 1120px for multi-column dashboards) with expanded gutters of `1.5rem`.

## Elevation & Depth

Visual hierarchy uses a refined combination of **tonal separation** and **ambient drop shadows**:

- **Ground Plane**: Base application canvas rests on `#F8FAFC`.
- **Level 1 (Cards & Feed Tiles)**: Rest on pure `#FFFFFF`, bound by a crisp hairline border (`1px solid #E2E8F0`) and softened with an ambient shadow: `0 4px 20px -2px rgba(15, 23, 42, 0.04)`.
- **Level 2 (Floating Action Buttons & Floating Modals)**: Lift above content using: `0 12px 28px -4px rgba(13, 148, 136, 0.15), 0 6px 12px -2px rgba(15, 23, 42, 0.06)`. This provides a physical sense of tactile reach without muddying the screen.
- **Overlay & Sheets**: Bottom sheets use a soft backdrop blur (`backdrop-filter: blur(12px)`) tinted with `rgba(15, 23, 42, 0.3)` to isolate interactive entry drawers cleanly.

## Shapes

The shape system employs deeply rounded contours that communicate warmth, friendliness, and security:

- **Cards & Primary Modules**: Feature radii between `16px` and `24px` (`rounded-xl` to custom `rounded-2xl`), matching the friendly framing demonstrated in the brand's core modal interface.
- **Buttons & Input Elements**: Inputs and standard interactive controls use smooth `12px` to `16px` corners.
- **Badges, Pills & Icon Surrounds**: Fully circular or pill-shaped (`9999px`) to create natural contrast against rectangular modules.

## Components

### Buttons
- **Primary Button**: Solid teal fill (`#0D9488`), white text (`#FFFFFF`), `font-weight: 600`, with horizontal padding of `1.5rem` and height of `48px` or `52px`. Soft rounded corners (`12px` - `16px`). Hover/active states trigger a smooth transition to `#0F766E`.
- **Secondary / Social Button (e.g., Masuk dengan Google)**: Crisp white background (`#FFFFFF`), neutral border (`1px solid #E2E8F0`), label color `#0F172A`, accompanied by the official brand icon.
- **Ghost / Tertiary**: Transparent background, text colored in primary teal or slate, applied to auxiliary links and dismissive actions.

### Cards
- **Financial Metric Cards**: White container, `16px` - `20px` internal padding, `20px` border-radius, hairline slate border. Contains a soft-tinted circular icon backdrop (`40px x 40px`), metric title in `body-sm`, and high-emphasis balance in `financial-amount-lg`.
- **Transaction Item Tile**: Horizontal layout inside transaction feeds; left icon badge (circular or rounded-sq, colored per transaction category), center vertical stack (Payee / Category in bold, Timestamp in muted), right vertical stack (amount colored in `#10B981` with `+` or `#F43F5E` with `-`).

### Status Badges & Chips
- **Income Badge**: Tinted background `#ECFDF5`, text `#047857`, border `1px solid rgba(16, 185, 129, 0.2)`, pill-shaped.
- **Expense Badge**: Tinted background `#FFF1F2`, text `#E11D48`, border `1px solid rgba(244, 63, 94, 0.2)`, pill-shaped.
- **Category Filter Chips**: Default state with transparent surface, subtle outline, and slate text. Active state filled with primary teal (`#0D9488`) and crisp white text.

### Input Fields
- Enclosed with a light `#FFFFFF` surface, `1px solid #E2E8F0` border, `12px` radius, and `14px` padding. Focus states illuminate with a `2px` teal ring (`#0D9488`) and zero blur offset.
- Floating currency prefix labels (e.g., "Rp") set in bold muted slate.

### Bottom Navigation Bar
- Fixed bottom dock on mobile viewports: white surface, subtle top divider (`#F1F5F9`), subtle shadow. Icons transition from `#94A3B8` (inactive) to `#0D9488` (active) paired with a compact, active indicator dot.