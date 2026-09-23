#!/usr/bin/env node
import { execSync } from 'node:child_process'

execSync('nuxt generate --envName twitchExt', { stdio: 'inherit' })
