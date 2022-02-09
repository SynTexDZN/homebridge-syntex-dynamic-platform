const BaseService = require('../base');

module.exports = class HumidityService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.HumiditySensor, manager);
		
		homebridgeAccessory.getServiceById(this.Service.HumiditySensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentRelativeHumidity).on('get', this.getState.bind(this));
	
		this.changeHandler = (state) =>
		{
			homebridgeAccessory.getServiceById(this.Service.HumiditySensor, serviceConfig.subtype).getCharacteristic(this.Characteristic.CurrentRelativeHumidity).updateValue(state);

			super.setValue('value', state);
		};
	}

	getState(callback, verbose)
	{
		callback(super.getValue('value', verbose));
	}
}