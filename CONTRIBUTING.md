# Contributing to Rhoe UI

Thank you for your interest in contributing! / Terima kasih atas minat Anda untuk berkontribusi!

## Before You Start / Sebelum Memulai

- Check the [open issues](https://github.com/irsyadagungh/rhoe-ui/issues) to avoid duplicates
- For large changes, open an issue first to discuss the approach
- Use Tailwind CSS utilities for component styling; use CSS variables for shared design and motion tokens
- All animations must respect `prefers-reduced-motion`

---

- Cek [issues yang ada](https://github.com/irsyadagungh/rhoe-ui/issues) untuk menghindari duplikasi
- Untuk perubahan besar, buka issue terlebih dahulu untuk mendiskusikan pendekatannya
- Gunakan utility Tailwind CSS untuk styling komponen; gunakan CSS variables untuk design token dan motion token bersama
- Semua animasi harus menghormati `prefers-reduced-motion`

## Reporting Bugs / Melaporkan Bug

Please include:
- Component name and version
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS

## Suggesting Components / Mengusulkan Komponen

Open an issue with the label `component-request` and describe:
- What problem it solves
- A rough description or reference

## Submitting a Pull Request

1. Fork this repository
2. Create a branch: `git checkout -b feat/component-name`
3. Run `pnpm install --frozen-lockfile`, then `pnpm dev`
4. Open the local URL printed in the terminal, visit `/components` or `/blocks`, and edit the source in `registry/`
5. Update the matching example in `app/(catalog)/components/previews/` or `app/(catalog)/blocks/previews/`, and the API catalog JSON when behavior or props change
6. Check light/dark themes, mobile widths, keyboard interaction, and reduced motion
7. Run `pnpm build`, `pnpm registry:check`, `pnpm typecheck`, and `pnpm lint`
8. Include regenerated `public/r` files and open a pull request with a clear description and screenshots/video for visual changes

Use Node.js 24 LTS and the pinned pnpm version. This public repository is the
source of truth for Free components and examples. Preview pages import registry
source directly, so no private repository or production credentials are needed.
Do not add Pro source or secrets. The maintainer separately imports an approved
commit into the production website before deployment.

The server port is configurable: use `pnpm dev --port 3002` if you need a second
local server. Follow the URL printed in the terminal. For a custom origin, set
`NEXT_PUBLIC_SITE_URL` in `.env.local` as described in `.env.example`.

## Code Style

- TypeScript strict mode
- Prefer existing dependencies; discuss new ones first and declare every runtime dependency in the affected registry items
- CSS variables for all design tokens — no hardcoded colors
- Accessible: keyboard navigation, ARIA attributes where needed

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
