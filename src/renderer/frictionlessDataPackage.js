import { Package, Resource } from 'datapackage'
import { HotRegister } from '@/hot.js'
import tabStore from '@/store/modules/tabs.js'
import hotStore from '@/store/modules/hots.js'
import path from 'path'
import { createZipFile } from '@/exportPackage.js'
import { getValidNames, hasAllColumnNames } from '@/frictionlessUtilities.js'
import _ from 'lodash'

export async function createDataPackage () {
  const errorMessages = []
  if (!haveAllTabsGotFilenames()) {
    errorMessages.push('All tabs must be saved before exporting.')
  }
  try {
    let dataPackage = await buildDataPackage(errorMessages)
    if (!_.isEmpty(errorMessages)) {
      return errorMessages
    }
    if (dataPackage) {
      dataPackage.commit()
      if (!dataPackage.valid) {
        errorMessages.push('There is a problem with at least 1 package property. Please check and try again.')
        return errorMessages
      }
      createZipFile(dataPackage.descriptor)
    }
  } catch (err) {
    if (err) {
      console.error('There was an error creating the data package.', err)
    }
  }
  return errorMessages
}

export function haveAllTabsGotFilenames () {
  return tabStore.getters.getTabFilenames(tabStore.state).length === tabStore.state.tabs.length
}

async function buildDataPackage (errorMessages) {
  auditPackageRequirements(errorMessages)
  let dataPackage = await initPackage()
  await buildAllResourcesForDataPackage(dataPackage, errorMessages)
  // adding package properties for validation only
  addPackageProperties(dataPackage.descriptor)
  return dataPackage
}

function auditPackageRequirements (requiredMessages) {
  if (!hotStore.state.provenanceProperties || !hotStore.state.provenanceProperties.markdown) {
    requiredMessages.push(`Provenance properties must be set.`)
  }
  let packageProperties = hotStore.state.packageProperties
  if (!packageProperties || _.isEmpty(packageProperties)) {
    requiredMessages.push(`Package properties must be set.`)
  } else {
    let name = packageProperties.name
    if (!name || name.trim() === '') {
      requiredMessages.push(`Package property, 'name' must be set.`)
    }
    auditSourcesRequirements(packageProperties, requiredMessages, 'package')
    auditContributorsRequirements(packageProperties, requiredMessages, 'package')
  }
}

async function initPackage () {
  const dataPackage = await Package.load()
  return dataPackage
}

function addPackageProperties (descriptor) {
  let packageProperties = hotStore.state.packageProperties
  _.merge(descriptor, packageProperties)
  removeEmptiesFromDescriptor(descriptor)
}

async function buildAllResourcesForDataPackage (dataPackage, errorMessages) {
  const resourcePaths = []
  for (let hotId in hotStore.state.hotTabs) {
    try {
      let resource = await createValidResource(hotId, errorMessages)
      if (!resource) {
        console.log(`Did not add resource: ${hotId}`)
        break
      }
      if (resourcePaths.indexOf(resource.descriptor.path) !== -1) {
        errorMessages.push('There is at least 1 tab with the same title. Each tab must have a unique title.')
        break
      }
      resourcePaths.push(resource.descriptor.path)
      dataPackage.addResource(resource.descriptor)
    } catch (err) {
      if (err) {
        console.error('There was an error creating a resource.', err)
        return false
      }
    }
  }
}

async function createValidResource (hotId, errorMessages) {
  let hotTab = hotStore.state.hotTabs[hotId]
  let hot = HotRegister.getInstance(hotId)
  auditResourceRequirements(hot, errorMessages)
  if (_.isEmpty(errorMessages)) {
    let resource = await buildResource(hotTab.tabId, hot.guid)
    if (!resource.valid) {
      console.error(resource.errors)
      errorMessages.push('There is a required table or column property that is missing. Please check that all required properties are entered.')
    }
    return resource
  }
}

function auditResourceRequirements (hot, requiredMessages) {
  let tableProperties = hotStore.state.hotTabs[hot.guid].tableProperties
  if (!tableProperties) {
    requiredMessages.push(`Table properties must be set.`)
  } else {
    let name = tableProperties.name
    if (!name || name.trim() === '') {
      requiredMessages.push(`Table property, 'name', must not be empty.`)
    }
    auditSourcesRequirements(tableProperties, requiredMessages, 'table')
    auditForeignKeyRequirements(tableProperties, requiredMessages)
  }
  let columnProperties = hotStore.state.hotTabs[hot.guid].columnProperties
  if (!columnProperties) {
    requiredMessages.push(`Column properties must be set.`)
  } else {
    let names = getValidNames(hot.guid)
    if (!hasAllColumnNames(hot.guid, columnProperties, names)) {
      requiredMessages.push(`Column property names cannot be empty - set a Header Row`)
    }
  }
  // return requiredMessages.length === 0
}

