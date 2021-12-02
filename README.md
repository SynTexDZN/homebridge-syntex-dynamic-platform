# Homebridge SynTex Dynamic Platform
A plugin framefork for dynamic platform accessory.

[![NPM Recommended Version](https://img.shields.io/npm/v/homebridge-syntex-dynamic-platform?label=release&color=brightgree&style=for-the-badge)](https://www.npmjs.com/package/homebridge-syntex-dynamic-platform)
[![NPM Beta Version](https://img.shields.io/npm/v/homebridge-syntex-dynamic-platform/beta?color=orange&label=beta&style=for-the-badge)](https://www.npmjs.com/package/homebridge-syntex-dynamic-platform)
[![NPM Downloads](https://img.shields.io/npm/dt/homebridge-syntex-dynamic-platform?color=9944ee&&style=for-the-badge)](https://www.npmjs.com/package/homebridge-syntex-dynamic-platform)
[![GitHub Commits](https://img.shields.io/github/commits-since/SynTexDZN/homebridge-syntex-dynamic-platform/0.0.0?color=yellow&label=commits&style=for-the-badge)](https://github.com/SynTexDZN/homebridge-syntex-dynamic-platform/commits)
[![GitHub Code Size](https://img.shields.io/github/languages/code-size/SynTexDZN/homebridge-syntex-dynamic-platform?color=0af&style=for-the-badge)](https://github.com/SynTexDZN/homebridge-syntex-dynamic-platform)

<br>

## Installation
1. Install homebridge using: `sudo npm install -g homebridge`
2. Install this plugin using: `sudo npm install -g homebridge-syntex-dynamic-platform`


## Example Config
**Info:** If the `baseDirectory` for the storage can't be created you have to do it by yourself and give it full write permissions!
- `sudo mkdir -p /var/homebridge/SynTex/` *( create the directory )*
- `sudo chown -R homebridge /var/homebridge/SynTex/` *( permissions only for homebridge )*
- `sudo chmod 777 -R homebridge /var/homebridge/SynTex/` *( permissions for many processes )*

```
"platforms": [
    {
        "platform": "SynTexDynamicPlatform",
        "baseDirectory": "/var/homebridge/SynTex"
    }
]
```
## Troubleshooting
#### [![GitHub Issues](https://img.shields.io/github/issues-raw/SynTexDZN/homebridge-syntex-dynamic-platform?logo=github&style=for-the-badge)](https://github.com/SynTexDZN/homebridge-syntex-dynamic-platform/issues)
- `Report` us your `Issues`
- `Join` our `Discord Server`
#### [![Discord](https://img.shields.io/discord/442095224953634828?color=5865F2&logoColor=white&label=discord&logo=discord&style=for-the-badge)](https://discord.gg/XUqghtw4DE)
