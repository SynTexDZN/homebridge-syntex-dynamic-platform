const BaseService = require('../base');

module.exports = class TemperatureService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.TemperatureSensor, manager);
		
		// TODO: Offset hinzufügen mit Kalibrierungswerten ( 0 / 100 Grad )

		this.service.getCharacteristic(this.Characteristic.CurrentTemperature).on('get', this.getState.bind(this));

		this.changeHandler = (state) => {

			if(state.value != null)
			{
				this.setState(state.value,
					() => this.service.getCharacteristic(this.Characteristic.CurrentTemperature).updateValue(state.value));
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, state);
		};
	}
}