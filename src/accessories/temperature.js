const BaseService = require('../base');

module.exports = class TemperatureService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.TemperatureSensor, manager);
		
		this.value = super.getValue('value');

		this.service.getCharacteristic(this.Characteristic.CurrentTemperature).on('get', this.getState.bind(this));
		this.service.getCharacteristic(this.Characteristic.CurrentTemperature).setProps({ minValue : -100, maxValue : 140 });
		
		this.service.getCharacteristic(this.Characteristic.CurrentTemperature).updateValue(this.value);

		this.changeHandler = (state) => {

			if(state.value != null)
			{
				super.setState(state.value,
					() => this.service.getCharacteristic(this.Characteristic.CurrentTemperature).updateValue(state.value));
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, state);
		};
	}
}