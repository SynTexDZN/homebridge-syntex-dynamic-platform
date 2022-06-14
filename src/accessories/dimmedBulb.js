const LightBulbService = require('./lightBulb');

module.exports = class ColoredBulbService extends LightBulbService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		if(!serviceConfig.subtype.includes('-'))
		{
			serviceConfig.subtype = 'dimmer-' + serviceConfig.subtype;
		}
		
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		homebridgeAccessory.getServiceById(this.Service.Lightbulb, serviceConfig.subtype).getCharacteristic(this.Characteristic.Brightness).on('get', this.getBrightness.bind(this)).on('set', this.setBrightness.bind(this));
	
		homebridgeAccessory.getServiceById(this.Service.Lightbulb, serviceConfig.subtype).getCharacteristic(this.Characteristic.Brightness).updateValue(super.getValue('brightness') || 100);

		this.changeHandler = (state) => {

			if(state instanceof Object)
			{
				var v = [
					{ type : 'value', Characteristic : this.Characteristic.On },
					{ type : 'brightness', Characteristic : this.Characteristic.Brightness }
				];

				for(const i in v)
				{
					if(state[v[i].type] != null)
					{
						homebridgeAccessory.getServiceById(this.Service.Lightbulb, serviceConfig.subtype).getCharacteristic(v[i].Characteristic).updateValue(state[v[i].type]);
						
						super.setValue('value', state[v[i].type]);
					}
				}
			}
			else
			{
				homebridgeAccessory.getServiceById(this.Service.Lightbulb, serviceConfig.subtype).getCharacteristic(this.Characteristic.On).updateValue(state);
					
				super.setValue('value', state);
			}
		};
	}

	getBrightness(callback, verbose)
	{
		callback(super.getValue('brightness', verbose) || 100);
	}

	setBrightness(level, callback, verbose)
	{
		super.setValue('brightness', level, verbose);		

		callback();
	}
}