const LightBulbService = require('./lightBulb');

module.exports = class DimmedBulbService extends LightBulbService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		if(!serviceConfig.subtype.includes('-'))
		{
			serviceConfig.subtype = 'dimmer-' + serviceConfig.subtype;
		}
		
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.running = false;

		this.tempState = {
			value : this.value,
			brightness : this.brightness
		};

		this.service.getCharacteristic(this.Characteristic.Brightness).on('get', this.getBrightness.bind(this)).on('set', this.setBrightness.bind(this));

		this.changeHandler = (state) => {

			const setState = () => {

				if(this.changedValue)
				{
					this.setState(state.value,
						() => this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value), false);
				}

				if(this.changedBrightness)
				{
					this.setBrightness(state.brightness,
						() => this.service.getCharacteristic(this.Characteristic.Brightness).updateValue(state.brightness), false);
				}

				this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + this.getStateText() + '] ( ' + this.id + ' )');
			};

			this.setToCurrentBrightness(state, (resolve) => {

				setState();

				resolve();
	
			}, (resolve) => {
	
				setState();

				resolve();
	
			}, (resolve) => {
	
				resolve();
			});

			this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, brightness : this.brightness });
		};
	}

	setState(value, callback, verbose)
	{
		this.tempState.value = value;

		super.setState(value, callback, verbose);
	}

	getBrightness(callback, verbose = false)
	{
		this.brightness = this.getValue('brightness', verbose);
		
		if(callback != null)
		{
			callback(null, this.brightness);
		}
	}

	setBrightness(brightness, callback, verbose = false)
	{
		this.brightness = this.tempState.brightness = brightness;

		this.setValue('brightness', brightness, verbose);		

		if(callback != null)
		{
			callback();
		}
	}

	setToCurrentBrightness(state, powerCallback, brightnessCallback, unchangedCallback)
	{
		if(state.value != null && (!super.hasState('value') || this.tempState.value != state.value))
		{
			this.tempState.value = state.value;

			this.changedValue = true;
		}

		if(state.brightness != null && (!super.hasState('brightness') || this.tempState.brightness != state.brightness))
		{
			this.tempState.brightness = state.brightness;

			this.changedBrightness = true;
		}

		if(!this.running)
		{
			this.running = true;

			setTimeout(() => {

				if(this.changedValue)
				{
					powerCallback(() => {

						this.changedValue = false;

						this.running = false;
					});
				}
				else if(this.changedBrightness)
				{
					brightnessCallback(() => {

						this.changedBrightness = false;

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