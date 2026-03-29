# Project Context

## Overview

This repository is an Obsidian vault used to curate and publish a guide to immersive restaurants and dining-adjacent experiences in Southern California.

The current content lives primarily in Markdown under `Restaurants/`. Venue notes now include structured frontmatter properties such as `title`, `area`, `venueType`, `price`, `kidsAllowed`, `description`, and `standout`.

## Current State

- The vault renders well inside Obsidian.
- `Restaurants/index.md` embeds an Obsidian Base from `Restaurants/restaurants.base`.
- Obsidian Bases are useful in-app but are not assumed to work on third-party static hosts.
- There is no existing app scaffold, package manifest, or deployment pipeline in this repository.

## Goals

- Publish the restaurant guide as a public website.
- Preserve the Markdown-first authoring workflow.
- Keep hosting cost at zero if possible.
- Preserve or replace the current interactive restaurant index with a website-compatible equivalent.

## Constraints

- The project is currently content-first, not app-first.
- The repository is minimal and should avoid unnecessary tooling.
- The published site should derive index data from note metadata instead of maintaining duplicate tables by hand.

## Decision Drivers

- Free hosting
- Low maintenance overhead
- Good support for Obsidian-style Markdown and wikilinks
- Ability to present a sortable/filterable restaurant index on the website
- Clear upgrade path if the guide grows
