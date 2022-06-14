const BaseService = require('../base');

module.exports = class MotionService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.MotionSensor, manager);
		
		homebridgeAccessory.getServiceById(this.Service.MotionSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.MotionDetected).on('get', this.getState.bind(this));
	
		homebridgeAccessory.getServiceById(this.Service.MotionSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.MotionDetected).updateValue(super.getValue('value', true) || false);

		this.changeHandler = (state) => {

			homebridgeAccessory.getServiceById(this.Service.MotionSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.MotionDetected).updateValue(state);

			super.setValue('value', state);
		};
	}

	getState(callback, verbose)
	{
		callback(super.getValue('value', verbose) || false);
	}
}