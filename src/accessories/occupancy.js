const BaseService = require('../base');

module.exports = class OccupancyService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.OccupancySensor, manager);
		
		this.service.getCharacteristic(this.Characteristic.OccupancyDetected).on('get', this.getState.bind(this));
	
		this.changeHandler = (state) => {

			if(state.value != null)
			{
				this.setState(state.value,
					() => this.service.getCharacteristic(this.Characteristic.OccupancyDetected).updateValue(state.value));
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, state);
		};
	}
}