let Service, Characteristic;

const BaseService = require('../base');

module.exports = class HumidityService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		Service = manager.platform.api.hap.Service;
		
		super(homebridgeAccessory, deviceConfig, serviceConfig, Service.HumiditySensor, manager);
		
		homebridgeAccessory.getServiceById(Service.HumiditySensor, serviceConfig.subtype).getCharacteristic(Characteristic.CurrentRelativeHumidity).on('get', this.getState.bind(this));
	
		this.changeHandler = (state) =>
		{
			homebridgeAccessory.getServiceById(Service.HumiditySensor, serviceConfig.subtype).getCharacteristic(Characteristic.CurrentRelativeHumidity).updateValue(state);

			super.setValue('value', state);
		};
	}

	getState(callback, verbose)
	{
		callback(super.getValue('value', verbose));
	}
}