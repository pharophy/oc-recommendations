# Change Proposal: Evaluate Publishing Path

## Why

The current restaurant guide works well inside Obsidian, but the core interactive index is implemented as an Obsidian Base. That feature is app-specific and should not be assumed to work on a public website. Before building a site, the project needs an explicit decision on the publishing path.

## What Changes

This change evaluates the available publishing options discussed for this vault:

- Obsidian Publish
- MindStone
- Obsidian Digital Garden with Vercel or Netlify
- Quartz with GitHub Pages
- A minimal custom static site hosted on GitHub Pages or Cloudflare Pages

This change recommends the best path for this project:

- Use `Quartz` as the publishing framework.
- Deploy it to `GitHub Pages` for free hosting.
- Treat Obsidian `Bases` as authoring-time features only.
- Rebuild the public restaurant index as a website-native sortable/filterable view generated from note frontmatter.

## Why This Path Wins

- It keeps the authoring model Markdown-first and vault-friendly.
- It avoids recurring hosting cost.
- It does not depend on undocumented third-party support for `.base` files.
- It gives full control over the published restaurant index rather than forcing the site to mirror Obsidian internals.
- It fits the current repository shape better than a heavier app scaffold.

## Option Summary

### Obsidian Publish

Pros:
- Most likely path if true Obsidian-native Base support is required.
- Minimal publishing friction.

Cons:
- Paid.
- Locks the project into the Obsidian-hosted path.

### MindStone

Pros:
- Free and designed for Obsidian-style Markdown.

Cons:
- Early-stage project with known issues.
- No reliable evidence of native Obsidian Base support.
- Smaller ecosystem and less confidence for long-term maintenance.

### Obsidian Digital Garden

Pros:
- Free.
- Good fit for publishing Obsidian notes with relatively low friction.

Cons:
- No reliable evidence of native Obsidian Base support.
- Less attractive than Quartz if the site will need custom interactive UI beyond note rendering.

### Quartz

Pros:
- Free and widely used for publishing Obsidian-like content.
- Good control over site behavior and rendering.
- Strong fit for generating a custom interactive restaurant index from frontmatter.
- Works cleanly with free GitHub Pages hosting.

Cons:
- More setup than Obsidian Publish.
- Requires replacing Base behavior with website-native UI.

### Custom Static Site

Pros:
- Maximum flexibility.

Cons:
- More implementation work than needed for a content-first vault.
- Reinvents site features that Quartz already provides.

## Recommendation

Proceed with `Quartz + GitHub Pages` and explicitly scope a follow-up implementation change to:

1. scaffold Quartz in this repo,
2. map `Restaurants/` notes into published pages,
3. generate a web-native restaurant index from frontmatter, and
4. deploy the static output via GitHub Pages.
