// Moonraker database namespaces as a fresh install has them once Mainsail has run once.
// Seeding "mainsail" and "maintenance" skips Mainsail's first-run migration, which would
// otherwise fetch defaults over HTTP and write them back.

const MAINTENANCE_INIT_KEY = '00000000-0000-4000-8000-000000000000'

export const databaseNamespaces = () => ({
    mainsail: {},
    maintenance: { [MAINTENANCE_INIT_KEY]: { name: 'MAINTENANCE_INIT' } },
    moonraker: {},
    webcams: {},
})
