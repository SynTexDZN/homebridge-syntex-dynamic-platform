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

		this.brightness = super.getValue('brightness');

		homebridgeAccessory.getServiceById(this.Service.Lightbulb, serviceConfig.subtype).getCharacteristic(this.Characteristic.Brightness).on('get', this.getBrightness.bind(this)).on('set', this.setBrightness.bind(this));
	
		homebridgeAccessory.getServiceById(this.Service.Lightbulb, serviceConfig.subtype).getCharacteristic(this.Characteristic.Brightness).updateValue(this.brightness);

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
						
						super.setValue('value', state[c.type]);
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
		callback(super.getValue('brightness', verbose));
	}

	setBrightness(level, callback, verbose)
	{
		super.setValue('brightness', level, verbose);		

		callback();
	}

	setToCurrentBrightness(state, powerCallback, brightnessCallback, unchangedCallback)
	{
		if(state.value != null && (!super.hasState('value') || this.value != state.value))
		{
			this.value = state.value;

			this.changedPower = true;
		}

		if(state.brightness != null && (!super.hasState('brightness') || this.brightness != state.brightness))
		{
			this.brightness = state.brightness;

			this.changedBrightness = true;
		}

		setTimeout(() => {

			if(!this.running)
			{
				this.running = true;

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
			}
			else
			{
				unchangedCallback(() => {});
			}

		}, 10);
	}
}