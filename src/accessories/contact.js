const BaseService = require('../base');

module.exports = class ContactService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.ContactSensor, manager);
		
		homebridgeAccessory.getServiceById(this.Service.ContactSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.ContactSensorState).on('get', this.getState.bind(this));
	
		homebridgeAccessory.getServiceById(this.Service.ContactSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.ContactSensorState).updateValue(super.getValue('value', true) || false);

		this.changeHandler = (state) => {

			homebridgeAccessory.getServiceById(this.Service.ContactSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.ContactSensorState).updateValue(state);

			super.setValue('value', state);
		};
	}

	getState(callback, verbose)
	{
		callback(super.getValue('value', verbose) || false);
	}
}