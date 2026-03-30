import fs from "node:fs/promises"
import path from "node:path"
import matter from "../quartz-site/node_modules/gray-matter/index.js"

const repoRoot = path.resolve(import.meta.dirname, "..")
const sections = [
  { name: "Activities", tag: "activity" },
  { name: "Nature", tag: "nature" },
  { name: "Playgrounds", tag: "playground" },
  { name: "Events", tag: "event" },
]

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"])
const HTML_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
}

const IMAGE_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
  accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  referer: "https://www.google.com/",
}

function normalizeWhitespace(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim()
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function parsePhotoSources(content) {
  const sources = []
  const lines = content.split(/\r?\n/)
  let inSection = false

  for (const line of lines) {
    if (line.trim() === "## Photo Sources") {
      inSection = true
      continue
    }

    if (!inSection) continue
    if (/^##\s+/.test(line)) break
    const match = line.match(/^\s*-\s+(https?:\/\/\S+)/)
    if (match) {
      sources.push(match[1].trim())
    }
  }

  return sources
}

async function hasLocalImages(imageDir) {
  return fs
    .readdir(imageDir)
    .then((entries) => entries.some((entry) => IMAGE_EXTENSIONS.has(path.extname(entry).toLowerCase())))
    .catch(() => false)
}

function extractMetaImageUrls(html, pageUrl) {
  const found = []
  const patterns = [
    /<meta[^>]+(?:property|name)=["'](?:og:image|og:image:url|twitter:image|twitter:image:src)["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|og:image:url|twitter:image|twitter:image:src)["'][^>]*>/gi,
  ]

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      try {
        found.push(new URL(match[1], pageUrl).href)
      } catch {}
    }
  }

  return found
}

function extractImgUrls(html, pageUrl) {
  const found = []
  const imgPattern = /<img\b[^>]+src=["']([^"']+)["'][^>]*>/gi

  for (const match of html.matchAll(imgPattern)) {
    try {
      found.push(new URL(match[1], pageUrl).href)
    } catch {}
  }

  return found
}

function scoreImageUrl(url) {
  const lower = url.toLowerCase()
  let score = 0

  if (lower.includes("og:image") || lower.includes("opengraph")) score += 8
  if (lower.includes("hero") || lower.includes("banner") || lower.includes("cover")) score += 5
  if (lower.includes("gallery") || lower.includes("playground") || lower.includes("trail")) score += 4
  if (/\.(jpe?g|png|webp|avif)(\?|$)/.test(lower)) score += 2
  if (
    lower.includes("logo") ||
    lower.includes("icon") ||
    lower.includes("favicon") ||
    lower.includes("sprite") ||
    lower.includes("calendar") ||
    lower.includes("sponsor") ||
    lower.includes("placeholder") ||
    lower.includes("userportal")
  ) {
    score -= 8
  }

  return score
}

async function fetchText(url) {
  const response = await fetch(url, { headers: HTML_HEADERS, redirect: "follow" })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return { url: response.url, text: await response.text() }
}

function extensionFromResponse(url, contentType) {
  const pathname = new URL(url).pathname
  const direct = path.extname(pathname).toLowerCase()
  if (IMAGE_EXTENSIONS.has(direct)) return direct

  if (contentType?.includes("image/jpeg")) return ".jpg"
  if (contentType?.includes("image/png")) return ".png"
  if (contentType?.includes("image/webp")) return ".webp"
  if (contentType?.includes("image/gif")) return ".gif"
  if (contentType?.includes("image/avif")) return ".avif"
  return ".jpg"
}

async function downloadImage(imageUrl, outputDir) {
  const response = await fetch(imageUrl, { headers: IMAGE_HEADERS, redirect: "follow" })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.startsWith("image/")) {
    throw new Error(`Non-image response: ${contentType}`)
  }

  const extension = extensionFromResponse(response.url, contentType)
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length < 15_000) {
    throw new Error(`Image too small: ${bytes.length} bytes`)
  }

  await fs.mkdir(outputDir, { recursive: true })
  const outputPath = path.join(outputDir, `01${extension}`)
  await fs.writeFile(outputPath, bytes)
  return outputPath
}

async function findImageCandidatesForPage(pageUrl) {
  const { url: resolvedPageUrl, text } = await fetchText(pageUrl)
  return unique([
    ...extractMetaImageUrls(text, resolvedPageUrl),
    ...extractImgUrls(text, resolvedPageUrl),
  ])
    .filter((candidate) => !candidate.startsWith("data:"))
    .sort((a, b) => scoreImageUrl(b) - scoreImageUrl(a))
}

async function processNote(section, fileName) {
  const slug = fileName.replace(/\.md$/i, "")
  const sectionDir = path.join(repoRoot, section.name)
  const imageDir = path.join(sectionDir, "images", slug)
  if (await hasLocalImages(imageDir)) {
    return { slug, status: "skipped-existing" }
  }

  const filePath = path.join(sectionDir, fileName)
  const raw = await fs.readFile(filePath, "utf8")
  const parsed = matter(raw)
  const tags = Array.isArray(parsed.data.tags) ? parsed.data.tags : []
  if (!tags.includes(section.tag)) {
    return { slug, status: "skipped-non-matching" }
  }

  const sources = unique([parsed.data.website, parsed.data.bookingUrl, ...parsePhotoSources(parsed.content)])
  if (sources.length === 0) {
    return { slug, status: "no-sources" }
  }

  const errors = []
  for (const source of sources) {
    try {
      const imageUrls = await findImageCandidatesForPage(source)
      if (imageUrls.length === 0) {
        errors.push(`${source}: no image candidates`)
        continue
      }

      for (const imageUrl of imageUrls) {
        try {
          const saved = await downloadImage(imageUrl, imageDir)
          return { slug, status: "downloaded", source, imageUrl, saved }
        } catch (error) {
          errors.push(`${source}: ${imageUrl} => ${normalizeWhitespace(error.message)}`)
        }
      }
    } catch (error) {
      errors.push(`${source}: ${normalizeWhitespace(error.message)}`)
    }
  }

  return { slug, status: "failed", errors }
}

async function main() {
  for (const section of sections) {
    const sectionDir = path.join(repoRoot, section.name)
    const noteFiles = (await fs.readdir(sectionDir)).filter(
      (entry) => entry.endsWith(".md") && entry.toLowerCase() !== "index.md",
    )

    console.log(`section ${section.name}`)
    for (const fileName of noteFiles) {
      const result = await processNote(section, fileName)
      if (result.status === "downloaded") {
        console.log(`downloaded ${result.slug}`)
        console.log(`  source: ${result.source}`)
        console.log(`  image: ${result.imageUrl}`)
        console.log(`  saved: ${path.relative(repoRoot, result.saved)}`)
      } else if (result.status === "failed") {
        console.log(`failed ${result.slug}`)
        for (const error of result.errors) {
          console.log(`  ${error}`)
        }
      } else {
        console.log(`${result.status} ${result.slug}`)
      }
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
