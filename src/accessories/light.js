const BaseService = require('../base');

let Service, Characteristic;

module.exports = class LightService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		Service = manager.platform.api.hap.Service;
		
		super(homebridgeAccessory, deviceConfig, serviceConfig, Service.LightSensor, manager);
		
		homebridgeAccessory.getServiceById(Service.LightSensor, serviceConfig.subtype).getCharacteristic(Characteristic.CurrentAmbientLightLevel).on('get', this.getState.bind(this));
	
		this.changeHandler = (state) =>
		{
			homebridgeAccessory.getServiceById(Service.LightSensor, serviceConfig.subtype).getCharacteristic(Characteristic.CurrentAmbientLightLevel).updateValue(state);

			super.setValue('state', state);
		};
	}

	getState(callback, verbose)
	{
		callback(super.getValue('state', verbose));
	}
}