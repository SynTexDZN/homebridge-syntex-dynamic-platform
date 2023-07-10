const BaseService = require('../base');

module.exports = class FanService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.Fan, manager);

		this.running = false;

		this.tempState = {
			value : this.value,
			speed : this.speed,
			direction : this.direction
		};

		this.service.getCharacteristic(this.Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));

		if(this.options.characteristics.speed == null || this.options.characteristics.speed.disable != true)
		{
			this.service.getCharacteristic(this.Characteristic.RotationSpeed).on('get', this.getRotationSpeed.bind(this)).on('set', this.setRotationSpeed.bind(this));
		}
		else
		{
			this.service.removeCharacteristic(this.service.getCharacteristic(this.Characteristic.RotationSpeed));
		}

		if(this.options.characteristics.direction == null || this.options.characteristics.direction.disable != true)
		{
			this.service.getCharacteristic(this.Characteristic.RotationDirection).on('get', this.getRotationDirection.bind(this)).on('set', this.setRotationDirection.bind(this));
		}
		else
		{
			this.service.removeCharacteristic(this.service.getCharacteristic(this.Characteristic.RotationDirection));
		}

		this.changeHandler = (state) => {

			const setState = () => {

				if(this.changedValue)
				{
					this.setState(state.value,
						() => this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value), false);
				}

				if(this.changedSpeed)
				{
					this.setRotationSpeed(state.speed,
						() => this.service.getCharacteristic(this.Characteristic.RotationSpeed).updateValue(state.speed), false);
				}

				if(this.changedDirection)
				{
					this.setRotationDirection(state.direction,
						() => this.service.getCharacteristic(this.Characteristic.RotationDirection).updateValue(state.direction), false);
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
	
				setState();

				resolve();
	
			}, (resolve) => {
	
				resolve();
			});

			this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, speed : this.speed, direction : this.direction });
		};
	}

	setState(value, callback, verbose)
	{
		this.tempState.value = value;

		super.setState(value, callback, verbose);
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

	setToCurrentState(state, valueCallback, speedCallback, directionCallback, unchangedCallback)
	{
		if(state.value != null && (!super.hasState('value') || this.tempState.value != state.value))
		{
			this.tempState.value = state.value;

			this.changedValue = true;
		}

		if(state.speed != null && (!super.hasState('speed') || this.tempState.speed != state.speed))
		{
			this.tempState.speed = state.speed;

			this.changedSpeed = true;
		}

		if(state.direction != null && (!super.hasState('direction') || this.tempState.direction != state.direction))
		{
			this.tempState.direction = state.direction;

			this.changedDirection = true;
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
				else if(this.changedSpeed)
				{
					speedCallback(() => {

						this.changedSpeed = false;

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