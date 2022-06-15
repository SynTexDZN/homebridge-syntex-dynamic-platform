module.exports = class TypeManager
{
	constructor(logger)
	{
		this.logger = logger;

		this.data = {
			0 : {
				type : 'occupancy',
				characteristics : {
					value : { format : 'boolean', default : false }
				}
			},
			1 : {
				type : 'smoke',
				characteristics : {
					value : { format : 'boolean', default : false }
				}
			},
			2 : {
				type : 'airquality',
				characteristics : {
					value : { format : 'number', default : 0, min : 0, max : 5 }
				}
			},
			3 : {
				type : 'rgb',
				characteristics : {
					value : { format : 'boolean', default : false },
					brightness : { format : 'number', default : 100, min : 0, max : 100 },
					saturation : { format : 'number', default : 100, min : 0, max : 100 },
					hue : { format : 'number', default : 0, min : 0, max : 360 }
				}
			},
			4 : {
				type : 'switch',
				characteristics : {
					value : { format : 'boolean', default : false }
				}
			},
			5 : {
				type : 'relais',
				characteristics : {
					value : { format : 'boolean', default : false }
				}
			},
			6 : {
				type : 'statelessswitch',
				characteristics : {
					value : { format : 'number' }
				}
			},
			7 : {
				type : 'outlet',
				characteristics : {
					value : { format : 'boolean', default : false }
				}
			},
			8 : {
				type : 'led',
				characteristics : {
					value : { format : 'boolean', default : false }
				}
			},
			9 : {
				type : 'dimmer',
				characteristics : {
					value : { format : 'boolean' },
					brightness : { format : 'number', default : 0, min : 0, max : 100 }
				}
			},
			A : {
				type : 'contact',
				characteristics : {
					value : { format : 'boolean', default : false }
				}
			},
			B : {
				type : 'motion',
				characteristics : {
					value : { format : 'boolean', default : false }
				}
			},
			C : {
				type : 'temperature',
				characteristics : {
					value : { format : 'number', default : 0, min : -270, max : 100 }
				}
			},
			D : {
				type : 'humidity',
				characteristics : {
					value : { format : 'number', default : 0, min : 0, max : 100 }
				}
			},
			E : {
				type : 'rain',
				characteristics : {
					value : { format : 'boolean', default : false }
				}
			},
			F : {
				type : 'light',
				characteristics : {
					value : { format : 'number', default : 0.0001, min : 0.0001, max : 100000 }
				}
			},
			G : {
				type : 'blind',
				characteristics : {
					value : { format : 'number', default : 0, min : 0, max : 100 }
				}
			}
		};
	}

	typeToLetter(type)
	{
		for(const letter in this.data)
		{
			if(this.data[letter].type == type.toLowerCase())
			{
				return letter;
			}
		}

		return null;
	}

	letterToType(letter)
	{
		if(letter != null && this.data[letter.toUpperCase()] != null)
		{
			return this.data[letter.toUpperCase()].type;
		}

		return null;
	}

	getCharacteristic(type, options)
	{
		var letter = null;
		
		if(options.letters != null)
		{
			letter = options.letters[0].toUpperCase();
		}

		if(options.type != null)
		{
			letter = this.typeToLetter(options.type);
		}

		if(letter != null && type != null && this.data[letter] != null && this.data[letter].characteristics[type] != null)
		{
			return this.data[letter].characteristics[type];
		}

		return null;
	}
	
	validateUpdate(id, letters, state)
	{
		if(id != null && letters != null && state != null && state instanceof Object)
		{
			for(const c in state)
			{
				var characteristic = this.getCharacteristic(c, { letters });

				if(characteristic != null)
				{
					try
					{
						state[c] = JSON.parse(state[c]);
					}
					catch(e)
					{
						this.logger.log('warn', id, letters, '%conversion_error_parse[0]%: [' + state[c] + '] %conversion_error_parse[1]%! ( ' + id + ' )');

						return null;
					}
					
					if(typeof state[c] != characteristic.format)
					{
						this.logger.log('warn', id, letters, '%conversion_error_format[0]%: [' + state[c] + '] %conversion_error_format[1]% ' + (characteristic.format == 'boolean' ? '%conversion_error_format[2]%' : characteristic.format == 'number' ? '%conversion_error_format[3]%' : '%conversion_error_format[4]%') + ' %conversion_error_format[5]%! ( ' + id + ' )');

						return null;
					}
					
					if(characteristic.format == 'number')
					{
						var min = characteristic.min, max = characteristic.max;

						if(min != null && state[c] < min)
						{
							state[c] = min;
						}

						if(max != null && state[c] > max)
						{
							state[c] = max;
						}
					}
				}
			}
		}

		return state;
	}
};