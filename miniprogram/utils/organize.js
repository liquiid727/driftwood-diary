function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function isValidCapturedAt(t) {
  return typeof t === 'number' && Number.isFinite(t) && t > 0
}

function photoScore(p) {
  const w = p.width || 0
  const h = p.height || 0
  const pixels = w && h ? w * h : 0
  const size = p.size || 0
  return pixels * 0.7 + size * 0.3
}

function dedupeBurst(photos) {
  const withTime = photos.filter((p) => isValidCapturedAt(p.capturedAt)).slice().sort((a, b) => a.capturedAt - b.capturedAt)
  const withoutTime = photos.filter((p) => !isValidCapturedAt(p.capturedAt))
  if (!withTime.length) return photos.slice()

  const kept = []
  let group = [withTime[0]]
  for (let i = 1; i < withTime.length; i += 1) {
    const prev = withTime[i - 1]
    const cur = withTime[i]
    if (cur.capturedAt - prev.capturedAt < 2000) {
      group.push(cur)
    } else {
      group.sort((a, b) => photoScore(b) - photoScore(a))
      kept.push(group[0])
      group = [cur]
    }
  }
  group.sort((a, b) => photoScore(b) - photoScore(a))
  kept.push(group[0])

  return kept.concat(withoutTime)
}

function median(arr) {
  const a = arr.slice().sort((x, y) => x - y)
  if (!a.length) return 0
  const m = Math.floor(a.length / 2)
  return a.length % 2 === 0 ? (a[m - 1] + a[m]) / 2 : a[m]
}

function splitEvenly(items, groups) {
  if (!items.length) return []
  const n = items.length
  const g = clamp(groups, 1, n)
  const out = []
  for (let i = 0; i < g; i += 1) {
    const start = Math.floor((i * n) / g)
    const end = Math.floor(((i + 1) * n) / g)
    out.push(items.slice(start, end))
  }
  return out.filter((x) => x.length)
}

function clusterChapters(photos) {
  const timed = photos.filter((p) => isValidCapturedAt(p.capturedAt)).slice().sort((a, b) => a.capturedAt - b.capturedAt)
  if (timed.length >= Math.max(12, Math.floor(photos.length * 0.4))) {
    const gaps = []
    for (let i = 1; i < timed.length; i += 1) gaps.push(timed[i].capturedAt - timed[i - 1].capturedAt)
    const gapMedian = median(gaps)
    const threshold = clamp(gapMedian * 2, 2 * 60 * 60 * 1000, 6 * 60 * 60 * 1000)

    const chapters = []
    let cur = [timed[0]]
    for (let i = 1; i < timed.length; i += 1) {
      if (timed[i].capturedAt - timed[i - 1].capturedAt > threshold) {
        chapters.push(cur)
        cur = [timed[i]]
      } else {
        cur.push(timed[i])
      }
    }
    chapters.push(cur)

    const limited = chapters.slice(0, 8)
    while (limited.length < 3 && limited.length < chapters.length) {
      limited.push(chapters[limited.length])
    }
    return limited
  }

  const groupCount = clamp(Math.ceil(photos.length / 30), 3, 6)
  return splitEvenly(photos, groupCount)
}

function pickHero(chapter) {
  if (!chapter.length) return null
  return chapter.slice().sort((a, b) => photoScore(b) - photoScore(a))[0]
}

function targetPageCount(photoCount) {
  if (photoCount <= 60) return 8
  if (photoCount <= 90) return 9
  if (photoCount <= 130) return 10
  if (photoCount <= 170) return 11
  return 12
}

function buildPagesFromPhotos(inputPhotos) {
  const photos = dedupeBurst(inputPhotos || [])
  const chapters = clusterChapters(photos)
  const pages = []

  const coverPhoto = photos[0]
  pages.push({
    pageId: 'p001',
    pageType: 'cover',
    layoutId: 'cover-A',
    text: {},
    assets: coverPhoto ? [{ assetId: coverPhoto.id, path: coverPhoto.path }] : []
  })

  const target = targetPageCount(photos.length)
  const grid9MaxPages = 2
  let usedGridPages = 0
  let pageSeq = 2

  const leftovers = []
  for (const chapter of chapters) {
    const hero = pickHero(chapter)
    const rest = chapter.filter((p) => p !== hero)
    if (hero) {
      const assets = [hero].concat(rest.slice(0, 1)).map((p) => ({ assetId: p.id, path: p.path }))
      pages.push({
        pageId: `p${String(pageSeq).padStart(3, '0')}`,
        pageType: 'groupPhoto',
        layoutId: 'group-hero',
        text: {},
        assets
      })
      pageSeq += 1
      leftovers.push(...rest.slice(1))
    } else {
      leftovers.push(...rest)
    }
  }

  let idx = 0
  while (pages.length < target - 2 && idx < leftovers.length) {
    if (usedGridPages < grid9MaxPages) {
      const slice = leftovers.slice(idx, idx + 9)
      pages.push({
        pageId: `p${String(pageSeq).padStart(3, '0')}`,
        pageType: 'dinner',
        layoutId: 'grid-9',
        text: {},
        assets: slice.map((p) => ({ assetId: p.id, path: p.path }))
      })
      pageSeq += 1
      usedGridPages += 1
      idx += slice.length
      continue
    }

    const slice = leftovers.slice(idx, idx + 2)
    pages.push({
      pageId: `p${String(pageSeq).padStart(3, '0')}`,
      pageType: 'groupPhoto',
      layoutId: 'group-hero',
      text: {},
      assets: slice.map((p) => ({ assetId: p.id, path: p.path }))
    })
    pageSeq += 1
    idx += slice.length
  }

  pages.push({
    pageId: `p${String(pageSeq).padStart(3, '0')}`,
    pageType: 'blank',
    layoutId: 'blank-text',
    text: {},
    assets: []
  })
  pageSeq += 1

  pages.push({
    pageId: `p${String(pageSeq).padStart(3, '0')}`,
    pageType: 'greeting',
    layoutId: 'blank-quote',
    text: {},
    assets: []
  })

  return pages
}

module.exports = { buildPagesFromPhotos }
