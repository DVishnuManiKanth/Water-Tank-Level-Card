import voluptuous as vol
from homeassistant import config_entries
from homeassistant.helpers import selector
from .const import *

class WaterTankConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input=None):
        if user_input is not None:
            return self.async_create_entry(title="Water Tank", data=user_input)

        schema = vol.Schema({
            vol.Required(CONF_LEVEL_ENTITY): selector.EntitySelector(
                selector.EntitySelectorConfig(domain="sensor")),
            vol.Optional(CONF_DISTANCE_ENTITY): selector.EntitySelector(
                selector.EntitySelectorConfig(domain="sensor")),
            vol.Optional(CONF_PUMP_ENTITY): selector.EntitySelector(
                selector.EntitySelectorConfig(domain=["switch", "input_boolean"])),
            vol.Required(CONF_TANK_CAPACITY, default=DEFAULT_CAPACITY): vol.Coerce(float),
            vol.Required(CONF_MAX_DROP_PERCENT, default=DEFAULT_MAX_DROP_PERCENT): vol.Coerce(float),
            vol.Required(CONF_MIN_CONSUMPTION_LITERS, default=DEFAULT_MIN_CONSUMPTION_LITERS): vol.Coerce(float),
        })
        return self.async_show_form(step_id="user", data_schema=schema)
