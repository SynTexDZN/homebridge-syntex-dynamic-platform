const BaseService = require('./base');

let Service;
let Characteristic;

module.exports = class LightBulbService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Service = manager.platform.api.hap.Service;
        Characteristic = manager.platform.api.hap.Characteristic;
        
        super(homebridgeAccessory, deviceConfig, serviceConfig, Service.Lightbulb, manager);

        this.letters = '3' + serviceConfig.subtype;

		homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
	}

	getState(callback)
	{
		console.log('getState() LIGHTBULB');

		callback(false);
	}

	setState(level, callback)
	{
        console.log('setState(' + level + ') LIGHTBULB');

		callback();
	}
}