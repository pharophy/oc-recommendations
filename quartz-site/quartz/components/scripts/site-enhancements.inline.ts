function initCollectionIndex() {
  const roots = Array.from(document.querySelectorAll("[data-collection-index], [data-restaurant-index]"))
  if (roots.length === 0) return

  roots.forEach((root) => {
    const rowsContainer = root.querySelector("[data-collection-rows], [data-restaurant-rows]")
    const summary = root.querySelector("[data-results-summary]")
    const emptyState = root.querySelector("[data-empty-state]")
    const sortButtons = Array.from(root.querySelectorAll("[data-sort]"))
    const filterElements = Array.from(root.querySelectorAll("[data-filter]"))
    if (!rowsContainer || !summary || !emptyState) return

    const rows = Array.from(rowsContainer.querySelectorAll("tr"))
    const singular = root.dataset.itemSingular || "venue"
    const plural = root.dataset.itemPlural || `${singular}s`
    let sortKey = root.dataset.sortKey || "title"
    let sortDirection = root.dataset.sortDirection || "asc"

    const sortValue = (row, key) => {
      if (key === "price") {
        return String((row.dataset.price || "").length).padStart(2, "0")
      }

      if (key === "date") {
        return row.dataset.sortDate || row.dataset.date || ""
      }

      return (row.dataset[key] || "").toLowerCase()
    }

    const update = () => {
      const activeFilters = Object.fromEntries(
        filterElements.map((element) => [element.dataset.filter || "", (element.value || "").trim()]),
      )
      const searchValue = (activeFilters.search || "").toLowerCase()

      const visibleRows = rows.filter((row) => {
        const matchesSearch = !searchValue || (row.dataset.search || "").includes(searchValue)
        const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
          if (!key || key === "search" || !value) return true
          const datasetValue = row.dataset[key] || ""
          if (key === "months") {
            return datasetValue.split("|").includes(value)
          }

          return datasetValue === value
        })

        const matches = matchesSearch && matchesFilters
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

      summary.textContent = visibleRows.length === 1
        ? `Showing 1 ${singular}`
        : `Showing ${visibleRows.length} ${plural}`
      emptyState.hidden = visibleRows.length !== 0

      sortButtons.forEach((button) => {
        const isActive = button.dataset.sort === sortKey
        button.dataset.active = isActive ? "true" : "false"
        button.dataset.direction = isActive ? sortDirection : ""
      })

      root.dataset.sortKey = sortKey
      root.dataset.sortDirection = sortDirection
    }

    filterElements.forEach((element) => {
      element.addEventListener("input", update)
      element.addEventListener("change", update)
    })

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
  })
}

document.addEventListener("nav", () => {
  initCollectionIndex()
})
