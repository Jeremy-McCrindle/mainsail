// Synthetic gcode_macro sections. PAUSE, RESUME and CANCEL_PRINT keep Mainsail's
// "missing config" warning away; the rest are what an Ender 3 V3 SE config usually has.

export const MACROS = {
    PAUSE: {
        description: 'Pause the running print',
        gcode: 'PAUSE_BASE\nG91\nG1 E-1 F2100\nG1 Z10 F900\nG90\nG1 X10 Y210 F6000',
        rename_existing: 'PAUSE_BASE',
    },
    RESUME: {
        description: 'Resume the paused print',
        gcode: 'G91\nG1 E1 F2100\nG90\nRESUME_BASE',
        rename_existing: 'RESUME_BASE',
    },
    CANCEL_PRINT: {
        description: 'Cancel the running print',
        gcode: 'TURN_OFF_HEATERS\nM106 S0\nCANCEL_PRINT_BASE',
        rename_existing: 'CANCEL_PRINT_BASE',
    },
    LOAD_FILAMENT: {
        description: 'Heat the nozzle and load filament',
        gcode: 'M109 S{params.TEMP|default(220)|float}\nM83\nG1 E50 F300\nM82',
    },
    UNLOAD_FILAMENT: {
        description: 'Heat the nozzle and unload filament',
        gcode: 'M109 S{params.TEMP|default(220)|float}\nM83\nG1 E10 F300\nG1 E-60 F1800\nM82',
    },
    PRINT_START: {
        description: 'Heat, home and prime before a print',
        gcode:
            'M190 S{params.BED_TEMP|default(60)|float}\nM109 S{params.EXTRUDER_TEMP|default(210)|float}\n' +
            'G28\nG1 Z2 F600\nG1 X5 Y20 F6000\nG1 Y200 E15 F1500',
    },
    PRINT_END: {
        description: 'Retract, park and cool down after a print',
        gcode: 'G91\nG1 E-2 F2700\nG1 Z10 F600\nG90\nG1 X10 Y210 F6000\nTURN_OFF_HEATERS\nM106 S0\nM84',
    },
}

const toSectionName = (name) => `gcode_macro ${name.toLowerCase()}`

export const macroConfigSections = () =>
    Object.fromEntries(Object.entries(MACROS).map(([name, settings]) => [toSectionName(name), { ...settings }]))

export const macroObjectNames = () => Object.keys(MACROS).map((name) => `gcode_macro ${name}`)

export const macroHelp = () =>
    Object.fromEntries(Object.entries(MACROS).map(([name, settings]) => [name, { help: settings.description }]))
