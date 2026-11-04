'use strict'

const fs = require('fs-extra')
const Utils = require('./utils')
const Project = require('./project')

const config = Utils.getConfig()

module.exports = {
  /**
   * Pull a translation file
   * @param  {Array}   locales Locales to pull ( by default pulls all of them )
   */
  pull: async function (locales = []) {
    let files
    try {
      files = await this.getAllFiles()
    } catch (error) {
      Utils.handleError({
        error: error,
      })
    }

    if (locales.length > 0) {
      files = files.filter((f) => locales.includes(f.locale_code))
    }

    let spinners = {}

    // Download the content for each file
    for (const file of files) {
      spinners[file.locale_code] = Utils.createSpinner(
        `Pulling file for ${file.locale_code} locale in ${file.name}`,
      )

      let result
      try {
        result = await Utils.get(`/files/${file.id}/locales/${file.locale_code}`)
      } catch {
        spinners[file.locale_code].fail()
        console.log(`Failed to pull results for ${file.name}`)
        continue
      }

      if (config.removeNullValues) {
        result = Utils.stripNullValues(result)
      }

      try {
        fs.outputFileSync(process.cwd() + `/${file.name}`, JSON.stringify(result, null, 4))
        spinners[file.locale_code].succeed()
      } catch {
        spinners[file.locale_code].fail()
        console.log(`Failed to output result file for ${file.name}`)
      }
    }
  },

  /**
   * Choose which project files a push uploads, and the file id each one targets.
   * A master file has master_project_file_id === null. Its upload target is its own id.
   * A translation targets master_project_file_id.
   * With no locales and no master flag, every master is skipped.
   * With the master flag, only masters are pushed. Locales then filter that set.
   * @param  {Array}   files    Project files
   * @param  {Array}   locales  Locale codes to include
   * @param  {Boolean} master   Push only master files
   * @return {Array}            Selected files and the id each upload targets
   */
  selectPushFiles: function (files, locales = [], master = false) {
    let selected = files

    if (master) {
      selected = selected.filter((file) => file.master_project_file_id === null)
    } else if (locales.length === 0) {
      selected = selected.filter((file) => file.master_project_file_id !== null)
    }

    if (locales.length > 0) {
      selected = selected.filter((file) => locales.includes(file.locale_code))
    }

    return selected.map((file) => {
      return {
        file,
        targetId: file.master_project_file_id ?? file.id,
      }
    })
  },

  /**
   * Push a translation file
   * @param  {Array}   locales Locales to push ( by default pushes all of them )
   * @param  {Boolean} master  Should we only push master
   */
  push: function (locales = [], master = false) {
    this.getAllFiles().then((files) => {
      let targets = this.selectPushFiles(files, locales, master)
      let spinners = {}

      //Loop files and push content
      for (const { file, targetId } of targets) {
        spinners[file.id] = Utils.createSpinner(
          `Pushing file for ${file.locale_code} : ${file.name}`,
        )
        Utils.put(`/files/${targetId}/locales/${file.locale_code}`, {
          file: fs.createReadStream(process.cwd() + `/${file.name}`),
        })
          .then(() => {
            spinners[
              file.id
            ].text = `File ${file.name} has been pushed to webtranslateit. It takes about 1 min for 1000 segments to be uploaded`
            spinners[file.id].succeed()
          })
          .catch((error) => {
            console.log(error)
            spinners[file.id].fail()
          })
      }
    })
  },

  /**
   * Get all files for a project
   * @return {Promise}
   */
  getAllFiles: function () {
    return new Promise((resolve, reject) => {
      Project.getProject()
        .then((result) => {
          resolve(result.project.project_files)
        })
        .catch(reject)
    })
  },
}
