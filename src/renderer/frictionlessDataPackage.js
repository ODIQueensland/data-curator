import {Resource, Package, validate} from 'datapackage'
import {HotRegister} from '@/hot.js'
import tabStore from '@/store/modules/tabs.js'
import hotStore from '@/store/modules/hots.js'
import path from 'path'
import {createZipFile} from '@/exportPackage.js'

export async function createDataPackage() {
  console.log('entered create data package method...')
  let errorMessages = []
  if (!haveAllTabsGotFilenames()) {
    errorMessages.push('All tabs must be saved before exporting.')
  }
  try {
    console.log('building package...')
    let dataPackage = await buildDataPackage(errorMessages)
    console.log(errorMessages)
    console.log(dataPackage.errors)
    if (errorMessages.length > 0) {
      return errorMessages
    }
    dataPackage.commit()
    console.log('checking data package is valid...')
    if (!dataPackage.valid) {
      errorMessages.push('There is a problem with at least 1 package property. Please check and try again.')
      console.log(dataPackage.errors)
      return errorMessages
    }
    console.log(dataPackage.valid)
    console.log('package now...')
    console.log(dataPackage)
    // only stringify descriptor here so no circular refs
    createZipFile(JSON.stringify(dataPackage.descriptor))
  } catch (err) {
    if (err) {
      console.log('There was an error creating the data package.')
      console.log(err)
    }
  }
  return errorMessages
}

export function haveAllTabsGotFilenames() {
  return tabStore.getters.getTabFilenames(tabStore.state).length === tabStore.state.tabs.length
}

async function buildDataPackage(errorMessages) {
  if (!hasAllPackageRequirements(errorMessages)) {
    return false
  }
  let dataPackage = await initPackage()
  // adding package properties for validation only
  addPackageProperties(dataPackage)
  await buildAllResourcesForDataPackage(dataPackage, errorMessages)
  console.log('data package so far...')
  console.log(dataPackage)
  return dataPackage
}

function hasAllPackageRequirements(requiredMessages) {
  console.log(hotStore.state)
  console.log('checking all package requirements...')
  if (!hotStore.state.provenanceProperties || !hotStore.state.provenanceProperties.markdown) {
    requiredMessages.push(`Provenance properties must be set.`)
  }
  if (!hotStore.state.packageProperties || _.isEmpty(hotStore.state.packageProperties)) {
    requiredMessages.push(`Package properties must be set.`)
  }
  return requiredMessages.length === 0
}

async function initPackage() {
  const dataPackage = await Package.load()
  return dataPackage
}

function addPackageProperties(dataPackage) {
  let packageProperties = hotStore.state.packageProperties
  console.log(`packageProperties: ${packageProperties}`)
  _.merge(dataPackage, packageProperties)
}

async function buildAllResourcesForDataPackage(dataPackage, errorMessages) {
  let resourcePaths = []
  for (let hotId in hotStore.state.hotTabs) {
    try {
      let resource = await createValidResource(hotId, errorMessages)
      if (!resource) {
        console.log(`did not add resource: ${hotId}`)
        break
      }
      if (resourcePaths.indexOf(resource.descriptor.path) !== -1) {
        errorMessages.push('There is at least 1 tab with the same title. Each tab must have a unique title.')
        break
      }
      resourcePaths.push(resource.descriptor.path)
      dataPackage.addResource(resource.descriptor)
      console.log('adding resource to data package...')
      console.log(dataPackage)
    } catch (err) {
      if (err) {
        console.log('There was an error creating a resource.')
        console.log(err)
        return false
      }
    }
  }
}

async function createValidResource(hotId, errorMessages) {
  let hotTab = hotStore.state.hotTabs[hotId]
  let hot = HotRegister.getInstance(hotId)
  if (!hasAllResourceRequirements(hot, errorMessages)) {
    return false
  }
  console.log(`${hotId} has requirements`)
  let resource = await buildResource(hotTab.tabId, hot.guid)
  if (!resource.valid) {
    console.log('resource if not valid')
    console.log(resource.errors)
    errorMessages.push('There is a required table or column property that is missing. Please check that all required properties are entered.')
    return false
  }
  return resource
}

function hasAllResourceRequirements(hot, requiredMessages) {
  if (!hotStore.state.hotTabs[hot.guid].tableProperties) {
    requiredMessages.push(`Table properties must be set.`)
  } else {
    let name = hotStore.state.hotTabs[hot.guid].tableProperties.name
    if (!name || name.trim() === '') {
      requiredMessages.push(`Table property, 'name', must not be empty.`)
    }
  }
  if (!hotStore.state.hotTabs[hot.guid].columnProperties) {
    requiredMessages.push(`Column properties must be set.`)
  }
  return requiredMessages.length === 0
}

async function buildResource(tabId, hotId) {
  let resource = await initResourceAndInfer()
  console.log('adding column properties...')
  addColumnProperties(resource, hotId)
  console.log('adding table properties...')
  addTableProperties(resource, hotId)
  console.log('adding path...')
  addPath(resource, tabId)
  resource.commit()
  console.log('resource after basic build...')
  console.log(resource)
  return resource
}

async function initResourceAndInfer() {
  const resource = await Resource.load()
  await resource.infer()
  return resource
}

function addColumnProperties(resource, hotId) {
  let columnProperties = hotStore.state.hotTabs[hotId].columnProperties
  resource.descriptor.schema = {}
  resource.descriptor.schema.fields = columnProperties
}

function addTableProperties(resource, hotId) {
  let tableProperties = hotStore.state.hotTabs[hotId].tableProperties
  _.merge(resource.descriptor, tableProperties)
  if (resource.descriptor.licenses && resource.descriptor.licenses.length === 0) {
    _.unset(resource.descriptor, 'licenses')
  }
}

function addPath(resource, tabId) {
  let parent = 'data'
  let filename = tabStore.state.tabObjects[tabId].filename
  let basename = path.basename(filename)
  let resourcePath = `${parent}/${basename}`
  resource.descriptor.path = resourcePath
}
