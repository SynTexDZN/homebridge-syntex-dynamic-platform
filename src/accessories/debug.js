const BaseService = require('../base');

module.exports = class BatteryService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.Battery, manager);
		
		this.value = super.getValue('value');
		this.state = super.getValue('state', false);
		this.low = super.getValue('low', false);

		this.service.getCharacteristic(this.Characteristic.BatteryLevel).on('get', this.getState.bind(this));
		this.service.getCharacteristic(this.Characteristic.ChargingState).on('get', this.getChargingState.bind(this));
		this.service.getCharacteristic(this.Characteristic.StatusLowBattery).on('get', this.getStatusLowBattery.bind(this));
		
		this.service.getCharacteristic(this.Characteristic.BatteryLevel).updateValue(this.value);
		this.service.getCharacteristic(this.Characteristic.ChargingState).updateValue(this.state);
		this.service.getCharacteristic(this.Characteristic.StatusLowBattery).updateValue(this.low);

		this.changeHandler = (state) => {

			if(state.value != null)
			{
				this.setState(state.value,
					() => this.service.getCharacteristic(this.Characteristic.BatteryLevel).updateValue(state.value)), false;
			}

			if(state.state != null)
			{
				this.setChargingState(state.state,
					() => this.service.getCharacteristic(this.Characteristic.ChargingState).updateValue(state.state), false);
			}

			if(state.low != null)
			{
				this.setStatusLowBattery(state.low,
					() => this.service.getCharacteristic(this.Characteristic.StatusLowBattery).updateValue(state.low), false);
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, state);
		};
	}

	getChargingState(callback, verbose = false)
	{
		this.state = this.getValue('state', verbose);
		
		if(callback != null)
		{
			callback(null, this.state);
		}
	}

	setChargingState(state, callback, verbose = false)
	{
		this.state = state;

		this.setValue('state', state, verbose);		

		if(callback != null)
		{
			callback();
		}
	}

	getStatusLowBattery(callback, verbose = false)
	{
		this.low = this.getValue('low', verbose);
		
		if(callback != null)
		{
			callback(null, this.low);
		}
	}

	setStatusLowBattery(low, callback, verbose = false)
	{
		this.low = low;

		this.setValue('low', low, verbose);		

		if(callback != null)
		{
			callback();
		}
	}
}