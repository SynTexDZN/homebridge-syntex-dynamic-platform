const BaseService = require('../base');

module.exports = class AirQualityService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.AirQualitySensor, manager);
		
		this.value = super.getValue('value');

		this.service.getCharacteristic(this.Characteristic.AirQuality).on('get', this.getState.bind(this));
		
		this.service.getCharacteristic(this.Characteristic.AirQuality).updateValue(this.value);

		this.changeHandler = (state) => {

			if(state.value != null)
			{
				this.setState(state.value,
					() => this.service.getCharacteristic(this.Characteristic.AirQuality).updateValue(state.value));
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, state);
		};
	}
}