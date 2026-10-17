<p align="center">
  <a href="https://rhoe.syadah.my.id">
    <img alt="Rhoe UI – Free React components with motion built in. Install with shadcn CLI." src="https://rhoe.syadah.my.id/og.png" width="100%">
  </a>
</p>

<p align="center">
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-111111?style=flat-square"></a>
  <a href="https://rhoe.syadah.my.id/docs/installation"><img alt="shadcn registry: @rhoe" src="https://img.shields.io/badge/shadcn%20registry-%40rhoe-111111?style=flat-square"></a>
  <img alt="30 components" src="https://img.shields.io/badge/components-30-7C3AED?style=flat-square">
  <img alt="1 block" src="https://img.shields.io/badge/blocks-1-7C3AED?style=flat-square">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-111111?style=flat-square">
</p>

<p align="center">
  <a href="https://rhoe.syadah.my.id/docs/introduction"><b>Docs</b></a>
  &nbsp;·&nbsp;
  <a href="https://rhoe.syadah.my.id/components"><b>Components</b></a>
  &nbsp;·&nbsp;
  <a href="#install"><b>Install</b></a>
  &nbsp;·&nbsp;
  <a href="https://rhoe.syadah.my.id/blocks"><b>Blocks</b></a>
</p>

---

Rhoe UI is a library of React components with motion built in. Every item is plain source code you own — no runtime package to keep in sync. Install anything with the shadcn CLI or copy the files by hand. Works with Next.js and Vite, with or without Tailwind.

