# Water Tank Level Card

A Home Assistant HACS dashboard card based on the Dosing Tank Card implementation by ADNPolymerase.

## Features
- Animated SVG tank
- Direct level-sensor mode
- Pump-runtime mode
- Remaining volume
- Consumption metrics
- 7-day consumption chart
- Low-level warning
- Adjustable tank settings
- Responsive/dark-mode friendly UI
- No external JavaScript dependencies

## Installation
Install this repository through HACS as a Dashboard custom repository.

The repository keeps the existing filename `Water-Tank-Level-Card.js` so existing HACS/resource paths remain compatible.

## Your 1000 L water tank

```yaml
type: custom:dosing-tank-card
level_entity: sensor.esp8266_text_tank_water_level
level_full: 100
level_empty: 0
capacity: 1000
capacity_unit: "L"
name: "Water Tank"
liquid_color: "#3b82f6"
alert_threshold_percent: 24
color_mode: level
warn_threshold_percent: 50
layout: columns
show_chart: true
last_update: changed
show_settings: true
```

## Upstream
The card implementation is based on:
https://github.com/ADNPolymerase/ha-dosing-tank-card

The upstream project is licensed under MIT.