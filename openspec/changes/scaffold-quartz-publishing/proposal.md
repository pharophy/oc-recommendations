# Change Proposal: Scaffold Quartz Publishing

## Why

The project has selected `Quartz + GitHub Pages` as the best publishing path for this vault. The repository now needs a concrete implementation plan to turn the existing Obsidian-authored content into a deployable static site.

## What Changes

This change scaffolds the first website implementation for the restaurant guide using Quartz and GitHub Pages.

The change includes:

- adding Quartz to the repository,
- configuring Quartz to publish the relevant notes,
- mapping `Restaurants/` content into the published site,
- replacing the Obsidian Base with a website-native interactive restaurant index generated from frontmatter, and
- adding a free GitHub Pages deployment workflow.

## Desired Outcome

After this change:

- the repository can build a static site locally,
- restaurant notes publish as website pages,
- the site exposes a sortable or filterable restaurant index on the web,
- the published site can be deployed to GitHub Pages at no recurring cost.

## Scope Notes

This change focuses on the first working publishing pipeline. It does not attempt to preserve Obsidian runtime features like Bases on the website.

## Non-Goals

- Preserve `.base` files on the public site
- Introduce paid hosting
- Redesign the content model away from Markdown source files
