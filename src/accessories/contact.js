const BaseService = require('../base');

module.exports = class ContactService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.ContactSensor, manager);
		
		this.value = super.getValue('value', true);

		homebridgeAccessory.getServiceById(this.Service.ContactSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.ContactSensorState).on('get', this.getState.bind(this));
	
		homebridgeAccessory.getServiceById(this.Service.ContactSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.ContactSensorState).updateValue(this.value);

		this.changeHandler = (state) => {

			homebridgeAccessory.getServiceById(this.Service.ContactSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.ContactSensorState).updateValue(state);

			super.setValue('value', state);
		};
	}
}