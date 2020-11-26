const DimmedBulbService = require('./dimmedBulb');

let Service, Characteristic;

module.exports = class ColoredBulbService extends DimmedBulbService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		Service = manager.platform.api.hap.Service;
        
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);
		
		console.log(this.letters);

		homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.Hue).on('get', this.getHue.bind(this)).on('set', this.setHue.bind(this));
		homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.Saturation).on('get', this.getSaturation.bind(this)).on('set', this.setSaturation.bind(this));
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