// Cypress helpers for the fake Moonraker (cypress/fake-moonraker). The preview server
// forwards /_fake to it, so these requests go through the page's own origin.

const CONTROL_PREFIX = '/_fake'
const GCODE_METHOD = 'printer.gcode.script'
const POLL_INTERVAL_MS = 250
const POLL_ATTEMPTS = 20

interface FakeRequest {
    id: number
    time: number
    transport: 'websocket' | 'http'
    method: string
    params: Record<string, unknown> | null
}

export const resetFakeMoonraker = () => cy.request('POST', `${CONTROL_PREFIX}/reset`)

export const fakeRequests = (method?: string) =>
    cy
        .request<FakeRequest[]>({ url: `${CONTROL_PREFIX}/requests`, qs: method ? { method } : {} })
        .its('body', { log: false })

// The UI sends asynchronously, so poll the request log until the script shows up.
export const expectGcodeSent = (script: string, attempt = 1): void => {
    fakeRequests(GCODE_METHOD).then((requests) => {
        const scripts = requests.map((request) => request.params?.script)
        if (scripts.includes(script)) return

        if (attempt >= POLL_ATTEMPTS) {
            throw new Error(`G-code "${script}" was never sent; the fake received: ${JSON.stringify(scripts)}`)
        }

        cy.wait(POLL_INTERVAL_MS, { log: false })
        expectGcodeSent(script, attempt + 1)
    })
}
