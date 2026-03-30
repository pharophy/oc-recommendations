import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"
import publishingConfig from "../../publishing.config.mjs"

const repoRoot = path.resolve(import.meta.dirname, "../..")
const quartzRoot = path.resolve(import.meta.dirname, "..")
const contentRoot = path.join(quartzRoot, "content")

const FRONTMATTER_KEYS_TO_KEEP = [
  "title",
  "tags",
  "area",
  "venueType",
  "activityType",
  "natureType",
  "difficulty",
  "playgroundType",
  "eventType",
  "eventDateLabel",
  "eventStartDate",
  "eventEndDate",
  "eventMonths",
  "website",
  "googleMaps",
  "openTable",
  "bookingUrl",
  "price",
  "kidsAllowed",
  "description",
  "standout",
]

const GENERIC_SECTION_CONFIGS = {
  activities: {
    singular: "activity",
    plural: "activities",
    columns: [
      { key: "title", label: "Name", sort: true },
      { key: "area", label: "Area", filter: true, sort: true },
      { key: "type", label: "Type", filter: true, sort: true },
      { key: "price", label: "Price", filter: true, sort: true },
      { key: "kids", label: "Kids Allowed", filter: true, sort: true },
      { key: "standout", label: "Why It Stands Out", sort: true },
    ],
  },
  nature: {
    singular: "nature spot",
    plural: "nature spots",
    columns: [
      { key: "title", label: "Name", sort: true },
      { key: "area", label: "Area", filter: true, sort: true },
      { key: "type", label: "Type", filter: true, sort: true },
      { key: "difficulty", label: "Difficulty", filter: true, sort: true },
      { key: "kids", label: "Kids Allowed", filter: true, sort: true },
      { key: "standout", label: "Why It Stands Out", sort: true },
    ],
  },
  playgrounds: {
    singular: "playground",
    plural: "playgrounds",
    columns: [
      { key: "title", label: "Name", sort: true },
      { key: "area", label: "Area", filter: true, sort: true },
      { key: "type", label: "Type", filter: true, sort: true },
      { key: "price", label: "Price", filter: true, sort: true },
      { key: "kids", label: "Kids Allowed", filter: true, sort: true },
      { key: "standout", label: "Why It Stands Out", sort: true },
    ],
  },
  events: {
    singular: "event",
    plural: "events",
    columns: [
      { key: "title", label: "Name", sort: true },
      { key: "area", label: "Area", filter: true, sort: true },
      { key: "type", label: "Type", filter: true, sort: true },
      { key: "date", label: "Date(s)", sort: true },
      { key: "months", label: "Month", filter: true, sort: true },
      { key: "price", label: "Price", filter: true, sort: true },
      { key: "kids", label: "Kids Allowed", filter: true, sort: true },
    ],
  },
}

async function exists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function ensureDir(targetPath) {
  await fs.mkdir(targetPath, { recursive: true })
}

async function resetDir(targetPath) {
  await fs.rm(targetPath, { recursive: true, force: true })
  await ensureDir(targetPath)
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function normalizeWhitespace(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim()
}

function normalizeDateValue(value) {
  if (!value) return ""
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString().slice(0, 10)
  }

  return normalizeWhitespace(value)
}

function getRelativeLink(fromDir, toPath) {
  let relative = path.relative(fromDir, toPath).replaceAll("\\", "/")
  if (!relative.startsWith(".")) relative = `./${relative}`
  return relative
}

async function collectMarkdownFiles(dir) {
  const results = []
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...(await collectMarkdownFiles(fullPath)))
      continue
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      results.push(fullPath)
    }
  }

  return results
}

async function collectImageFiles(dir) {
  if (!(await exists(dir))) return []

  const entries = await fs.readdir(dir, { withFileTypes: true })
  const results = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...(await collectImageFiles(fullPath)))
      continue
    }

    if (entry.isFile() && /\.(avif|gif|jpe?g|png|webp)$/i.test(entry.name)) {
      results.push(fullPath)
    }
  }

  return results.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

async function copySectionDirectory(sourceDir, destDir, { skipRootIndex = false } = {}) {
  await ensureDir(destDir)
  const entries = await fs.readdir(sourceDir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name === ".DS_Store") continue
    if (entry.name.toLowerCase().endsWith(".base")) continue

    const sourcePath = path.join(sourceDir, entry.name)
    const destPath = path.join(destDir, entry.name)

    if (skipRootIndex && entry.isFile() && entry.name.toLowerCase() === "index.md") {
      continue
    }

    if (entry.isDirectory()) {
      await copySectionDirectory(sourcePath, destPath)
      continue
    }

    if (entry.isFile()) {
      await ensureDir(path.dirname(destPath))
      await fs.copyFile(sourcePath, destPath)
    }
  }
}

