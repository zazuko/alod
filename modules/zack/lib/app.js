var Promise = require('bluebird')
var debounce = require('debounce')
var renderer = require('./renderer')
var Event = require('crab-event').Event
var Histogram = require('./histogram')
var QueryBuilder = require('./query-builder')
var Timeline = require('./timeline')
var Zack = require('./zack')

var app = {}

window.app = app

window.onresize = function () {
  app.events.resize.trigger()
}

app.options = {
  endpointUrl: 'http://data.admin.ch:3030/alod/query',
  pageSize: 20,
  preload: 80,
  filterContainer: 'filter-container'
}

app.events = {
  fetched: new Event(),
  fetching: new Event(),
  filterChange: new Event(),
  resize: new Event(),
  resultMetadata: new Event(),
  search: new Event()
}

app.isFetching = 0
app.renderHistogram = false

app.filters = []

function search () {
  var query = document.getElementById('query').value

  if (query.trim() !== '') {
    query = query.replace('"', '').trim()
  } else {
    query = '*'
  }

  app.zack.search(query)
}

function resultMetadata (metadata) {
  document.getElementById('count').innerHTML = metadata.length
  document.getElementById('scrollArea').scrollTop = 0
}

function updateTimeline () {
  app.timeline.render(app.zack.start, app.zack.end)
  app.histogram.clear()
}

function updateHistogram () {
  app.histogram.render(app.zack.query)
  app.renderHistogram = false
}

app.updateFilters = function () {
  var elements = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'))

  app.filters = elements.filter(function (element) {
    return element.getAttribute('disabled') === null
  }).map(function (element, index) {
    var filter = {}

    filter.operator = element.getAttribute('data-filter')
    filter.predicate = element.getAttribute('data-predicate')
    filter.propertyPathPrefix = element.getAttribute('data-property-path-prefix')
    filter.propertyPathPostfix = element.getAttribute('data-property-path-postfix')
    filter.termType = element.getAttribute('data-named-node') !== null ? 'NamedNode' : 'Literal'
    filter.variable = 'filter' + index

    var eventName = 'onchange'
    var getValue = function (element) {
      var value = element.value || element.getAttribute('data-value')

      if (!value) {
        return null
      }

      if (filter.termType === 'NamedNode') {
        return '<' + value + '>'
      } else {
        return '"' + value + '"' // TODO: escape literal
      }
    }

    if (element.nodeName.toLowerCase() === 'input' && element.type.toLowerCase() === 'date') {
      eventName = 'onblur'

      getValue = function (element) {
        if (element.value) {
          return 'xsd:date(\'' + element.value + '\')'
        } else {
          return null
        }
      }
    }

    filter.value = getValue(element)

    if (eventName) {
      element[eventName] = function (event) {
        filter.value = getValue(element)

        app.events.filterChange.trigger()
      }
    }

    return filter
  })

  app.events.filterChange.trigger()
}

app.removeFilter = function (element) {
  element.parentNode.removeChild(element)
  app.updateFilters()
}

app.addFilter = function (label, operator, predicate, value, options) {
  if (arguments.length === 1) {
    var element = arguments[0]

    label = element.getAttribute('data-label') || element.textContent
    operator = element.getAttribute('data-filterable')
    predicate = element.getAttribute('data-predicate')
    value = element.value || element.getAttribute('data-value')
    options = {
      namedNode: element.getAttribute('data-named-node') !== null,
      propertyPathPrefix: element.getAttribute('data-property-path-prefix'),
      propertyPathPostfix: element.getAttribute('data-property-path-postfix')
    }

    return app.addFilter(label, operator, predicate, value, options)
  }

  options = options || {}

  var html = '<div data-filter="' + operator + '" ' +
    'data-predicate="' + predicate + '" ' +
    (options.propertyPathPrefix ? 'data-property-path-prefix="' + options.propertyPathPrefix + '" ' : '') +
    (options.propertyPathPostfix ? 'data-property-path-postfix="' + options.propertyPathPostfix + '" ' : '') +
    'data-value="' + value + '" ' +
    (options.namedNode ? 'data-named-node ' : '') +
    'class="filter-item" onclick="app.removeFilter(this)">' + label + '</div>'

  document.getElementById(app.options.filterContainer).innerHTML += html

  app.updateFilters()
}

function initUi () {
  // timeline
  app.timeline = new Timeline({margin: {top: 40, right: 20, bottom: 0, left: 20}})

  app.events.resize.on(updateTimeline)
  app.events.resultMetadata.on(updateTimeline)

  // histogram
  app.histogram = new Histogram({
    endpointUrl: app.options.endpointUrl,
    margin: {top: 0, right: 20, bottom: 0, left: 20}
  })

  app.histogram.buildQuery = app.queryBuilder.createBuilder(app.queryTemplates.histogram)

  app.events.resultMetadata.on(function () {
    app.renderHistogram = true
  })

  app.events.fetched.on(function () {
    setTimeout(function () {
      if (app.renderHistogram && !app.isFetching) {
        updateHistogram()
      }
    }, 1)
  })

  app.events.resize.on(debounce(updateHistogram, 500))

  // query field
  document.getElementById('query').onkeyup = debounce(function () {
    app.events.search.trigger()
  }, 250)

  app.updateFilters()

  app.events.search.trigger()
}

function initQueryBuilder () {
  app.queryBuilder = new QueryBuilder()

  app.queryTemplates = {
    search: require('../.build/zack-sparql'),
    count: require('../.build/zack-count-sparql'),
    histogram: require('../.build/zack-histogram-sparql')
  }

  return Promise.resolve()
}

function initZack () {
  app.zack = new Zack({
    endpointUrl: app.options.endpointUrl,
    pageSize: app.options.pageSize,
    preload: app.options.preload,
    dummyResult: '<div class="zack-result"></div>',
    resultType: 'http://data.archiveshub.ac.uk/def/ArchivalResource',
    renderResult: renderer.renderResult,
    postRender: renderer.postRender,
    onFetched: app.events.fetched.trigger,
    onFetching: app.events.fetching.trigger,
    onResultMetadata: app.events.resultMetadata.trigger
  })

  // replace default filter query builder methods
  app.zack.buildCountFilterQuery = app.queryBuilder.createBuilder(app.queryTemplates.count)
  app.zack.buildSearchFilterQuery = app.queryBuilder.createBuilder(app.queryTemplates.search)

  // connect events

  app.events.fetched.on(function () {
//    console.log('fetched')
    app.isFetching--
  })

  app.events.fetching.on(function () {
//    console.log('fetching')
    app.isFetching++
  })

  app.events.filterChange.on(function () {
    app.queryBuilder.setFilters(app.filters)
    app.events.search.trigger()
  })

  app.events.resultMetadata.on(resultMetadata)

  app.events.search.on(search)
}

initQueryBuilder().then(function () {
  return initZack()
}).then(function () {
  return initUi()
})
