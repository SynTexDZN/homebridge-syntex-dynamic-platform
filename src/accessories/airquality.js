const BaseService = require('../base');

module.exports = class AirQualityService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.AirQualitySensor, manager);
		
		this.value = super.getValue('value', true);

		homebridgeAccessory.getServiceById(this.Service.AirQualitySensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.AirQuality).on('get', this.getState.bind(this));
		
		homebridgeAccessory.getServiceById(this.Service.AirQualitySensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.AirQuality).updateValue(this.value);

		this.changeHandler = (state) => {

			homebridgeAccessory.getServiceById(this.Service.AirQualitySensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.AirQuality).updateValue(state);

			super.setValue('value', state);
		};
	}

	getState(callback, verbose)
	{
		callback(super.getValue('value', verbose));
	}
}