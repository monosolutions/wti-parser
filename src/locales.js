"use strict";

const Utils = require('./utils');
const Project = require('./project');
const fs = require('fs-extra');
const config = Utils.getConfig();

module.exports = {

    /**
     * Pull a translation file
     * @param  {Array}   locales Locales to pull ( by default pulls all of them )
     */
    pull: function(locales = []){
        
        this.getAllFiles()
        .then( (files) => {
            let masterId = files.filter( f => f.master_project_file_id === null )[0].id;

            //Filter locales to pull
            if(locales.length){
                files = files.filter( f => locales.indexOf(f.locale_code) > -1 );
            }

            let spinners = {};

            //Loop files and download content
            files.forEach( (file) => {
                spinners[file.locale_code] = Utils.createSpinner(`Pulling file for ${file.locale_code} locale in ${file.name}`);
                
                Utils.get(`/files/${masterId}/locales/${file.locale_code}`)
                .then( (result) => {

                    //Remove null values
                    if(config.removeNullValues){
                        result = Utils.stripNullValues(result);
                    }

                    //Write file
                    fs.outputFile(process.cwd() + `/${file.name}`, JSON.stringify(result, null, 4), (err) => {
                        if(err){
                            spinners[file.locale_code].fail();

                            Utils.handleError({
                                "error": `There was a problem writing ${file.name}`
                            });
                        } else {
                            spinners[file.locale_code].succeed();
                        }
                    });
                })
                .catch( (err) => {
                    spinners[file.locale_code].fail();
                });
            });

        });
    },

    /**
     * Push a translation file
     * @param  {Array}   locales Locales to push ( by default pushes all of them )
     * @param  {Boolean} master  Should we only push master
     */
    push: function(locales = [], master = false){
        this.getAllFiles()
        .then( (files) => {
            let masterFile = files.filter( f => f.master_project_file_id === null )[0],
                masterId = masterFile.id;

            //Filter locales to push
            if(locales.length){
                files = files.filter( f => locales.indexOf(f.locale_code) > -1 );
            }

            //Should we only push master
            if(master){
                files = [ masterFile ];
            }

            let spinners = {};

            //Loop files and push content
            files.forEach( (file) => {
                spinners[file.locale_code] = Utils.createSpinner(`Pushing file for ${file.locale_code} : ${file.name}`);
                Utils.put(`/files/${masterId}/locales/${file.locale_code}`, {file: fs.createReadStream(process.cwd() + `/${file.name}`) })
                .then( (result) => {
                    spinners[file.locale_code].text = `File ${file.name} has been pushed to webtranslateit. It takes about 1 min for 1000 segments to be uploaded`;
                    spinners[file.locale_code].succeed();
                })
                .catch( (err) => {
                    console.log(err);
                    spinners[file.locale_code].fail();
                });
            });

        });
    },

    /**
     * Get all files for a project
     * @return {Promise}         
     */
    getAllFiles: function(){
        return new Promise((resolve, reject) => {
            Project.getProject()
            .then((result) => {
                resolve(result.project.project_files);
            })
            .catch(reject);
        });
    }
};