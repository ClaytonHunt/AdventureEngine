set dotenv-load := true

default:
    @just --list

# The Chronicle -- state machine workflow orchestrator
chronicle:
    pi -e extensions/chronicle.ts -e extensions/theme-cycler.ts

# The Chronicle with Damage Control (recommended)
chronicle-safe:
    pi -e extensions/damage-control.ts -e extensions/chronicle.ts -e extensions/theme-cycler.ts
