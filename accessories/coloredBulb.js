const DimmedBulbService = require('./dimmedBulb');

let Service, Characteristic;

module.exports = class ColoredBulbService extends DimmedBulbService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		Service = manager.platform.api.hap.Service;
        
        super(homebridgeAccessory, deviceConfig, serviceConfig, Service.Lightbulb, manager);

		homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
		homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.Hue).on('get', this.setHue.bind(this)).on('set', this.getHue.bind(this));
		homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.Saturation).on('get', this.setSaturation.bind(this)).on('set', this.getSaturation.bind(this));
	}

	getHue(callback)
	{
		callback(null, super.getState('hue') || 0);
	}

	setHue(level, callback)
	{
        super.setState('hue', level);		

		callback();
	}

	getSaturation(callback)
	{
		callback(null, super.getState('saturation') || 100);
	}

	setSaturation(level, callback)
	{
        super.setState('saturation', level);		

		callback();
	}
}