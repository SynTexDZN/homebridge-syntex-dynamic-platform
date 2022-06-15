const BaseService = require('../base');

module.exports = class LeakService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.LeakSensor, manager);
		
		this.value = super.getValue('value', true);

		homebridgeAccessory.getServiceById(this.Service.LeakSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.LeakDetected).on('get', this.getState.bind(this));
	
		homebridgeAccessory.getServiceById(this.Service.LeakSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.LeakDetected).updateValue(this.value);

		this.changeHandler = (state) => {

			homebridgeAccessory.getServiceById(this.Service.LeakSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.LeakDetected).updateValue(state);

			super.setValue('value', state);
		};
	}

	getState(callback, verbose)
	{
		callback(super.getValue('value', verbose));
	}
}