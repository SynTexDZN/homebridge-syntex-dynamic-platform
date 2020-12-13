const BaseService = require('../base');

let Service, Characteristic;

module.exports = class TemperatureService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		Service = manager.platform.api.hap.Service;
		
		super(homebridgeAccessory, deviceConfig, serviceConfig, Service.TemperatureSensor, manager);
		
		homebridgeAccessory.getServiceById(Service.TemperatureSensor, serviceConfig.subtype).getCharacteristic(Characteristic.CurrentTemperature).on('get', this.getState.bind(this));
		homebridgeAccessory.getServiceById(Service.TemperatureSensor, serviceConfig.subtype).getCharacteristic(Characteristic.CurrentTemperature).setProps({ minValue : -100, maxValue : 140 });
		
		this.changeHandler = (state) =>
		{
			homebridgeAccessory.getServiceById(Service.TemperatureSensor, serviceConfig.subtype).getCharacteristic(Characteristic.CurrentTemperature).updateValue(state);

			super.setValue('state', state);
		};
	}

	getState(callback, verbose)
	{
		callback(super.getValue('state', verbose));
	}
}