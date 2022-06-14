const DimmedBulbService = require('./dimmedBulb');

module.exports = class ColoredBulbService extends DimmedBulbService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		if(!serviceConfig.subtype.includes('-'))
		{
			serviceConfig.subtype = 'rgb-' + serviceConfig.subtype;
		}
		
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);
		
		homebridgeAccessory.getServiceById(this.Service.Lightbulb, serviceConfig.subtype).getCharacteristic(this.Characteristic.Hue).on('get', this.getHue.bind(this)).on('set', this.setHue.bind(this));
		homebridgeAccessory.getServiceById(this.Service.Lightbulb, serviceConfig.subtype).getCharacteristic(this.Characteristic.Saturation).on('get', this.getSaturation.bind(this)).on('set', this.setSaturation.bind(this));
	
		homebridgeAccessory.getServiceById(this.Service.Lightbulb, serviceConfig.subtype).getCharacteristic(this.Characteristic.Hue).updateValue(super.getValue('hue') || 0);
		homebridgeAccessory.getServiceById(this.Service.Lightbulb, serviceConfig.subtype).getCharacteristic(this.Characteristic.Saturation).updateValue(super.getValue('saturation') || 100);

		this.changeHandler = (state) => {
			
			if(state instanceof Object)
			{
				var v = [
					{ type : 'value', Characteristic : this.Characteristic.On },
					{ type : 'hue', Characteristic : this.Characteristic.Hue },
					{ type : 'saturation', Characteristic : this.Characteristic.Saturation },
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

	getHue(callback, verbose)
	{
		callback(super.getValue('hue', verbose) || 0);
	}

	setHue(level, callback, verbose)
	{
		super.setValue('hue', level, verbose);		

		callback();
	}

	getSaturation(callback, verbose)
	{
		callback(super.getValue('saturation', verbose) || 100);
	}

	setSaturation(level, callback, verbose)
	{
		super.setValue('saturation', level, verbose);		

		callback();
	}
}