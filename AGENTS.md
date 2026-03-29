# Repository Guidelines

## Project Structure & Module Organization
This repository is currently minimal, with no committed source tree yet. Keep the root reserved for project-level files such as `README.md`, `AGENTS.md`, and package or tooling manifests. As the codebase grows, place application code in `src/`, tests in `tests/`, and static assets in `assets/` or `public/` depending on the stack. Keep modules small and grouped by feature when possible, for example `src/auth/` or `src/api/`.

## Build, Test, and Development Commands
No build or test scripts are defined yet. When adding tooling, expose standard commands through a single entry point such as `npm` or `make` so contributors do not need to memorize custom flows.

Examples:
- `npm install` installs dependencies
- `npm run dev` starts a local development server
- `npm test` runs the automated test suite
- `npm run build` creates a production build

Document any new commands in `README.md` and keep them consistent with this guide.

## Coding Style & Naming Conventions
Use consistent formatting and keep files focused on one responsibility. Prefer 2-space indentation for Markdown, JSON, YAML, and most web-oriented source files unless a formatter enforces otherwise. Use:
- `PascalCase` for component or class names
- `camelCase` for variables and functions
- `kebab-case` for filenames unless the framework strongly prefers another pattern

If you add linting or formatting tools, wire them into a command such as `npm run lint` and `npm run format`.

## Testing Guidelines
Place tests in `tests/` or beside source files using a clear suffix such as `*.test.js`, `*.spec.ts`, or similar. Favor fast, repeatable tests over manual checks. Add coverage for new logic and bug fixes, and keep fixtures small and readable.

## Commit & Pull Request Guidelines
There is no visible git history in this workspace, so use short, imperative commit messages such as `Add API client scaffold` or `Fix login form validation`. Keep one logical change per commit when practical.

Pull requests should include:
- a brief summary of the change
- linked issue or task context, if applicable
- test evidence or commands run
- screenshots for UI changes

## Agent-Specific Notes
When editing repository files, prefer small, reviewable patches and avoid unrelated cleanup in the same change.

## OpenSpec Workflow
This repository uses OpenSpec artifacts under `openspec/` for planning notable changes before implementation.

- Treat `openspec/project.md` as the shared project context for planning.
- Put active proposals under `openspec/changes/<change-id>/`.
- Keep `proposal.md`, `design.md`, `tasks.md`, and spec deltas in the same change folder.
- Use spec deltas to describe intended behavior changes before code changes.
