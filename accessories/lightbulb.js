const BaseService = require('./base');

let Service, Characteristic;

module.exports = class LightBulbService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		Service = manager.platform.api.hap.Service;
        
        super(homebridgeAccessory, deviceConfig, serviceConfig, Service.Lightbulb, manager);

		homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
	}

	getState(callback)
	{
		console.log('getState() LIGHTBULB', this.homebridgeAccessory.context);

		callback(false);
	}

	setState(level, callback)
	{
        console.log('setState(' + level + ') LIGHTBULB', this.homebridgeAccessory.context);

		callback();
	}
}