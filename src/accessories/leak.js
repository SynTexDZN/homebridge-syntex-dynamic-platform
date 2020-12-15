let Service, Characteristic;

const BaseService = require('../base');

module.exports = class LeakService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		Service = manager.platform.api.hap.Service;
		
		super(homebridgeAccessory, deviceConfig, serviceConfig, Service.LeakSensor, manager);
		
		homebridgeAccessory.getServiceById(Service.LeakSensor, serviceConfig.subtype).getCharacteristic(Characteristic.LeakDetected).on('get', this.getState.bind(this));
	
		this.changeHandler = (state) =>
		{
			homebridgeAccessory.getServiceById(Service.LeakSensor, serviceConfig.subtype).getCharacteristic(Characteristic.LeakDetected).updateValue(state);

			super.setValue('state', state);
		};
	}

	getState(callback, verbose)
	{
		callback(super.getValue('state', verbose));
	}
}