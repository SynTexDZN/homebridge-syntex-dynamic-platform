const DimmedBulbService = require('./dimmedBulb');

let Service, Characteristic;

module.exports = class ColoredBulbService extends DimmedBulbService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		Service = manager.platform.api.hap.Service;

		if(!serviceConfig.subtype.includes('-'))
		{
			serviceConfig.subtype = 'rgb-' + serviceConfig.subtype;
		}
        
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);
		
		homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.Hue).on('get', this.getHue.bind(this)).on('set', this.setHue.bind(this));
		homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.Saturation).on('get', this.getSaturation.bind(this)).on('set', this.setSaturation.bind(this));
	
		this.changeHandler = (state) =>
        {
			if(state instanceof Object)
			{
				var v = [
					{ type : 'power', Characteristic : Characteristic.On },
					{ type : 'hue', Characteristic : Characteristic.Hue },
					{ type : 'saturation', Characteristic : Characteristic.Saturation },
					{ type : 'brightness', Characteristic : Characteristic.Brightness }
				];

				for(const i in v)
				{
					if(state[v[i].type] != null)
					{
						homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(v[i].Characteristic).updateValue(state[v[i].type]);
						
						super.setValue('state', state[v[i].type]);
					}
				}
			}
			else
			{
				homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.On).updateValue(state);
					
				super.setValue('state', state);
			}
        };
	}

	getHue(callback, verbose)
	{
		callback(super.getValue('hue', verbose));
	}

	setHue(level, callback, verbose)
	{
        super.setValue('hue', level, verbose);		

		callback();
	}

	getSaturation(callback, verbose)
	{
		callback(super.getValue('saturation', verbose));
	}

	setSaturation(level, callback, verbose)
	{
        super.setValue('saturation', level, verbose);		

		callback();
	}
}