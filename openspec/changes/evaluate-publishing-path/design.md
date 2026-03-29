# Design: Evaluate Publishing Path

## Context

The vault currently contains Markdown content plus one Obsidian Base:

- `Restaurants/index.md`
- `Restaurants/restaurants.base`
- individual venue notes with frontmatter

The public site requirement introduces a mismatch:

- Obsidian-specific runtime features, especially `Bases`, are not portable by default.
- The published website still needs an interactive restaurant index.

## Decision

Use a two-layer model:

- Authoring layer: Obsidian vault with Markdown notes and optional Obsidian-only conveniences.
- Publishing layer: Quartz site that consumes note content and frontmatter, then renders website-native UI.

## Architecture Direction

### Content Source

The source of truth remains the Markdown files under `Restaurants/`.

### Structured Metadata

Venue frontmatter is the canonical dataset for web rendering:

- `title`
- `area`
- `venueType`
- `price`
- `kidsAllowed`
- `description`
- `standout`
- link properties such as `website`, `googleMaps`, and `openTable`

### Interactive Index

The website replaces the Obsidian Base with a client-side or build-time generated table/list view that supports:

- sort
- filter
- note/page links

This keeps interactivity on the web without relying on `.base` execution.

### Hosting

Use GitHub Pages because:

- it is free,
- it is sufficient for static output,
- it fits a repository-backed publishing workflow.

Cloudflare Pages remains a fallback if GitHub Pages constraints become inconvenient.

## Rejected Directions

### Preserve Base Behavior on Third-Party Hosts

Rejected because there is no reliable basis to assume Quartz, Digital Garden, MindStone, GitHub Pages, Netlify, or Vercel will execute Obsidian Bases natively.

### Use Obsidian Publish

Rejected for now because the project preference is free hosting and the current decision is to optimize for zero recurring cost.

### Build a Fully Custom Site First

Rejected because the repo is content-first and Quartz covers most publishing needs with less custom code.

## Risks

- Quartz setup will add site-specific structure to a currently minimal repo.
- The restaurant index UI will need custom implementation rather than a direct Base embed.
- Image paths and wiki links may need normalization for the published site.

## Follow-Up Implementation Shape

The next implementation change should:

1. scaffold Quartz,
2. define which notes publish,
3. create the restaurant index page from frontmatter,
4. validate local build output, and
5. add deployment instructions.
