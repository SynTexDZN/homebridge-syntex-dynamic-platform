const BaseService = require('../base');

module.exports = class MotionService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.MotionSensor, manager);
		
		this.value = super.getValue('value');

		this.service.getCharacteristic(this.Characteristic.MotionDetected).on('get', this.getState.bind(this));
	
		this.service.getCharacteristic(this.Characteristic.MotionDetected).updateValue(this.value);

		this.changeHandler = (state) => {

			if(state.value != null)
			{
				this.setState(state.value,
					() => this.service.getCharacteristic(this.Characteristic.MotionDetected).updateValue(state.value));
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, state);
		};
	}
}