"use strict";

const Utils = require('./utils');
const colors = require('colors');
const config = Utils.getConfig();
const fs = require('fs-extra');

module.exports = {

    /**
     * Gets project status
     */
    status: function(){
        let spinner = Utils.createSpinner("Loading status for " + this.getProjectName().green);

        Utils.get('/stats.json')
        .then( (result) => {
            let locales = Object.keys(result);
            
            spinner.text = `Status for ${this.getProjectName().green}:`
            spinner.succeed();
            locales.forEach( (l) => {
                let percTranslated = ((result[l].count_strings - result[l].count_strings_to_translate ) * 100 / result[l].count_strings).toFixed(2);
                
                console.log(`${l}\t Translated: ` + `${percTranslated}%`.green);
            });
        })
        .catch( (err) => {
            spinner.fail();
        });
    },

    /**
     * Gets project name from config
     * @return {String}         Project name
     */
    getProjectName: function(){
        return config.projects[Utils.currentProject].name || Utils.currentProject;
    },

    /**
     * Get project info from server
     * @return {Promise}
     */
    getProject: function(){
        return new Promise((resolve, reject) => {
            Utils.get('.json')
            .then(resolve)
            .catch(reject);
        });
    },

    /**
     * Add a project to the config
     * @param {String}  key     API key of the new project to add
     */
    add: function(key = ''){
        if(!key){
            Utils.handleError({error: 'You need to specify an API key in order to add a project'});
        }

        Utils.get('.json', key)
        .then((result) => {
            //Check if the key is already there
            for(var proj in config.projects){
                if(config.projects[proj].api_key == key){
                    Utils.handleError({error: 'It seems this project is already in your config file'});
                    process.exit(1);
                    break;
                }
            }

            //Add project to config
            config.projects['project_' + result.project.name.replace(/[\s-_]/g, '').toLowerCase()] = {
                name: result.project.name,
                api_key: key
            };

            //Write the config file
            fs.outputFile(process.cwd() + `/wti_config.json`, JSON.stringify(config, null, 4), (err) => {
                if(err){
                    Utils.handleError({
                        "error": `There was a problem writing the config file`
                    });
                } else {
                    console.log(`Project "${result.project.name}" added to config`.green);
                }
            });

        });
    }
};