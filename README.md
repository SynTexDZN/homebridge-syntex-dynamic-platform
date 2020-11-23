# Homebridge SynTex Dynamic Platform
A plugin framefork for dynamic platform accessory.


## Installation
1. Install homebridge using: `sudo npm install -g homebridge`
2. Install this plugin using: `sudo npm install -g homebridge-syntex-dynamic-platform`


## Example Config
**Info:** If the directory for the storage can't be created you have to do it by yourself and give it full write permissions!
- `sudo chown -R homebridge ./SynTex/` ( *permissions only for homebridge* )
- `sudo chmod 777 -R homebridge ./SynTex/` ( *permissions for many processes* )

```
{
    "platform": "SynTexDynamicPlatform",
    "log_directory": "./SynTex/log"
}
```