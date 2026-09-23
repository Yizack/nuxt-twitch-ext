export default defineEventHandler(async (event) => {
  const payload = await verifyTwitchExtension(event)

  if (!payload) {
    throw createError({
      status: 400,
      message: 'Invalid authorization',
    })
  }

  return { test: 'value' }
})
