const BaseService = require('../base');

module.exports = class ThermostatService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.Thermostat, manager);
		
		this.value = super.getValue('value');
		this.target = super.getValue('target', false);
		this.state = super.getValue('state', false);
		this.mode = super.getValue('mode', false);

		this.service.getCharacteristic(this.Characteristic.CurrentTemperature).on('get', this.getState.bind(this));
		this.service.getCharacteristic(this.Characteristic.TargetTemperature).on('get', this.getTargetTemperature.bind(this)).on('set', this.setTargetTemperature.bind(this));
		this.service.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState).on('get', this.getCurrentHeatingCoolingState.bind(this));
		this.service.getCharacteristic(this.Characteristic.TargetHeatingCoolingState).on('get', this.getTargetHeatingCoolingState.bind(this)).on('set', this.setTargetHeatingCoolingState.bind(this));
		
		this.service.getCharacteristic(this.Characteristic.CurrentTemperature).setProps({ minValue : -270, maxValue : 100 });
		this.service.getCharacteristic(this.Characteristic.TargetTemperature).setProps({ minValue : 4, maxValue : 36 });
		this.service.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState).setProps({ validValues : [0, 1, 2] });
		this.service.getCharacteristic(this.Characteristic.TargetHeatingCoolingState).setProps({ validValues : [1, 2, 3] });

		this.service.getCharacteristic(this.Characteristic.CurrentTemperature).updateValue(this.value);
		this.service.getCharacteristic(this.Characteristic.TargetTemperature).updateValue(this.target);
		this.service.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState).updateValue(this.state);
		this.service.getCharacteristic(this.Characteristic.TargetHeatingCoolingState).updateValue(this.mode);

		this.changeHandler = (state) => {

			var changed = false;

			if(state.value != null)
			{
				if(!super.hasState('value') || this.value != state.value)
				{
					changed = true;
				}

				this.setState(state.value, 
					() => this.service.getCharacteristic(this.Characteristic.CurrentTemperature).updateValue(state.value), false);
			}

			if(state.target != null)
			{
				if(!super.hasState('target') || this.target != state.target)
				{
					changed = true;
				}

				this.setTargetTemperature(state.target, 
					() => this.service.getCharacteristic(this.Characteristic.TargetTemperature).updateValue(state.target), false);
			}

			if(state.state != null)
			{
				if(!super.hasState('state') || this.state != state.state)
				{
					changed = true;
				}

				this.setCurrentHeatingCoolingState(state.state, 
					() => this.service.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState).updateValue(state.state), false);
			}

			if(state.mode != null)
			{
				if(!super.hasState('mode') || this.mode != state.mode)
				{
					changed = true;
				}

				this.setTargetHeatingCoolingState(state.mode, 
					() => this.service.getCharacteristic(this.Characteristic.TargetHeatingCoolingState).updateValue(state.mode), false);
			}

			if(changed)
			{
				this.logger.log('update', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + this.getStateText() + '] ( ' + this.id + ' )');
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, target : this.target, state : this.state, mode : this.mode });
		};
	}

	getTargetTemperature(callback, verbose = false)
	{
		this.target = this.getValue('target', verbose);
		
		if(callback != null)
		{
			callback(null, this.target);
		}
	}

	setTargetTemperature(target, callback, verbose = false)
	{
		this.target = target;

		this.setValue('target', target, verbose);		

		if(callback != null)
		{
			callback();
		}
	}

	getCurrentHeatingCoolingState(callback, verbose = false)
	{
		this.state = this.getValue('state', verbose);
		
		if(callback != null)
		{
			callback(null, this.state);
		}
	}

	setCurrentHeatingCoolingState(state, callback, verbose = false)
	{
		this.state = state;

		this.setValue('state', state, verbose);		

		if(callback != null)
		{
			callback();
		}
	}

	getTargetHeatingCoolingState(callback, verbose = false)
	{
		this.mode = this.getValue('mode', verbose);
		
		if(callback != null)
		{
			callback(null, this.mode);
		}
	}

	setTargetHeatingCoolingState(mode, callback, verbose = false)
	{
		this.mode = mode;

		this.setValue('mode', mode, verbose);		

		if(callback != null)
		{
			callback();
		}
	}
}