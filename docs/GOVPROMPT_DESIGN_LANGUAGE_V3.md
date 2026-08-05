# GovPrompt Design Language (GDL) 3.0

## Product architecture

The home page is now a single AI-first conversation shell. User intent flows through the existing `SharedContext` and `TransactionRouter`, which selects GP001–GP012 without exposing module choice. Knowledge and Citation engines remain the authority for source/version validation. The legacy assistants remain unchanged and are reachable under **Tools** for advanced users.

`User → Chat composer → SharedContext → TransactionRouter → GP001–GP012 → Knowledge/Citation engines → Structured answer`

## Foundations

- Color: government green `#12372A`, interaction green `#1D513F`, ceremonial gold `#C99A3D`, canvas `#F7F8F5`, ink `#17231E`, muted `#64716B`, line `#DCE3DE`, danger `#A9342D`, focus `#1F6FEB`.
- Typography: Noto Sans Thai when available, then Leelawadee UI, Tahoma, and system sans. Body is 16 px; compact metadata never drops below 10 px; headings use responsive sizing.
- Spacing: 4 px base rhythm. Primary steps are 8, 12, 16, 20, 24, 32, 48, and 64 px.
- Radius: 10 px controls, 16 px cards, 24 px major surfaces. Shadows are restrained and green-tinted.
- Touch: interactive targets are at least 42 px; primary actions are 44 px. Focus uses a visible 3 px blue outline.
- Icons: inline, stroke-based SVG with 24 px view boxes. Icons always have a text label or accessible name.
- Motion: 120–240 ms for interface state and an 850 ms analysis handoff. `prefers-reduced-motion` removes non-essential motion.

## Components

- Composer: multiline input, attachment, camera, microphone, and send. Attachments remain local until an explicit future submission contract exists.
- Quick-action chips: horizontally scrollable on phones and wrapping on larger screens.
- Answer card: fixed semantic order—Summary, Applicable Laws, Procedure, Risk, Recommendation, References.
- Navigation: left rail on desktop and five-item bottom bar on mobile/tablet.
- Tools dialog: the only home-page location exposing GP001–GP012.

## Wireframes

### Mobile

```text
┌ GovPrompt Thailand                 + ┐
│                                    │
│              [กพ]                  │
│       วันนี้ให้ช่วยเรื่องอะไรดี       │
│  ถามได้ทุกเรื่องเกี่ยวกับงานราชการไทย  │
│ [รถเสีย…] [ร่างหนังสือ] [ตรวจ TOR] → │
│                                    │
│ ┌ ถามเกี่ยวกับงานราชการ…           ┐ │
│ │                                  │ │
│ │ 📎  📷  🎙                  ↑   │ │
│ └──────────────────────────────────┘ │
├────────────────────────────────────┤
│ Home History Knowledge Profile Tools│
└────────────────────────────────────┘
```

### Tablet/Desktop

```text
┌──rail──┬──────── GovPrompt Thailand ───────────┐
│ Home   │                                       │
│History │            [กพ]                       │
│Knowl.  │     วันนี้ให้ช่วยเรื่องอะไรดี             │
│Profile │      [quick action chips]             │
│Tools   │                                       │
│        │   ┌──────── chat / answers ───────┐   │
│        │   └───────────────────────────────┘   │
│        │   ┌──────── composer ─────────────┐   │
└────────┴───┴───────────────────────────────┴───┘
```

## Responsive rules

- Below 620 px: compact header, single-column answers, scrollable quick actions, one-hand bottom navigation.
- 620–959 px: centered conversation with bottom navigation and generous tablet gutters.
- 960 px and above: persistent 88 px left rail; composer stays centered at a readable 800 px maximum.
- Content width never exceeds 800 px for conversation; dialogs cap at 680 px.

## Accessibility and performance

The shell uses semantic regions, explicit labels, `aria-live` for analysis and file state, keyboard submission, skip navigation, visible focus, reduced-motion support, and high-contrast text. No framework or icon library was introduced. The home controller is deferred and the existing engines remain separate scripts, allowing browser caching and future route-level lazy loading.

## Migration plan

1. Ship the v3 home shell while keeping all GP pages and engine scripts intact.
2. Observe router classifications and add vocabulary only to the canonical Transaction Router.
3. Connect the composer to the approved server-side AI contract; keep the current structured preview as a safe fallback.
4. Load history/profile from authenticated storage only after retention and privacy policies are approved.
5. Move advanced GP forms into a lazy-loaded overlay without changing their prompt logic.
6. Retire duplicated legacy launcher styles after usage confirms the v3 path is stable.
