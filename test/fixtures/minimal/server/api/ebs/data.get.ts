import { defineEventHandler } from 'h3'
import { createError } from '#imports'
import { verifyTwitchExtension } from '../../../../../../src/runtime/server/utils/verify'

export default defineEventHandler(async (event) => {
  const payload = await verifyTwitchExtension(event)

  if (!payload) {
    throw createError({
      status: 401,
      message: 'Invalid authorization',
    })
  }

  return { test: 'value' }
})
