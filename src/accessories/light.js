const BaseService = require('../base');

module.exports = class LightService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.LightSensor, manager);
		
		homebridgeAccessory.getServiceById(this.Service.LightSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentAmbientLightLevel).on('get', this.getState.bind(this));
	
		homebridgeAccessory.getServiceById(this.Service.LightSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentAmbientLightLevel).updateValue(super.getValue('value', true) || 0.0001);

		this.changeHandler = (state) => {

			homebridgeAccessory.getServiceById(this.Service.LightSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentAmbientLightLevel).updateValue(state);

			super.setValue('value', state);
		};
	}

	getState(callback, verbose)
	{
		callback(super.getValue('value', verbose) || 0.0001);
	}
}