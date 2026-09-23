import { Buffer } from 'node:buffer'
import { jwtVerify, type JWTVerifyOptions } from 'jose'
import { type H3Event, getHeader } from 'h3'
import { useRuntimeConfig } from '#imports'
import type {} from '../../types/twitch-jwt'

export const verifyTwitchExtension = async (event: H3Event, options?: JWTVerifyOptions) => {
  const token = getHeader(event, 'Authorization')?.replace('Bearer ', '')

  if (!token) return null

  const { twitchExt } = useRuntimeConfig(event)
  const key = Buffer.from(twitchExt.secretKey, 'base64')

  try {
    const { payload } = await jwtVerify<Twitch.jwt.ExtensionPayload>(token, key, {
      algorithms: ['HS256'],
      ...options,
    })

    return payload
  }
  catch {
    return null
  }
}

export const verifyTwitchTransaction = async (
  event: H3Event,
  receipt: Twitch.ext.BitsTransaction['transactionReceipt'],
  options?: JWTVerifyOptions,
) => {
  const { twitchExt } = useRuntimeConfig(event)
  const key = Buffer.from(twitchExt.secretKey, 'base64')

  try {
    const { payload } = await jwtVerify<Twitch.jwt.TransactionPayload>(receipt, key, {
      algorithms: ['HS256'],
      ...options,
    })

    if (payload.topic === 'bits_transaction_receipt'
      && payload.data.product.domainId === `twitch.ext.${twitchExt.clientId}`
      && payload.data.product.cost.type === 'bits'
    ) {
      return payload
    }
  }
  catch {
    return
  }
}