function buildRootIndex(sections) {
  const intro = [
    "---",
    `title: ${publishingConfig.siteTitle}`,
    `description: ${publishingConfig.siteDescription}`,
    "---",
    "",
    `# ${publishingConfig.siteTitle}`,
    "",
    publishingConfig.siteDescription,
    "",
    "## Explore",
    "",
  ]

  const body = sections.map((section) =>
    [
      `### [${section.title}](./${section.output}/)`,
      "",
      section.description,
      "",
      `Currently published notes: **${section.noteCount}**`,
      "",
    ].join("\n"),
  )

  return `${intro.join("\n")}${body.join("\n")}`.trimEnd() + "\n"
}

function buildGenericSectionIndex(section) {
  return [
    "---",
    `title: ${section.title}`,
    `description: ${section.description}`,
    "---",
    "",
    `# ${section.title}`,
    "",
    section.description,
    "",
    "Use the folder listing below to browse the published notes in this section.",
    "",
  ].join("\n")
}

function getGenericItemData(section, parsed, slug, imageLinks, link) {
  const data = parsed.data
  const typeKeyBySection = {
    activities: "activityType",
    nature: "natureType",
    playgrounds: "playgroundType",
    events: "eventType",
  }

  const months = Array.isArray(data.eventMonths)
    ? data.eventMonths.map((value) => normalizeWhitespace(value)).filter(Boolean)
    : []

  return {
    slug,
    title: normalizeWhitespace(data.title ?? slug),
    area: normalizeWhitespace(data.area ?? ""),
    type: normalizeWhitespace(data[typeKeyBySection[section.id]] ?? ""),
    difficulty: normalizeWhitespace(data.difficulty ?? ""),
    date: normalizeWhitespace(data.eventDateLabel ?? ""),
    months,
    price: normalizeWhitespace(data.price ?? ""),
    kids: normalizeWhitespace(data.kidsAllowed ?? ""),
    standout: normalizeWhitespace(data.standout ?? ""),
    description: normalizeWhitespace(data.description ?? ""),
    thumbnail: imageLinks[0] ?? "",
    link,
    sortDate: normalizeDateValue(data.eventStartDate ?? ""),
  }
}

function buildCollectionIndex(section, items) {
  const config = GENERIC_SECTION_CONFIGS[section.id]
  if (!config) return buildGenericSectionIndex(section)

  const buildSelect = (key, label, options) => {
    const renderedOptions = options
      .map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`)
      .join("")

    return `  <label class="collection-index__field">
    <span>${escapeHtml(label)}</span>
    <select data-filter="${escapeHtml(key)}">
      <option value="">All</option>${renderedOptions}
    </select>
  </label>`
  }

  const filterColumns = config.columns.filter((column) => column.filter)
  const controls = [
    '    <label class="collection-index__field collection-index__field--search">',
    "      <span>Search</span>",
    '      <input type="search" placeholder="Search names, areas, and standout details" data-filter="search" />',
    "    </label>",
    ...filterColumns.map((column) => {
      const options = [...new Set(items.flatMap((item) => (Array.isArray(item[column.key]) ? item[column.key] : [item[column.key]])).filter(Boolean))].sort()
      return buildSelect(column.key, column.label, options)
    }),
  ]

  const headers = config.columns
    .map((column) => {
      if (column.sort) {
        return `          <th><button type="button" data-sort="${escapeHtml(column.key)}">${escapeHtml(column.label)}</button></th>`
      }

      return `          <th>${escapeHtml(column.label)}</th>`
    })
    .join("\n")

  const rows = items
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => {
      const search = [
        item.title,
        item.area,
        item.type,
        item.difficulty,
        item.date,
        item.months.join(" "),
        item.price,
        item.kids,
        item.standout,
        item.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      const cells = config.columns
        .map((column) => {
          if (column.key === "title") {
            return `      <td><a href="${escapeHtml(item.link)}">${escapeHtml(item.title)}</a></td>`
          }

          const value = Array.isArray(item[column.key]) ? item[column.key].join(", ") : item[column.key]
          return `      <td>${escapeHtml(value ?? "")}</td>`
        })
        .join("\n")

      return `    <tr data-search="${escapeHtml(search)}" data-title="${escapeHtml(
        item.title.toLowerCase(),
      )}" data-area="${escapeHtml(item.area)}" data-type="${escapeHtml(item.type)}" data-difficulty="${escapeHtml(
        item.difficulty,
      )}" data-date="${escapeHtml(item.date)}" data-months="${escapeHtml(item.months.join("|"))}" data-price="${escapeHtml(
        item.price,
      )}" data-kids="${escapeHtml(item.kids)}" data-standout="${escapeHtml(item.standout)}" data-sort-date="${escapeHtml(
        item.sortDate,
      )}">
