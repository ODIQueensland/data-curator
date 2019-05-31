import store from '@/store'
import fs from 'fs'
import { fixRaggedRows } from '@/ragged-rows.js'
import { includeHeadersInData } from '@/frictionlessUtilities.js'
import { toggleHeaderNoFeedback } from '@/headerRow.js'
import { pushCsvFormat } from '@/dialect.js'
var parse = require('csv-parse/lib/sync')
var stringify = require('csv-stringify/lib/sync')

// { delimiter: ',', lineTerminator, quoteChar, doubleQuote, escapeChar, nullSequence, skipInitialSpace, header, caseSensitiveHeader, csvddfVersion }
const frictionlessToCsvmapper = { delimiter: 'delimiter', lineTerminator: 'rowDelimiter', quoteChar: 'quote', escapeChar: 'escape', skipInitialSpace: 'ltrim' }

export function loadDataIntoHot(hot, data, format) {
  if (_.isArray(data)) {
    loadArrayDataIntoHot(hot, data, format)
  } else {
    loadCsvDataIntoHot(hot, data, format)
  }
}

export function loadCsvDataIntoHot(hot, data, format) {
  // do not handle errors here as caller can activate appropriate user feedback dialog
  let arrays
  // if no format specified, default to csv
  if (typeof format === 'undefined' || !format) {
    arrays = parse(data)
  } else {
    let csvOptions = dialectToCsvOptions(format.dialect)
    // let csv parser handle the line terminators
    _.unset(csvOptions, 'rowDelimiter')
    csvOptions.doubleQuote = false
    csvOptions.quote = '"'
    csvOptions.escape = '\\'
    csvOptions.relax = true
    // TODO: update to stream
    let updatedData = _.replace(data, /["]/g, '"""')
    updatedData = _.replace(updatedData, /""""""/g, '""')
    // data = _.replace
    arrays = parse(updatedData, csvOptions)
    pushCsvFormat(hot.guid, format)
  }
  fixRaggedRows(arrays)
  hot.loadData(arrays)
  hot.render()
  // frictionless csv header default = true
  toggleHeaderNoFeedback(hot)
}

export function loadArrayDataIntoHot(hot, arrays, format) {
  pushCsvFormat(hot.guid, format)

  fixRaggedRows(arrays)
  hot.loadData(arrays)
  hot.render()
  // frictionless csv header default = true
  toggleHeaderNoFeedback(hot)
}

export function saveDataToFile(hot, format, filename, callback) {
  let tabId = store.getters.getActiveTab
  if (typeof filename === 'string') {
    store.commit('pushTabObject', { id: tabId, filename: filename })
  } else {
    filename = store.getters.getTabObjects(`${tabId}.filename`)
  }
  if (!filename) {
    return
  }
  if (typeof callback === 'undefined') {
    callback = (err) => {
      if (err) {
        console.error('There was a problem saving data to file.')
        throw err
      }
      // console.log('File saved successfully.')
    }
  }

  // unlike handsontable, in frictionless by default, headers should be included (http://frictionlessdata.io/specs/csv-dialect)
  let arrays = includeHeadersInData(hot)
  let data
  // if no format specified, default to csv
  if (typeof format === 'undefined' || !format) {
    // TODO: update to stream
    data = stringify(arrays)
  } else {
    let csvOptions = dialectToCsvOptions(format.dialect)
    data = stringify(arrays, csvOptions)
    pushCsvFormat(hot.guid, format)
  }
  fs.writeFile(filename, data, callback)
}

function dialectToCsvOptions(dialect) {
  let csvOptions = {}
  if (dialect) {
    _.forEach(frictionlessToCsvmapper, function(csvKey, frictionlessKey) {
      if (_.has(dialect, frictionlessKey)) {
        csvOptions[csvKey] = dialect[frictionlessKey]
      }
    })
  }
  return csvOptions
}
