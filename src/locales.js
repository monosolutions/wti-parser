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
    pull: async function(locales = []){
        let files;
        try {
            files = await this.getAllFiles();
        } catch (err) {
            Utils.handleError({
                "error": err
            });
        }

        let masterId = files.filter( f => f.master_project_file_id === null )[0].id;

        //Filter locales to pull by the locales passed
        if(locales.length){
            files = files.filter( f => locales.indexOf(f.locale_code) > -1 );
        
        //If no locales passed we pull all locales but the master one
        } else {
            files = files.filter( f => f.id !== masterId );
        }

        let spinners = {};

        // Download the content for each file
        for(let fileIndex = 0; fileIndex < files.length; fileIndex++) {
            const file = files[fileIndex];
            spinners[file.locale_code] = Utils.createSpinner(`Pulling file for ${file.locale_code} locale in ${file.name}`);

            let result;
            try {
                result = await Utils.get(`/files/${masterId}/locales/${file.locale_code}`);
            } catch (err) {
                spinners[file.locale_code].fail();
                console.log(`Failed to pull results for ${file.name}`);
                continue;
            }

            if(config.removeNullValues){
                result = Utils.stripNullValues(result);
            }

            try {
                fs.outputFileSync(process.cwd() + `/${file.name}`, JSON.stringify(result, null, 4));
                spinners[file.locale_code].succeed();
            } catch (err) {
                spinners[file.locale_code].fail();
                console.log(`Failed to output result file for ${file.name}`);
            }
        }
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

            //Filter locales to push by the locales passed
            if(locales.length){
                files = files.filter( f => locales.indexOf(f.locale_code) > -1 );
            
            //If no locales passed we push all locales but the master one
            } else {
                files = files.filter( f => f.id !== masterId );
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