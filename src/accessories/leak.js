const BaseService = require('../base');

module.exports = class LeakService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.LeakSensor, manager);
		
		homebridgeAccessory.getServiceById(this.Service.LeakSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.LeakDetected).on('get', this.getState.bind(this));
	
		homebridgeAccessory.getServiceById(this.Service.LeakSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.LeakDetected).updateValue(super.getValue('value', true) || false);

		this.changeHandler = (state) => {

			homebridgeAccessory.getServiceById(this.Service.LeakSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.LeakDetected).updateValue(state);

			super.setValue('value', state);
		};
	}

	getState(callback, verbose)
	{
		callback(super.getValue('value', verbose) || false);
	}
}