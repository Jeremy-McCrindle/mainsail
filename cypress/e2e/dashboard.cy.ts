import { expectGcodeSent, resetFakeMoonraker } from '../support/fake-moonraker'

// The dashboard against the fake Moonraker: an idle Ender 3 V3 SE named "printer".
// `npm run test` starts the fake and a preview server that forwards Moonraker's paths to it.

const DASHBOARD_READY_TIMEOUT_MS = 20000

describe('Dashboard', () => {
    beforeEach(() => {
        resetFakeMoonraker()
        cy.visit('/')
        cy.get('.macros-panel', { timeout: DASHBOARD_READY_TIMEOUT_MS }).should('be.visible')
    })

    it('connects and shows the idle printer', () => {
        cy.contains('Connecting to').should('not.exist')
        cy.get('header').should('contain', 'printer')
        cy.contains('Standby').should('be.visible')
        cy.contains('calibration_cube.gcode').should('be.visible')
        cy.contains('benchy.gcode').should('be.visible')
        // An empty notification list keeps the bell's badge hidden: no warnings, no failed components.
        cy.get('header').find('.v-badge__badge:visible').should('not.exist')
    })

    it('shows the extruder and bed temperatures', () => {
        cy.get('.temperature-panel').within(() => {
            cy.contains('tr', 'Extruder').should('contain', '24.6°C')
            cy.contains('tr', 'Heater Bed').should('contain', '23.8°C')
        })
    })

    it('sends a macro when its button is clicked', () => {
        cy.get('.macros-panel').within(() => {
            cy.contains('button', 'PRINT END').should('be.visible')
            cy.contains('button', 'UNLOAD FILAMENT').should('be.visible')
            cy.contains('button', /^\s*LOAD FILAMENT\s*$/).click()
        })

        expectGcodeSent('LOAD_FILAMENT')
    })

    it('sends a command typed into the console', () => {
        cy.get('.gcode-command-field textarea').type('M115{enter}')

        expectGcodeSent('M115')
        cy.contains('fake moonraker received: M115').should('be.visible')
    })
})
