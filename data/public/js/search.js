var context = {
  "level" : "http://localhost:3030/alod/level",
  "title" : "http://purl.org/dc/elements/1.1/title",
  "dc" : "http://purl.org/dc/elements/1.1/",
  "prov" : "http://www.w3.org/ns/prov#",
  "foaf" : "http://xmlns.com/foaf/0.1/",
  "ge" : "http://localhost:3030/alod/ge",
  "bs" : "http://localhost:3030/alod/bs",
  "rdfs" : "http://www.w3.org/2000/01/rdf-schema#",
  "time" : "http://www.w3.org/2006/time#",
  "alod" : "http://data.alod.ch/alod/",
  "ne" : "http://localhost:3030/alod/ne",
  "locah" : "http://data.archiveshub.ac.uk/def/",
  "owl" : "http://www.w3.org/2002/07/owl#",
  "rdf" : "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  "bar" : "http://localhost:3030/alod/bar",
  "skos" : "http://www.w3.org/2004/02/skos/core#"
};


var ResultTable = React.createClass({
  getInitialState: function() {
    return {
      page: 0,
      cache: {},
      data: []
    }
  },
  search: function () {
    var self = this;

    self.setState({cache: {}, data: []});

    self.setPage(0);
  },
  setPage: function (page) {
    var self = this;

    self.loadResults(page)
      .then(function (results) {
        self.setState({page: page, data: results});

        self.updateCache();
      });
  },
  turnPage: function (direction, event) {
    var self = this;

    if (event != null) {
      event.preventDefault();
    }

    if (self.state.page + direction >= 0) {
      self.setPage(self.state.page + direction);
    }
  },
  updateCache: function () {
    var self = this;

    if (self.state.page > 0) {
      self.loadResults(self.state.page-1);
    }

    self.loadResults(self.state.page+1);
  },
  loadResults: function(page) {
    var
      self = this,
      searchString = $('#search-string').val();

    var doRequest = function (searchString, page) {
      return new Promise(function (resolve, reject) {
        $.ajax({
          url: '/alod/search?q=' + encodeURIComponent(searchString) + '&page=' + (page + 1),
          headers: {Accept: 'application/ld+json'},
          success: function (data) {
            jsonld.promises().compact(data, context)
              .then(function (data) {
                var cache = self.state.cache;

                if ('@graph' in data) {
                  data = data['@graph'];
                } else {
                  data = [data];
                }

                cache[page] = data;

                self.setState({cache: cache});

                resolve(data);
              })
          },
          error: function () {
            reject();
          }
        });
      });
    };

    if (page in self.state.cache) {
      return Promise.resolve(self.state.cache[page]);
    } else {
      return doRequest(searchString, page);
    }
  },
  componentDidMount: function() {
    var self = this;

    $('#search').on('click', self.search);
  },
  componentWillUnmount: function() {
    var self = this;

    $('#search').off('click', self.search);
  },
  render: function() {
    var self = this;

    var value = function (property) {
      if (typeof property === 'string') {
        return property;
      } else if ('@value' in property) {
        return property['@value'];
      }
    };

    var rows = self.state.data.map(function (row, index) {
      return React.DOM.tr({},
        React.DOM.td({}, self.state.page*self.props.resultsPerPage + index + 1),
        React.DOM.td({},
          React.DOM.a({href: row['@id']}, value(row.title))));
    });

    var table = React.DOM.table({className: 'table table-bordered', id: 'results-table'},
      React.DOM.thead({},
        React.DOM.tr({},
          React.DOM.th({}, 'Nr.'),
          React.DOM.th({}, 'Titel'))),
      React.DOM.tbody({}, rows));

    var noEntries = React.DOM.p({}, 'keine Treffer');

    var pageIsNotEmpty = function (page) {
      if (!(page in self.state.cache)) {
        return false;
      }

      // there is at least one context entry
      return self.state.cache[page].length > 1;
    };

    var pager = React.DOM.nav({},
      React.DOM.ul({className: 'pager'},
        pageIsNotEmpty(self.state.page-1) ? React.DOM.li({className: 'previous'},
          React.DOM.a({href: '#', onClick: self.turnPage.bind(self, -1)}, 'Previous')) : null,
        pageIsNotEmpty(self.state.page+1) ? React.DOM.li({className: 'next'},
          React.DOM.a({href: '#', onClick: self.turnPage.bind(self, +1)}, 'Next')) : null));

    return React.DOM.div({},
      self.state.data.length > 0 ? table : noEntries,
      pager);
  }
});

var createResultTable = React.createFactory(ResultTable);


var results = createResultTable({id: 'results', resultsPerPage: 10});

React.render(results, document.getElementById('results'));
