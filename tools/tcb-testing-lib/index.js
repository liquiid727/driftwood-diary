function mockContext(overrides) {
  return {
    requestId: `test_req_${Date.now()}`,
    ...overrides
  }
}

function mockEvent(overrides) {
  return { ...overrides }
}

module.exports = { mockContext, mockEvent }

