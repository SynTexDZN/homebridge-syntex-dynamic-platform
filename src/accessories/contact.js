const BaseService = require('../base');

module.exports = class ContactService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.ContactSensor, manager);
		
		this.value = super.getValue('value');

		this.service.getCharacteristic(this.Characteristic.ContactSensorState).on('get', this.getState.bind(this));
	
		this.service.getCharacteristic(this.Characteristic.ContactSensorState).updateValue(this.value);

		this.changeHandler = (state) => {

			if(state.value != null)
			{
				this.setState(state.value,
					() => this.service.getCharacteristic(this.Characteristic.ContactSensorState).updateValue(state.value));
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, state);
		};
	}
}