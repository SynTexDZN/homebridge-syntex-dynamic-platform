const BaseService = require('./base');

let Service, Characteristic;

module.exports = class LightBulbService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		Service = manager.platform.api.hap.Service;

		if(!serviceConfig.subtype.includes('-'))
		{
			serviceConfig.subtype = 'led-' + serviceConfig.subtype;
		}

		super(homebridgeAccessory, deviceConfig, serviceConfig, Service.Lightbulb, manager);
		
		homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
	}

	getState(callback)
	{
        callback(null, super.getValue('state') || false);
	}

	setState(level, callback)
	{
		super.setValue('state', level);		

		callback();
	}
}