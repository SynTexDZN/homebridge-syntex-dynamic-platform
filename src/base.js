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

		this.homebridgeAccessory = homebridgeAccessory;

		this.logger = manager.platform.logger;
		this.ContextManager = manager.ContextManager;
		this.EventManager = manager.platform.EventManager;
		this.TypeManager = manager.platform.TypeManager;
		this.AutomationSystem = manager.platform.AutomationSystem;

		this.id = deviceConfig['id'];
		this.name = serviceConfig['name'];
		
		this.letters = this.TypeManager.typeToLetter(serviceConfig.type) + subtype;

		this.options = {};

		this.options.virtual = serviceConfig.virtual || false;
		this.options.requests = serviceConfig.requests || [];

		this.service = this.createService(serviceType, serviceConfig.type, serviceConfig.subtype);

		if(this.EventManager != null)
		{
			this.EventManager.setInputStream(manager.platform.pluginName, this, this.id, (state) => {

				if((state = this.TypeManager.validateUpdate(this.id, this.letters, state)) != null && this.updateState != null)
				{
					this.updateState(state);
				}
				else
				{
					this.logger.log('error', this.id, this.letters, '[' + this.name + '] %update_error%! ( ' + this.id + ' )');
				}
			});
		}

		if(this.AutomationSystem != null)
		{
			this.AutomationSystem.setInputStream('SynTexAutomation', this, (state) => {

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
		var service = this.homebridgeAccessory.getServiceById(serviceType, subtype);

		if(service)
		{
			service.setCharacteristic(this.Characteristic.Name, this.name);

			this.logger.debug('%service_found%! [name: ' + this.name + ', type: ' + type + ', letters: ' + this.letters + '] ( ' +  this.id + ' )');
		}
		else
		{
			this.logger.debug('%service_create%! [name: ' + this.name + ', type: ' + type + ', letters: ' + this.letters + '] ( ' +  this.id + ' )');
			
			service = this.homebridgeAccessory.addService(serviceType, this.name, subtype);
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
		var value = null, characteristic = this.TypeManager.getCharacteristic(key, { letters : this.letters });

		if(characteristic != null)
		{
			value = characteristic.default;
		}

		if(this.homebridgeAccessory != null
		&& this.homebridgeAccessory.context != null
		&& this.homebridgeAccessory.context.data != null
		&& this.homebridgeAccessory.context.data[this.letters] != null
		&& this.homebridgeAccessory.context.data[this.letters][key] != null)
		{
			value = this.homebridgeAccessory.context.data[this.letters][key];

			if(verbose)
			{
				var stateText = JSON.stringify(value);

				if(Object.keys(this.homebridgeAccessory.context.data[this.letters]).length > 1)
				{
					stateText = 'value: ' + JSON.stringify(value);
				}

				if(this.homebridgeAccessory.context.data[this.letters]['hue'] != null)
				{
					stateText += ', hue: ' + this.homebridgeAccessory.context.data[this.letters]['hue'];
				}

				if(this.homebridgeAccessory.context.data[this.letters]['saturation'] != null)
				{
					stateText += ', saturation: ' + this.homebridgeAccessory.context.data[this.letters]['saturation'];
				}

				if(this.homebridgeAccessory.context.data[this.letters]['brightness'] != null)
				{
					stateText += ', brightness: ' + this.homebridgeAccessory.context.data[this.letters]['brightness'];
				}

				if(this.homebridgeAccessory.context.data[this.letters]['position'] != null)
				{
					stateText += ', position: ' + this.homebridgeAccessory.context.data[this.letters]['position'];
				}

				this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + stateText + '] ( ' + this.id + ' )');
			}

			this.ContextManager.updateContext(this.id, this.letters, this.homebridgeAccessory.context.data[this.letters]);
		}
		else
		{
			this.logger.log('warn', this.id, this.letters, '[' + key + '] %of% [' + this.name + '] %cache_read_error%! ( ' + this.id + ' )');
		}

		return value;
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
					var stateText = JSON.stringify(value);

					if(Object.keys(this.homebridgeAccessory.context.data[this.letters]) > 1)
					{
						stateText = 'value: ' + JSON.stringify(value);
					}

					if(this.homebridgeAccessory.context.data[this.letters]['hue'] != null)
					{
						stateText += ', hue: ' + this.homebridgeAccessory.context.data[this.letters]['hue'];
					}

					if(this.homebridgeAccessory.context.data[this.letters]['saturation'] != null)
					{
						stateText += ', saturation: ' + this.homebridgeAccessory.context.data[this.letters]['saturation'];
					}

					if(this.homebridgeAccessory.context.data[this.letters]['brightness'] != null)
					{
						stateText += ', brightness: ' + this.homebridgeAccessory.context.data[this.letters]['brightness'];
					}

					if(this.homebridgeAccessory.context.data[this.letters]['position'] != null)
					{
						stateText += ', position: ' + this.homebridgeAccessory.context.data[this.letters]['position'];
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
		var state = null;

		if(this.homebridgeAccessory != null
		&& this.homebridgeAccessory.context != null
		&& this.homebridgeAccessory.context.data != null
		&& this.homebridgeAccessory.context.data[this.letters] != null)
		{
			state = this.homebridgeAccessory.context.data[this.letters];

			if(verbose)
			{
				var stateText = JSON.stringify(state.value);

				if(Object.keys(this.homebridgeAccessory.context.data[this.letters]).length > 1)
				{
					stateText = 'value: ' + JSON.stringify(state.value);
				}

				if(this.homebridgeAccessory.context.data[this.letters]['hue'] != null)
				{
					stateText += ', hue: ' + this.homebridgeAccessory.context.data[this.letters]['hue'];
				}

				if(this.homebridgeAccessory.context.data[this.letters]['saturation'] != null)
				{
					stateText += ', saturation: ' + this.homebridgeAccessory.context.data[this.letters]['saturation'];
				}

				if(this.homebridgeAccessory.context.data[this.letters]['brightness'] != null)
				{
					stateText += ', brightness: ' + this.homebridgeAccessory.context.data[this.letters]['brightness'];
				}

				if(this.homebridgeAccessory.context.data[this.letters]['position'] != null)
				{
					stateText += ', position: ' + this.homebridgeAccessory.context.data[this.letters]['position'];
				}

				this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + stateText + '] ( ' + this.id + ' )');
			}
		}
		else
		{
			this.logger.log('warn', this.id, this.letters, '[' + this.name + '] %cache_read_error%! ( ' + this.id + ' )');
		}

		return state;
	}
}