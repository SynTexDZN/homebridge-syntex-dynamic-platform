const BaseService = require('../base');

module.exports = class FanService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.Fan, manager);
		
		this.running = false;

		this.value = super.getValue('value');
		this.direction = super.getValue('direction', false);
		this.speed = super.getValue('speed', false);

		this.tempState = {
			value : this.value,
			direction : this.direction,
			speed : this.speed
		};

		this.service.getCharacteristic(this.Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
		this.service.getCharacteristic(this.Characteristic.RotationDirection).on('get', this.getRotationDirection.bind(this)).on('set', this.setRotationDirection.bind(this));
		this.service.getCharacteristic(this.Characteristic.RotationSpeed).on('get', this.getRotationSpeed.bind(this)).on('set', this.setRotationSpeed.bind(this));

		this.service.getCharacteristic(this.Characteristic.On).updateValue(this.value);
		this.service.getCharacteristic(this.Characteristic.RotationDirection).updateValue(this.direction);
		this.service.getCharacteristic(this.Characteristic.RotationSpeed).updateValue(this.speed);

		this.changeHandler = (state) => {

			var changed = false;

			if(state.value != null)
			{
				if(!super.hasState('value') || this.value != state.value)
				{
					changed = true;
				}

				this.setState(state.value, 
					() => this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value), false);
			}

			if(state.direction != null)
			{
				if(!super.hasState('direction') || this.direction != state.direction)
				{
					changed = true;
				}

				this.setRotationDirection(state.direction, 
					() => this.service.getCharacteristic(this.Characteristic.RotationDirection).updateValue(state.direction), false);
			}

			if(state.speed != null)
			{
				if(!super.hasState('speed') || this.speed != state.speed)
				{
					changed = true;
				}

				this.setRotationSpeed(state.speed, 
					() => this.service.getCharacteristic(this.Characteristic.RotationSpeed).updateValue(state.speed), false);
			}

			if(changed)
			{
				this.logger.log('update', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + this.getStateText() + '] ( ' + this.id + ' )');
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, direction : this.direction, speed : this.speed });
		};
	}

	setState(value, callback, verbose)
	{
		this.tempState.value = value;

		super.setState(value, callback, verbose);
	}

	getRotationDirection(callback, verbose = false)
	{
		this.direction = this.getValue('direction', verbose);
		
		if(callback != null)
		{
			callback(null, this.direction);
		}
	}

	setRotationDirection(direction, callback, verbose = false)
	{
		this.direction = this.tempState.direction = direction;

		this.setValue('direction', direction, verbose);		

		if(callback != null)
		{
			callback();
		}
	}

	getRotationSpeed(callback, verbose = false)
	{
		this.speed = this.getValue('speed', verbose);
		
		if(callback != null)
		{
			callback(null, this.speed);
		}
	}

	setRotationSpeed(speed, callback, verbose = false)
	{
		this.speed = this.tempState.speed = speed;

		this.setValue('speed', speed, verbose);		

		if(callback != null)
		{
			callback();
		}
	}

	setToCurrentState(state, valueCallback, directionCallback, speedCallback, unchangedCallback)
	{
		if(state.value != null && (!super.hasState('value') || this.tempState.value != state.value))
		{
			this.tempState.value = state.value;

			this.changedValue = true;
		}

		if(state.direction != null && (!super.hasState('direction') || this.tempState.direction != state.direction))
		{
			this.tempState.direction = state.direction;

			this.changedDirection = true;
		}

		if(state.speed != null && (!super.hasState('speed') || this.tempState.speed != state.speed))
		{
			this.tempState.speed = state.speed;

			this.changedSpeed = true;
		}

		if(!this.running)
		{
			this.running = true;

			setTimeout(() => {

				if(this.changedValue)
				{
					valueCallback(() => {

						this.changedValue = false;

						this.running = false;
					});
				}
				else if(this.changedDirection)
				{
					directionCallback(() => {

						this.changedDirection = false;

						this.running = false;
					});
				}
				else if(this.changedSpeed)
				{
					speedCallback(() => {

						this.changedSpeed = false;

						this.running = false;
					});
				}
				else
				{
					unchangedCallback(() => {

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