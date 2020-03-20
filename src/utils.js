"use strict";

const request = require('request');
const colors = require('colors');
const ora = require('ora');
const fs = require('fs-extra');
let config = false;

//Try to load the config
try{
    config = require(process.cwd() + '/wti_config.json');
} catch(e) {
    if(e.toString().indexOf('Unexpected end of JSON input') > -1){
        config = "Invalid JSON";
    } else if(e.toString().indexOf('Cannot find module') > -1){
        config = "No config";
    }
}


module.exports = {
    /**
     * Get config object
     * @return {Object} Config object
     */
    getConfig: function(){
        return config;
    },

    /**
     * Validates config object
     */
    validateConfig: function(){
        switch(config){
            case "No config":
                this.handleError( { error: "There is no wti_config.json configuration file in this folder." } );
                process.exit(1);
                break;
            case "Invalid JSON":
                this.handleError( { error: "The configuration is not a valid JSON" } );
                process.exit(1);
                break;
        }
    },

    /**
     * Creates the config wti_config.json
     * @param  {Object} newConfig Object with config to write
     */
    createConfig: function(newConfig){
        if(typeof config === 'object'){
            this.handleError( { error: "A configuration file is already present" } );
            process.exit(1);
        }

        if(!newConfig.projectKey){
            this.handleError( { error: "A project key is needed to create the config file" } );
            process.exit(1);
        }
        
        let configObj = {
            projects: {},
            removeNullValues: newConfig.removeNullValues || false
        };

        this.get('.json', newConfig.projectKey)
        .then((result) => {
            //Add project to config
            configObj.projects['project_' + result.project.name.replace(/[\s-_]/g, '').toLowerCase()] = {
                name: result.project.name,
                api_key: newConfig.projectKey
            };

            //Write the config file
            fs.outputFile(process.cwd() + `/wti_config.json`, JSON.stringify(configObj, null, 4), (err) => {
                if(err){
                    this.handleError({
                        "error": `There was a problem writing the config file`
                    });
                } else {
                    console.log(`Config file written successfuly with project "${result.project.name}"`.green);
                }
            });
        });
    },

    /**
     * Getter for webtranslateit API
     * @param  {String} url     Url to get
     * @param  {String} api_key API Key to use if provided
     * @return {Promise}
     */
    get: function(url = '', api_key){
        let apiKey = api_key || this.getConfig().projects[this.currentProject].api_key;

        return new Promise((resolve, reject) => {
            request.get(`https://webtranslateit.com/api/projects/${apiKey}${url}`, (err, resp, body) => {
                let parsedBody = body.trim() ? JSON.parse(body) : {};

                if(err || parsedBody.error){
                    this.handleError(err || parsedBody);
                    reject(err || parsedBody); return;
                }

                resolve(parsedBody);
            });
        });
    },

    /**
     * Putter for webtranslateit API 
     * @param  {String} url  Url to PUT to
     * @param  {Object} data Data to send
     * @return {Promise}
     */
    put: function(url = '', data){
        let apiKey = this.getConfig().projects[this.currentProject].api_key;

        return new Promise((resolve, reject) => {
            request.put({url: `https://webtranslateit.com/api/projects/${apiKey}${url}`, formData: data}, (err, resp, body) => {
                let parsedBody = body.trim() ? JSON.parse(body) : {};

                if(err || parsedBody.error){
                    this.handleError(err || parsedBody);
                    reject(err || parsedBody); return;
                }

                resolve(parsedBody);
            });
        });
    },

    /**
     * Handles errors
     * @param  {Object} obj Object containing errors
     */
    handleError: function(obj = {}){
        if(typeof obj !== 'object') return;

        let error = '';

        for(var key in obj){
            error += `${key.red}: ${obj[key]} \n`;
        }

        console.log(error);
        console.trace();
        process.exit(1);
    },

    /**
     * Creates a loading spinner
     * @param  {String} spinnerText Text to use in the spinner
     * @return {Object}             Spinner instance
     */
    createSpinner: function(spinnerText = ''){
        return ora(spinnerText).start();
    },

    /**
     * Strips null values from object recursively
     * @param  {Object} obj Object to parse
     * @return {Object}     Parsed object
     */
    stripNullValues: function(obj){
        for(var key in obj){
            if(obj[key] === null){
                delete obj[key];
            }

            //Recursive
            if(typeof obj[key] === 'object'){
                obj[key] = this.stripNullValues(obj[key]);
            }
        }

        return obj;
    }
};