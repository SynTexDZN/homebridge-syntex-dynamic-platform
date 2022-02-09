const BaseService = require('../base');

module.exports = class TemperatureService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.TemperatureSensor, manager);
		
		homebridgeAccessory.getServiceById(this.Service.TemperatureSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentTemperature).on('get', this.getState.bind(this));
		homebridgeAccessory.getServiceById(this.Service.TemperatureSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentTemperature).setProps({ minValue : -100, maxValue : 140 });
		
		this.changeHandler = (state) =>
		{
			homebridgeAccessory.getServiceById(this.Service.TemperatureSensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentTemperature).updateValue(state);

			super.setValue('value', state);
		};
	}

	getState(callback, verbose)
	{
		callback(super.getValue('value', verbose));
	}
}