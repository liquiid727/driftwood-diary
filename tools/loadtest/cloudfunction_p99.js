const tcb = require('tcb-admin-node')

function parseArgs(argv) {
  const out = {}
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i]
    if (!a.startsWith('--')) continue
    const k = a.slice(2)
    const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : 'true'
    out[k] = v
    if (v !== 'true') i += 1
  }
  return out
}

function percentile(values, p) {
  if (!values.length) return 0
  const arr = values.slice().sort((a, b) => a - b)
  const idx = Math.ceil((p / 100) * arr.length) - 1
  return arr[Math.max(0, Math.min(arr.length - 1, idx))]
}

async function main() {
  const args = parseArgs(process.argv)
  const envId = process.env.TCB_ENV_ID || ''
  const secretId = process.env.TCB_SECRET_ID || ''
  const secretKey = process.env.TCB_SECRET_KEY || ''
  const name = args.name || ''
  const concurrency = Number(args.concurrency || 100)
  const requests = Number(args.requests || 1000)
  const payload = args.data ? JSON.parse(args.data) : {}

  if (!envId || !secretId || !secretKey) {
    throw new Error('missing_env: set TCB_ENV_ID/TCB_SECRET_ID/TCB_SECRET_KEY')
  }
  if (!name) {
    throw new Error('missing_arg: --name <cloudfunctionName>')
  }

  const app = tcb.init({ env: envId, secretId, secretKey })

  let cursor = 0
  const costs = []
  let errors = 0

  async function worker() {
    while (true) {
      const i = cursor
      cursor += 1
      if (i >= requests) return
      const start = Date.now()
      try {
        const res = await app.callFunction({ name, data: payload })
        const end = Date.now()
        costs.push(end - start)
        const code = res && res.result && typeof res.result.code === 'number' ? res.result.code : 0
        if (code !== 0) errors += 1
      } catch (e) {
        const end = Date.now()
        costs.push(end - start)
        errors += 1
      }
    }
  }

  const workers = []
  for (let i = 0; i < concurrency; i += 1) workers.push(worker())
  await Promise.all(workers)

  const p99 = percentile(costs, 99)
  const p95 = percentile(costs, 95)
  const p50 = percentile(costs, 50)
  const errRate = costs.length ? errors / costs.length : 1

  process.stdout.write(
    JSON.stringify(
      {
        name,
        requests: costs.length,
        concurrency,
        p50Ms: p50,
        p95Ms: p95,
        p99Ms: p99,
        errorRate: errRate
      },
      null,
      2
    ) + '\n'
  )

  if (p99 > 600 || errRate > 0.001) {
    process.exitCode = 2
  }
}

main().catch((e) => {
  process.stderr.write(String(e && e.stack ? e.stack : e) + '\n')
  process.exitCode = 1
})

