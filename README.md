# Homebridge SynTex Dynamic Platform
A plugin framefork for dynamic platform accessory.

[![NPM Recommended Version](https://img.shields.io/npm/v/homebridge-syntex-dynamic-platform?label=release&color=brightgreen)](https://www.npmjs.com/package/homebridge-syntex-dynamic-platform)
[![NPM Beta Version](https://img.shields.io/npm/v/homebridge-syntex-dynamic-platform/beta?color=orange&label=beta)](https://www.npmjs.com/package/homebridge-syntex-dynamic-platform)
[![GitHub Commits](https://badgen.net/github/commits/SynTexDZN/homebridge-syntex-dynamic-platform?color=yellow)](https://github.com/SynTexDZN/homebridge-syntex-dynamic-platform/commits)
[![NPM Downloads](https://badgen.net/npm/dt/homebridge-syntex-dynamic-platform?color=purple)](https://www.npmjs.com/package/homebridge-syntex-dynamic-platform)
[![GitHub Code Size](https://img.shields.io/github/languages/code-size/SynTexDZN/homebridge-syntex-dynamic-platform?color=0af)](https://github.com/SynTexDZN/homebridge-syntex-dynamic-platform)
[![Discord](https://img.shields.io/discord/442095224953634828?color=728ED5&label=discord)](https://discord.gg/XUqghtw4DE)

<br>

## Installation
1. Install homebridge using: `sudo npm install -g homebridge`
2. Install this plugin using: `sudo npm install -g homebridge-syntex-dynamic-platform`


## Example Config
**Info:** If the `logDirectory` for the storage can't be created you have to do it by yourself and give it full write permissions!
- `sudo chown -R homebridge ./SynTex/` ( *permissions only for homebridge* )
- `sudo chmod 777 -R homebridge ./SynTex/` ( *permissions for many processes* )

```
"platforms": [
    {
        "platform": "SynTexDynamicPlatform",
        "logDirectory": "./SynTex/log"
    }
]
```
