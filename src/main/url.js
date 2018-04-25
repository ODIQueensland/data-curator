// import axios from 'axios'
import {ipcMain as ipc, dialog} from 'electron'
import {focusOrNewSecondaryWindow, focusMainWindow} from './windows'
import {getSubMenuFromMenu, disableSubMenuItemsFromMenuObject, enableSubMenuItemsFromMenuObject} from './menu.js'
import {Package} from 'datapackage'
import tmp from 'tmp'
import _ from 'lodash'
import {dataResourceToFormat} from '../renderer/file-formats.js'

// auto cleanup
tmp.setGracefulCleanup()

export function showUrlDialog() {
  let labels = ['Zip File...', 'URL...']
  let menu = getSubMenuFromMenu('File', 'Open Data Package')
  disableSubMenuItemsFromMenuObject(menu, labels)
  let browserWindow = focusOrNewSecondaryWindow('urldialog', {width: 300, height: 150, modal: true, alwaysOnTop: true})
  browserWindow.on('closed', () => {
    enableSubMenuItemsFromMenuObject(menu, labels)
  })
  browserWindow.webContents.on('did-finish-load', () => {
    ipc.once('urlCancelled', () => {
      if (browserWindow) {
        browserWindow.close()
      }
    })
    ipc.once('urlSubmitted', (e, urlText) => {
      console.log(`text is ${urlText}`)
      if (browserWindow) {
        browserWindow.close()
      }
      loadPackage(urlText)
      // mainWindow.webContents.send('importDataPackageJsonUrl', urlText)
    })
  })
}

async function loadPackage(urlText) {
  const mainWindow = focusMainWindow()
  const dataPackageJson = await loadPackageJson(urlText, mainWindow)
  console.log(dataPackageJson.descriptor)
  console.log(dataPackageJson.errors)
  if (!dataPackageJson.valid) {
    showInvalidMessage(urlText, mainWindow)
    return
  }
  tmp.file({ mode: '0644', prefix: 'datapackage-', postfix: '.json' }, function _tempFileCreated(err, path, fd) {
    if (err) throw err

    console.log('File: ', path)
    // console.log('Filedescriptor: ', fd);
  })
  await loadResources(dataPackageJson, mainWindow)
}

function showInvalidMessage(urlText, mainWindow) {
  dialog.showMessageBox(mainWindow, {
    type: 'warning',
    title: `Invalid Data Package`,
    message:
  `The data package, at ${urlText}, is not valid. Please refer to
  https://frictionlessdata.io/specs/
  for more information.`
  })
}

// datapackage-js does not support loading url in browser
async function loadPackageJson(json, mainWindow) {
  try {
    const dataPackage = await Package.load(json)
    return dataPackage
  } catch (error) {
    // console.log(`There was a problem loading the package: ${json}`, error)
    dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: `Unable to load Data Package`,
      message:
`The data package, ${json}, could not be loaded.
If the data package is a URL, please check that the URL exists.`
    })
  }
}

async function loadResources(dataPackageJson, mainWindow) {
  try {
    for (const resource of dataPackageJson.resourceNames) {
      console.log(`loading resource ${resource}`)
      const dataResource = dataPackageJson.getResource(resource)
      console.log(dataResource)
      console.log(dataResource.descriptor)
      const format = dataResourceToFormat(dataResource.descriptor)
      console.log('format is: ', format)
      let data = await dataResource.read()
      console.log(data)
      mainWindow.webContents.send('addTabWithFormattedData', data, format)
    }
  } catch (error) {
    console.log(`There was a problem loading the package`, error)
  }
}
