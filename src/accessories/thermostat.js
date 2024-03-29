const BaseService = require('../base');

module.exports = class ThermostatService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.Thermostat, manager);
		
		this.running = false;

		this.tempState = {
			value : this.value,
			target : this.target,
			state : this.state,
			mode : this.mode
		};

		this.service.getCharacteristic(this.Characteristic.CurrentTemperature).on('get', this.getState.bind(this));
		this.service.getCharacteristic(this.Characteristic.TargetTemperature).on('get', this.getTargetTemperature.bind(this)).on('set', this.setTargetTemperature.bind(this));
		this.service.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState).on('get', this.getCurrentHeatingCoolingState.bind(this));
		this.service.getCharacteristic(this.Characteristic.TargetHeatingCoolingState).on('get', this.getTargetHeatingCoolingState.bind(this)).on('set', this.setTargetHeatingCoolingState.bind(this));
		
		this.changeHandler = (state) => {

			const setState = () => {

				if(this.changedValue)
				{
					this.setState(state.value,
						() => this.service.getCharacteristic(this.Characteristic.CurrentTemperature).updateValue(state.value), false);
				}

				if(this.changedTarget)
				{
					this.setTargetTemperature(state.target,
						() => this.service.getCharacteristic(this.Characteristic.TargetTemperature).updateValue(state.target), false);
				}

				if(this.changedState)
				{
					this.setCurrentHeatingCoolingState(state.state,
						() => this.service.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState).updateValue(state.state), false);
				}

				if(this.changedMode)
				{
					this.setTargetHeatingCoolingState(state.mode,
						() => this.service.getCharacteristic(this.Characteristic.TargetHeatingCoolingState).updateValue(state.mode), false);
				}

				this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + this.getStateText() + '] ( ' + this.id + ' )');
			};

			this.setToCurrentState(state, (resolve) => {

				setState();

				resolve();
	
			}, (resolve) => {
	
				setState();

				resolve();
	
			}, (resolve) => {

				if(this.changedValue || this.changedState)
				{
					setState();
				}
				
				resolve();
			});

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

	setToCurrentState(state, targetCallback, modeCallback, unchangedCallback)
	{
		if(state.value != null && (!super.hasState('value') || this.value != state.value))
		{
			this.tempState.value = state.value;

			this.changedValue = true;
		}

		if(state.target != null && (!super.hasState('target') || this.target != state.target))
		{
			this.tempState.target = state.target;

			this.changedTarget = true;
		}

		if(state.state != null && (!super.hasState('state') || this.state != state.state))
		{
			this.tempState.state = state.state;

			this.changedState = true;
		}

		if(state.mode != null && (!super.hasState('mode') || this.mode != state.mode))
		{
			this.tempState.mode = state.mode;

			this.changedMode = true;
		}

		if(!this.running)
		{
			this.running = true;

			setTimeout(() => {

				if(this.changedTarget)
				{
					targetCallback(() => {

						this.changedTarget = false;

						this.changedValue = false;
						this.changedState = false;

						this.running = false;
					});
				}
				else if(this.changedMode)
				{
					modeCallback(() => {

						this.changedMode = false;

						this.changedValue = false;
						this.changedState = false;

						this.running = false;
					});
				}
				else
				{
					unchangedCallback(() => {

						this.changedValue = false;
						this.changedState = false;

						this.running = false;
					});
				}

			}, 10);
		}
		else
		{
			unchangedCallback(() => {});
		}
	}
}