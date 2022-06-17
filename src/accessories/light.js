const BaseService = require('../base');

module.exports = class LightService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.LightSensor, manager);
		
		this.value = super.getValue('value', true);

		homebridgeAccessory.getServiceById(this.Service.LightSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentAmbientLightLevel).on('get', this.getState.bind(this));
	
		homebridgeAccessory.getServiceById(this.Service.LightSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentAmbientLightLevel).updateValue(this.value);

		this.changeHandler = (state) => {

			homebridgeAccessory.getServiceById(this.Service.LightSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentAmbientLightLevel).updateValue(state);

			super.setValue('value', state);
		};
	}
}