${cells}
    </tr>`
    })
    .join("\n")

  return [
    "---",
    `title: ${section.title}`,
    `description: ${section.description}`,
    "---",
    "",
    `# ${section.title}`,
    "",
    section.description,
    "",
    "This website version uses a native sortable and filterable table generated from note frontmatter.",
    "",
    `<div class="collection-index" data-collection-index="${escapeHtml(section.id)}" data-item-singular="${escapeHtml(config.singular)}" data-item-plural="${escapeHtml(config.plural)}">`,
    '  <div class="collection-index__controls">',
    ...controls,
    "  </div>",
    `  <p class="collection-index__summary" data-results-summary>Showing ${items.length} ${config.singular}${items.length === 1 ? "" : "s"}</p>`,
    '  <div class="collection-index__table-wrap">',
    '    <table class="collection-index__table">',
    "      <thead>",
    "        <tr>",
    headers,
    "        </tr>",
    "      </thead>",
    '      <tbody data-collection-rows>',
    rows,
    "      </tbody>",
    "    </table>",
    "  </div>",
    `  <p class="collection-index__empty" data-empty-state hidden>No ${config.singular}s match the current filters.</p>`,
    "</div>",
    "",
  ].join("\n")
}

function buildRestaurantIndex(section, restaurants) {
  const areas = [...new Set(restaurants.map((item) => item.area).filter(Boolean))].sort()
  const types = [...new Set(restaurants.map((item) => item.venueType).filter(Boolean))].sort()
  const prices = [...new Set(restaurants.map((item) => item.price).filter(Boolean))].sort(
    (a, b) => a.length - b.length || a.localeCompare(b),
  )
  const kidsPolicies = [...new Set(restaurants.map((item) => item.kidsAllowed).filter(Boolean))].sort()

  const rows = restaurants
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((item) => {
      const filters = [
        item.title,
        item.area,
        item.venueType,
        item.price,
        item.kidsAllowed,
        item.standout,
        item.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return `    <tr data-search="${escapeHtml(filters)}" data-title="${escapeHtml(
        item.title.toLowerCase(),
      )}" data-area="${escapeHtml(item.area)}" data-type="${escapeHtml(
        item.venueType,
      )}" data-price="${escapeHtml(item.price)}" data-kids="${escapeHtml(
        item.kidsAllowed,
      )}" data-standout="${escapeHtml(item.standout)}">
      <td class="restaurant-index__thumb-cell">${
        item.thumbnail
          ? `<a href="${escapeHtml(item.link)}" class="restaurant-index__thumb-link"><img src="${escapeHtml(
              item.thumbnail,
            )}" alt="${escapeHtml(`${item.title} thumbnail`)}" loading="lazy" class="restaurant-index__thumb" /></a>`
          : ""
      }</td>
      <td><a href="${escapeHtml(item.link)}">${escapeHtml(item.title)}</a></td>
      <td>${escapeHtml(item.area)}</td>
      <td>${escapeHtml(item.venueType)}</td>
      <td>${escapeHtml(item.price)}</td>
      <td>${escapeHtml(item.kidsAllowed)}</td>
      <td>${escapeHtml(item.standout)}</td>
    </tr>`
    })
    .join("\n")

  const buildSelect = (name, label, options) => {
    const renderedOptions = options
      .map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`)
      .join("")

    return `  <label class="restaurant-index__field">
    <span>${escapeHtml(label)}</span>
    <select data-filter="${escapeHtml(name)}">
      <option value="">All</option>${renderedOptions}
    </select>
  </label>`
  }

  return [
    "---",
    `title: ${section.title}`,
    `description: ${section.description}`,
    "---",
    "",
    `# ${section.title}`,
    "",
    section.description,
    "",
    "This website version uses a native sortable and filterable table generated from note frontmatter.",
    "",
    '<div class="restaurant-index" data-restaurant-index>',
    '  <div class="restaurant-index__controls">',
    '    <label class="restaurant-index__field restaurant-index__field--search">',
    "      <span>Search</span>",
    '      <input type="search" placeholder="Search venues, areas, or standout details" data-filter="search" />',
    "    </label>",
    buildSelect("area", "Area", areas),
    buildSelect("type", "Type", types),
    buildSelect("price", "Price", prices),
    buildSelect("kids", "Kids Allowed", kidsPolicies),
    "  </div>",
    `  <p class="restaurant-index__summary" data-results-summary>Showing ${restaurants.length} venues</p>`,
    '  <div class="restaurant-index__table-wrap">',
    '    <table class="restaurant-index__table">',
    "      <thead>",
    "        <tr>",
    '          <th>Photo</th>',
    '          <th><button type="button" data-sort="title">Name</button></th>',
    '          <th><button type="button" data-sort="area">Area</button></th>',
    '          <th><button type="button" data-sort="type">Type</button></th>',
    '          <th><button type="button" data-sort="price">Price</button></th>',
    '          <th><button type="button" data-sort="kids">Kids Allowed</button></th>',
    '          <th><button type="button" data-sort="standout">Why It Stands Out</button></th>',
    "        </tr>",
    "      </thead>",
    '      <tbody data-restaurant-rows>',
    rows,
    "      </tbody>",
    "    </table>",
    "  </div>",
    '  <p class="restaurant-index__empty" data-empty-state hidden>No venues match the current filters.</p>',
    "</div>",
    "",
    "## Notes",
    "",
    "- Prices are based on official menus, reservation context, or conservative estimates when exact pricing was not obvious.",
    "- `Kids Allowed` reflects the most reliable current signal available in the source notes; venues with bar-style or time-based rules are marked `Mixed / Time-dependent`.",
    "",
  ].join("\n")
}

