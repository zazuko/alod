var d3 = require('d3')

function Timeline (options) {
  this.start = ''
  this.end = ''

  this.options = options || {}

  this.margin = this.options.margin || {top: 0, right: 0, bottom: 0, left: 0}
  this.height = this.options.height || 60

  // get different sizes defined by windows size
  this.width = document.getElementById('zack-timeline').offsetWidth
  this.innerWidth = this.width - this.margin.left - this.margin.right
  this.innerHeight = this.height - this.margin.top - this.margin.bottom

  // main objects
  this.timelineContainer = d3.select('#zack-timeline').append('svg')
      .attr('id', 'timeline-container')

  this.timeline = this.timelineContainer.append('g')
      .attr('id', 'timeline')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')

  // handles
  this.timelineHandles = this.timeline.append('g')
      .attr('id', 'timeline-handles')
      .attr('transform', 'translate(0, -' + this.margin.top + ')')

  var that = this
  var move = function (d, i, s) {
    d3.select(s[0]).attr('x', event.x - that.margin.left)
  }
  var filter = function (d, i, s) {
    if (s[0].id === 'from-handle') {
      console.log('set-from', that.x.invert(event.x - that.margin.left))
    }
    if (s[0].id === 'to-handle') {
      console.log('set-to', that.x.invert(event.x - that.margin.left + that.handleWidth))
    }
  }

  var drag = d3.drag().on('drag', move).on('end', filter)

  this.fromHandle = this.timelineHandles.append('rect')
      .attr('id', 'from-handle')
      .attr('class', 'handle')
      .attr('visibility', 'hidden')
      .attr('x', '0')
      .call(drag)

  this.handleWidth = this.fromHandle.node().getBoundingClientRect().width

  this.toHandle = this.timelineHandles.append('rect')
      .attr('id', 'to-handle')
      .attr('class', 'handle')
      .attr('visibility', 'hidden')
      .attr('x', this.width - this.margin.left - this.margin.right - this.handleWidth)
      .call(drag)

  // axis element
  this.timelineAxis = this.timeline.append('g')
      .attr('id', 'timeline-axis')
}

Timeline.prototype.render = function (start, end) {
  // update in case resize occured
  this.width = document.getElementById('zack-timeline').offsetWidth
  this.innerWidth = this.width - this.margin.left - this.margin.right

  // scale
  this.x = d3.scaleUtc()
    .domain([start, end])
    .range([0, this.innerWidth])

  // axis with ticks
  this.xAxis = d3.axisBottom()
    .scale(this.x)
    .tickFormat(d3.timeFormat('%Y'))
    .tickValues(
        [start, end].concat( // add the first and last year
            d3.scaleUtc().domain(this.x.domain()) // use UTC domain
              .ticks(Math.floor(this.innerWidth / 50)) // get ticks roughly 50px appart
              .slice(0, -1) // remove the first and last tick
        )
    )

  // resize Container
  this.timelineContainer
    .attr('width', this.width)
    .attr('height', this.height)

  // render axis
  this.timelineAxis
    .transition()
    .duration(400)
    .call(this.xAxis)

  // reposition handles and make them visible
  this.fromHandle
    .attr('visibility', 'visible')
    .attr('x', 0)
  this.toHandle
    .attr('visibility', 'visible')
    .attr('x', this.width - this.margin.left - this.margin.right - this.handleWidth)
}

module.exports = Timeline
