const BaseService = require('../base');

module.exports = class SmokeService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.SmokeSensor, manager);
		
		this.value = super.getValue('value');

		this.service.getCharacteristic(this.Characteristic.SmokeDetected).on('get', this.getState.bind(this));
	
		this.service.getCharacteristic(this.Characteristic.SmokeDetected).updateValue(this.value);

		this.changeHandler = (state) => {

			if(state.value != null)
			{
				this.setState(state.value,
					() => this.service.getCharacteristic(this.Characteristic.SmokeDetected).updateValue(state.value));
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, state);
		};
	}
}