This repository holds the **free, open source** part: **30 components and 1 block**, plus the design and motion tokens they share. Every component has a live preview at [rhoe.syadah.my.id](https://rhoe.syadah.my.id).

---

Rhoe UI adalah library komponen React dengan animasi bawaan. Setiap item adalah source code murni yang langsung kamu miliki — tidak ada runtime package yang perlu dijaga sinkronnya. Install apapun dengan shadcn CLI atau salin filenya secara manual. Mendukung Next.js dan Vite, dengan atau tanpa Tailwind.

Repository ini berisi bagian yang **gratis dan open source**: **30 komponen dan 1 block**, beserta design token dan motion token yang digunakan bersama. Setiap komponen memiliki live preview di [rhoe.syadah.my.id](https://rhoe.syadah.my.id).

---

## Contents

- [Install](#install)
  - [Requirements / Persyaratan](#requirements--persyaratan)
  - [With the shadcn CLI](#with-the-shadcn-cli)
  - [Copy and paste](#copy-and-paste)
- [Usage / Penggunaan](#usage--penggunaan)
- [Theming / Kustomisasi](#theming--kustomisasi)
- [Components / Komponen](#components--komponen)
- [Blocks](#blocks)
- [Repository Layout](#repository-layout)
- [Contributing / Kontribusi](#contributing--kontribusi)
- [License](#license)

---

## Install

### Requirements / Persyaratan

- **React 19** with TypeScript
- **Next.js** (App Router) or **Vite**
- **[motion](https://www.npmjs.com/package/motion)** for animation. Some items also use [lucide-react](https://lucide.dev); the CLI installs whatever an item needs.
- The `@/*` import alias (Next.js and shadcn set it up by default)

No Tailwind is required. Rhoe UI styles use CSS variables.

---

- **React 19** dengan TypeScript
- **Next.js** (App Router) atau **Vite**
- **[motion](https://www.npmjs.com/package/motion)** untuk animasi. Beberapa item juga menggunakan [lucide-react](https://lucide.dev); CLI akan menginstal semua yang dibutuhkan secara otomatis.
- Import alias `@/*` (sudah diatur otomatis oleh Next.js dan shadcn)

Tailwind tidak diperlukan. Style Rhoe UI menggunakan CSS variables.

### With the shadcn CLI

Register the `@rhoe` namespace once in `components.json`:

```json
{
  "registries": {
    "@rhoe": "https://rhoe.syadah.my.id/r/{name}.json"
  }
}
```

Then add items by name. Local dependencies come along automatically:

```bash
npx shadcn@latest add @rhoe/button
npx shadcn@latest add @rhoe/dialog @rhoe/input
```

Install the design tokens once per app:

```bash
npx shadcn@latest add @rhoe/foundation
```

Then import them at the root of your app:

```tsx
// app/layout.tsx (Next.js) or src/main.tsx (Vite)
import "@/components/rhoe/foundation.css";
```

Every item also installs from its full URL, without touching `components.json`:

```bash
npx shadcn@latest add https://rhoe.syadah.my.id/r/button.json
```

### Copy and paste

1. Install the shared packages: `npm install motion lucide-react`
2. Copy `registry/components/foundation.css` and `registry/components/lib/motion-tokens.ts` into the same paths under your `@/` root, and import the CSS once at the root
3. Copy the item's folder from `registry/components/<name>/` or `registry/blocks/<name>/`, keeping the path

Each page on [rhoe.syadah.my.id](https://rhoe.syadah.my.id) has a **Manual** tab with the exact files listed.

---

## Usage / Penggunaan

The CLI puts every file in a `rhoe/` folder under the `components` alias, for example `components/rhoe/button/button.tsx`. Use them like any local component:

CLI akan menempatkan setiap file di folder `rhoe/` di bawah alias `components`, contohnya `components/rhoe/button/button.tsx`. Gunakan seperti komponen lokal biasa:

```tsx
import { Button } from "@/components/rhoe/button/button";

export default function Page() {
  return <Button>Save changes</Button>;
}
```

The code is yours: edit it, rename it, move it. There is no runtime package to keep in sync.

Kode ini milikmu: edit, rename, atau pindahkan sesukamu. Tidak ada runtime package yang perlu dijaga sinkronnya.

---

## Theming / Kustomisasi

Components read semantic tokens, never raw colors. Change a token in `foundation.css` and every component follows, in both themes.

| Token | Used for |
| --- | --- |
| `--background` | Page background |
| `--surface`, `--surface-raised`, `--surface-muted` | Cards, inputs, floating layers, quiet fills |
| `--foreground`, `--text-secondary`, `--text-muted` | Primary, supporting, and hint text |
| `--border`, `--border-subtle`, `--border-strong` | Separators and edges |
| `--accent`, `--accent-strong`, `--accent-subtle` | Selection, progress, helpful context |
| `--success`, `--warning`, `--danger` | Semantic status, always paired with a label |
| `--radius-control`, `--radius-panel`, `--radius-surface` | Controls, menus, cards |

- **Dark mode:** set `data-theme="dark"` on `<html>`
- **Motion:** spring and duration presets live in `registry/components/lib/motion-tokens.ts`. Every animation respects `prefers-reduced-motion`.

---

## Components / Komponen

30 free components. Click a name for the live preview.

### Actions

| Component | Description | Install |
| --- | --- | --- |
| [Button](https://rhoe.syadah.my.id/components/button) | Filled, bordered, text, and animated action buttons across semantic tones. | `npx shadcn@latest add @rhoe/button` |
| [Dropdown Menu](https://rhoe.syadah.my.id/components/dropdown-menu) | Animated dropdown menu with keyboard navigation. | `npx shadcn@latest add @rhoe/dropdown-menu` |
| [Popover](https://rhoe.syadah.my.id/components/popover) | Floating content anchored to a trigger. | `npx shadcn@latest add @rhoe/popover` |
| [Dialog](https://rhoe.syadah.my.id/components/dialog) | Modal dialog that morphs from its trigger. | `npx shadcn@latest add @rhoe/dialog` |
| [Expanding Search](https://rhoe.syadah.my.id/components/expanding-search) | Search input that expands on focus. | `npx shadcn@latest add @rhoe/expanding-search` |

### Inputs

| Component | Description | Install |
| --- | --- | --- |
| [Input](https://rhoe.syadah.my.id/components/input) | Accessible filled and bordered inputs with icons and validation. | `npx shadcn@latest add @rhoe/input` |
| [Textarea](https://rhoe.syadah.my.id/components/textarea) | Multiline input with optional auto-height and character counter. | `npx shadcn@latest add @rhoe/textarea` |
| [Password Strength](https://rhoe.syadah.my.id/components/password-strength) | Password input with live requirements and strength indicator. | `npx shadcn@latest add @rhoe/password-strength` |
| [Currency Input](https://rhoe.syadah.my.id/components/currency-input) | Localized numeric input with morphing currency symbol. | `npx shadcn@latest add @rhoe/currency-input` |
| [Number Input](https://rhoe.syadah.my.id/components/number-input) | Numeric stepper with bounded increments. | `npx shadcn@latest add @rhoe/number-input` |
| [Select](https://rhoe.syadah.my.id/components/select) | Animated select with search and keyboard navigation. | `npx shadcn@latest add @rhoe/select` |
| [Checkbox](https://rhoe.syadah.my.id/components/checkbox) | Animated checkbox with indeterminate state. | `npx shadcn@latest add @rhoe/checkbox` |
| [Radio](https://rhoe.syadah.my.id/components/radio) | Radio group with smooth selection indicator. | `npx shadcn@latest add @rhoe/radio` |
| [Switch](https://rhoe.syadah.my.id/components/switch) | Toggle switch with spring animation. | `npx shadcn@latest add @rhoe/switch` |
| [Calendar](https://rhoe.syadah.my.id/components/calendar) | Date picker with animated month transitions. | `npx shadcn@latest add @rhoe/calendar` |

### Display

| Component | Description | Install |
| --- | --- | --- |
| [Badge](https://rhoe.syadah.my.id/components/badge) | Compact semantic status labels. | `npx shadcn@latest add @rhoe/badge` |
| [Toast](https://rhoe.syadah.my.id/components/toast) | Stacked notifications with semantic tones and six positions. | `npx shadcn@latest add @rhoe/toast` |
| [Tooltip](https://rhoe.syadah.my.id/components/tooltip) | Contextual help revealed on hover or keyboard focus. | `npx shadcn@latest add @rhoe/tooltip` |
| [Code Block](https://rhoe.syadah.my.id/components/code-block) | Server-rendered syntax highlighting with filename variant. | `npx shadcn@latest add @rhoe/code-block` |
| [Tabs](https://rhoe.syadah.my.id/components/tabs) | Animated tab switcher with sliding indicator. | `npx shadcn@latest add @rhoe/tabs` |
| [Animated List](https://rhoe.syadah.my.id/components/animated-list) | List items that enter and exit with staggered motion. | `npx shadcn@latest add @rhoe/animated-list` |
| [Expandable Card](https://rhoe.syadah.my.id/components/expandable-card) | Card that expands to reveal additional content. | `npx shadcn@latest add @rhoe/expandable-card` |
| [Curved Carousel](https://rhoe.syadah.my.id/components/curved-carousel) | Carousel with perspective depth and curved layout. | `npx shadcn@latest add @rhoe/curved-carousel` |
| [Sidebar Navigation](https://rhoe.syadah.my.id/components/sidebar-navigation) | Collapsible sidebar with animated active indicator. | `npx shadcn@latest add @rhoe/sidebar-navigation` |
| [Table of Contents](https://rhoe.syadah.my.id/components/table-of-contents) | Auto-generated TOC with active section tracking. | `npx shadcn@latest add @rhoe/table-of-contents` |

### Motion / Text

| Component | Description | Install |
| --- | --- | --- |
| [Icon Morph](https://rhoe.syadah.my.id/components/icon-morph) | Smoothly morphs between two icons. | `npx shadcn@latest add @rhoe/icon-morph` |
| [Morphing Text](https://rhoe.syadah.my.id/components/morphing-text) | Text that morphs character by character. | `npx shadcn@latest add @rhoe/morphing-text` |
| [Text Reveal](https://rhoe.syadah.my.id/components/text-reveal) | Text that reveals word by word on scroll. | `npx shadcn@latest add @rhoe/text-reveal` |
| [Scramble Text](https://rhoe.syadah.my.id/components/scramble-text) | Text that scrambles to a new value. | `npx shadcn@latest add @rhoe/scramble-text` |
| [Rolling Number](https://rhoe.syadah.my.id/components/rolling-number) | Number that rolls to a new value with spring motion. | `npx shadcn@latest add @rhoe/rolling-number` |

---

## Blocks

| Block | Description | Install |
| --- | --- | --- |
| [Todo Calendar](https://rhoe.syadah.my.id/blocks/todo-calendar) | A full-featured to-do list with an animated calendar date picker. | `npx shadcn@latest add @rhoe/todo-calendar` |

---

## Repository Layout

```
rhoe-ui/
├── registry/
│   ├── components/         # Free component source files
│   │   ├── foundation.css  # Design tokens (color, radius, shadow)
│   │   ├── theme-tailwind.css
│   │   ├── lib/
│   │   │   └── motion-tokens.ts
│   │   ├── button/
│   │   ├── input/
│   │   └── ...
│   └── blocks/             # Free block source files
│       └── todo-calendar/
├── public/
│   └── r/                  # Built JSON endpoints for shadcn CLI
│       ├── registry.json
│       ├── foundation.json
│       ├── button.json
│       └── ...
├── registry.json           # shadcn registry manifest
├── package.json
├── tsconfig.json
├── eslint.config.mjs
├── README.md
├── LICENSE
└── CONTRIBUTING.md
```

> **Note:** This repository contains only the free components. The documentation website source and Pro components are maintained separately.

---

## Contributing / Kontribusi

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting a pull request.

Kontribusi sangat disambut! Silakan baca [CONTRIBUTING.md](./CONTRIBUTING.md) sebelum mengajukan pull request.

**Ways to contribute / Cara berkontribusi:**
- 🐛 Report bugs / Laporkan bug
- 💡 Suggest new components / Usulkan komponen baru
- 📖 Improve documentation / Perbaiki dokumentasi
- 🔧 Submit a fix / Kirim perbaikan

---

## License

MIT © [Irsyad Agung Hermawan](https://github.com/irsyadagungh)

See [LICENSE](./LICENSE) for full text.
