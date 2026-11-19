// Klipper status objects for an idle, unhomed printer at room temperature.

import { BED_SIZE_MM, configfile } from './printer-config.js'
import { macroHelp, macroObjectNames } from './macros.js'

export const ROOM_TEMPERATURE = { extruder: 24.6, heater_bed: 23.8 }

const ORIGIN = [0, 0, 0, 0]
const AXIS_MIN = [-6, -6, -2, 0]
const AXIS_MAX = [BED_SIZE_MM.x, BED_SIZE_MM.y, BED_SIZE_MM.z, 0]

const heater = (temperature) => ({ temperature, target: 0, power: 0 })

const emptyMesh = () => ({
    profile_name: '',
    mesh_min: [0, 0],
    mesh_max: [0, 0],
    probed_matrix: [[]],
    mesh_matrix: [[]],
    profiles: {},
})

const macroObjects = () => Object.fromEntries(macroObjectNames().map((name) => [name, {}]))

export const printerObjects = () => ({
    webhooks: { state: 'ready', state_message: 'Printer is ready' },
    configfile: configfile(),
    mcu: {
        mcu_version: 'v0.12.0-0-gfake',
        mcu_build_versions: 'gcc: (fake) 10.0 binutils: (fake) 2.0',
        mcu_constants: { MCU: 'stm32f401xc', CLOCK_FREQ: 84000000 },
        last_stats: {},
    },
    gcode: { commands: macroHelp() },
    gcode_move: {
        speed_factor: 1,
        speed: 1500,
        extrude_factor: 1,
        absolute_coordinates: true,
        absolute_extrude: true,
        homing_origin: [...ORIGIN],
        position: [...ORIGIN],
        gcode_position: [...ORIGIN],
    },
    toolhead: {
        homed_axes: '',
        axis_minimum: [...AXIS_MIN],
        axis_maximum: [...AXIS_MAX],
        print_time: 0,
        stalls: 0,
        estimated_print_time: 0,
        extruder: 'extruder',
        position: [...ORIGIN],
        max_velocity: 500,
        max_accel: 5000,
        minimum_cruise_ratio: 0.5,
        square_corner_velocity: 5,
    },
    motion_report: { live_position: [...ORIGIN], live_velocity: 0, live_extruder_velocity: 0 },
    extruder: {
        ...heater(ROOM_TEMPERATURE.extruder),
        can_extrude: false,
        pressure_advance: 0.04,
        smooth_time: 0.04,
    },
    heater_bed: heater(ROOM_TEMPERATURE.heater_bed),
    heaters: {
        available_heaters: ['heater_bed', 'extruder'],
        available_sensors: ['heater_bed', 'extruder'],
        available_monitors: [],
    },
    fan: { speed: 0, rpm: null },
    'heater_fan hotend_fan': { speed: 0, rpm: null },
    idle_timeout: { state: 'Idle', printing_time: 0 },
    print_stats: {
        filename: '',
        total_duration: 0,
        print_duration: 0,
        filament_used: 0,
        state: 'standby',
        message: '',
        info: { total_layer: null, current_layer: null },
    },
    virtual_sdcard: { file_path: null, progress: 0, is_active: false, file_position: 0, file_size: 0 },
    pause_resume: { is_paused: false },
    display_status: { progress: 0, message: null },
    bed_mesh: emptyMesh(),
    query_endstops: { last_query: {} },
    stepper_enable: { steppers: { stepper_x: false, stepper_y: false, stepper_z: false, extruder: false } },
    system_stats: { sysload: 0.1, cputime: 12.5, memavail: 3500000 },
    ...macroObjects(),
})
