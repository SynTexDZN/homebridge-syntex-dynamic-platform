const DimmedBulbService = require('./dimmedBulb');

module.exports = class ColoredBulbService extends DimmedBulbService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		if(!serviceConfig.subtype.includes('-'))
		{
			serviceConfig.subtype = 'rgb-' + serviceConfig.subtype;
		}
		
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.running = false;

		this.hue = super.getValue('hue', false);
		this.saturation = super.getValue('saturation', false);

		this.tempState = {
			value : this.value,
			hue : this.hue,
			saturation : this.saturation,
			brightness : this.brightness
		};

		this.service.getCharacteristic(this.Characteristic.Hue).on('get', this.getHue.bind(this)).on('set', this.setHue.bind(this));
		this.service.getCharacteristic(this.Characteristic.Saturation).on('get', this.getSaturation.bind(this)).on('set', this.setSaturation.bind(this));
	
		this.service.getCharacteristic(this.Characteristic.Hue).updateValue(this.hue);
		this.service.getCharacteristic(this.Characteristic.Saturation).updateValue(this.saturation);

		this.changeHandler = (state) => {
			
			if(state instanceof Object)
			{
				var v = [
					{ type : 'value', Characteristic : this.Characteristic.On },
					{ type : 'hue', Characteristic : this.Characteristic.Hue },
					{ type : 'saturation', Characteristic : this.Characteristic.Saturation },
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

	getHue(callback, verbose)
	{
		this.hue = this.getValue('hue', verbose);
		
		if(callback != null)
		{
			callback(null, this.hue);
		}
	}

	setHue(hue, callback, verbose)
	{
		this.hue = hue;

		this.setValue('hue', hue, verbose);		

		if(callback != null)
		{
			callback();
		}
	}

	getSaturation(callback, verbose)
	{
		this.saturation = this.getValue('saturation', verbose);
		
		if(callback != null)
		{
			callback(null, this.saturation);
		}
	}

	setSaturation(saturation, callback, verbose)
	{
		this.saturation = saturation;

		this.setValue('saturation', saturation, verbose);		

		if(callback != null)
		{
			callback();
		}
	}

	setToCurrentColor(state, powerCallback, colorCallback, unchangedCallback)
	{
		if(state.value != null && (!super.hasState('value') || this.tempState.value != state.value))
		{
			this.tempState.value = state.value;

			this.changedPower = true;
		}

		if(state.hue != null && (!super.hasState('hue') || this.tempState.hue != state.hue))
		{
			this.tempState.hue = state.hue;

			this.changedColor = true;
		}

		if(state.saturation != null && (!super.hasState('saturation') || this.tempState.saturation != state.saturation))
		{
			this.tempState.saturation = state.saturation;

			this.changedColor = true;
		}

		if(state.brightness != null && (!super.hasState('brightness') || this.tempState.brightness != state.brightness))
		{
			this.tempState.brightness = state.brightness;

			this.changedColor = true;
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
				else if(this.changedColor)
				{
					colorCallback(() => {

						this.changedColor = false;

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