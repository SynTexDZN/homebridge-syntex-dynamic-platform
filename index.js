var Service, Characteristic, Homebridge, UUIDGen, Accessory;

module.exports = function(homebridge)
{
    Homebridge = homebridge;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;
    Accessory = homebridge.platformAccessory;

    var unencrypted = [1, '1', 1.0, '1.0', 'Test', 'Test', 'Test1', 'Test2'];

    for(var i = 0; i < unencrypted.length; i++)
    {
        console.log(this.api.hap.uuid.generate(unencrypted[i]));
    }

    homebridge.registerPlatform('homebridge-syntex-dynamic-platform', 'SynTexDynamicPlatform', SynTexDynamicPlatform, true);
};