function buildRestaurantPhotoGallery(title, imageLinks) {
  if (imageLinks.length === 0) return ""

  const galleryItems = imageLinks
    .map(
      (imageLink, index) =>
        `  <img src="${escapeHtml(imageLink)}" alt="${escapeHtml(`${title} photo ${index + 1}`)}" loading="lazy" />`,
    )
    .join("\n")

  return ["## Photos", "", '<div class="restaurant-photo-grid">', galleryItems, "</div>", ""].join("\n")
}

function buildGenericPhotoGallery(title, imageLinks) {
  if (imageLinks.length === 0) return ""

  const galleryItems = imageLinks
    .map(
      (imageLink, index) =>
        `![${title} photo ${index + 1}](${imageLink})`,
    )
    .join("\n")

  return ["## Photos", "", galleryItems, ""].join("\n")
}

function normalizeRestaurantImagePaths(content) {
  return content.replace(
    /(!?\[[^\]]*\]\()images\//g,
    (_, prefix) => `${prefix}restaurants/images/`,
  )
}

function normalizeSectionImagePaths(content, output) {
  return content.replace(
    /(!?\[[^\]]*\]\()images\//g,
    (_, prefix) => `${prefix}${output}/images/`,
  )
}

function getVenueFrontmatter(data) {
  const frontmatter = {}
  for (const key of FRONTMATTER_KEYS_TO_KEEP) {
    if (data[key] !== undefined) {
      frontmatter[key] = data[key]
    }
  }
  return frontmatter
}

