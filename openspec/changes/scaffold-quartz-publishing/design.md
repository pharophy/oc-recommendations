# Design: Scaffold Quartz Publishing

## Context

The repository is currently an Obsidian vault with restaurant notes stored as Markdown files under `Restaurants/`. Those notes already include frontmatter suitable for website rendering.

Quartz is a strong fit because it:

- accepts Markdown-first content,
- supports Obsidian-style authoring patterns,
- generates static output,
- works with GitHub Pages.

## Implementation Direction

### Site Framework

Add Quartz to the repository as the static-site framework.

### Content Source

Use `Restaurants/` notes as the source of truth for published venue content.

### Publishing Rules

Publish the restaurant guide content and exclude internal planning material such as:

- `openspec/`
- `.obsidian/`
- `_archive/`

### Interactive Index

Replace the Obsidian Base with a web-native index page derived from note frontmatter.

The index should support:

- venue links,
- sorting and filtering,
- display of area, type, price, kids policy, and standout summary.

### Deployment

Use GitHub Pages as the initial deployment target.

The implementation should include:

- a reproducible local build command,
- a GitHub Actions workflow or equivalent Pages-compatible deployment process,
- documentation for how content changes reach production.

## Risks

- Quartz setup may impose structure that needs to coexist cleanly with the existing vault layout.
- Interactive index behavior may require a small amount of custom component or client-side code.
- Image and wikilink handling may need path normalization during integration.

## Acceptance Shape

This change is complete when:

1. Quartz is scaffolded in the repo.
2. The restaurant notes build into browsable site pages.
3. The public index is interactive without relying on Obsidian Bases.
4. GitHub Pages deployment is documented and wired.
