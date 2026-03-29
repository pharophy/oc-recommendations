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
  "website",
  "googleMaps",
  "openTable",
  "price",
  "kidsAllowed",
  "description",
  "standout",
]

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

function buildRestaurantIndex(section, restaurants) {
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
    buildSelect("type", "Type", types),
    buildSelect("price", "Price", prices),
    buildSelect("kids", "Kids Allowed", kidsPolicies),
    "  </div>",
    `  <p class="restaurant-index__summary" data-results-summary>Showing ${restaurants.length} venues</p>`,
    '  <div class="restaurant-index__table-wrap">',
    '    <table class="restaurant-index__table">',
    "      <thead>",
    "        <tr>",
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

  const skipRootIndex = section.type === "restaurants"
  await copySectionDirectory(sourceDir, outputDir, { skipRootIndex })

  if (section.type !== "restaurants") {
    const sourceIndex = path.join(sourceDir, "index.md")
    if (!(await exists(sourceIndex))) {
      await fs.writeFile(path.join(outputDir, "index.md"), buildGenericSectionIndex(section), "utf8")
    }

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
    const cleanedContent = matter.stringify(parsed.content.trimStart(), getVenueFrontmatter(parsed.data))

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
