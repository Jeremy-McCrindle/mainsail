// Mainsail's Vite config with Moonraker's paths forwarded to the fake, for `npm run serve:fake`
// and the E2E preview. Mainsail then reaches Moonraker on its own origin, as behind nginx,
// so config.json and the build stay untouched.

import { mergeConfig } from 'vite'
import baseConfig from '../../vite.config'
import { PROXIED_PATHS } from './constants.js'
import { fakeMoonrakerUrl } from './address.js'

const proxy = Object.fromEntries(
    PROXIED_PATHS.map((path) => [path, { target: fakeMoonrakerUrl(), ws: path === '/websocket' }])
)

export default mergeConfig(baseConfig, {
    // Loopback only: the fake accepts anything, so keep it off the network.
    server: { proxy, host: '127.0.0.1' },
    preview: { proxy },
})
