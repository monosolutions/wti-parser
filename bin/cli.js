#!/usr/bin/env node

"use strict";

const WTI = require('../index.js');
const program = require('commander');
const ask = require('inquirer');
let config = WTI.utils.getConfig();

/**
 * Main program interface
 */
program
    .version('0.1.3')
    .description('A WebTranslateIt Syncronization tool build with Javascript with support for multiple projects')
    .usage('<command> [options]');


/**
 * Create project configuration file
 */
program
    .command('init')
    .description('Create project wti_config.json configuration file')
    .action((options) => {
        initConfig( (config) => {
            WTI.utils.createConfig(config);
        });
    });


/**
 * Get status of project
 */
program
    .command('status')
    .description('Fetch and display project statistics')
    .option("-p, --project [project]", "Project key from config you want to use command for")
    .action((options) => {
        WTI.utils.validateConfig();
        selectProject(() => {
            WTI.project.status();
        }, options.project);
    });

/**
 * Add new project to config
 */
program
    .command('add-project')
    .description('Pull language files')
    .option("-k, --project_key  [project_key]",  "Project API key")
    .action((options) => {
        WTI.utils.validateConfig();
        addProject(options.project_key, (key) => {
            WTI.project.add(key);
        });
    })
    .on('--help', function() {
        console.log('  Examples:');
        console.log();
        console.log('    $ wti-parser add-project');
        console.log('    $ wti-parser add-project -k 1234_abcd');
        console.log();
    });

/**
 * Pull language files
 */
program
    .command('pull')
    .description('Pull language files. If no locales are passed, we pull all locales except the master one.')
    .option("-p, --project [project]", "Project key from config you want to use command for")
    .option("-l, --locales [locale]", "Which locale should we pull. ")
    .action((options) => {
        WTI.utils.validateConfig();
        selectProject( () => {
            let locales = [];
            if(options.locales){
                locales = options.locales.split(' ');
            }

            WTI.locales.pull(locales);
        }, options.project);
    })
    .on('--help', function() {
        console.log('  Examples:');
        console.log();
        console.log('    $ wti-parser pull');
        console.log('    $ wti-parser pull -l fr');
        console.log('    $ wti-parser pull -l "fr es da"');
        console.log();
    });

/**
 * Push language files
 */
program
    .command('push')
    .description('Pull language files. If no locales are passed, we push all locales except the master one.')
    .option("-p, --project [project]", "Project key from config you want to use command for")
    .option("-l, --locales [locale]", "Which locale should we push. ")
    .option("--master", "Only push the master locale")
    .action((options) => {
        WTI.utils.validateConfig();
        selectProject( (project) => {
            let locales = [];
            if(options.locales){
                locales = options.locales.split(' ');
            }

            WTI.locales.push(locales, options.master);
        }, options.project);
    })
    .on('--help', function() {
        console.log('  Examples:');
        console.log();
        console.log('    $ wti-parser push');
        console.log('    $ wti-parser --master');
        console.log('    $ wti-parser push -l fr');
        console.log('    $ wti-parser push -l "fr es da"');
        console.log();
    });
    
program.parse(process.argv);

// Show help if no command specified
if(program.args.length === 0) {
    program.outputHelp();
}

//Select which project we should run command on
function selectProject(cb, specifiedProject = false){
    let projects = Object.keys(config.projects);

    //Have we specified a project
    if(specifiedProject){
        if(projects.indexOf(specifiedProject) > -1){
            WTI.utils.currentProject = specifiedProject;
            cb();
        } else {
            WTI.utils.handleError({
                "error": "Invalid project specified"
            });
            process.exit(1);
        }
        return;
    }

    //We only have one project
    if(projects.length === 1){
        WTI.utils.currentProject = projects[0];
        cb();
    
    } else {
        let projectsChoices = [];

        //Create options list
        projects.forEach((p) => {
            projectsChoices.push( (config.projects[p].name || "") + ` [${p}]`);
        });

        //Prompt question
        ask.prompt([
            {   
                message: 'Choose the project to run command for',
                type: 'list',
                name: 'project',
                choices: projectsChoices
            }
        ])
        .then((answer) => {
            WTI.utils.currentProject = answer.project.replace(/^.*?\[(.*?)\]$/, '$1');
            cb();
        });
    }
}

//initConfig
function initConfig(cb){
    let prompts = [
        {
            message: 'Project API key',
            type: 'input',
            name: 'projectKey',
            validate: (input) => {
                if(!input || !input.trim().length){
                    return 'You need to provide an API KEY!';
                } else {
                    return true;
                }
            }
        },
        {
            message: 'Remove null values from pulled jsons ?',
            type: 'confirm',
            name: 'removeNullValues'
        }
    ];

    ask.prompt(prompts)
    .then( (answer) => {
        cb(answer);
    });
}

//Adds a project to config
function addProject(key, cb){
    let prompts = [];

    if(!key){
        prompts.push({   
            message: 'Project API key',
            type: 'input',
            name: 'key',
            validate: (input) => {
                if(!input || !input.trim().length){
                    return 'You need to add an API KEY!';
                } else {
                    return true;
                }
            }
        });
    };

    ask.prompt(prompts)
    .then( (answer) => {
        cb( (answer.key || key) );
    });
}