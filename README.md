# Immersive SoCal Guide

This repository is an Obsidian-authored content workspace with a Quartz-powered static site in `quartz-site/`.

## Publishing Workflow

- Author notes in top-level content folders such as `Restaurants/`
- Configure published sections in `publishing.config.mjs`
- Run `npm run stage:site` to stage selected folders into `quartz-site/content/`
- Run `npm run site:build` to create the static site
- Run `npm run site:dev` to stage content and start the local Quartz dev server

## Multi-Section Support

The staging pipeline is set up for multiple future sections. Add another top-level folder and a matching entry in `publishing.config.mjs` to publish it without changing the overall Quartz structure.

## GitHub Pages

The repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml` that builds the Quartz site and deploys `quartz-site/public/` to GitHub Pages from the `main` branch.

Before deploying, update the `siteBaseUrl` in `publishing.config.mjs` and the `baseUrl` value in `quartz-site/quartz.config.ts` to match your actual GitHub Pages URL.

