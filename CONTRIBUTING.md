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
3. Make your changes
4. Open a pull request with a clear description

## Code Style

- TypeScript strict mode
- No external dependencies beyond `motion` and `lucide-react`
- CSS variables for all design tokens — no hardcoded colors
- Accessible: keyboard navigation, ARIA attributes where needed

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
