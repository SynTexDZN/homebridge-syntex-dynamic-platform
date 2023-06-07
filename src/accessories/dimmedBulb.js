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

			if(state instanceof Object)
			{
				var v = [
					{ type : 'value', Characteristic : this.Characteristic.On },
					{ type : 'brightness', Characteristic : this.Characteristic.Brightness }
				];

				for(const c of v)
				{
					if(state[c.type] != null)
					{
						homebridgeAccessory.getServiceById(this.Service.Lightbulb, serviceConfig.subtype).getCharacteristic(c.Characteristic).updateValue(state[c.type]);
						
						super.setValue(c.type, state[c.type]);
					}
				}
			}
			else
			{
				homebridgeAccessory.getServiceById(this.Service.Lightbulb, serviceConfig.subtype).getCharacteristic(this.Characteristic.On).updateValue(state);
					
				super.setValue('value', state);
			}
		};
	}

	getBrightness(callback, verbose)
	{
		this.brightness = this.getValue('brightness', verbose);
		
		if(callback != null)
		{
			callback(null, this.brightness);
		}
	}

	setBrightness(brightness, callback, verbose)
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

			this.changedPower = true;
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

				if(this.changedPower)
				{
					powerCallback(() => {

						this.changedPower = false;

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