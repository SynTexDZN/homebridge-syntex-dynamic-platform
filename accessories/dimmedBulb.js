const LightBulbService = require('./lightBulb');
const LightBulbService = require('./lightBulb');

let Service, Characteristic;

module.exports = class ColoredBulbService extends LightBulbService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		Service = manager.platform.api.hap.Service;
        
        super(homebridgeAccessory, deviceConfig, serviceConfig, Service.Lightbulb, manager);

		homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.Brightness).on('get', this.getBrightness.bind(this)).on('set', this.setBrightness.bind(this));
	}

	getBrightness(callback)
	{
		callback(null, super.getState('brightness') || 100);
	}

	setBrightness(level, callback)
	{
        super.setState('brightness', level);		

		callback();
	}
}