const BaseService = require('./base');

let Service, Characteristic;

module.exports = class ContactService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		Service = manager.platform.api.hap.Service;
        
		super(homebridgeAccessory, deviceConfig, serviceConfig, Service.ContactSensor, manager);
		
		homebridgeAccessory.getServiceById(Service.ContactSensor, serviceConfig.subtype).getCharacteristic(Characteristic.ContactSensorState).on('get', this.getState.bind(this));
    
        this.changeHandler = (state) =>
        {
            homebridgeAccessory.getServiceById(Service.ContactSensor, serviceConfig.subtype).getCharacteristic(Characteristic.ContactSensorState).updateValue(state);

            super.setValue('state', state);
        };
    }

	getState(callback, verbose)
	{
        callback(super.getValue('state', verbose));
	}
}