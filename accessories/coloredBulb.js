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
			homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.On).updateValue(state.power);
			homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.Hue).updateValue(state.hue);
			homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.Saturation).updateValue(state.saturation);
			homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.Brightness).updateValue(state.brightness);

			super.setValue('state', state.power);
			super.setValue('hue', state.hue);
			super.setValue('saturation', state.saturation);
			super.setValue('brightness', state.brightness);
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