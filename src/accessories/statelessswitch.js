const BaseService = require('../base');

let UUIDGen;
module.exports = class StatelessSwitchService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		UUIDGen = manager.platform.api.hap.uuid;
		
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager.platform.api.hap.Service.StatelessProgrammableSwitch, manager);

		this.options.buttons = serviceConfig.buttons || 1;

		if(this.options.buttons > 1)
		{
			for(var i = 1; i < this.options.buttons; i++)
			{
				this.createService(this.Service.StatelessProgrammableSwitch, serviceConfig.type, i);
			}
		}

		this.changeHandler = (state) =>
		{
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
	
	createService(serviceType, type, subtype)
	{
		var service = this.homebridgeAccessory.getServiceById(serviceType, subtype.toString());

		if(service)
		{
			service.setCharacteristic(this.Characteristic.Name, this.name);

			this.logger.debug('%service_found%! ' + this.name + ' ' + type + ' ' + subtype + ' ( ' +  this.id + ' )');
		}
		else
		{
			this.logger.debug('%create_service%! ' + this.name + ' ' + type + ' ' + subtype + ' ( ' +  this.id + ' )');

			var button = new serviceType(UUIDGen.generate(this.id), subtype.toString());
			var props = {
				minValue : this.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS,
				maxValue : this.Characteristic.ProgrammableSwitchEvent.DOUBLE_PRESS
			};

			button.getCharacteristic(this.Characteristic.ProgrammableSwitchEvent).setProps(props);
			button.getCharacteristic(this.Characteristic.ServiceLabelIndex).setValue(subtype + 1);

			this.homebridgeAccessory.addService(button);
		}
	}
}