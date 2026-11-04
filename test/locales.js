'use strict'

/*
Locales push selection
==============
Which project files a push uploads, and which master id each one targets.
*/

const assert = require('chai').assert
const Locales = require('../src/locales')

function summarize(targets) {
  return targets.map((target) => {
    return {
      id: target.file.id,
      name: target.file.name,
      locale_code: target.file.locale_code,
      targetId: target.targetId,
    }
  })
}

const oneMaster = [
  { id: 1, name: 'en.json', locale_code: 'en', master_project_file_id: null },
  { id: 2, name: 'da.json', locale_code: 'da', master_project_file_id: 1 },
  { id: 3, name: 'fr.json', locale_code: 'fr', master_project_file_id: 1 },
]

const severalMasters = [
  { id: 10, name: 'ae.en.json', locale_code: 'en', master_project_file_id: null },
  { id: 11, name: 'ae.da.json', locale_code: 'da', master_project_file_id: 10 },
  { id: 20, name: 'en.json', locale_code: 'en', master_project_file_id: null },
  { id: 21, name: 'da.json', locale_code: 'da', master_project_file_id: 20 },
  { id: 30, name: 'archouse.en.json', locale_code: 'en', master_project_file_id: null },
  { id: 31, name: 'archouse.da.json', locale_code: 'da', master_project_file_id: 30 },
]

describe('Locales.selectPushFiles', () => {
  describe('one master and two locales', () => {
    it('default push skips the master and uploads each locale to that master', () => {
      assert.deepEqual(summarize(Locales.selectPushFiles(oneMaster)), [
        { id: 2, name: 'da.json', locale_code: 'da', targetId: 1 },
        { id: 3, name: 'fr.json', locale_code: 'fr', targetId: 1 },
      ])
    })

    it('--master pushes that master file to its own id', () => {
      assert.deepEqual(summarize(Locales.selectPushFiles(oneMaster, [], true)), [
        { id: 1, name: 'en.json', locale_code: 'en', targetId: 1 },
      ])
    })

    it('-l filters by locale_code and keeps the master as the upload target', () => {
      assert.deepEqual(summarize(Locales.selectPushFiles(oneMaster, ['da'])), [
        { id: 2, name: 'da.json', locale_code: 'da', targetId: 1 },
      ])
      assert.deepEqual(summarize(Locales.selectPushFiles(oneMaster, ['fr', 'en'])), [
        { id: 1, name: 'en.json', locale_code: 'en', targetId: 1 },
        { id: 3, name: 'fr.json', locale_code: 'fr', targetId: 1 },
      ])
    })

    it('-l combined with --master applies the locale filter to the master file', () => {
      assert.deepEqual(summarize(Locales.selectPushFiles(oneMaster, ['en'], true)), [
        { id: 1, name: 'en.json', locale_code: 'en', targetId: 1 },
      ])
      assert.deepEqual(summarize(Locales.selectPushFiles(oneMaster, ['da'], true)), [])
    })
  })

  describe('several masters', () => {
    it('default push skips every master and uploads each file to its own master', () => {
      const targets = Locales.selectPushFiles(severalMasters)

      assert.deepEqual(summarize(targets), [
        { id: 11, name: 'ae.da.json', locale_code: 'da', targetId: 10 },
        { id: 21, name: 'da.json', locale_code: 'da', targetId: 20 },
        { id: 31, name: 'archouse.da.json', locale_code: 'da', targetId: 30 },
      ])

      const spinnerKeys = targets.map((target) => target.file.id)
      assert.strictEqual(new Set(spinnerKeys).size, spinnerKeys.length)
    })

    it('--master pushes every master file to its own id', () => {
      assert.deepEqual(summarize(Locales.selectPushFiles(severalMasters, [], true)), [
        { id: 10, name: 'ae.en.json', locale_code: 'en', targetId: 10 },
        { id: 20, name: 'en.json', locale_code: 'en', targetId: 20 },
        { id: 30, name: 'archouse.en.json', locale_code: 'en', targetId: 30 },
      ])
    })

    it('-l keeps every matching file, including ones that share a locale', () => {
      const targets = Locales.selectPushFiles(severalMasters, ['da', 'en'])
      const spinnerKeys = targets.map((target) => target.file.id)

      assert.deepEqual(summarize(targets), [
        { id: 10, name: 'ae.en.json', locale_code: 'en', targetId: 10 },
        { id: 11, name: 'ae.da.json', locale_code: 'da', targetId: 10 },
        { id: 20, name: 'en.json', locale_code: 'en', targetId: 20 },
        { id: 21, name: 'da.json', locale_code: 'da', targetId: 20 },
        { id: 30, name: 'archouse.en.json', locale_code: 'en', targetId: 30 },
        { id: 31, name: 'archouse.da.json', locale_code: 'da', targetId: 30 },
      ])
      assert.strictEqual(new Set(spinnerKeys).size, targets.length)
    })

    it('-l combined with --master applies the locale filter to master files only', () => {
      assert.deepEqual(summarize(Locales.selectPushFiles(severalMasters, ['en'], true)), [
        { id: 10, name: 'ae.en.json', locale_code: 'en', targetId: 10 },
        { id: 20, name: 'en.json', locale_code: 'en', targetId: 20 },
        { id: 30, name: 'archouse.en.json', locale_code: 'en', targetId: 30 },
      ])
      assert.deepEqual(summarize(Locales.selectPushFiles(severalMasters, ['da'], true)), [])
    })
  })
})
