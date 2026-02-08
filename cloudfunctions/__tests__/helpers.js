function makeMockDb() {
  const collections = new Map()
  function collection(name) {
    if (!collections.has(name)) {
      const rows = []
      collections.set(name, { rows })
    }
    const store = collections.get(name)
    return {
      _name: name,
      add: async (doc) => {
        store.rows.push({ ...doc, _id: `${name}_${store.rows.length + 1}` })
        return { id: `${name}_${store.rows.length}` }
      },
      where: (query) => ({
        limit: () => ({
          get: async () => ({
            data: store.rows.filter((r) => Object.keys(query).every((k) => r[k] === query[k])).slice(0, 1)
          })
        }),
        update: async (patch) => {
          let updated = 0
          for (const r of store.rows) {
            if (Object.keys(query).every((k) => r[k] === query[k])) {
              Object.assign(r, patch)
              updated += 1
            }
          }
          return { updated }
        }
      })
    }
  }
  return { collection, _collections: collections }
}

function makeMockStorage() {
  const files = new Map()
  return {
    _files: files,
    uploadFile: async ({ cloudPath, fileContent }) => {
      const fileID = `cloud://${cloudPath}:${Date.now()}`
      files.set(fileID, Buffer.isBuffer(fileContent) ? fileContent : Buffer.from(fileContent))
      return { fileID }
    },
    downloadFile: async ({ fileID }) => {
      if (!files.has(fileID)) {
        throw new Error('file_not_found')
      }
      return { fileContent: files.get(fileID) }
    },
    getTempFileURL: async ({ fileList }) => {
      return {
        fileList: (fileList || []).map((x) => ({
          fileID: x.fileID,
          tempFileURL: x.fileID ? `https://temp.example.com/${encodeURIComponent(x.fileID)}` : ''
        }))
      }
    }
  }
}

module.exports = { makeMockDb, makeMockStorage }

