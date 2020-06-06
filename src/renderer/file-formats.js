import _ from 'lodash'
import { DEFAULT_DIALECT as _dialectDefaults } from 'datapackage/lib/config.js'
/**
 * Definitions for supported file types
 * No renderer shortcuts in here (e.g., @) as used by main and renderer
 *
 * Add more objects here to support additional formats
 */

const fileFormats = {
  csv: {
    label: 'Comma separated...',
    filters: [
      {
        name: 'csv files',
        extensions: ['csv']
      }
    ],
    dialect: _.assign({}, _dialectDefaults, {
      delimiter: ','
    }),
    mediatype: 'text/csv',
    format: 'csv'
  },
  tsv: {
    label: 'Tab separated...',
    filters: [
      {
        name: 'tsv files',
        extensions: ['tsv']
      }, {
        name: 'txt files',
        extensions: ['txt']
      }, {
        name: 'dat files',
        extensions: ['dat']
      }
    ],
    dialect: _.assign({}, _dialectDefaults, {
      delimiter: '\t'
    }),
    mediatype: 'text/tab-separated-values',
    format: 'tsv'
  },
  semicolon: {
    label: 'Semicolon separated...',
    filters: [
      {
        name: 'csv files',
        extensions: ['csv']
      }
    ],
    dialect: _.assign({}, _dialectDefaults, {
      delimiter: ';'
    }),
    mediatype: 'text/csv',
    format: 'csv'
  },
  pipe: {
    label: 'Pipe (vbar) separated...',
    filters: [
      {
        name: 'csv files',
        extensions: ['csv']
      }
    ],
    dialect: _.assign({}, _dialectDefaults, {
      delimiter: '|'
    }),
    mediatype: 'text/csv',
    format: 'csv'
  }
}

export function dataResourceToFormat (dataResource) {
  let format = {}
  _.assign(format, dataResource)
  for (const key of ['missingValues', 'name', 'path', 'profile', 'schema']) {
    _.unset(format, key)
  }
  return format
}

export {
  fileFormats
}
