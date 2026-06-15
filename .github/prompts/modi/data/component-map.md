# Component Map — MODI Resolution Cache

> Auto-maintained by MODI. Manual edits are fine — MODI appends below the relevant section header.

## Core Kit (pre-scanned)

- name: FDS-Input
  componentKey: "519c3267c04299f0db248c35091f533b70053e72"
  axes:
    Size: [Small, Medium, Large]
    State: [Default, Filled, Error, Disabled]
  defaultVariantKey: "b7357daba5a390783d8b9d8ade39005188694f80"
  scanned: 2026-04-27

- name: FDS-Button-Control-One
  componentKey: "b47d0f024c9e62a9f1ee8a0754c6675d53b5042f"
  axes:
    Size: [Small, Medium, Large]
    Type: [Primary, Secondary, Ghost]
    State: [Default, Hover, Pressed, Disabled]
  defaultVariantKey: "b864b18565f991e0ce44ff9818c378bc48054fe6"
  scanned: 2026-04-27

## Discovered (auto-appended by MODI)

- name: FDS-Input (local)
  componentKey: "7a523c014c245d806c39ea4f825fb9396160d867"
  nodeId: "8556:55146"
  file: Ahvbwk0dUHeHazrQX2XtGd
  local: true
  axes:
    State: [Default, Default-Error, Placeholder, Filled, Focus, Success, Danger, Disabled, readonly]
    Assistive Text: [On, Off]
    Prefix: [On, Off]
    Suffix: [On, Off]
    Leading Icon: [Off, On]
    Theme: [Surface-Variant, Surface, Alternate-Surface-Variant, Alternate-Surface]
  scanned: 2026-04-27

- name: FDS-site-header
  componentKey: "e871b2c694587f13a9ef4e6c13adfe387e4cb1b9"
  library: "🧣 DS Fabric Components (WIP)"
  file: Dli7JA3N6vuTTYi4lD9qMF
  nodeId: "37086:21633"
  axes:
    Status: [Logged-out, Logged-in]
    Break-point: [">1023px", "<1024px"]
  scanned: 2026-06-15

- name: FDS-ProgressBar
  componentKey: "bcb44dddd44bf1cfd363dca318a7a516fd94bd76"
  library: "🧣 DS Fabric Components (WIP)"
  file: Dli7JA3N6vuTTYi4lD9qMF
  nodeId: "27468:53201"
  axes:
    Property 1: [Short, Weak, Valid, Error]
  notes: "Variants are password-strength flavoured (Short/Weak/Valid/Error) — not a generic 0–100% fill bar. For generic progress, stylise inline."
  scanned: 2026-06-15

- name: FDS-Button-Update
  componentKey: "af0713c212ec9752e4b3aaaa2ca4fc85b996f8f5"
  axes:
    Size: [Large, Regular, Small, Tiny]
    Type: [Primary, Secondary, Teritary]
    Shape: [Default]
    Leading Icon: [On, Off]
    Label: [On, Off]
    Trailing Icon: [On, Off]
    Colour: [header default, default, accent, surface default, alternate accent, alternate surface default]
    Theme: [On header, On surface, On alternate surface]
  scanned: 2026-04-27

## Custom (user-provided URLs)

- name: FDS-Stepper
  componentSetKey: "a0bd91f5ddd55cfff9bf012741251929c85774a6"
  axes:
    Steps: [3, 4, 5]
    Direction: [horizontal, vertical]
    Theme: [on-surface, on-alternate-surface]
    Style: [Badge, Ico]
    Text: [false, true]
  scanned: 2026-04-27

- name: Status Bar - iPhone
  componentSetKey: "921f043d21ba058760197af0dbbda05de2dbbcd5"
  axes:
    Background: [False, True]
  defaultVariantKey: "306a7dd7d7ad637a44fe791d48466d86da257255"
  scanned: 2026-04-27

- name: Checkbox (DS Fabric)
  componentSetKey: "b78a63b3938742980d4ea9bcfa03d7cb9d2c2bea"
  axes:
    Type: [Unselected, Error, Selected, Indeterminate]
    State: [Rest, Focused, Disabled]
    Context: [on-surface, on-alternate-surface]
  defaultVariantKey: "998ff0cbf46b0342161ab309d61e53bb5ca1dcdb"
  scanned: 2026-04-27

- name: Top bar/ios/Back
  componentKey: "810863aa8b8693a3a955c139fcbdfef9ac7ecd86"
  axes: none
  scanned: 2026-04-27

- name: FDS-Verification-Code-Group-WIP
  componentSetKey: "87936dc9bf368a687fb84fa831e8c81a796e6212"
  axes:
    State: [Default, Focus, Filled, Error, Disabled]
    Lenght: [6, 5, 4]
    Visible: [True, False]
  scanned: 2026-04-27
