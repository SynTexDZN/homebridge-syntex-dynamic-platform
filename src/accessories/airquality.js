let Service, Characteristic;

const BaseService = require('../base');

module.exports = class AirQualityService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		Service = manager.platform.api.hap.Service;
		
		super(homebridgeAccessory, deviceConfig, serviceConfig, Service.AirQualitySensor, manager);
		
		homebridgeAccessory.getServiceById(Service.AirQualitySensor, serviceConfig.subtype).getCharacteristic(Characteristic.AirQuality).on('get', this.getState.bind(this));
	
		this.changeHandler = (state) =>
		{
			homebridgeAccessory.getServiceById(Service.AirQualitySensor, serviceConfig.subtype).getCharacteristic(Characteristic.AirQuality).updateValue(state);

			super.setValue('value', state);
		};
	}

	getState(callback, verbose)
	{
		callback(super.getValue('value', verbose));
	}
}