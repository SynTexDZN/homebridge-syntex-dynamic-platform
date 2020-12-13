const BaseService = require('../base');

let Service, Characteristic;

module.exports = class MotionService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		Service = manager.platform.api.hap.Service;
		
		super(homebridgeAccessory, deviceConfig, serviceConfig, Service.MotionSensor, manager);
		
		homebridgeAccessory.getServiceById(Service.MotionSensor, serviceConfig.subtype).getCharacteristic(Characteristic.MotionDetected).on('get', this.getState.bind(this));
	
		this.changeHandler = (state) =>
		{
			homebridgeAccessory.getServiceById(Service.MotionSensor, serviceConfig.subtype).getCharacteristic(Characteristic.MotionDetected).updateValue(state);

			super.setValue('state', state);
		};
	}

	getState(callback, verbose)
	{
		callback(super.getValue('state', verbose));
	}
}