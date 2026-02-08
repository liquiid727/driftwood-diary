function pickRequestId(context) {
  if (!context) return ''
  return (
    context.requestId ||
    context.request_id ||
    context.wxCloudRequestId ||
    context.wxCloudRequestID ||
    ''
  )
}

function logRequestId(context) {
  const requestId = pickRequestId(context)
  if (requestId) {
    console.log(JSON.stringify({ requestId }))
  } else {
    console.log(JSON.stringify({ requestId: '' }))
  }
  return requestId
}

module.exports = { pickRequestId, logRequestId }

