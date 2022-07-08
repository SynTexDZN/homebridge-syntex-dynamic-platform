const BaseService = require('../base');

module.exports = class StatelessSwitchService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.StatelessProgrammableSwitch, manager);

		this.service = [ this.service ];

		this.options.buttons = serviceConfig.buttons || 1;

		if(this.options.buttons > 1)
		{
			for(var i = 1; i < this.options.buttons; i++)
			{
				this.service.push(this.createService(this.Service.StatelessProgrammableSwitch, serviceConfig.type, i));
			}
		}

		this.changeHandler = (state) => {
			
			if(state.event != null)
			{
				var service = homebridgeAccessory.getServiceById(this.Service.StatelessProgrammableSwitch, state.event.toString());

				if(service != null)
				{
					var value = 0
					
					if(state.value != null)
					{
						value = state.value;
					}
					
					service.getCharacteristic(this.Characteristic.ProgrammableSwitchEvent).updateValue(value);
			
					this.logger.log('update', this.id, this.letters, '[' + this.name + ']: %event_fired[0]% [' + (state.event + 1) + '] %event_fired[1]%! ( ' + this.id + ' )');
				}
			}
		};
	}
}