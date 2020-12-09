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
	
		this.changeHandler = (state) =>
		{
			homebridgeAccessory.getServiceById(Service.Lightbulb, serviceConfig.subtype).getCharacteristic(Characteristic.On).updateValue(state);

			super.setValue('state', state);
		};
	}

	getState(callback, verbose)
	{
		callback(super.getValue('state', verbose));
	}

	setState(level, callback, verbose)
	{
		super.setValue('state', level, verbose);		

		callback();
	}
}