const BaseService = require('../base');

module.exports = class TemperatureService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.TemperatureSensor, manager);
		
		this.value = super.getValue('value', true);

		homebridgeAccessory.getServiceById(this.Service.TemperatureSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentTemperature).on('get', this.getState.bind(this));
		homebridgeAccessory.getServiceById(this.Service.TemperatureSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentTemperature).setProps({ minValue : -100, maxValue : 140 });
		
		homebridgeAccessory.getServiceById(this.Service.TemperatureSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentTemperature).updateValue(this.value);

		this.changeHandler = (state) => {

			homebridgeAccessory.getServiceById(this.Service.TemperatureSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentTemperature).updateValue(state);

			super.setValue('value', state);
		};
	}

	getState(callback, verbose)
	{
		callback(super.getValue('value', verbose));
	}
}