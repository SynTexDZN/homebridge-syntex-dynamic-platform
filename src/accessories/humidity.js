const BaseService = require('../base');

module.exports = class HumidityService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.HumiditySensor, manager);
		
		this.service.getCharacteristic(this.Characteristic.CurrentRelativeHumidity).on('get', this.getState.bind(this));
	
		this.changeHandler = (state) => {

			if(state.value != null)
			{
				this.setState(state.value,
					() => this.service.getCharacteristic(this.Characteristic.CurrentRelativeHumidity).updateValue(state.value));
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, state);
		};
	}
}