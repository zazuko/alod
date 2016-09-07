var d3 = require('d3')

function Timeline (options) {
  this.options = options || {}

  this.margin = this.options.margin || {top: 0, right: 0, bottom: 0, left: 0}
  this.height = this.options.height || 60

  this.width = document.getElementById('zack-timeline').offsetWidth
  this.innerWidth = this.width - this.margin.left - this.margin.right
  this.innerHeight = this.height - this.margin.top - this.margin.bottom

  d3.select('#zack-timeline').append('svg')
    .attr('id', 'timeline-container')
    .append('g')
    .attr('id', 'timeline')
    .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
    .append('g')
    .attr('id', 'timeline-axis')
}

Timeline.prototype.render = function (start, end) {
  this.width = document.getElementById('zack-timeline').offsetWidth
  this.innerWidth = this.width - this.margin.left - this.margin.right

  var x = d3.scaleUtc()
    .domain([start, end])
    .range([0, this.innerWidth])

  var xAxis = d3.axisBottom()
    .scale(x)
    .tickFormat(d3.timeFormat('%Y'))
    .tickValues(
        [start, end].concat( // add the first and last year
            d3.scaleUtc().domain(x.domain()) // use UTC domain
              .ticks(Math.floor(this.innerWidth / 50)) // get ticks roughly 50px appart
              .slice(0, -1) // remove the first and last tick
        )
    )

  d3.select('#timeline-container')
    .attr('width', this.width)
    .attr('height', this.height)

  d3.select('#timeline-axis')
//    .transition()
//    .duration(400)
    .call(xAxis)
}

module.exports = Timeline
