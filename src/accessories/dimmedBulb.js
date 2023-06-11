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

		this.brightness = super.getValue('brightness', false);

		this.tempState = {
			value : this.value,
			brightness : this.brightness
		};

		this.service.getCharacteristic(this.Characteristic.Brightness).on('get', this.getBrightness.bind(this)).on('set', this.setBrightness.bind(this));
	
		this.service.getCharacteristic(this.Characteristic.Brightness).updateValue(this.brightness);

		this.changeHandler = (state) => {

			this.setToCurrentBrightness(state, (resolve) => {

				this.setState(state.value,
					() => this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value));

				resolve();
	
			}, (resolve) => {
	
				this.setBrightness(state.brightness,
					() => this.service.getCharacteristic(this.Characteristic.Brightness).updateValue(state.brightness));

				resolve();
	
			}, (resolve) => {
	
				resolve();
			});

			this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, brightness : this.brightness });
		};
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
		this.brightness = brightness;

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