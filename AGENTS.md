# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` holds Next.js App Router pages and layouts (`layout.tsx`, route folders like `(home)`, `editor`, `export`).
- `src/components/` is split by feature (`editor`, `layout-builder`, `site`, `ui`).
- `src/lib/` contains reusable logic (storage, geometry, rendering).
- `src/data/` stores static data (themes, templates).
- `public/` contains static assets served at the site root.
- `doc/` is reserved for design notes or supporting documentation.

## Build, Test, and Development Commands
- `pnpm dev`: start the Next.js dev server at `http://localhost:3000`.
- `pnpm build`: create a production build.
- `pnpm start`: run the production server from the build output.
- `pnpm lint`: run ESLint with the Next.js ruleset.
No test script is defined yet; add one before introducing automated tests.

## Coding Style & Naming Conventions
- TypeScript + React (JSX) with 2-space indentation, semicolons, and double quotes, matching existing files.
- Use the `@/*` path alias for imports from `src/` (e.g., `import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher"`).
- Keep component filenames in PascalCase (`ThemeSwitcher.tsx`) and hooks/helpers in camelCase (`localStore.ts`).
- Linting is enforced via `eslint.config.mjs` using Next.js core-web-vitals + TypeScript presets.

## Testing Guidelines
- No test framework is configured in `package.json`.
- If adding tests, prefer a `src/**/__tests__` or `src/**/test` convention and add a `pnpm test` script.
- Keep test filenames aligned with the module name (e.g., `LayoutBuilder.test.tsx`).

## Commit & Pull Request Guidelines
- Commit history uses Conventional Commits (example: `feat: initialize react app with scrapbook editor functionality`).
- Use `feat:`, `fix:`, `chore:`, `refactor:`, or `docs:` prefixes with a short, present-tense summary.
- PRs should include: a concise description, linked issue (if any), and UI screenshots for visual changes.

## Agent-Specific Notes
- Prefer `pnpm` commands; the lockfile is `pnpm-lock.yaml`.
- Keep App Router conventions in mind when adding routes or metadata.
