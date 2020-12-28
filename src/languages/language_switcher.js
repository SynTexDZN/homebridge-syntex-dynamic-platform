const English = require('./us');
const German = require('./de');

module.exports = class LanguageSwitcher
{
    constructor(language)
    {
        if(language == 'de')
        {
            this.language = German;
        }
        else if(language == 'en' || language == 'us')
        {
            this.language = English;
        }
    }
}