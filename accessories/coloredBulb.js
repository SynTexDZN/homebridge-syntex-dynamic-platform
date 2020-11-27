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

	getHue(callback)
	{
		callback(null, super.getValue('hue') || 0);
	}

	setHue(level, callback)
	{
        super.setValue('hue', level);		

		callback();
	}

	getSaturation(callback)
	{
		callback(null, super.getValue('saturation') || 100);
	}

	setSaturation(level, callback)
	{
        super.setValue('saturation', level);		

		callback();
	}
}