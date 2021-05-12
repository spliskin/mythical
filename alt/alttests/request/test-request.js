const { getcached } = require('../harness.js');
const { test: t, TARGET, title } = getcached("../alt/request.js");

let Request = require(TARGET)._request;
var callAsync = require("../../../alt/test-utils/callAsync")
var xhrMock = require("../../../alt/test-utils/xhrMock")

t.spy = function(fn) {
    var spy = function() {
        spy.this = this
        spy.args = [].slice.call(arguments)
        spy.calls.push({this: this, args: spy.args})
        spy.callCount++

        if (fn) return fn.apply(this, arguments)
    }
    if (fn)
        Object.defineProperties(spy, {
            length: {value: fn.length},
            name: {value: fn.name}
        })
    spy.args = []
    spy.calls = []
    spy.callCount = 0
    return spy
}

t.group(title, () => {
    t.group('interface', () => {
        t.run('check', () => {
            t.ok(typeof(Request) === 'function');
        });
    });

    t.group("request", () => {
        var mock, request, complete
        t.beforeEach(() => {
            mock = xhrMock()
            complete = t.spy()
            request = Request(mock, Promise, complete).request
        })

        t.group("success", () => {
            t.run("works via GET", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 200, responseText: JSON.stringify({a: 1})}
                    }
                })
                request({method: "GET", url: "/item"})
                .then((data) => {
                    t.deepEqual(data, {a: 1})
                    done()
                })
            }))
            t.run("implicit GET method", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 200, responseText: JSON.stringify({a: 1})}
                    }
                })
                request({url: "/item"}).then(function(data) {
                    t.deepEqual(data, {a: 1})
                }).then(() => {
                    done()
                })
            }))
            t.run("first argument can be a string aliasing url property", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 200, responseText: JSON.stringify({a: 1})}
                    }
                })
                request("/item").then(function(data) {
                    t.deepEqual(data, {a: 1})
                }).then(() => {
                    done()
                })
            }))
            t.run("works via POST", t.wait((done) => {
                mock.$defineRoutes({
                    "POST /item": () => {
                        return {status: 200, responseText: JSON.stringify({a: 1})}
                    }
                })
                request({method: "POST", url: "/item"}).then(function(data) {
                    t.deepEqual(data, {a: 1})
                }).then(done)
            }))
            t.run("first argument can act as URI with second argument providing options", t.wait((done) => {
                mock.$defineRoutes({
                    "POST /item": () => {
                        return {status: 200, responseText: JSON.stringify({a: 1})}
                    }
                })
                request("/item", {method: "POST"}).then(function(data) {
                    t.deepEqual(data, {a: 1})
                }).then(done)
            }))
            t.run("first argument keeps protocol", t.wait((done) => {
                mock.$defineRoutes({
                    "POST /item": function(request) {
                        t.equal(request.rawUrl, "https://example.com/item")
                        return {status: 200, responseText: JSON.stringify({a: 1})}
                    }
                })
                request("https://example.com/item", {method: "POST"}).then(function(data) {
                    t.deepEqual(data, {a: 1})
                }).then(done)
            }))
            t.run("works w/ parameterized data via GET", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item": function(request) {
                        return {status: 200, responseText: JSON.stringify({a: request.query})}
                    }
                })
                request({method: "GET", url: "/item", params: {x: "y"}}).then(function(data) {
                    t.deepEqual(data, {a: "?x=y"})
                }).then(done)
            }))
            t.run("works w/ parameterized data via POST", t.wait((done) => {
                mock.$defineRoutes({
                    "POST /item": function(request) {
                        return {status: 200, responseText: JSON.stringify({a: JSON.parse(request.body)})}
                    }
                })
                request({method: "POST", url: "/item", body: {x: "y"}}).then(function(data) {
                    t.deepEqual(data, {a: {x: "y"}})
                }).then(done)
            }))
            t.run("works w/ parameterized data containing colon via GET", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item": function(request) {
                        return {status: 200, responseText: JSON.stringify({a: request.query})}
                    }
                })
                request({method: "GET", url: "/item", params: {x: ":y"}}).then(function(data) {
                    t.deepEqual(data, {a: "?x=%3Ay"})
                }).then(done)
            }))
            t.run("works w/ parameterized data containing colon via POST", t.wait((done) => {
                mock.$defineRoutes({
                    "POST /item": function(request) {
                        return {status: 200, responseText: JSON.stringify({a: JSON.parse(request.body)})}
                    }
                })
                request({method: "POST", url: "/item", body: {x: ":y"}}).then(function(data) {
                    t.deepEqual(data, {a: {x: ":y"}})
                }).then(done)
            }))
            t.run("works w/ parameterized url via GET", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item/y": function(request) {
                        return {status: 200, responseText: JSON.stringify({a: request.url, b: request.query, c: request.body})}
                    }
                })
                request({method: "GET", url: "/item/:x", params: {x: "y"}}).then(function(data) {
                    t.deepEqual(data, {a: "/item/y", b: {}, c: null})
                }).then(done)
            }))
            t.run("works w/ parameterized url via POST", t.wait((done) => {
                mock.$defineRoutes({
                    "POST /item/y": function(request) {
                        return {status: 200, responseText: JSON.stringify({a: request.url, b: request.query, c: request.body})}
                    }
                })
                request({method: "POST", url: "/item/:x", params: {x: "y"}}).then(function(data) {
                    t.deepEqual(data, {a: "/item/y", b: {}, c: null})
                }).then(done)
            }))
            t.run("works w/ parameterized url + body via GET", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item/y": function(request) {
                        return {status: 200, responseText: JSON.stringify({a: request.url, b: request.query, c: JSON.parse(request.body)})}
                    }
                })
                request({method: "GET", url: "/item/:x", params: {x: "y"}, body: {a: "b"}}).then(function(data) {
                    t.deepEqual(data, {a: "/item/y", b: {}, c: {a: "b"}})
                }).then(done)
            }))
            t.run("works w/ parameterized url + body via POST", t.wait((done) => {
                mock.$defineRoutes({
                    "POST /item/y": function(request) {
                        return {status: 200, responseText: JSON.stringify({a: request.url, b: request.query, c: JSON.parse(request.body)})}
                    }
                })
                request({method: "POST", url: "/item/:x", params: {x: "y"}, body: {a: "b"}}).then(function(data) {
                    t.deepEqual(data, {a: "/item/y", b: {}, c: {a: "b"}})
                }).then(done)
            }))
            t.run("works w/ parameterized url + query via GET", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item/y": function(request) {
                        return {status: 200, responseText: JSON.stringify({a: request.url, b: request.query, c: request.body})}
                    }
                })
                request({method: "GET", url: "/item/:x", params: {x: "y", q: "term"}}).then(function(data) {
                    t.deepEqual(data, {a: "/item/y", b: "?q=term", c: null})
                }).then(done)
            }))
            t.run("works w/ parameterized url + query via POST", t.wait((done) => {
                mock.$defineRoutes({
                    "POST /item/y": function(request) {
                        return {status: 200, responseText: JSON.stringify({a: request.url, b: request.query, c: request.body})}
                    }
                })
                request({method: "POST", url: "/item/:x", params: {x: "y", q: "term"}}).then(function(data) {
                    t.deepEqual(data, {a: "/item/y", b: "?q=term", c: null})
                }).then(done)
            }))
            t.run("works w/ parameterized url + query + body via GET", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item/y": function(request) {
                        return {status: 200, responseText: JSON.stringify({a: request.url, b: request.query, c: JSON.parse(request.body)})}
                    }
                })
                request({method: "GET", url: "/item/:x", params: {x: "y", q: "term"}, body: {a: "b"}}).then(function(data) {
                    t.deepEqual(data, {a: "/item/y", b: "?q=term", c: {a: "b"}})
                }).then(done)
            }))
            t.run("works w/ parameterized url + query + body via POST", t.wait((done) => {
                mock.$defineRoutes({
                    "POST /item/y": function(request) {
                        return {status: 200, responseText: JSON.stringify({a: request.url, b: request.query, c: JSON.parse(request.body)})}
                    }
                })
                request({method: "POST", url: "/item/:x", params: {x: "y", q: "term"}, body: {a: "b"}}).then(function(data) {
                    t.deepEqual(data, {a: "/item/y", b: "?q=term", c: {a: "b"}})
                }).then(done)
            }))
            t.run("works w/ array", t.wait((done) => {
                mock.$defineRoutes({
                    "POST /items": function(request) {
                        return {status: 200, responseText: JSON.stringify({a: request.url, b: JSON.parse(request.body)})}
                    }
                })
                request({method: "POST", url: "/items", body: [{x: "y"}]}).then(function(data) {
                    t.deepEqual(data, {a: "/items", b: [{x: "y"}]})
                }).then(done)
            }))
            t.run("ignores unresolved parameter via GET", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item/:x": function(request) {
                        return {status: 200, responseText: JSON.stringify({a: request.url})}
                    }
                })
                request({method: "GET", url: "/item/:x"}).then(function(data) {
                    t.deepEqual(data, {a: "/item/:x"})
                }).then(done)
            }))
            t.run("ignores unresolved parameter via POST", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item/:x": function(request) {
                        return {status: 200, responseText: JSON.stringify({a: request.url})}
                    }
                })
                request({method: "GET", url: "/item/:x"}).then(function(data) {
                    t.deepEqual(data, {a: "/item/:x"})
                }).then(done)
            }))
            t.run("type parameter works for Array responses", t.wait((done) => {
                var Entity = function(args) {
                    return {_id: args.id}
                }

                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 200, responseText: JSON.stringify([{id: 1}, {id: 2}, {id: 3}])}
                    }
                })
                request({method: "GET", url: "/item", type: Entity}).then(function(data) {
                    t.deepEqual(data, [{_id: 1}, {_id: 2}, {_id: 3}])
                }).then(done)
            }))
            t.run("type parameter works for Object responses", t.wait((done) => {
                var Entity = function(args) {
                    return {_id: args.id}
                }

                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 200, responseText: JSON.stringify({id: 1})}
                    }
                })
                request({method: "GET", url: "/item", type: Entity}).then(function(data) {
                    t.deepEqual(data, {_id: 1})
                }).then(done)
            }))
            t.run("serialize parameter works in GET", t.wait((done) => {
                var serialize = function(data) {
                    return "id=" + data.id
                }

                mock.$defineRoutes({
                    "GET /item": function(request) {
                        return {status: 200, responseText: JSON.stringify({body: request.query})}
                    }
                })
                request({method: "GET", url: "/item", serialize: serialize, params: {id: 1}}).then(function(data) {
                    t.equal(data.body, "?id=1")
                }).then(done)
            }))
            t.run("serialize parameter works in POST", t.wait((done) => {
                var serialize = function(data) {
                    return "id=" + data.id
                }

                mock.$defineRoutes({
                    "POST /item": function(request) {
                        return {status: 200, responseText: JSON.stringify({body: request.body})}
                    }
                })
                request({method: "POST", url: "/item", serialize: serialize, body: {id: 1}}).then(function(data) {
                    t.equal(data.body, "id=1")
                }).then(done)
            }))
            t.run("deserialize parameter works in GET", t.wait((done) => {
                var deserialize = function(data) {
                    return data
                }

                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 200, responseText: JSON.stringify({test: 123})}
                    }
                })
                request({method: "GET", url: "/item", deserialize: deserialize}).then(function(data) {
                    t.deepEqual(data, {test: 123})
                }).then(done)
            }))
            t.run("deserialize parameter works in POST", t.wait((done) => {
                var deserialize = function(data) {
                    return data
                }

                mock.$defineRoutes({
                    "POST /item": () => {
                        return {status: 200, responseText: JSON.stringify({test: 123})}
                    }
                })
                request({method: "POST", url: "/item", deserialize: deserialize}).then(function(data) {
                    t.deepEqual(data, {test: 123})
                }).then(done)
            }))
            t.run("extract parameter works in GET", t.wait((done) => {
                var extract = () => {
                    return {test: 123}
                }

                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 200, responseText: ""}
                    }
                })
                request({method: "GET", url: "/item", extract: extract}).then(function(data) {
                    t.deepEqual(data, {test: 123})
                }).then(done)
            }))
            t.run("extract parameter works in POST", t.wait((done) => {
                var extract = () => {
                    return {test: 123}
                }

                mock.$defineRoutes({
                    "POST /item": () => {
                        return {status: 200, responseText: ""}
                    }
                })
                request({method: "POST", url: "/item", extract: extract}).then(function(data) {
                    t.deepEqual(data, {test: 123})
                }).then(done)
            }))
            t.run("ignores deserialize if extract is defined", t.wait((done) => {
                var extract = function(data) {
                    return data.status
                }
                var deserialize = t.spy()

                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 200, responseText: ""}
                    }
                })
                request({method: "GET", url: "/item", extract: extract, deserialize: deserialize}).then(function(data) {
                    t.equal(data, 200)
                }).then(() => {
                    t.equal(deserialize.callCount, 0)
                }).then(done)
            }))
            t.run("config parameter works", t.wait((done) => {
                mock.$defineRoutes({
                    "POST /item": () => {
                        return {status: 200, responseText: ""}
                    }
                })
                request({method: "POST", url: "/item", config: config}).then(done)

                function config(xhr) {
                    t.equal(typeof xhr.setRequestHeader, "function")
                    t.equal(typeof xhr.open, "function")
                    t.equal(typeof xhr.send, "function")
                }
            }))

            t.run("requests don't block each other", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 200, responseText: "[]"}
                    }
                })
                request("/item").then(() => {
                    return request("/item")
                })
                request("/item").then(() => {
                    return request("/item")
                })
                setTimeout(() => {
                    t.equal(complete.callCount, 4)
                    done()
                }, 20)
            }))

            t.run("requests trigger finally once with a chained then", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 200, responseText: "[]"}
                    }
                })
                var promise = request("/item")
                promise.then(() => {}).then(() => {})
                promise.then(() => {}).then(() => {})
                setTimeout(() => {
                    t.equal(complete.callCount, 1)
                    done()
                }, 20)
            }))
            t.run("requests does not trigger finally when background: true", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 200, responseText: "[]"}
                    }
                })
                request("/item", {background: true}).then(() => {})

                setTimeout(() => {
                    t.equal(complete.callCount, 0)
                    done()
                }, 20)
            }))
            t.run("headers are set when header arg passed", t.wait((done) => {
                mock.$defineRoutes({
                    "POST /item": () => {
                        return {status: 200, responseText: ""}
                    }
                })
                request({method: "POST", url: "/item", config: config, headers: {"Custom-Header": "Value"}}).then(done)

                function config(xhr) {
                    t.equal(xhr.getRequestHeader("Custom-Header"), "Value")
                }
            }))
            t.run("headers are with higher precedence than default headers", t.wait((done) => {
                mock.$defineRoutes({
                    "POST /item": () => {
                        return {status: 200, responseText: ""}
                    }
                })
                request({method: "POST", url: "/item", config: config, headers: {"Content-Type": "Value"}}).then(done)

                function config(xhr) {
                    t.equal(xhr.getRequestHeader("Content-Type"), "Value")
                }
            }))
            t.run("doesn't fail on abort", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 200, responseText: JSON.stringify({a: 1})}
                    }
                })

                var failed = false
                var resolved = false
                function handleAbort(xhr) {
                    var onreadystatechange = xhr.onreadystatechange
                    xhr.onreadystatechange = () => {
                        onreadystatechange.call(xhr, {target: xhr})
                        setTimeout(() => { // allow promises to (not) resolve first
                            t.equal(failed, false)
                            t.equal(resolved, false)
                            done()
                        }, 0)
                    }
                    xhr.abort()
                }
                request({method: "GET", url: "/item", config: handleAbort}).catch(() => {
                    failed = true
                })
                    .then(() => {
                        resolved = true
                    })
            }))
            t.run("doesn't fail on replaced abort", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 200, responseText: JSON.stringify({a: 1})}
                    }
                })

                var failed = false
                var resolved = false
                var abortSpy = t.spy()
                var replacement
                function handleAbort(xhr) {
                    var onreadystatechange = xhr.onreadystatechange
                    xhr.onreadystatechange = () => {
                        onreadystatechange.call(xhr, {target: xhr})
                        setTimeout(() => { // allow promises to (not) resolve first
                            t.equal(failed, false)
                            t.equal(resolved, false)
                            done()
                        }, 0)
                    }
                    return replacement = {
                        send: xhr.send.bind(xhr),
                        abort: abortSpy,
                    }
                }
                request({method: "GET", url: "/item", config: handleAbort}).then(() => {
                    resolved = true
                }, () => {
                    failed = true
                })
                replacement.abort()
                t.equal(abortSpy.callCount, 1)
            }))
            t.run("doesn't fail on file:// status 0", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 0, responseText: JSON.stringify({a: 1})}
                    }
                })
                var failed = false
                request({method: "GET", url: "file:///item"}).catch(() => {
                    failed = true
                }).then(function(data) {
                    t.equal(failed, false)
                    t.deepEqual(data, {a: 1})
                }).then(() => {
                    done()
                })
            }))
            t.run("set timeout to xhr instance", async () => {
                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 200, responseText: ""}
                    }
                })
                return request({
                    method: "GET", url: "/item",
                    timeout: 42,
                    config: function(xhr) {
                        t.equal(xhr.timeout, 42)
                    }
                })
            })
            t.run("set responseType to request instance", async () => {
                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 200, responseText: ""}
                    }
                })
                return request({
                    method: "GET", url: "/item",
                    responseType: "blob",
                    config: function(xhr) {
                        t.equal(xhr.responseType, "blob")
                    }
                })
            })
            t.run("params unmodified after interpolate", async () => {
                mock.$defineRoutes({
                    "PUT /items/1": () => {
                        return {status: 200, responseText: "[]"}
                    }
                })
                var params = {x: 1, y: 2}
                var p = request({method: "PUT", url: "/items/:x", params: params})

                t.deepEqual(params, {x: 1, y: 2})

                return p
            })
            t.run("can return replacement from config", async () => {
                mock.$defineRoutes({
                    "GET /a": () => {
                        return {status: 200, responseText: "[]"}
                    }
                })
                var result
                return request({
                    url: "/a",
                    config: function(xhr) {
                        return result = {
                            send: t.spy(xhr.send.bind(xhr)),
                        }
                    },
                })
                .then(function () {
                    t.equal(result.send.callCount, 1)
                })
            })
            t.run("can abort from replacement", () => {
                mock.$defineRoutes({
                    "GET /a": () => {
                        return {status: 200, responseText: "[]"}
                    }
                })
                var result

                request({
                    url: "/a",
                    config: function(xhr) {
                        return result = {
                            send: t.spy(xhr.send.bind(xhr)),
                            abort: t.spy(),
                        }
                    },
                })

                result.abort()
            })
        })
        t.group("failure", () => {
            t.run("rejects on server error", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 500, responseText: JSON.stringify({error: "error"})}
                    }
                })
                request({method: "GET", url: "/item"})
                .catch(function(e) {
                    t.equal(e instanceof Error, true)
                    t.equal(e.message, "[object Object]")
                    t.deepEqual(e.response, {error: "error"})
                    t.equal(e.code, 500)
                })
                .then(done)
            }))
            t.run("adds response to Error", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 500, responseText: JSON.stringify({message: "error", stack: "error on line 1"})}
                    }
                })
                request({method: "GET", url: "/item"}).catch(function(e) {
                    t.equal(e instanceof Error, true)
                    t.equal(e.response.message, "error")
                    t.equal(e.response.stack, "error on line 1")
                }).then(done)
            }))
            t.run("rejects on non-JSON server error", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 500, responseText: "error"}
                    }
                })
                request({method: "GET", url: "/item"}).catch(function(e) {
                    t.equal(e.message, "null")
                    t.equal(e.response, null)
                }).then(done)
            }))
            t.run("triggers all branched catches upon rejection", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 500, responseText: "error"}
                    }
                })
                var promise = request({method: "GET", url: "/item"})
                var then = t.spy()
                var catch1 = t.spy()
                var catch2 = t.spy()
                var catch3 = t.spy()

                promise.catch(catch1)
                promise.then(then, catch2)
                promise.then(then).catch(catch3)

                callAsync(() => {
                    callAsync(() => {
                        callAsync(() => {
                            t.equal(catch1.callCount, 1)
                            t.equal(then.callCount, 0)
                            t.equal(catch2.callCount, 1)
                            t.equal(catch3.callCount, 1)
                            done()
                        })
                    })
                })
            }))
            t.run("rejects on cors-like error", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 0}
                    }
                })
                request({method: "GET", url: "/item"}).catch(function(e) {
                    t.equal(e instanceof Error, true)
                }).then(done)
            }))
            t.run("rejects on request timeout", t.wait((done) => {
                var timeout = 50
                var timeToGetItem = timeout + 1

                mock.$defineRoutes({
                    "GET /item": () => {
                        return new Promise(function(resolve) {
                            setTimeout(() => {
                                resolve({status: 200})
                            }, timeToGetItem)
                        })
                    }
                })

                request({
                    method: "GET", url: "/item",
                    timeout: timeout
                }).catch(function(e) {
                    t.equal(e instanceof Error, true)
                    t.equal(e.message, "Request timed out")
                    t.equal(e.code, 0)
                }).then(() => {
                    done()
                })
            }))
            t.run("does not reject when time to request resource does not exceed timeout", t.wait((done) => {
                var timeout = 50
                var timeToGetItem = timeout - 1
                var isRequestRejected = false

                mock.$defineRoutes({
                    "GET /item": () => {
                        return new Promise(function(resolve) {
                            setTimeout(() => {
                                resolve({status: 200})
                            }, timeToGetItem)
                        })
                    }
                })

                request({
                    method: "GET", url: "/item",
                    timeout: timeout
                }).catch(function(e) {
                    isRequestRejected = true
                    t.notEqual(e.message, "Request timed out")
                }).then(() => {
                    t.equal(isRequestRejected, false)
                    done()
                })
            }))
            t.run("does not reject on status error code when extract provided", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 500, responseText: JSON.stringify({message: "error"})}
                    }
                })
                request({
                    method: "GET", url: "/item",
                    extract: function(xhr) {return JSON.parse(xhr.responseText)}
                }).then(function(data) {
                    t.equal(data.message, "error")
                    done()
                })
            }))
            t.run("rejects on error in extract", t.wait((done) => {
                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 200, responseText: JSON.stringify({a: 1})}
                    }
                })
                request({
                    method: "GET", url: "/item",
                    extract: () => {throw new Error("error")}
                }).catch(function(e) {
                    t.equal(e instanceof Error, true)
                    t.equal(e.message, "error")
                }).then(() => {
                    done()
                })
            }))
        })
        t.group("json header", () => {
            function checkUnset(method) {
                t.run("doesn't set header on " + method + " without body", t.wait(async (done) => {
                    var routes = {}
                    routes[method + " /item"] = () => {
                        return {status: 200, responseText: JSON.stringify({a: 1})}
                    }
                    mock.$defineRoutes(routes)
                    var out = await request({
                        method: method, url: "/item",
                        config: function(xhr) {
                            var header = xhr.getRequestHeader("Content-Type")
                            t.equal(header, undefined)
                            header = xhr.getRequestHeader("Accept")
                            t.equal(header, "application/json, text/*")
                        }
                    }).then(function(result) {
                        t.deepEqual(result, {a: 1})
                        done()
                    }).catch(function(e) {
                        done(e)
                    })
                    console.log(out);
                }))
            }

            function checkSet(method, body) {
                t.run("sets header on " + method + " with body", t.wait((done) => {
                    var routes = {}
                    routes[method + " /item"] = function(response) {
                        return {
                            status: 200,
                            responseText: JSON.stringify({body: JSON.parse(response.body)}),
                        }
                    }
                    mock.$defineRoutes(routes)
                    request({
                        method: method, url: "/item", body: body,
                        config: function(xhr) {
                            var header = xhr.getRequestHeader("Content-Type")
                            t.equal(header, "application/json; charset=utf-8")
                            header = xhr.getRequestHeader("Accept")
                            t.equal(header, "application/json, text/*")
                        }
                    }).then(function(result) {
                        t.deepEqual(result, {body: body})
                        done()
                    }).catch(function(e) {
                        done(e)
                    })
                }))
            }

            checkUnset("GET")
            checkUnset("HEAD")
            checkUnset("OPTIONS")
            checkUnset("POST")
            checkUnset("PUT")
            checkUnset("DELETE")
            checkUnset("PATCH")

            checkSet("GET", {foo: "bar"})
            checkSet("HEAD", {foo: "bar"})
            checkSet("OPTIONS", {foo: "bar"})
            checkSet("POST", {foo: "bar"})
            checkSet("PUT", {foo: "bar"})
            checkSet("DELETE", {foo: "bar"})
            checkSet("PATCH", {foo: "bar"})
        })

        // See: https://github.com/MithrilJS/mithril.js/issues/2426
        //
        // TL;DR: lots of subtlety. Make sure you read the ES spec closely before
        // updating this code or the corresponding finalizer code in
        // `request/request` responsible for scheduling autoredraws, or you might
        // inadvertently break things.
        //
        // The precise behavior here is that it schedules a redraw immediately after
        // the second tick *after* the promise resolves, but `await` in engines that
        // have implemented the change in https://github.com/tc39/ecma262/pull/1250
        // will only take one tick to get the value. Engines that haven't
        // implemented that spec change would wait until the tick after the redraw
        // was scheduled before it can see the new value. But this only applies when
        // the engine needs to coerce the value, and this is where things get a bit
        // hairy. As per spec, V8 checks the `.constructor` property of promises and
        // if that `=== Promise`, it does *not* coerce it using `.then`, but instead
        // just resolves it directly. This, of course, can screw with our autoredraw
        // behavior, and we have to work around that. At the time of writing, no
        // other browser checks for this additional constraint, and just blindly
        // invokes `.then` instead, and so we end up working as anticipated. But for
        // obvious reasons, it's a bad idea to rely on a spec violation for things
        // to work unless the spec itself is clearly broken (in this case, it's
        // not). And so we need to test for this very unusual edge case.
        //
        // The direct `eval` is just so I can convert early errors to runtime
        // errors without having to explicitly wire up all the bindings set up in
        // `o.beforeEach`. I evaluate it immediately inside a `try`/`catch` instead
        // of inside the test code so any relevant syntax error can be detected
        // ahead of time and the test skipped entirely. It might trigger mental
        // alarms because `eval` is normally asking for problems, but this is a
        // rare case where it's genuinely safe and rational.
        try {
            // eslint-disable-next-line no-eval
            var runAsyncTest = eval(
                "async () => {\n" +
                "    var p = request('/item')\n" +
                "    t.equal(complete.callCount, 0)\n" +
                // Note: this step does *not* invoke `.then` on the promise returned
                // from `p.then(resolve, reject)`.
                "    await p\n" +
                // The spec prior to https://github.com/tc39/ecma262/pull/1250 used
                // to take 3 ticks instead of 1, so `complete` would have been
                // called already and we would've been done. After it, it now takes
                // 1 tick and so `complete` wouldn't have yet been called - it takes
                // 2 ticks to get called. And so we have to wait for one more ticks
                // for `complete` to get called.
                "    await null\n" +
                "    t.equal(complete.callCount, 1)\n" +
                "}"
            )

            t.run("invokes the redraw in native async/await", function () {
                // Use the native promise for correct semantics. This test will fail
                // if you use the polyfill, as it's based on `setImmediate` (falling
                // back to `setTimeout`), and promise microtasks are run at higher
                // priority than either of those.
                request = Request(mock, Promise, complete).request
                mock.$defineRoutes({
                    "GET /item": () => {
                        return {status: 200, responseText: "[]"}
                    }
                })
                return runAsyncTest()
            })
        } catch (e) {
            // ignore - this is just for browsers that natively support
            // `async`/`await`, like most modern browsers.
            // it's just a syntax error anyways.
        }
    })
});