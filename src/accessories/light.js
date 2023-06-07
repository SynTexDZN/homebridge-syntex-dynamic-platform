const BaseService = require('../base');

module.exports = class LightService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.LightSensor, manager);
		
		this.value = super.getValue('value');

		this.service.getCharacteristic(this.Characteristic.CurrentAmbientLightLevel).on('get', this.getState.bind(this));
	
		this.service.getCharacteristic(this.Characteristic.CurrentAmbientLightLevel).updateValue(this.value);

		this.changeHandler = (state) => {

			if(state.value != null)
			{
				super.setState(state.value,
					() => this.service.getCharacteristic(this.Characteristic.CurrentAmbientLightLevel).updateValue(state.value));
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, state);
		};
	}
}