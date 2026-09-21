from __future__ import annotations
from collections import deque
from datetime import datetime, timedelta
from homeassistant.components.sensor import SensorEntity, SensorDeviceClass
from homeassistant.const import UnitOfVolume
from homeassistant.core import callback
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers.restore_state import RestoreEntity
from .const import *

class WaterConsumptionSensor(RestoreEntity, SensorEntity):
    _attr_native_unit_of_measurement = UnitOfVolume.LITERS
    _attr_device_class = SensorDeviceClass.WATER
    _attr_state_class = "total_increasing"
    _attr_icon = "mdi:water"

    def __init__(self, hass, entry):
        self.hass = hass
        self.level_entity = entry.data[CONF_LEVEL_ENTITY]
        self.pump_entity = entry.data.get(CONF_PUMP_ENTITY)
        self.capacity = float(entry.data.get(CONF_TANK_CAPACITY, DEFAULT_CAPACITY))
        self.max_drop = float(entry.data.get(CONF_MAX_DROP_PERCENT, DEFAULT_MAX_DROP_PERCENT))
        self.minimum = float(entry.data.get(CONF_MIN_CONSUMPTION_LITERS, DEFAULT_MIN_CONSUMPTION_LITERS))
        self._total = 0.0
        self._events = deque()
        self._previous_level = None
        self._attr_unique_id = f"{entry.entry_id}_water_consumption"
        self._attr_name = "Water Consumption"

    async def async_added_to_hass(self):
        await super().async_added_to_hass()
        old = await self.async_get_last_state()
        if old:
            try:
                self._total = float(old.state)
            except (ValueError, TypeError):
                pass
        state = self.hass.states.get(self.level_entity)
        if state:
            try:
                self._previous_level = float(state.state)
            except (ValueError, TypeError):
                pass
        async_track_state_change_event(hass=self.hass, entity_ids=[self.level_entity], action=self._level_changed)

    @callback
    def _level_changed(self, event):
        new_state = event.data.get("new_state")
        if not new_state or new_state.state in ("unknown", "unavailable"):
            return
        try:
            new_level = float(new_state.state)
        except (ValueError, TypeError):
            return
        if self._previous_level is None:
            self._previous_level = new_level
            return

        delta = new_level - self._previous_level
        self._previous_level = new_level

        # Filling is never consumption.
        if delta >= 0:
            return

        # Do not count any level decrease while the configured pump is ON.
        if self.pump_entity:
            pump = self.hass.states.get(self.pump_entity)
            if pump and pump.state == "on":
                return

        # Ignore sudden large jumps, normally caused by sensor glitches.
        if abs(delta) > self.max_drop:
            return

        liters = abs(delta) / 100.0 * self.capacity
        if liters < self.minimum:
            return

        now = datetime.now().astimezone()
        self._total += liters
        self._events.append((now, liters))
        self._purge(now)
        self.async_write_ha_state()

    def _purge(self, now):
        cutoff = now - timedelta(days=8)
        while self._events and self._events[0][0] < cutoff:
            self._events.popleft()

    def _sum_since(self, days):
        now = datetime.now().astimezone()
        cutoff = now - timedelta(days=days)
        return round(sum(v for t, v in self._events if t >= cutoff), 2)

    @property
    def native_value(self):
        return round(self._total, 2)

    @property
    def extra_state_attributes(self):
        seven = self._sum_since(7)
        return {
            "today_liters": self._sum_since(1),
            "seven_day_liters": seven,
            "seven_day_average_l_day": round(seven / 7, 2),
            "tank_capacity_liters": self.capacity,
            "max_valid_drop_percent": self.max_drop,
            "pump_ignored": True,
            "filling_ignored": True,
        }

async def async_setup_entry(hass, entry, async_add_entities):
    async_add_entities([WaterConsumptionSensor(hass, entry)])
