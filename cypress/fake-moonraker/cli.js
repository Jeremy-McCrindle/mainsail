// Starts the fake Moonraker: `npm run fake-moonraker`. FAKE_MOONRAKER_PORT and
// FAKE_MOONRAKER_HOST override the defaults (7125 on 127.0.0.1).

import { startFakeMoonraker } from './server.js'

const fake = await startFakeMoonraker()

const shutdown = async () => {
    await fake.close()
    process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
