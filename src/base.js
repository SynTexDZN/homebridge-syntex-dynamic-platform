module.exports = class BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, serviceType, manager)
	{
		var subtype = serviceConfig.subtype;

		if(subtype.includes('-'))
		{
			subtype = subtype.split('-')[1];
		}

		this.Service = manager.platform.api.hap.Service;
		this.Characteristic = manager.platform.api.hap.Characteristic;

		this.UUIDGen = manager.platform.api.hap.uuid;

		this.homebridgeAccessory = homebridgeAccessory;

		this.logger = manager.platform.logger;
		
		this.AutomationSystem = manager.platform.AutomationSystem;
		this.ContextManager = manager.platform.ContextManager;
		this.EventManager = manager.platform.EventManager;
		this.TypeManager = manager.platform.TypeManager;

		this.id = deviceConfig['id'];

		this.sid = serviceConfig['id'] || deviceConfig['id'];
		this.name = serviceConfig['name'];

		this.letters = this.TypeManager.typeToLetter(serviceConfig.type) + subtype;

		this.options = {};

		this.options.virtual = serviceConfig.virtual || false;
		this.options.requests = serviceConfig.requests || [];

		this.service = this.createService(serviceType, serviceConfig.type, serviceConfig.subtype);

		this.connection = this.service.getCharacteristic(this.Characteristic.Connection) || this.service.addCharacteristic(this.Characteristic.Connection);

		this.connection.on('get', this.getConnectionState.bind(this)).on('set', this.setConnectionState.bind(this));

		this.connection.updateValue(this.getConnectionState());

		if(this.EventManager != null)
		{
			if(deviceConfig.disableEvents == null)
			{
				this.EventManager.setInputStream('updateState', { source : this, destination : this.sid }, (state) => {

					if((state = this.TypeManager.validateUpdate(this.id, this.letters, state)) != null && this.updateState != null)
					{
						this.updateState(state);
					}
					else
					{
						this.logger.log('error', this.id, this.letters, '[' + this.name + '] %update_error%! ( ' + this.id + ' )');
					}
	
					if(state.connection != null)
					{
						this.setConnectionState(state.connection, null, true);
					}
				});
			}
			
			this.EventManager.setInputStream('changeHandler', { destination : { id : this.id, letters : this.letters }, external : true }, (state) => {

				if((state = this.TypeManager.validateUpdate(this.id, this.letters, state)) != null && this.changeHandler != null)
				{
					this.changeHandler(state);
				}
				else
				{
					this.logger.log('error', this.id, this.letters, '[' + this.name + '] %update_error%! ( ' + this.id + ' )');
				}
			});
		}
	}

	createService(serviceType, type, subtype)
	{
		var service = this.homebridgeAccessory.getServiceById(serviceType, subtype.toString());

		if(service)
		{
			service.setCharacteristic(this.Characteristic.Name, this.name);

			this.logger.debug('%service_found%! [name: ' + this.name + ', type: ' + type + ', letters: ' + this.letters + '] ( ' +  this.id + ' )');
		}
		else
		{
			this.logger.debug('%service_create%! [name: ' + this.name + ', type: ' + type + ', letters: ' + this.letters + '] ( ' +  this.id + ' )');

			if(type == 'statelessswitch')
			{
				var button = new serviceType(this.UUIDGen.generate(this.id), subtype.toString());
				var props = {
					minValue : this.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS,
					maxValue : this.Characteristic.ProgrammableSwitchEvent.DOUBLE_PRESS
				};

				button.getCharacteristic(this.Characteristic.ProgrammableSwitchEvent).setProps(props);
				button.getCharacteristic(this.Characteristic.ServiceLabelIndex).setValue(subtype + 1);

				service = this.homebridgeAccessory.addService(button);
			}
			else
			{
				service = this.homebridgeAccessory.addService(serviceType, this.name, subtype);
			}
		}

		return service;
	}

	hasState(key)
	{
		if(this.homebridgeAccessory != null
		&& this.homebridgeAccessory.context != null
		&& this.homebridgeAccessory.context.data != null
		&& this.homebridgeAccessory.context.data[this.letters] != null
		&& this.homebridgeAccessory.context.data[this.letters][key] != null)
		{
			return true;
		}

		return false;
	}

	getValue(key, verbose)
	{
		var state = {}, characteristic = this.TypeManager.getCharacteristic(key, { letters : this.letters });

		if(characteristic != null)
		{
			state[key] = characteristic.default;
		}

		if(this.homebridgeAccessory != null
		&& this.homebridgeAccessory.context != null
		&& this.homebridgeAccessory.context.data != null
		&& this.homebridgeAccessory.context.data[this.letters] != null
		&& this.homebridgeAccessory.context.data[this.letters][key] != null)
		{
			state[key] = this.homebridgeAccessory.context.data[this.letters][key];

			if(verbose)
			{
				var stateText = JSON.stringify(state[key]), characteristics = Object.keys(this.homebridgeAccessory.context.data[this.letters]);

				if(characteristics.length > 1)
				{
					stateText = 'value: ' + stateText;
				}

				if(characteristics.hue != null)
				{
					stateText += ', hue: ' + characteristics.hue;
				}

				if(characteristics.saturation != null)
				{
					stateText += ', saturation: ' + characteristics.saturation;
				}

				if(characteristics.brightness != null)
				{
					stateText += ', brightness: ' + characteristics.brightness;
				}

				if(characteristics.position != null)
				{
					stateText += ', position: ' + characteristics.position;
				}

				this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + stateText + '] ( ' + this.id + ' )');
			}
		}
		else
		{
			this.logger.log('info', this.id, this.letters, '[' + key + '] %of% [' + this.name + '] %cache_read_error%! ( ' + this.id + ' )');
		}

		this.ContextManager.updateContext(this.id, this.letters, state, true);

		return state[key];
	}

	setValue(key, value, verbose)
	{
		if(key != null && value != null && !isNaN(value))
		{
			if(this.homebridgeAccessory && this.homebridgeAccessory.context)
			{
				if(!this.homebridgeAccessory.context.data)
				{
					this.homebridgeAccessory.context.data = {};
				}

				if(!this.homebridgeAccessory.context.data[this.letters])
				{
					this.homebridgeAccessory.context.data[this.letters] = {};
				}

				this.homebridgeAccessory.context.data[this.letters][key] = value;

				if(verbose)
				{
					var stateText = JSON.stringify(value), characteristics = Object.keys(this.homebridgeAccessory.context.data[this.letters]);

					if(characteristics.length > 1)
					{
						stateText = 'value: ' + stateText;
					}

					if(characteristics.hue != null)
					{
						stateText += ', hue: ' + characteristics.hue;
					}

					if(characteristics.saturation != null)
					{
						stateText += ', saturation: ' + characteristics.saturation;
					}

					if(characteristics.brightness != null)
					{
						stateText += ', brightness: ' + characteristics.brightness;
					}

					if(characteristics.position != null)
					{
						stateText += ', position: ' + characteristics.position;
					}

					this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + stateText + '] ( ' + this.id + ' )');
				}

				this.ContextManager.updateContext(this.id, this.letters, this.homebridgeAccessory.context.data[this.letters]);

				return true;
			}
			else
			{
				this.logger.log('error', this.id, this.letters, '[' + key + '] %of% [' + this.name + '] %cache_update_error%! ( ' + this.id + ' )');

				return false;
			}
		}
	}

	getValues(verbose)
	{
		var state = {};

		if(this.homebridgeAccessory != null
		&& this.homebridgeAccessory.context != null
		&& this.homebridgeAccessory.context.data != null
		&& this.homebridgeAccessory.context.data[this.letters] != null)
		{
			for(const key in this.homebridgeAccessory.context.data[this.letters])
			{
				var characteristic = this.TypeManager.getCharacteristic(key, { letters : this.letters });

				if(characteristic != null)
				{
					state[key] = characteristic.default;
				}

				if(this.homebridgeAccessory.context.data[this.letters][key] != null)
				{
					state[key] = this.homebridgeAccessory.context.data[this.letters][key];
				}
			}

			if(verbose)
			{
				var stateText = JSON.stringify(state.value), characteristics = Object.keys(state);

				if(characteristics.length > 1)
				{
					stateText = 'value: ' + stateText;
				}

				if(characteristics.hue != null)
				{
					stateText += ', hue: ' + characteristics.hue;
				}

				if(characteristics.saturation != null)
				{
					stateText += ', saturation: ' + characteristics.saturation;
				}

				if(characteristics.brightness != null)
				{
					stateText += ', brightness: ' + characteristics.brightness;
				}

				if(characteristics.position != null)
				{
					stateText += ', position: ' + characteristics.position;
				}

				this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + stateText + '] ( ' + this.id + ' )');
			}
		}
		else
		{
			this.logger.log('info', this.id, this.letters, '[' + this.name + '] %cache_read_error%! ( ' + this.id + ' )');
		}

		return state;
	}

	getState(callback, verbose)
	{
		callback(this.getValue('value', verbose));
	}

	setState(level, callback, verbose)
	{
		this.setValue('value', level, verbose);		

		callback();
	}

	getConnectionState(callback)
	{
		var connection = true;

		if(this.homebridgeAccessory != null
		&& this.homebridgeAccessory.context != null
		&& this.homebridgeAccessory.context.connection != null
		&& this.homebridgeAccessory.context.connection[this.letters] != null)
		{
			connection = this.homebridgeAccessory.context.connection[this.letters];
		}

		if(callback != null)
		{
			callback(null, connection);
		}

		return connection;
	}

	setConnectionState(level, callback, verbose)
	{
		var changed = false;

		if(level != null && !isNaN(level))
		{
			if(this.homebridgeAccessory != null && this.homebridgeAccessory.context != null)
			{
				if(this.homebridgeAccessory.context.connection == null)
				{
					this.homebridgeAccessory.context.connection = {};
				}

				if(this.homebridgeAccessory.context.connection[this.letters] != level)
				{
					changed = true;
				}

				this.homebridgeAccessory.context.connection[this.letters] = level;
			}
			else
			{
				this.logger.log('error', this.id, this.letters, '[connection] %of% [' + this.name + '] %cache_update_error%! ( ' + this.id + ' )');
			}
		}

		this.connection.updateValue(level);

		if(verbose && changed)
		{
			this.logger.log(level ? 'success' : 'warn', this.id, this.letters, '[' + this.name + '] ' + (level ? '%accessory_connected%' : '%accessory_disconnected%') + '! ( ' + this.id + ' )');
		}

		if(callback != null)
		{
			callback(null);
		}

		return changed;
	}
}