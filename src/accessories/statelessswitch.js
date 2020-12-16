let Service, Characteristic, UUIDGen;

const BaseService = require('../base');

module.exports = class StatelessSwitchService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		Service = manager.platform.api.hap.Service;
		UUIDGen = manager.platform.api.hap.uuid;
		
		super(homebridgeAccessory, deviceConfig, serviceConfig, Service.StatelessProgrammableSwitch, manager);

		this.options.buttons = serviceConfig.buttons || 1;

		if(this.options.buttons > 1)
		{
			for(var i = 1; i < this.options.buttons; i++)
			{
				this.createService(Service.StatelessProgrammableSwitch, serviceConfig.type, i.toString());
			}
		}

		this.changeHandler = (state) =>
		{
			if(state.event != null)
			{
				var value = 0;

				if(state.value != null)
				{
					value = state.value;
				}
				
				this.logger.log('update', this.id, this.letters, '[' + this.name + ']: Event [' + (state.event + 1) + '] wurde ausgeführt! ( ' + this.id + ' )');

				homebridgeAccessory.getServiceById(Service.StatelessProgrammableSwitch, state.event.toString()).getCharacteristic(Characteristic.ProgrammableSwitchEvent).updateValue(value);
			}
		};
	}
	
	createService(serviceType, type, subtype)
	{
		var service = this.homebridgeAccessory.getServiceById(serviceType, subtype);

		if(service)
		{
			this.logger.debug('Existierenden Service gefunden! ' + this.name + ' ' + type + ' ' + subtype + ' ( ' +  this.id + ' )');

			service.setCharacteristic(Characteristic.Name, this.name);
		}
		else
		{
			this.logger.debug('Erstelle neuen Service! ' + this.name + ' ' + type + ' ' + subtype + ' ( ' +  this.id + ' )');

			var button = new serviceType(UUIDGen.generate(this.id), subtype);
			var props = {
				minValue : Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS,
				maxValue : Characteristic.ProgrammableSwitchEvent.DOUBLE_PRESS
			};

			button.getCharacteristic(Characteristic.ProgrammableSwitchEvent).setProps(props);
			button.getCharacteristic(Characteristic.ServiceLabelIndex).setValue(subtype + 1);

			this.homebridgeAccessory.addService(button);
		}
	}
}