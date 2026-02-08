const { ok, fail } = require('@horse/cf-shared/response')
const { Joi, validate } = require('@horse/cf-shared/validate')
const { logRequestId } = require('@horse/cf-shared/request')
const { signDoubaoRequest } = require('@horse/cf-shared/doubaoSign')
const { postJson } = require('@horse/cf-shared/http')
const { sha256Hex } = require('@horse/cf-shared/crypto')
const { getDb } = require('@horse/cf-shared/tcb')

const CACHE_COLLECTION = 'ai_text_cache'

const schema = Joi.object({
  albumId: Joi.string().min(1).max(128).required(),
  themeId: Joi.string().min(1).max(64).default('horseNewYear'),
  templateId: Joi.string().min(1).max(128).required(),
  tone: Joi.string().valid('warm', 'humor', 'restrained', 'literary').default('warm'),
  strength: Joi.string().valid('light', 'normal', 'strong').default('normal'),
  pages: Joi.array()
    .items(
      Joi.object({
        pageType: Joi.string().min(1).max(32).required(),
        layoutId: Joi.string().min(1).max(64).required(),
        imageSummary: Joi.object().unknown(true).default({})
      })
    )
    .min(1)
    .max(30)
    .required()
})

function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj)
  if (Array.isArray(obj)) return `[${obj.map((x) => stableStringify(x)).join(',')}]`
  const keys = Object.keys(obj).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`
}

function buildCacheKey(input) {
  return sha256Hex(stableStringify(input))
}

function defaultText(pages) {
  const cover = {
    title: '马年新春团圆年册',
    subtitle: '把这一年的热闹与温柔，都装进这里',
    blessing: '愿你新岁顺遂，心里有光，脚下有路。'
  }
  const pageTexts = pages.map((p, idx) => {
    if (p.pageType === 'groupPhoto') {
      return {
        pageIndex: idx,
        paragraph: '灯火可亲，笑声入册。把最重要的人，放在最亮的一页。',
        captions: ['这一刻值得记住', '我们在一起就很好']
      }
    }
    if (p.pageType === 'dinner') {
      return {
        pageIndex: idx,
        paragraph: '年夜饭的香气和热气，藏在每一张小小的照片里。',
        tags: ['团圆', '烟火气', '热闹']
      }
    }
    if (p.pageType === 'greeting') {
      return {
        pageIndex: idx,
        greeting: '马到成功，所愿皆成，喜乐常在。',
        caption: '新的一年，继续向前，步步安稳。'
      }
    }
    if (p.pageType === 'blank') {
      return {
        pageIndex: idx,
        title: '留一页给自己',
        paragraph: '愿你把喜欢的事做成习惯，把想见的人见成日常。'
      }
    }
    return { pageIndex: idx, paragraph: '把这一刻收进册页，慢慢翻阅。' }
  })
  return { cover, pages: pageTexts }
}

function normalizeAiOutput(payload) {
  const cover = payload && payload.cover ? payload.cover : null
  const pages = payload && payload.pages ? payload.pages : null
  if (!cover || !pages || !Array.isArray(pages)) return null
  return { cover, pages }
}

function countExclamations(text) {
  return (String(text || '').match(/[!！]/g) || []).length
}

function hasBannedWords(text) {
  const s = String(text || '')
  const banned = ['秒出', '爆款', '点赞', '关注', '转发', '免费', '立刻', '必须', '下单', '购买', '私信', '点我']
  return banned.some((w) => s.includes(w))
}

function validateCover(cover) {
  const title = String((cover && cover.title) || '').trim()
  const subtitle = String((cover && cover.subtitle) || '').trim()
  const blessing = String((cover && cover.blessing) || '').trim()
  if (title.length < 8 || title.length > 14) return false
  if (subtitle.length < 12 || subtitle.length > 20) return false
  if (blessing.length < 12 || blessing.length > 24) return false
  if (countExclamations(`${title}${subtitle}${blessing}`) > 1) return false
  if (hasBannedWords(`${title}${subtitle}${blessing}`)) return false
  return true
}

function validatePageText(pageType, txt) {
  if (!txt || typeof txt !== 'object') return false
  const joined = Object.values(txt)
    .map((v) => (Array.isArray(v) ? v.join(' ') : String(v || '')))
    .join(' ')
  if (countExclamations(joined) > 1) return false
  if (hasBannedWords(joined)) return false

  if (pageType === 'groupPhoto') {
    const paragraph = String(txt.paragraph || '').trim()
    const captions = Array.isArray(txt.captions) ? txt.captions : []
    if (paragraph.length < 20 || paragraph.length > 45) return false
    if (captions.length > 2) return false
    for (const c of captions) {
      const s = String(c || '').trim()
      if (s.length < 8 || s.length > 16) return false
    }
    return true
  }

  if (pageType === 'dinner') {
    const paragraph = String(txt.paragraph || '').trim()
    const tags = Array.isArray(txt.tags) ? txt.tags : []
    if (paragraph.length < 18 || paragraph.length > 40) return false
    if (tags.length > 6) return false
    return true
  }

  if (pageType === 'greeting') {
    const greeting = String(txt.greeting || '').trim()
    const caption = String(txt.caption || '').trim()
    if (greeting.length < 12 || greeting.length > 22) return false
    if (caption && (caption.length < 12 || caption.length > 22)) return false
    return true
  }

  if (pageType === 'blank') {
    const paragraph = String(txt.paragraph || '').trim()
    if (paragraph.length < 24 || paragraph.length > 60) return false
    return true
  }

  return true
}

function validateAiResult(result, pageMetas) {
  if (!result || !result.cover || !Array.isArray(result.pages)) return false
  if (!validateCover(result.cover)) return false
  if (result.pages.length !== pageMetas.length) return false

  const seenParagraphs = new Set()
  for (let i = 0; i < pageMetas.length; i += 1) {
    const meta = pageMetas[i]
    const txt = result.pages[i]
    if (!validatePageText(meta.pageType, txt)) return false
    const p = String(txt.paragraph || txt.greeting || '').trim()
    if (p && seenParagraphs.has(p)) return false
    if (p) seenParagraphs.add(p)
  }
  return true
}

exports.main = async (event, context) => {
  logRequestId(context)
  const { value, errorMsg } = validate(schema, event || {})
  if (errorMsg) return fail(400, errorMsg)

  const cacheInput = {
    themeId: value.themeId,
    templateId: value.templateId,
    tone: value.tone,
    strength: value.strength,
    pages: value.pages
  }
  const cacheKey = buildCacheKey(cacheInput)
  const db = getDb()
  const cacheCol = db.collection(CACHE_COLLECTION)
  const cacheHit = await cacheCol.where({ cacheKey }).limit(1).get()
  const hitItem = (cacheHit.data || [])[0]
  if (hitItem && hitItem.result) {
    return ok({ albumId: value.albumId, cacheKey, result: hitItem.result, fromCache: true })
  }

  const host = process.env.DOUBAO_HOST || ''
  const region = process.env.DOUBAO_REGION || ''
  const service = process.env.DOUBAO_SERVICE || ''
  const accessKey = process.env.DOUBAO_ACCESS_KEY || ''
  const secretKey = process.env.DOUBAO_SECRET_KEY || ''
  const apiPath = process.env.DOUBAO_API_PATH || '/api/v3/chat/completions'
  const model = process.env.DOUBAO_MODEL || 'doubao'

  let result = null
  let fromAi = false
  if (host && region && service && accessKey && secretKey) {
    const url = `https://${host}${apiPath}`
    const maxAttempts = 3
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const tunedInput = {
        ...cacheInput,
        attempt,
        retryHint: attempt === 0 ? '' : attempt === 1 ? '更短一些，更克制一些，减少重复' : '严格按字段输出，避免口号与感叹号'
      }
      if (attempt >= 1) tunedInput.strength = 'light'
      if (attempt >= 2) tunedInput.tone = 'restrained'

      const requestBody = { model, input: tunedInput }
      const bodyStr = JSON.stringify(requestBody)
      try {
        const { headers } = signDoubaoRequest({
          accessKey,
          secretKey,
          host,
          region,
          service,
          method: 'POST',
          canonicalUri: apiPath,
          queryString: '',
          body: bodyStr
        })
        const data = await postJson(url, requestBody, headers, 12000)
        const candidate = normalizeAiOutput(data && (data.output || data.data || data.result))
        if (validateAiResult(candidate, value.pages)) {
          result = candidate
          fromAi = true
          break
        }
      } catch (e) {
        result = null
        fromAi = false
      }
    }
  }

  if (!result) {
    result = defaultText(value.pages)
  }

  await cacheCol.add({
    cacheKey,
    createdAt: Date.now(),
    result
  })

  return ok({ albumId: value.albumId, cacheKey, result, fromCache: false, fromAi })
}
