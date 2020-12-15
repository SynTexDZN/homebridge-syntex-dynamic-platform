const BaseService = require('../base');

let Service, Characteristic;

module.exports = class StatelessSwitchService extends BaseService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
        Characteristic = manager.platform.api.hap.Characteristic;
        Service = manager.platform.api.hap.Service;
        
        super(homebridgeAccessory, deviceConfig, serviceConfig, Service.StatelessProgrammableSwitch, manager);

        this.options.buttons = serviceConfig.buttons;

        if(this.options.button > 1)
        {
            for(var i = 1; i < this.options.buttons; i++)
            {
                var service = this.homebridgeAccessory.getServiceById(Service.StatelessProgrammableSwitch, i);

                if(service)
                {
                    this.logger.debug('Existierenden Service gefunden! ' + serviceConfig.name + ' ' + serviceConfig.type + ' ' + i + ' ( ' +  this.id + ' )');

                    service.setCharacteristic(manager.platform.api.hap.Characteristic.Name, serviceConfig.name);
                }
                else
                {
                    this.logger.debug('Erstelle neuen Service! ' + serviceConfig.name + ' ' + serviceConfig.type + ' ' + i + ' ( ' +  this.id + ' )');

                    var button = new Service.StatelessProgrammableSwitch(manager.hap.uuid.generate(this.id), i);
                    var props = {
                        minValue : Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS,
                        maxValue : Characteristic.ProgrammableSwitchEvent.DOUBLE_PRESS
                    };

                    button.getCharacteristic(Characteristic.ProgrammableSwitchEvent).setProps(props);
                    button.getCharacteristic(Characteristic.ServiceLabelIndex).setValue(i + 1);

                    this.homebridgeAccessory.addService(button);
                }
            }
        }
        /*
        homebridgeAccessory.getServiceById(Service.Switch, serviceConfig.subtype).getCharacteristic(Characteristic.On).on('get', this.getState.bind(this)).on('set', this.setState.bind(this));
    
        this.changeHandler = (state) =>
        {
            homebridgeAccessory.getServiceById(Service.Switch, serviceConfig.subtype).getCharacteristic(Characteristic.On).updateValue(state);

            super.setValue('state', state);
        };
        */

        this.changeHandler = (state) =>
        {
            for(var i = 1; i < this.service.length - 1; i++)
            {
                if(i - 1 == state)
                {
                    logger.log('update', this.mac, this.letters, '[' + buttonName + ']: Event [' + (i + 1) + '] wurde ausgeführt! ( ' + this.mac + ' )');

                    homebridgeAccessory.getServiceById(Service.StatelessProgrammableSwitch, state).getCharacteristic(Characteristic.ProgrammableSwitchEvent).updateValue(value);
                }
            }
        };
	}
}