function auditSourcesRequirements (properties, requiredMessages, entityName) {
  auditGenericRequirements(properties, requiredMessages, entityName, 'sources')
}

function auditContributorsRequirements (properties, requiredMessages, entityName) {
  auditGenericRequirements(properties, requiredMessages, entityName, 'contributors')
}

function auditGenericRequirements (properties, requiredMessages, entityName, auditField) {
  if (typeof properties[auditField] === 'undefined') {
    return
  }
  for (let nextAuditField of properties[auditField]) {
    if (hasAllEmptyValues(nextAuditField)) {
      _.pull(properties[auditField], nextAuditField)
    } else if (_.isEmpty(_.trim(_.get(nextAuditField, 'title')))) {
      requiredMessages.push(`At least 1 ${entityName} ${nextAuditField} does not have a title.`)
      return
    } else {
      // console.log('source is valid')
    }
  }
  if (properties[auditField].length < 1) {
    properties[auditField] = null
    _.unset(properties, auditField)
  }
}

function hasAllEmptyValues (propertyObject) {
  let isEmpty = true
  _.forOwn(propertyObject, function (value, key) {
    if (value.trim().length > 0) {
      isEmpty = false
      return false
    }
  })
  return isEmpty
}

function auditForeignKeyRequirements (tableProperties, requiredMessages) {
  if (typeof tableProperties.foreignKeys === 'undefined') {
    return
  }
  for (let foreignKey of tableProperties.foreignKeys) {
    if (_.isEmpty(foreignKey.fields) || _.isEmpty(foreignKey.reference.fields)) {
      requiredMessages.push(`Foreign keys cannot be empty.`)
    }
  }
}

async function buildResource (tabId, hotId) {
  let resource = await initResourceAndInfer()
  let descriptor = resource.descriptor
  addColumnProperties(descriptor, hotId)
  addTableProperties(descriptor, hotId)
  removeEmptiesFromDescriptor(descriptor)
  removeNonFrictionlessKeys(descriptor)
  addPath(descriptor, tabId)
  resource.commit()
  return resource
}

async function initResourceAndInfer () {
  const resource = await Resource.load()
  await resource.infer()
  return resource
}

function addColumnProperties (descriptor, hotId) {
  let columnProperties = hotStore.state.hotTabs[hotId].columnProperties
  descriptor.schema = {}
  descriptor.schema.fields = columnProperties
}

function addTableProperties (descriptor, hotId) {
  let tableProperties = hotStore.state.hotTabs[hotId].tableProperties
  _.merge(descriptor, tableProperties)
  moveTableSchemaProperties(descriptor, tableProperties)
}

function moveTableSchemaProperties (descriptor, tableProperties) {
  _.unset(descriptor, 'missingValues')
  descriptor.schema.missingValues = tableProperties.missingValues
  if (!_.isEmpty(tableProperties['primaryKeys'])) {
    _.set(descriptor, `schema.primaryKey`, tableProperties['primaryKeys'])
  }
  if (!_.isEmpty(tableProperties['foreignKeys'])) {
    _.set(descriptor, `schema.foreignKeys`, tableProperties['foreignKeys'])
  }
}

function removeEmptiesFromDescriptor (descriptor) {
  removeEmpty(descriptor, 'licenses')
  removeEmpty(descriptor, 'sources')
}

function removeNonFrictionlessKeys (descriptor) {
  for (const propertyName of ['sampledQuoteChar', 'bom']) {
    _.unset(descriptor, propertyName)
  }
}

function removeEmpty (descriptor, propertyName) {
  if (descriptor[propertyName] && descriptor[propertyName].length === 0) {
    _.unset(descriptor, propertyName)
  }
}

function addPath (descriptor, tabId) {
  let parent = 'data'
  let filename = tabStore.state.tabObjects[tabId].filename
  let basename = path.basename(filename)
  let osPath = path.join(parent, basename)
  // resource paths must be POSIX https://frictionlessdata.io/specs/data-resource/#url-or-path
  descriptor.path = _.replace(osPath, '\\', '/')
}
