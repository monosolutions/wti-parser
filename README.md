wti-parser
====
_by @cosminlupu_

> For easy file sync to WebtranslateIt.com

* **GitHub:** <https://github.com/monosolutions/wti-parser>

This project was manly created to have an NPM module for getting/sending translations to [webtranslateit.com](https://webtranslateit.com/), that also supports multiple projects per config. It was heavily inspired by [wti](https://github.com/AtelierConvivialite/webtranslateit), so you might want to check that repository out for a much more feature complete tool build with Ruby.

### TODO

* Support for adding new locales
* Support for adding new master files to project

## How to install
To use _wti-parser_ via cli, install it globally using **npm**:
```
npm install -g wti-parser
```

If you want to use the API instead, install it locally:
```
npm install --save wti-parser
```

then, include it in your javascript:
```js
var wti-parser = require('wti-parser');
```

## How to use via CLI
To create a wti configuration file:
```
wti-parser init
```
Will generate `wti_config.json`.

### Available CLI options
* `-h`, `--help`                output usage information
* `-V`, `--version`             output the version number

### Available CLI commands
* `init`          Creates a `wti_config.json` file with the project settings. Run `wti-parser init -h` for more info
* `add-project`   Add a new WebTranslateIt project. Run `wti-parser add-project -h` for more info
* `push`          Push files that need translations. Run `wti-parser push -h` for more info
* `pull`          Pull files that were translated. Run `wti-parser pull -h` for more info
* `status`        Get status of a webtranslateit project. Run `wti-parser status -h` for more info


## Developing / extending

* To install dependencies execute `npm install`
* To test, execute `npm test` ( This will run _Mocha_ tests and _Instanbul_ coverage report)
* To execute the CLI, execute `npm start -- <command> [options]`
* To install your local version globally, execute `npm install -g .` on the project folder ( Only use for development)


## How to contribute
To contribute to **wti-parser** you should fork this repository with `git`.

1. Make a change that you might see fit on your own fork ( using _develop_ branch )
2. Create tests for your change, and also make sure the existing tests pass
4. Only make pull requests from the _develop_ branch. Pull requests from master won't be merged
5. Check the opened and closed issues before creating one

Thanks for your help!

## License
GPL