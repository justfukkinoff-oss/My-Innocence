# Design Brief

## Direction

Docket — a warm parchment legal workbench where case files, grounded retrieval, and drafting live in one quiet, authoritative reading environment.

## Tone

Editorial/refined — a well-typeset law review fused with a modern document tool, chosen because pro se petitioners need calm authority, not startup gloss.

## Differentiation

Every retrieved passage carries a mono locator chip (file · p. · ¶) that expands inline, so the interface itself performs cite-checking.

## Color Palette

| Token      | OKLCH            | Role                                    |
| ---------- | ---------------- | --------------------------------------- |
| background | 0.968 0.011 84   | warm parchment canvas                   |
| foreground | 0.205 0.018 45   | near-black warm ink                     |
| card       | 0.988 0.007 84   | raised paper surfaces                   |
| primary    | 0.375 0.115 15   | oxblood — actions, active nav, links    |
| accent     | 0.62 0.1 72      | muted brass — highlights, selection     |
| muted      | 0.932 0.013 80   | inset bands, table headers, code blocks |

## Typography

- Display: Fraunces — headings, statute titles, draft section headers, wordmark
- Body: General Sans — UI labels, tables, reading text
- Mono: JetBrains Mono — citation locators, page/paragraph numbers, key fingerprints
- Scale: hero `text-4xl md:text-5xl font-semibold tracking-tight`, h2 `text-2xl md:text-3xl font-semibold`, label `text-xs font-semibold tracking-widest uppercase`, body `text-base leading-relaxed`

## Elevation & Depth

Flat parchment layering with hairline borders; elevation reserved for floating panels via `shadow-subtle` / `shadow-elevated`, never glow.

## Structural Zones

| Zone    | Background        | Border                  | Notes                                          |
| ------- | ----------------- | ----------------------- | ---------------------------------------------- |
| Header  | bg-card           | border-b border-border  | wordmark, BYOK key chip, disclaimer strip      |
| Sidebar | bg-sidebar        | border-r border-border  | nested projects → files/drafts/retrieval       |
| Content | bg-background     | —                       | alternate `bg-muted/30` bands between sections |
| Footer  | bg-muted/40       | border-t border-border  | not-legal-advice line, key status              |

## Spacing & Rhythm

Sections gap `space-y-8`; cards pad `p-5`; table rows `py-2.5`; micro-spacing 4/8/12px; long-form reading column capped at 68ch.

## Component Patterns

- Buttons: 6px radius, oxblood `bg-primary` fill for primary, hairline outline for secondary, `transition-smooth`
- Cards: 8px radius, `bg-card`, `border-border`, `shadow-subtle`; hover lifts to `shadow-elevated`
- Badges: pill, muted tint fills — success green, warning amber, destructive oxblood, muted grey for queued

## Motion

- Entrance: `animate-fade-in` 280ms for panels and list rows
- Hover: `transition-smooth` 220ms on buttons, cards, nav items
- Decorative: `animate-index-pulse` on in-progress indexing dots only

## Constraints

- Tokens only — no hex, no arbitrary color classes, no inline colors in components
- Light mode primary; dark mode via `.dark` class, tuned not inverted
- No gradients on page backgrounds; brass is the only highlight color

## Signature Detail

The citation locator chip — a mono `file · p.14 · ¶3` tag that expands to the source passage, making verification the interface's core gesture.
