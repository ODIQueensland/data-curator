import {HotRegister, insertRowAbove, insertRowBelow, insertColumnLeft, insertColumnRight} from '@/hot.js'
import {loadDataIntoHot, saveDataToFile} from '@/data-actions.js'
var ipc = require('electron').ipcRenderer
var fs = require('fs')

var hotController = require('../renderer/hot.js')
var schemawizard = require('../renderer/schemawizard.js')
var rows = require('../renderer/ragged-rows.js')
var menu = require('../renderer/menu.js').menu
var remote = require('../renderer/menu.js').remote
var rowAbove = require('../renderer/menu.js').rowAbove
// var rowBelow = require('../renderer/menu.js').rowBelow
var columnLeft = require('../renderer/menu.js').columnLeft
// var columnRight = require('../renderer/menu.js').columnRight
// var removeRow = require('../renderer/menu.js').removeRow
// var removeCol = require('../renderer/menu.js').removeCol
// var freezeRow = require('../renderer/menu.js').freezeRow
// var unfreezeRow = require('../renderer/menu.js').unfreezeRow

export function addHotContainerListeners(container) {
  container.ondragover = function() {
    return false
  }
  container.ondragleave = container.ondragend = function() {
    return false
  }
  container.ondrop = function(e) {
    e.preventDefault()
    var f = e.dataTransfer.files[0]
    fs.readFile(f.path, 'utf-8', function(err, data) {
      if (err) {
        console.log(err.stack)
      }
      // if we're dragging a file in, default the format to comma-separated
      loadData(hot, data, file.formats.csv.options)
    })
  }

  container.addEventListener('contextmenu', function(e) {
    e.preventDefault()
    menu.popup(remote.getCurrentWindow())
    rowAbove.enabled = true
    columnLeft.enabled = true
  }, false)
}

export function loadData(key, data, format) {
  let hot = HotRegister.getInstance(key)
  loadDataIntoHot(hot, data, format)
}

ipc.on('saveData', function(e, format, fileName) {
  let hot = HotRegister.getActiveInstance()
  saveDataToFile(hot, format, fileName)
})

ipc.on('getCSV', function(e, format) {
  let hot = HotRegister.getActiveInstance()
  var data
  // if no format specified, default to csv
  if (typeof format === 'undefined') {
    data = $.csv.fromArrays(hot.getData())
  } else {
    data = $.csv.fromArrays(hot.getData(), format.options)
  }
  ipc.send('sendCSV', data)
})

ipc.on('validate', function() {
  let hot = HotRegister.getActiveInstance()
  var data = $.csv.fromArrays(hot.getData(), file.formats.csv)
  validation.validate(data)
})

ipc.on('schemaFromHeaders', function() {
  try {
    let hot = HotRegister.getActiveInstance()
    var assumedHeader = hot.getData()[0]
    var header = schemawizard.returnHeaderRow(assumedHeader)
    ipc.send('jsonHeaders', schemawizard.createSchema(header))
    schemawizard.createSchema(header)
  } catch (err) {
    console.log('attempting to get the first row has failed')
    console.log(err)
  }
})

ipc.on('fetchData', function() {
  let hot = HotRegister.getActiveInstance()
  var csv = $.csv.fromArrays(hot.getData(), file.formats.csv)
  ipc.send('dataSent', csv)
})

ipc.on('validationStarted', function() {
  loader.showLoader('Loading validation results...')
})

ipc.on('validationResults', function(e, results) {
  let hot = HotRegister.getActiveInstance()
  validation.displayResults(hot, results)
})

ipc.on('editUndo', function() {
  let hot = HotRegister.getActiveInstance()
  if (hot.isUndoAvailable) {
    hot.undo()
  }
})

ipc.on('editRedo', function() {
  let hot = HotRegister.getActiveInstance()
  if (hot.isRedoAvailable) {
    hot.redo()
  }
})

ipc.on('editCopy', function() {
  let hot = HotRegister.getActiveInstance()
  hot.copyPaste.setCopyableText()
})

ipc.on('editCut', function() {
  let hot = HotRegister.getActiveInstance()
  hot.copyPaste.setCopyableText()
  hot.copyPaste.triggerCut()
})

ipc.on('editPaste', function() {
  let hot = HotRegister.getActiveInstance()
  hot.copyPaste.triggerPaste()
})

ipc.on('editSelectAll', function() {
  let hot = HotRegister.getActiveInstance()
  hot.selectCell(0, 0, (hot.countRows() - 1), (hot.countCols() - 1))
})

ipc.on('insertRowAbove', function() {
  insertRowAbove(false)
})

ipc.on('insertRowBelow', function() {
  insertRowBelow(false)
})

ipc.on('insertColumnLeft', function() {
  insertColumnLeft(false)
})

ipc.on('insertColumnRight', function() {
  insertColumnRight(false)
})

ipc.on('removeRows', function() {
  hotController.removeRows()
})

ipc.on('removeColumns', function() {
  hotController.removeColumns()
})

ipc.on('freeze', function() {
  hotController.freeze()
})
ipc.on('unfreeze', function() {
  hotController.unfreeze()
})
