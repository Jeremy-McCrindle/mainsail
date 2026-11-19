// Synthetic Klipper config for an idle Creality Ender 3 V3 SE, as configfile.settings
// reports it (parsed values, lower-case section names).

import { macroConfigSections } from './macros.js'

export const BED_SIZE_MM = { x: 220, y: 220, z: 250 }

const stepper = (axis, max) => ({
    microsteps: 16,
    rotation_distance: axis === 'z' ? 8 : 40,
    position_min: axis === 'z' ? -2 : -6,
    position_endstop: 0,
    position_max: max,
    homing_speed: axis === 'z' ? 5 : 50,
})

const settings = () => ({
    mcu: { serial: '/dev/fake-mcu', baud: 250000 },
    printer: {
        kinematics: 'cartesian',
        max_velocity: 500,
        max_accel: 5000,
        max_z_velocity: 15,
        max_z_accel: 100,
        square_corner_velocity: 5,
    },
    stepper_x: stepper('x', BED_SIZE_MM.x),
    stepper_y: stepper('y', BED_SIZE_MM.y),
    stepper_z: stepper('z', BED_SIZE_MM.z),
    extruder: {
        nozzle_diameter: 0.4,
        filament_diameter: 1.75,
        rotation_distance: 7.5,
        sensor_type: 'EPCOS 100K B57560G104F',
        control: 'pid',
        pid_kp: 22.5,
        pid_ki: 1.3,
        pid_kd: 98.0,
        min_temp: 0,
        max_temp: 300,
        min_extrude_temp: 170,
        max_extrude_only_distance: 100,
        pressure_advance: 0.04,
    },
    heater_bed: {
        sensor_type: 'EPCOS 100K B57560G104F',
        control: 'pid',
        pid_kp: 70.0,
        pid_ki: 1.2,
        pid_kd: 1000.0,
        min_temp: 0,
        max_temp: 110,
    },
    fan: {},
    'heater_fan hotend_fan': { heater: 'extruder', heater_temp: 50 },
    virtual_sdcard: { path: '/printer_data/gcodes', on_error_gcode: 'CANCEL_PRINT' },
    pause_resume: { recover_velocity: 50 },
    display_status: {},
    respond: { default_type: 'echo', default_prefix: 'echo:' },
    bed_mesh: {
        speed: 150,
        horizontal_move_z: 5,
        mesh_min: [10, 10],
        mesh_max: [200, 200],
        probe_count: [5, 5],
    },
    ...macroConfigSections(),
})

const toConfigValue = (value) => (Array.isArray(value) ? value.join(', ') : String(value))

// configfile.config holds the raw strings Klipper read from printer.cfg.
const toRawConfig = (parsed) =>
    Object.fromEntries(
        Object.entries(parsed).map(([section, options]) => [
            section,
            Object.fromEntries(Object.entries(options).map(([key, value]) => [key, toConfigValue(value)])),
        ])
    )

export const configfile = () => {
    const parsed = settings()

    return {
        config: toRawConfig(parsed),
        settings: parsed,
        warnings: [],
        save_config_pending: false,
        save_config_pending_items: {},
    }
}
