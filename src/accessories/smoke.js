let Service, Characteristic;

const BaseService = require('../base');

module.exports = class SmokeService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		Service = manager.platform.api.hap.Service;
		
		super(homebridgeAccessory, deviceConfig, serviceConfig, Service.SmokeSensor, manager);
		
		homebridgeAccessory.getServiceById(Service.SmokeSensor, serviceConfig.subtype).getCharacteristic(Characteristic.SmokeDetected).on('get', this.getState.bind(this));
	
		this.changeHandler = (state) =>
		{
			homebridgeAccessory.getServiceById(Service.SmokeSensor, serviceConfig.subtype).getCharacteristic(Characteristic.SmokeDetected).updateValue(state);

			super.setValue('state', state);
		};
	}

	getState(callback, verbose)
	{
		callback(super.getValue('state', verbose));
	}
}