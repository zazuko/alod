# SOMEName - Lightweight Linked Data Server and Proxy

SOMEName provides a lightweight and easy way to access Linked Data URIs via HTTP. In the Linked Data world this is often called [dereferencing](http://en.wikipedia.org/wiki/Dereferenceable_Uniform_Resource_Identifier). SOMEName is inspired by [Pubby](http://wifo5-03.informatik.uni-mannheim.de/pubby/) and written in (server side) JavaScript.

Features:

* Provides a Linked Data interface to SPARQL protocol servers
* Provides an in-memory store suitable for smaller data sets and testing environments
* Provides a simple HTML interface showing the data available about each resource
* Support for multiple HTML templates based on namespace patterns
* HTML view is providing embedded JSON-LD which is rendered by client-side JavaScript
* Takes care of content-negotiation
* Runs well behind HTTP reverse proxies like Varnish
* Provides a SPARQL proxy and [YASR](http://yasr.yasgui.org/) (from YASGUI) as web frontend
* Does not do 303 redirects because you don't want to do an extra roundtrip

Requirements:

* A SPARQL endpoint (accessed via HTTP, needs to support JSON-LD for HTML view)
* Or for development some triples in a local file. In this case the built-in in-memory store can be used.

SOMEName supports all content-types provided by the SPARQL endpoint and does not do additional format conversion.

## Installation

SOMEName requires [Node.js](http://nodejs.org/) or [IO.js](https://iojs.org/). Make sure you have either of it installed. Once this is done clone the Github repository and run `npm install` to install all module dependencies.

SOMEName is using Bunyan for logging. To prettyprint log on the console you might want to install it globally using

    npm install -g bunyan

To start the server execute

    npm start | bunyan


Note that it is not recommended to run Node applications on [well-known ports](http://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers#Well-known_ports) (< 1024). You should use a reverse proxy like [Varnish](https://www.varnish-cache.org/) instead.

## Using it

`config.js` contains two configurations. The default configuration uses the SPARQL endpoint. The second configuration
uses the LDP module with an in memory store which might be useful during development. The in memory store does the graph
splitting in the init process, which takes some time. All configurations require a proxy which sets the
`X-Forwarded-Host` and `X-Forwarded-Port` header fields.

## Folder Structure

### data/graphs

This folder contains the named graphs per canton.

### data/public

Static files (JavaScript, CSS, images) for HTML rendering. `js/render-ld.js` contains the JSON-LD graph render code.


### data/scripts

Scripts for external applications (Fuseki), dynamic graph creation, etc.

### data/templates

HTML templates per canton.


## HTTPRange-14

SOMEName does not care about [HTTPRange-14](http://en.wikipedia.org/wiki/HTTPRange-14) and neither should you. We consider the extra 303 redirect roundtrip a waste of precious response time. You get back what you asked for in content-negotiation and if we ever do have to care about it, we would implement it using the  [Content-Location](http://tools.ietf.org/html/rfc7231#section-3.1.4.2) header field.

![Ceci n'est pas une pipe](http://upload.wikimedia.org/wikipedia/en/thumb/b/b9/MagrittePipe.jpg/300px-MagrittePipe.jpg)

As of now *Ceci n'est pas une pipe*, but it still [looks like one](http://en.wikipedia.org/wiki/The_Treachery_of_Images).

## License

Copyright 2015 Zazuko GmbH

SOMEName is licensed under the Apache License, Version 2.0. Please see LICENSE and NOTICE for details.
