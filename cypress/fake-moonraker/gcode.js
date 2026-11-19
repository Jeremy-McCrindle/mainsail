// What the fake does with G-code: nothing moves. It keeps the command in the console
// history and echoes a response, so the console shows the round trip.

export const ECHO_PREFIX = '// fake moonraker received: '

export const runGcodeScript = (state, notify, script) => {
    const text = String(script ?? '')
    const response = ECHO_PREFIX + text

    state.addGcodeStoreEntry(text, 'command')
    state.addGcodeStoreEntry(response, 'response')
    notify('notify_gcode_response', [response])

    return 'ok'
}
