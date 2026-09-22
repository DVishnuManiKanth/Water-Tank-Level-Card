# Water Tank Level Card

Combined Home Assistant HACS project: animated tank card + water-consumption sensor.

## HACS
Repository: https://github.com/DVishnuManiKanth/Water-Tank-Level-Card

Install this repository in HACS as a **Dashboard** (Plugin) repository. The dashboard card is installed as `Water-Tank-Level-Card.js`.

## Water Tank Integration
Add **Water Tank** from Settings → Devices & services → Add Integration.

For the user's 1000 L setup:
- Level: `sensor.esp8266_text_tank_water_level`
- Distance: `sensor.esp8266_text_tank_water_level_distance`
- Pump: `switch.borewell_p110`
- Capacity: `1000`
- Maximum valid drop: `5%`
- Minimum event: `0.5 L`

The sensor exposes total consumption plus attributes `today_liters`, `seven_day_liters`, and `seven_day_average_l_day`.

## Dashboard Card

After installing through HACS, the card resource is:
`/hacsfiles/Water-Tank-Level-Card/Water-Tank-Level-Card.js`

HACS custom repository type: **Dashboard**.


```yaml
type: custom:water-tank-card
level_entity: sensor.esp8266_text_tank_water_level
distance_entity: sensor.esp8266_text_tank_water_level_distance
pump_entity: switch.borewell_p110
name: Water Tank
capacity_liters: 1000
```
