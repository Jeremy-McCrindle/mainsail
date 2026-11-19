// Where the fake listens: 127.0.0.1:7125 unless FAKE_MOONRAKER_HOST or FAKE_MOONRAKER_PORT say otherwise.

import { DEFAULT_HOST, DEFAULT_PORT } from './constants.js'

export const fakeMoonrakerHost = () => process.env.FAKE_MOONRAKER_HOST ?? DEFAULT_HOST
export const fakeMoonrakerPort = () => Number(process.env.FAKE_MOONRAKER_PORT ?? DEFAULT_PORT)
export const fakeMoonrakerUrl = () => `http://${fakeMoonrakerHost()}:${fakeMoonrakerPort()}`
