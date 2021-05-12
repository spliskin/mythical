const { TARGET, test: t } = require('../harness.js').nogen("../alt/stream.js", "==== stream.js ============")
const Stream = require(TARGET)

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

t.group("stream", function() {
	t.group("stream", function() {
		t.run("works as getter/setter", function() {
			var stream = Stream(1)
			var initialValue = stream()
			stream(2)
			var newValue = stream()

			t.equal(initialValue, 1)
			t.equal(newValue, 2)
		})
		t.run("has undefined value by default", function() {
			var stream = Stream()

			t.equal(stream(), undefined)
		})
		t.run("can update to undefined", function() {
			var stream = Stream(1)
			stream(undefined)

			t.equal(stream(), undefined)
		})
		t.run("can be stream of streams", function() {
			var stream = Stream(Stream(1))

			t.equal(stream()(), 1)
		})
		t.run("can SKIP", function() {
			var a = Stream(2)
			var b = a.map(function(value) {
				return value === 5
					? Stream.SKIP
					: value
			})

			a(5)

			t.equal(b(), 2)
		})
		// NOTE: this *must* be the *only* uses of `Stream.HALT` in the entire
		// test suite.
		t.run("HALT is a deprecated alias of SKIP and warns once", function() {
			var log = console.log
			var warnings = []
			console.log = function(a) {
				warnings.push(a)
			}

			try {
				t.equal(Stream.HALT, Stream.SKIP)
				t.deepEqual(warnings, ["HALT is deprecated and has been renamed to SKIP"])
				t.equal(Stream.HALT, Stream.SKIP)
				t.deepEqual(warnings, ["HALT is deprecated and has been renamed to SKIP"])
				t.equal(Stream.HALT, Stream.SKIP)
				t.deepEqual(warnings, ["HALT is deprecated and has been renamed to SKIP"])
			} finally {
				console.log = log
			}
		})
	})
	t.group("combine", function() {
		t.run("transforms value", function() {
			var stream = Stream()
			var doubled = Stream.combine(function(s) {return s() * 2}, [stream])

			stream(2)

			t.equal(doubled(), 4)
		})
		t.run("transforms default value", function() {
			var stream = Stream(2)
			var doubled = Stream.combine(function(s) {return s() * 2}, [stream])

			t.equal(doubled(), 4)
		})
		t.run("transforms multiple values", function() {
			var s1 = Stream()
			var s2 = Stream()
			var added = Stream.combine(function(s1, s2) {return s1() + s2()}, [s1, s2])

			s1(2)
			s2(3)

			t.equal(added(), 5)
		})
		t.run("transforms multiple default values", function() {
			var s1 = Stream(2)
			var s2 = Stream(3)
			var added = Stream.combine(function(s1, s2) {return s1() + s2()}, [s1, s2])

			t.equal(added(), 5)
		})
		t.run("transforms mixed default and late-bound values", function() {
			var s1 = Stream(2)
			var s2 = Stream()
			var added = Stream.combine(function(s1, s2) {return s1() + s2()}, [s1, s2])

			s2(3)

			t.equal(added(), 5)
		})
		t.run("combines atomically", function() {
			var count = 0
			var a = Stream()
			var b = Stream.combine(function(a) {return a() * 2}, [a])
			var c = Stream.combine(function(a) {return a() * a()}, [a])
			var d = Stream.combine(function(b, c) {
				count++
				return b() + c()
			}, [b, c])

			a(3)

			t.equal(d(), 15)
			t.equal(count, 1)
		})

		t.run("combines default value atomically", function() {
			var count = 0
			var a = Stream(3)
			var b = Stream.combine(function(a) {return a() * 2}, [a])
			var c = Stream.combine(function(a) {return a() * a()}, [a])
			var d = Stream.combine(function(b, c) {
				count++
				return b() + c()
			}, [b, c])

			t.equal(d(), 15)
			t.equal(count, 1)
		})
		t.run("combines and maps nested streams atomically", function() {
			var count = 0
			var a = Stream(3)
			var b = Stream.combine(function(a) {return a() * 2}, [a])
			var c = Stream.combine(function(a) {return a() * a()}, [a])
			var d = c.map(function(x){return x})
			var e = Stream.combine(function(x) {return x()}, [d])
			var f = Stream.combine(function(b, e) {
				count++
				return b() + e()
			}, [b, e])

			t.equal(f(), 15)
			t.equal(count, 1)
		})
		t.run("combine lists only changed upstreams in last arg", function() {
			var streams = []
			var a = Stream()
			var b = Stream()
			Stream.combine(function(a, b, changed) {
				streams = changed
			}, [a, b])

			a(3)
			b(5)

			t.equal(streams.length, 2)
			t.equal(streams[0], a)
			t.equal(streams[1], b)
		})
		t.run("combine continues with ended streams", function() {
			var a = Stream()
			var b = Stream()
			var combined = Stream.combine(function(a, b) {
				return a() + b()
			}, [a, b])

			a(3)
			a.end(true)
			b(5)

			t.equal(combined(), 8)
		})
		t.run("combine lists only changed upstreams in last arg with default value", function() {
			var streams = []
			var a = Stream(3)
			var b = Stream(5)
			Stream.combine(function(a, b, changed) {
				streams = changed
			}, [a, b])

			a(7)

			t.equal(streams.length, 1)
			t.equal(streams[0], a)
		})
		t.run("combine can return undefined", function() {
			var a = Stream(1)
			var b = Stream.combine(function() {
				return undefined
			}, [a])

			t.equal(b(), undefined)
		})
		t.run("combine can return stream", function() {
			var a = Stream(1)
			var b = Stream.combine(function() {
				return Stream(2)
			}, [a])

			t.equal(b()(), 2)
		})
		t.run("combine can return pending stream", function() {
			var a = Stream(1)
			var b = Stream.combine(function() {
				return Stream()
			}, [a])

			t.equal(b()(), undefined)
		})
		t.run("combine can skip", function() {
			var count = 0
			var a = Stream(1)
			var b = Stream.combine(function() {
				return Stream.SKIP
			}, [a])["fantasy-land/map"](function() {
				count++
				return 1
			})

			t.equal(b(), undefined)
			t.equal(count, 0)
		})
		t.run("combine can conditionaly skip", function() {
			var count = 0
			var skip = false
			var a = Stream(1)
			var b = Stream.combine(function(a) {
				if (skip) {
					return Stream.SKIP
				}
				return a()
			}, [a])["fantasy-land/map"](function(a) {
				count++
				return a
			})
			t.equal(b(), 1)
			t.equal(count, 1)
			skip = true
			count = 0
			a(2)
			t.equal(b(), 1)
			t.equal(count, 0)
		})
		t.run("combine will throw with a helpful error if given non-stream values", function () {
			var spy = t.spy()
			var a = Stream(1)
			var thrown = null;
			try {
				Stream.combine(spy, [a, ""])
			} catch (e) {
				thrown = e
			}

			t.notEqual(thrown, null)
			t.equal(thrown.constructor === TypeError, false)
			t.equal(spy.callCount, 0)
		})
		t.run("combine callback not called when child stream was ended", function () {
			var spy = t.spy()
			var a = Stream(1)
			var b = Stream(2)
			var mapped = Stream.combine(spy, [a, b])
			mapped.end(true)
			a(11)
			t.equal(spy.callCount, 1)
		})
	})
	t.group("lift", function() {
		t.run("transforms value", function() {
			var stream = Stream()
			var doubled = Stream.lift(function(s) {return s * 2}, stream)

			stream(2)

			t.equal(doubled(), 4)
		})
		t.run("transforms default value", function() {
			var stream = Stream(2)
			var doubled = Stream.lift(function(s) {return s * 2}, stream)

			t.equal(doubled(), 4)
		})
		t.run("transforms multiple values", function() {
			var s1 = Stream()
			var s2 = Stream()
			var added = Stream.lift(function(s1, s2) {return s1 + s2}, s1, s2)

			s1(2)
			s2(3)

			t.equal(added(), 5)
		})
		t.run("transforms multiple default values", function() {
			var s1 = Stream(2)
			var s2 = Stream(3)
			var added = Stream.lift(function(s1, s2) {return s1 + s2}, s1, s2)

			t.equal(added(), 5)
		})
		t.run("transforms mixed default and late-bound values", function() {
			var s1 = Stream(2)
			var s2 = Stream()
			var added = Stream.lift(function(s1, s2) {return s1 + s2}, s1, s2)

			s2(3)

			t.equal(added(), 5)
		})
		t.run("lifts atomically", function() {
			var count = 0
			var a = Stream()
			var b = Stream.lift(function(a) {return a * 2}, a)
			var c = Stream.lift(function(a) {return a * a}, a)
			var d = Stream.lift(function(b, c) {
				count++
				return b + c
			}, b, c)

			a(3)

			t.equal(d(), 15)
			t.equal(count, 1)
		})
		t.run("lifts default value atomically", function() {
			var count = 0
			var a = Stream(3)
			var b = Stream.lift(function(a) {return a * 2}, a)
			var c = Stream.lift(function(a) {return a * a}, a)
			var d = Stream.lift(function(b, c) {
				count++
				return b + c
			}, b, c)

			t.equal(d(), 15)
			t.equal(count, 1)
		})
		t.run("lift can return undefined", function() {
			var a = Stream(1)
			var b = Stream.lift(function() {
				return undefined
			}, a)

			t.equal(b(), undefined)
		})
		t.run("lift can return stream", function() {
			var a = Stream(1)
			var b = Stream.lift(function() {
				return Stream(2)
			}, a)

			t.equal(b()(), 2)
		})
		t.run("lift can return pending stream", function() {
			var a = Stream(1)
			var b = Stream.lift(function() {
				return Stream()
			}, a)

			t.equal(b()(), undefined)
		})
		t.run("lift can halt", function() {
			var count = 0
			var a = Stream(1)
			var b = Stream.lift(function() {
				return Stream.SKIP
			}, a)["fantasy-land/map"](function() {
				count++
				return 1
			})

			t.equal(b(), undefined)
			t.equal(count, 0)
		})
		t.run("lift will throw with a helpful error if given non-stream values", function () {
			var spy = t.spy()
			var a = Stream(1)
			var thrown = null;
			try {
				Stream.lift(spy, a, "")
			} catch (e) {
				thrown = e
			}

			t.notEqual(thrown, null)
			t.equal(thrown.constructor === TypeError, false)
			t.equal(spy.callCount, 0)
		})
	})
	t.group("merge", function() {
		t.run("transforms an array of streams to an array of values", function() {
			var all = Stream.merge([
				Stream(10),
				Stream("20"),
				Stream({value: 30}),
			])

			t.deepEqual(all(), [10, "20", {value: 30}])
		})
		t.run("remains pending until all streams are active", function() {
			var straggler = Stream()

			var all = Stream.merge([
				Stream(10),
				Stream("20"),
				straggler,
			])

			t.equal(all(), undefined)

			straggler(30)
			t.deepEqual(all(), [10, "20", 30])
		})
		t.run("calls run callback after all parents are active", function() {
			var value = 0
			var id = function(value) {return value}
			var a = Stream()
			var b = Stream()

			Stream.merge([a.map(id), b.map(id)]).map(function(data) {
				value = data[0] + data[1]
				return undefined
			})

			a(1)
			b(2)
			t.equal(value, 3)

			a(3)
			b(4)
			t.equal(value, 7)
		})
	})
	t.group("end", function() {
		t.run("end stream works", function() {
			var stream = Stream()
			var doubled = Stream.combine(function(stream) {return stream() * 2}, [stream])

			stream.end(true)

			stream(3)

			t.equal(doubled(), undefined)
		})
		t.run("end stream works with default value", function() {
			var stream = Stream(2)
			var doubled = Stream.combine(function(stream) {return stream() * 2}, [stream])

			stream.end(true)

			stream(3)

			t.equal(doubled(), 4)
		})
		t.run("cannot add downstream to ended stream", function() {
			var stream = Stream(2)
			stream.end(true)

			var doubled = Stream.combine(function(stream) {return stream() * 2}, [stream])
			stream(3)

			t.equal(doubled(), undefined)
		})
		t.run("upstream does not affect ended stream", function() {
			var stream = Stream(2)
			var doubled = Stream.combine(function(stream) {return stream() * 2}, [stream])

			doubled.end(true)

			stream(4)

			t.equal(doubled(), 4)
		})
		t.run("end stream can be mapped to", function() {
			var stream = Stream()
			var spy = t.spy()

			stream.end.map(spy)

			t.equal(spy.callCount, 0)

			stream.end(true)

			t.equal(spy.callCount, 1)
		})
		t.run("ended stream works like a container", function() {
			var stream = Stream(1)
			stream.end(true)
			stream(2)
			t.equal(stream(), 2)
		})
		// https://github.com/MithrilJS/mithril.js/issues/2601
		t.run("ended stream doesn't affect emit of subsequent streams", function() {
			const refreshing = Stream()
			const o1Received = []
			const waitingReceived = []
			const o2Received = []
			const o3Received = []
			const o4Received = []

			/* eslint-disable array-callback-return */
			refreshing.map(function(v) { o1Received.push(v) })

			const waiting = refreshing.map(function(v) {
				waitingReceived.push(v)
				if (v === false) {
					waiting.end(true)
				}
			})

			refreshing.map(function(v) { o2Received.push(v) })
			refreshing.map(function(v) { o3Received.push(v) })
			refreshing.map(function(v) { o4Received.push(v) })
			/* eslint-enable array-callback-return */

			refreshing(true)
			refreshing(false)
			refreshing("more")

			t.deepEqual(o1Received, [true, false, "more"])
			t.deepEqual(waitingReceived, [true, false])
			t.deepEqual(o2Received, [true, false, "more"])
			t.deepEqual(o3Received, [true, false, "more"])
			t.deepEqual(o4Received, [true, false, "more"])
		})
	})
	t.group("toJSON", function() {
		t.run("works", function() {
			t.equal(Stream(1).toJSON(), 1)
			t.equal(Stream("a").toJSON(), "a")
			t.equal(Stream(true).toJSON(), true)
			t.equal(Stream(null).toJSON(), null)
			t.equal(Stream(undefined).toJSON(), undefined)
			t.deepEqual(Stream({a: 1}).toJSON(), {a: 1})
			t.deepEqual(Stream([1, 2, 3]).toJSON(), [1, 2, 3])
			t.equal(Stream().toJSON(), undefined)
			t.equal(Stream(new Date(0)).toJSON(), new Date(0).toJSON())
		})
		t.run("works w/ JSON.stringify", function() {
			t.equal(JSON.stringify(Stream(1)), JSON.stringify(1))
			t.equal(JSON.stringify(Stream("a")), JSON.stringify("a"))
			t.equal(JSON.stringify(Stream(true)), JSON.stringify(true))
			t.equal(JSON.stringify(Stream(null)), JSON.stringify(null))
			t.equal(JSON.stringify(Stream(undefined)), JSON.stringify(undefined))
			t.deepEqual(JSON.stringify(Stream({a: 1})), JSON.stringify({a: 1}))
			t.deepEqual(JSON.stringify(Stream([1, 2, 3])), JSON.stringify([1, 2, 3]))
			t.equal(JSON.stringify(Stream()), JSON.stringify(undefined))
			t.equal(JSON.stringify(Stream(new Date(0))), JSON.stringify(new Date(0)))
		})
	})
	t.group("map", function() {
		t.run("works", function() {
			var stream = Stream()
			var doubled = stream["fantasy-land/map"](function(value) {return value * 2})

			stream(3)

			t.equal(doubled(), 6)
		})
		t.run("works with default value", function() {
			var stream = Stream(3)
			var doubled = stream["fantasy-land/map"](function(value) {return value * 2})

			t.equal(doubled(), 6)
		})
		t.run("works with undefined value", function() {
			var stream = Stream()
			var mapped = stream["fantasy-land/map"](function(value) {return String(value)})

			stream(undefined)

			t.equal(mapped(), "undefined")
		})
		t.run("works with default undefined value", function() {
			var stream = Stream(undefined)
			var mapped = stream["fantasy-land/map"](function(value) {return String(value)})

			t.equal(mapped(), "undefined")
		})
		t.run("works with pending stream", function() {
			var stream = Stream(undefined)
			var mapped = stream["fantasy-land/map"](function() {return Stream()})

			t.equal(mapped()(), undefined)
		})
		t.run("has alias", function() {
			var stream = Stream(undefined)

			t.equal(stream["fantasy-land/map"], stream.map)
		})
		t.run("mapping function is not invoked after ending", function () {
			var stream = Stream(undefined)
			var fn = t.spy()
			var mapped = stream.map(fn)
			mapped.end(true)
			stream(undefined)
			t.equal(fn.callCount, 1)
		})
	})
	t.group("ap", function() {
		t.run("works", function() {
			var apply = Stream(function(value) {return value * 2})
			var stream = Stream(3)
			var applied = stream["fantasy-land/ap"](apply)

			t.equal(applied(), 6)

			apply(function(value) {return value / 3})

			t.equal(applied(), 1)

			stream(9)

			t.equal(applied(), 3)
		})
		t.run("works with undefined value", function() {
			var apply = Stream(function(value) {return String(value)})
			var stream = Stream(undefined)
			var applied = stream["fantasy-land/ap"](apply)

			t.equal(applied(), "undefined")

			apply(function(value) {return String(value) + "a"})

			t.equal(applied(), "undefineda")
		})
	})
	t.group("fantasy-land", function() {
		t.group("functor", function() {
			t.run("identity", function() {
				var stream = Stream(3)
				var mapped = stream["fantasy-land/map"](function(value) {return value})

				t.equal(stream(), mapped())
			})
			t.run("composition", function() {
				function f(x) {return x * 2}
				function g(x) {return x * x}

				var stream = Stream(3)

				var mapped = stream["fantasy-land/map"](function(value) {return f(g(value))})
				var composed = stream["fantasy-land/map"](g)["fantasy-land/map"](f)

				t.equal(mapped(), 18)
				t.equal(mapped(), composed())
			})
		})
		t.group("apply", function() {
			t.run("composition", function() {
				var a = Stream(function(value) {return value * 2})
				var u = Stream(function(value) {return value * 3})
				var v = Stream(5)

				var mapped = v["fantasy-land/ap"](u["fantasy-land/ap"](a["fantasy-land/map"](function(f) {
					return function(g) {
						return function(x) {
							return f(g(x))
						}
					}
				})))

				var composed = v["fantasy-land/ap"](u)["fantasy-land/ap"](a)

				t.equal(mapped(), 30)
				t.equal(mapped(), composed())
			})
		})
		t.group("applicative", function() {
			t.run("identity", function() {
				var a = Stream["fantasy-land/of"](function(value) {return value})
				var v = Stream(5)

				t.equal(v["fantasy-land/ap"](a)(), 5)
				t.equal(v["fantasy-land/ap"](a)(), v())
			})
			t.run("homomorphism", function() {
				var a = Stream(0)
				var f = function(value) {return value * 2}
				var x = 3

				t.equal(a.constructor["fantasy-land/of"](x)["fantasy-land/ap"](a.constructor["fantasy-land/of"](f))(), 6)
				t.equal(a.constructor["fantasy-land/of"](x)["fantasy-land/ap"](a.constructor["fantasy-land/of"](f))(), a.constructor["fantasy-land/of"](f(x))())
			})
			t.run("interchange", function() {
				var u = Stream(function(value) {return value * 2})
				var a = Stream()
				var y = 3

				t.equal(a.constructor["fantasy-land/of"](y)["fantasy-land/ap"](u)(), 6)
				t.equal(a.constructor["fantasy-land/of"](y)["fantasy-land/ap"](u)(), u["fantasy-land/ap"](a.constructor["fantasy-land/of"](function(f) {return f(y)}))())
			})
		})
	})
})
