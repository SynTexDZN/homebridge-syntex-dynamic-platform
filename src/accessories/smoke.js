const BaseService = require('../base');

module.exports = class SmokeService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.SmokeSensor, manager);
		
		homebridgeAccessory.getServiceById(this.Service.SmokeSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.SmokeDetected).on('get', this.getState.bind(this));
	
		homebridgeAccessory.getServiceById(this.Service.SmokeSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.SmokeDetected).updateValue(super.getValue('value', true) || false);

		this.changeHandler = (state) => {

			homebridgeAccessory.getServiceById(this.Service.SmokeSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.SmokeDetected).updateValue(state);

			super.setValue('value', state);
		};
	}

	getState(callback, verbose)
	{
		callback(super.getValue('value', verbose) || false);
	}
}