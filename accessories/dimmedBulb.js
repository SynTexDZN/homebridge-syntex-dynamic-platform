const LightBulbService = require('./lightBulb');

let Service, Characteristic;

module.exports = class ColoredBulbService extends LightBulbService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		Service = manager.platform.api.hap.Service;

		if(!serviceConfig.subtype.includes('-'))
		{
			serviceConfig.subtype = 'dimmer-' + serviceConfig.subtype;
		}
        
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);
		
		homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.Brightness).on('get', this.getBrightness.bind(this)).on('set', this.setBrightness.bind(this));
	
		this.changeHandler = (state) =>
        {
			if(state instanceof Object)
			{
				var v = [
					{ type : 'power', Characteristic : Characteristic.On },
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

	getBrightness(callback)
	{
		callback(super.getValue('brightness', true));
	}

	setBrightness(level, callback)
	{
        super.setValue('brightness', level);		

		callback();
	}
}