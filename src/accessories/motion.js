const BaseService = require('../base');

module.exports = class MotionService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.MotionSensor, manager);
		
		this.value = super.getValue('value', true);

		homebridgeAccessory.getServiceById(this.Service.MotionSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.MotionDetected).on('get', this.getState.bind(this));
	
		homebridgeAccessory.getServiceById(this.Service.MotionSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.MotionDetected).updateValue(this.value);

		this.changeHandler = (state) => {

			homebridgeAccessory.getServiceById(this.Service.MotionSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.MotionDetected).updateValue(state);

			super.setValue('value', state);
		};
	}
}