function initRestaurantIndex() {
  const root = document.querySelector("[data-restaurant-index]")
  if (!root) return

  const searchInput = root.querySelector('[data-filter="search"]')
  const typeFilter = root.querySelector('[data-filter="type"]')
  const priceFilter = root.querySelector('[data-filter="price"]')
  const kidsFilter = root.querySelector('[data-filter="kids"]')
  const rowsContainer = root.querySelector("[data-restaurant-rows]")
  const summary = root.querySelector("[data-results-summary]")
  const emptyState = root.querySelector("[data-empty-state]")
  const sortButtons = Array.from(root.querySelectorAll("[data-sort]"))

  if (!rowsContainer || !summary || !emptyState) return

  const rows = Array.from(rowsContainer.querySelectorAll("tr"))
  let sortKey = root.dataset.sortKey || "title"
  let sortDirection = root.dataset.sortDirection || "asc"

  const sortValue = (row, key) => {
    if (key === "price") {
      return String((row.dataset.price || "").length).padStart(2, "0")
    }

    return (row.dataset[key] || "").toLowerCase()
  }

  const update = () => {
    const searchValue = (searchInput?.value || "").trim().toLowerCase()
    const typeValue = typeFilter?.value || ""
    const priceValue = priceFilter?.value || ""
    const kidsValue = kidsFilter?.value || ""

    const visibleRows = rows.filter((row) => {
      const matchesSearch = !searchValue || (row.dataset.search || "").includes(searchValue)
      const matchesType = !typeValue || row.dataset.type === typeValue
      const matchesPrice = !priceValue || row.dataset.price === priceValue
      const matchesKids = !kidsValue || row.dataset.kids === kidsValue
      const matches = matchesSearch && matchesType && matchesPrice && matchesKids
      row.hidden = !matches
      return matches
    })

    const sortedRows = [...visibleRows].sort((a, b) => {
      const comparison = sortValue(a, sortKey).localeCompare(sortValue(b, sortKey), undefined, {
        numeric: true,
      })
      return sortDirection === "asc" ? comparison : -comparison
    })

    sortedRows.forEach((row) => rowsContainer.appendChild(row))
    rows.filter((row) => row.hidden).forEach((row) => rowsContainer.appendChild(row))

    summary.textContent = `Showing ${visibleRows.length} venue${visibleRows.length === 1 ? "" : "s"}`
    emptyState.hidden = visibleRows.length !== 0

    sortButtons.forEach((button) => {
      const isActive = button.dataset.sort === sortKey
      button.dataset.active = isActive ? "true" : "false"
      button.dataset.direction = isActive ? sortDirection : ""
    })

    root.dataset.sortKey = sortKey
    root.dataset.sortDirection = sortDirection
  }

  ;[searchInput, typeFilter, priceFilter, kidsFilter]
    .filter(Boolean)
    .forEach((element) => element.addEventListener("input", update))

  sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextKey = button.dataset.sort || "title"
      if (sortKey === nextKey) {
        sortDirection = sortDirection === "asc" ? "desc" : "asc"
      } else {
        sortKey = nextKey
        sortDirection = nextKey === "price" ? "desc" : "asc"
      }

      update()
    })
  })

  update()
}

document.addEventListener("nav", () => {
  initRestaurantIndex()
})
