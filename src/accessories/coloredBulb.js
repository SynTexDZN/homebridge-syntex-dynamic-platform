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

		this.hue = super.getValue('hue');
		this.saturation = super.getValue('saturation');

		this.tempState = {
			value : this.value,
			hue : this.hue,
			saturation : this.saturation,
			brightness : this.brightness
		};

		this.running = false;
		
		homebridgeAccessory.getServiceById(this.Service.Lightbulb, serviceConfig.subtype).getCharacteristic(this.Characteristic.Hue).on('get', this.getHue.bind(this)).on('set', this.setHue.bind(this));
		homebridgeAccessory.getServiceById(this.Service.Lightbulb, serviceConfig.subtype).getCharacteristic(this.Characteristic.Saturation).on('get', this.getSaturation.bind(this)).on('set', this.setSaturation.bind(this));
	
		homebridgeAccessory.getServiceById(this.Service.Lightbulb, serviceConfig.subtype).getCharacteristic(this.Characteristic.Hue).updateValue(this.hue);
		homebridgeAccessory.getServiceById(this.Service.Lightbulb, serviceConfig.subtype).getCharacteristic(this.Characteristic.Saturation).updateValue(this.saturation);

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

	getHue(callback, verbose)
	{
		callback(super.getValue('hue', verbose));
	}

	setHue(level, callback, verbose)
	{
		super.setValue('hue', level, verbose);		

		callback();
	}

	getSaturation(callback, verbose)
	{
		callback(super.getValue('saturation', verbose));
	}

	setSaturation(level, callback, verbose)
	{
		super.setValue('saturation', level, verbose);		

		callback();
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