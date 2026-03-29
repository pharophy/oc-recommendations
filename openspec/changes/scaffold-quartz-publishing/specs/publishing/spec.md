# Delta for Publishing

## MODIFIED Requirements

### Requirement: Free public publishing

The project SHALL support publication of the restaurant guide as a publicly accessible website using free hosting through Quartz static output deployed to GitHub Pages.

#### Scenario: GitHub Pages deployment

- GIVEN the project content is stored as Markdown in the repository
- WHEN the site is built for publication
- THEN the output SHALL be deployable to GitHub Pages

### Requirement: Web-native interactive restaurant index

The published website SHALL provide an interactive restaurant index derived from note metadata without depending on Obsidian Bases at runtime, using Quartz-rendered content and website-native UI behavior.

#### Scenario: Sort and filter venue listings

- GIVEN venue notes contain structured frontmatter
- WHEN a visitor opens the restaurant index page
- THEN the site SHALL render venue listings using that metadata
- AND the visitor SHALL be able to sort or filter the listings
- AND each listing SHALL link to its published venue page

### Requirement: Markdown-first authoring workflow

The publishing solution SHALL preserve Markdown files in the vault as the primary content source and publish the restaurant guide through Quartz.

#### Scenario: Update published content from note edits

- GIVEN a venue note is updated in the repository
- WHEN the Quartz publishing flow runs again
- THEN the published site SHALL reflect the updated note content and metadata
