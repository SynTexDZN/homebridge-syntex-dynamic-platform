const BaseService = require('../base');

module.exports = class SmokeService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.SmokeSensor, manager);
		
		this.value = super.getValue('value', true);

		homebridgeAccessory.getServiceById(this.Service.SmokeSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.SmokeDetected).on('get', this.getState.bind(this));
	
		homebridgeAccessory.getServiceById(this.Service.SmokeSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.SmokeDetected).updateValue(this.value);

		this.changeHandler = (state) => {

			homebridgeAccessory.getServiceById(this.Service.SmokeSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.SmokeDetected).updateValue(state);

			super.setValue('value', state);
		};
	}
}