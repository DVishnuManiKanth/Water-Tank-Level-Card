[![Buy Me a Coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=%E2%98%95&slug=DVishnuManiKanTh&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff)](https://buymeacoffee.com/DVishnuManiKanTh)

# Water Tank Level Card

A custom Home Assistant Lovelace card for monitoring a water tank with an animated glass-style tank, live water level, pump status, distance, consumption metrics, low-water alerts, and responsive light/dark theme support.

## Features

- Animated glass-style water tank with smooth water-level animation
- Live water level displayed as percentage
- Tank capacity and remaining water in liters
- Optional distance sensor
- Pump ON/OFF status
- Optional daily water consumption
- Optional 7-day water consumption
- Configurable low-water alert threshold
- Visual editor support for card settings and display options
- Adjustable tank width, height, corner radius, and accent color
- Automatic Home Assistant light and dark theme support
- Live "Updated X sec/min ago" display
- Responsive layout for desktop and mobile dashboards
- No external JavaScript dependencies

## Installation

Install the repository through HACS as a Dashboard custom repository.

Add the card as:

```yaml
type: custom:water-tank-card
level_entity: sensor.water_level_sensors_tank_water_level
distance_entity: sensor.water_level_sensors_tank_water_level_distance
pump_entity: switch.borewell_p110
capacity_liters: 1000
name: Water Tank
alert_threshold_percent: 24
```

The existing filename `Water-Tank-Level-Card.js` is retained for compatibility with the repository's HACS resource path.

## Visual Editor

The card provides a Home Assistant visual editor for configuring:

- Water level, distance, pump, daily consumption, and 7-day consumption entities
- Tank name and capacity
- Layout
- Tank width and height
- Corner radius and accent color
- Show/hide Source, Range, Level, and Today details
- Low-water alert threshold

## Preview

### Dark Theme

<img src="https://raw.githubusercontent.com/DVishnuManiKanTh/Water-Tank-Level-Card/main/assets/water-tank-dark.webp" alt="Water Tank Level Card - Dark Theme" width="280">

### Light Theme

<img src="https://raw.githubusercontent.com/DVishnuManiKanTh/Water-Tank-Level-Card/main/assets/water-tank-light.jpg" alt="Water Tank Level Card - Light Theme" width="280">

### Animated Preview

<img src="https://raw.githubusercontent.com/DVishnuManiKanTh/Water-Tank-Level-Card/main/assets/lv_0_20260926170321.gif" alt="Water Tank Level Card - Animated Preview" width="280">
