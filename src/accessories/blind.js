const BaseService = require('../base');

module.exports = class BlindService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.WindowCovering, manager);

		this.value = super.getValue('value');
		this.target = super.getValue('target', false);
		this.state = super.getValue('state', false);

		this.service.getCharacteristic(this.Characteristic.CurrentPosition).on('get', this.getState.bind(this));
		this.service.getCharacteristic(this.Characteristic.TargetPosition).on('get', this.getTargetPosition.bind(this)).on('set', this.setTargetPosition.bind(this));
		this.service.getCharacteristic(this.Characteristic.PositionState).on('get', this.getPositionState.bind(this));
	
		this.service.getCharacteristic(this.Characteristic.CurrentPosition).updateValue(this.value);
		this.service.getCharacteristic(this.Characteristic.TargetPosition).updateValue(this.target);
		this.service.getCharacteristic(this.Characteristic.PositionState).updateValue(this.state);

		this.changeHandler = (state) => {

			var changed = false;

			if(state.value != null)
			{
				if(!super.hasState('value') || this.value != state.value)
				{
					changed = true;
				}

				this.setState(state.value, 
					() => this.service.getCharacteristic(this.Characteristic.CurrentPosition).updateValue(state.value), false);
			}

			if(state.target != null)
			{
				if(!super.hasState('target') || this.target != state.target)
				{
					changed = true;
				}

				this.setTargetPosition(state.target, 
					() => this.service.getCharacteristic(this.Characteristic.TargetPosition).updateValue(state.target), false);
			}

			if(state.state != null)
			{
				if(!super.hasState('state') || this.state != state.state)
				{
					changed = true;
				}

				this.setPositionState(state.state, 
					() => this.service.getCharacteristic(this.Characteristic.PositionState).updateValue(state.state), false);
			}

			if(changed)
			{
				this.logger.log('update', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + this.getStateText() + '] ( ' + this.id + ' )');
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, state);
		};
	}

	getTargetPosition(callback, verbose = false)
	{
		this.target = this.getValue('target', verbose);
		
		if(callback != null)
		{
			callback(null, this.target);
		}
	}

	setTargetPosition(target, callback, verbose = false)
	{
		this.target = target;

		this.setValue('target', target, verbose);		

		if(callback != null)
		{
			callback();
		}
	}

	getPositionState(callback, verbose = false)
	{
		this.state = this.getValue('state', verbose);
		
		if(callback != null)
		{
			callback(null, this.state);
		}
	}

	setPositionState(state, callback, verbose = false)
	{
		this.state = state;

		this.setValue('state', state, verbose);		

		if(callback != null)
		{
			callback();
		}
	}
}