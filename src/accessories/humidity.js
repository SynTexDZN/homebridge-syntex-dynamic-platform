const BaseService = require('../base');

module.exports = class HumidityService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.HumiditySensor, manager);
		
		this.value = super.getValue('value');

		this.service.getCharacteristic(this.Characteristic.CurrentRelativeHumidity).on('get', this.getState.bind(this));
	
		this.service.getCharacteristic(this.Characteristic.CurrentRelativeHumidity).updateValue(this.value);

		this.changeHandler = (state) => {

			if(state.value != null)
			{
				super.setState(state.value,
					() => this.service.getCharacteristic(this.Characteristic.CurrentRelativeHumidity).updateValue(state.value));
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, state);
		};
	}
}