let Characteristic, TypeManager = require('./type-manager');

module.exports = class BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, serviceType, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;

		this.id = deviceConfig['id'];
		this.name = serviceConfig['name'];

		var subtype = serviceConfig.subtype;

		if(subtype.includes('-'))
		{
			subtype = subtype.split('-')[1];
		}

		this.TypeManager = new TypeManager(this.logger);

		this.letters = this.TypeManager.typeToLetter(serviceConfig.type) + subtype;
		this.homebridgeAccessory = homebridgeAccessory;

		this.logger = manager.logger;
		this.ContextManager = manager.ContextManager;

		this.options = {};
		this.options.requests = serviceConfig.requests || [];

		this.service = this.createService(serviceType, serviceConfig.type, serviceConfig.subtype);

		if(manager.AutomationSystem != null && this.changeHandler != null)
		{
			manager.AutomationSystem.setInputStream('SynTexAutomation', (reciever, state) => {

				if(reciever.id == this.id && reciever.letters == this.letters)
				{
					this.changeHandler(state);
	
					this.logger.debug('<<< SynTexAutomation' + ' ' + JSON.stringify(reciever) + ' ' + JSON.stringify(state));
				}
			});
		}
	}

	createService(serviceType, type, subtype)
	{
		var service = this.homebridgeAccessory.getServiceById(serviceType, subtype);

		if(service)
		{
			service.setCharacteristic(Characteristic.Name, this.name);

			this.logger.debug('%service_found%! [name: ' + this.name + ', type: ' + type + ', letters: ' + this.letters + '] ( ' +  this.id + ' )');
		}
		else
		{
			this.logger.debug('%service_create%! [name: ' + this.name + ', type: ' + type + ', letters: ' + this.letters + '] ( ' +  this.id + ' )');
			
			service = this.homebridgeAccessory.addService(serviceType, this.name, subtype);
		}

		return service;
	}

	getValue(key, verbose)
	{
		var value = null;

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
					stateText = 'power: ' + JSON.stringify(value);
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

				this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + stateText + '] ( ' + this.id + ' )');
			}

			this.ContextManager.updateContext(this.id, this.letters, this.homebridgeAccessory.context.data[this.letters]);
		}
		else
		{
			this.logger.log('warn', this.id, this.letters, '[' + key + '] %of% [' + this.name + '] %cache_read_error%! ( ' + this.id + ' )');
		}

		if(this.homebridgeAccessory != null
		&& this.homebridgeAccessory.context != null
		&& this.homebridgeAccessory.context.data != null
		&& this.homebridgeAccessory.context.data[this.letters] != null
		&& this.homebridgeAccessory.context.data[this.letters]['state'] != null)
		{
			delete this.homebridgeAccessory.context.data[this.letters]['state'];
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
						stateText = 'power: ' + JSON.stringify(value);
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

	getValues()
	{
		var values = null;

		if(this.homebridgeAccessory != null
		&& this.homebridgeAccessory.context != null
		&& this.homebridgeAccessory.context.data != null
		&& this.homebridgeAccessory.context.data[this.letters] != null)
		{
			values = this.homebridgeAccessory.context.data[this.letters];
		}
		else
		{
			this.logger.log('warn', this.id, this.letters, '[' + this.name + '] %cache_read_error%! ( ' + this.id + ' )');
		}

		return values;
	}
}