async function stageSection(section) {
  const sourceDir = path.join(repoRoot, section.source)
  const outputDir = path.join(contentRoot, section.output)

  if (!(await exists(sourceDir))) {
    throw new Error(`Missing section source folder: ${section.source}`)
  }

  const skipRootIndex = true
  await copySectionDirectory(sourceDir, outputDir, { skipRootIndex })

  if (section.type !== "restaurants") {
    const sourceMarkdown = await collectMarkdownFiles(sourceDir)
    const noteFiles = sourceMarkdown.filter((filePath) => path.basename(filePath).toLowerCase() !== "index.md")
    const items = []

    for (const filePath of noteFiles) {
      const raw = await fs.readFile(filePath, "utf8")
      const parsed = matter(raw)
      const slug = path.basename(filePath, ".md")
      const sourceImagesDir = path.join(path.dirname(filePath), "images", slug)
      const imageFiles = await collectImageFiles(sourceImagesDir)
      const imageLinks = imageFiles.map((imagePath) =>
        path.join(section.output, "images", slug, path.relative(sourceImagesDir, imagePath)).replaceAll("\\", "/"),
      )
      const hasEmbeddedImages = /!\[[^\]]*\]\([^)]+\)/.test(parsed.content)
      const gallery = hasEmbeddedImages
        ? ""
        : buildGenericPhotoGallery(normalizeWhitespace(parsed.data.title ?? slug), imageLinks)
      const normalizedContent = normalizeSectionImagePaths(parsed.content.trimStart(), section.output)
      const contentWithGallery = [gallery, normalizedContent].filter(Boolean).join("\n")
      const cleanedContent = matter.stringify(contentWithGallery, parsed.data)
      const relativeFromSource = path.relative(sourceDir, filePath)
      const targetOutputPath = path.join(outputDir, relativeFromSource)
      const indexDir = path.dirname(path.join(outputDir, "index.md"))
      const link = getRelativeLink(indexDir, targetOutputPath)

      await ensureDir(path.dirname(targetOutputPath))
      await fs.writeFile(targetOutputPath, `${cleanedContent.trimEnd()}\n`, "utf8")
      items.push(getGenericItemData(section, parsed, slug, imageLinks, link))
    }

    await fs.writeFile(path.join(outputDir, "index.md"), buildCollectionIndex(section, items), "utf8")

    const markdownFiles = await collectMarkdownFiles(outputDir)
    return {
      ...section,
      noteCount: markdownFiles.filter((filePath) => path.basename(filePath).toLowerCase() !== "index.md")
        .length,
    }
  }

  const sourceMarkdown = await collectMarkdownFiles(sourceDir)
  const restaurantFiles = sourceMarkdown.filter((filePath) => path.basename(filePath).toLowerCase() !== "index.md")
  const restaurants = []

  for (const filePath of restaurantFiles) {
    const raw = await fs.readFile(filePath, "utf8")
    const parsed = matter(raw)
    const tags = Array.isArray(parsed.data.tags) ? parsed.data.tags : []
    if (!tags.includes("restaurant")) continue

    const relativeFromSource = path.relative(sourceDir, filePath)
    const targetOutputPath = path.join(outputDir, relativeFromSource)
    const indexDir = path.dirname(path.join(outputDir, "index.md"))
    const sourceImagesDir = path.join(path.dirname(filePath), "images", path.basename(filePath, ".md"))
    const imageFiles = await collectImageFiles(sourceImagesDir)
    const imageLinks = imageFiles.map((imagePath) =>
      path
        .join(
          "restaurants",
          "images",
          path.basename(filePath, ".md"),
          path.relative(sourceImagesDir, imagePath),
        )
        .replaceAll("\\", "/"),
    )
    const hasEmbeddedImages = /!\[[^\]]*\]\([^)]+\)/.test(parsed.content)
    const gallery = hasEmbeddedImages
      ? ""
      : buildRestaurantPhotoGallery(
          normalizeWhitespace(parsed.data.title ?? path.basename(filePath, ".md")),
          imageLinks,
        )
    const normalizedContent = normalizeRestaurantImagePaths(parsed.content.trimStart())
    const contentWithGallery = [gallery, normalizedContent].filter(Boolean).join("\n")
    const cleanedContent = matter.stringify(contentWithGallery, getVenueFrontmatter(parsed.data))

    await ensureDir(path.dirname(targetOutputPath))
    await fs.writeFile(targetOutputPath, `${cleanedContent.trimEnd()}\n`, "utf8")

    restaurants.push({
      title: normalizeWhitespace(parsed.data.title ?? path.basename(filePath, ".md")),
      area: normalizeWhitespace(parsed.data.area ?? ""),
      venueType: normalizeWhitespace(parsed.data.venueType ?? ""),
      price: normalizeWhitespace(parsed.data.price ?? ""),
      kidsAllowed: normalizeWhitespace(parsed.data.kidsAllowed ?? ""),
      standout: normalizeWhitespace(parsed.data.standout ?? ""),
      description: normalizeWhitespace(parsed.data.description ?? ""),
      thumbnail: imageLinks[0] ?? "",
      link: getRelativeLink(indexDir, targetOutputPath),
    })
  }

  await fs.writeFile(path.join(outputDir, "index.md"), buildRestaurantIndex(section, restaurants), "utf8")

  return {
    ...section,
    noteCount: restaurants.length,
  }
}

async function main() {
  await resetDir(contentRoot)

  const stagedSections = []
  for (const section of publishingConfig.sections) {
    stagedSections.push(await stageSection(section))
  }

  await fs.writeFile(path.join(contentRoot, "index.md"), buildRootIndex(stagedSections), "utf8")
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
