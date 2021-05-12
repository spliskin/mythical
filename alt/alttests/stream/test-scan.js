const { TARGET, test: t } = require('../harness.js').nogen("../alt/stream.js", "==== stream.js ============")
const stream = require(TARGET)

t.group("scan", function() {
	t.run("defaults to seed", function() {
		var parent = stream()
		var child = stream.scan(function(out, p) {
			return out - p
		}, 123, parent)
		t.equal(child(), 123)
	})

	t.run("accumulates values as expected", function() {
		var parent = stream()
		var child = stream.scan(function(arr, p) {
			return arr.concat(p)
		}, [], parent)

		parent(7)
		parent("11")
		parent(undefined)
		parent({a: 1})
		var result = child()

		// deepEquals fails on arrays?
		t.equal(result[0], 7)
		t.equal(result[1], "11")
		t.equal(result[2], undefined)
		t.deepEqual(result[3], {a: 1})
	})

	t.run("reducer can return SKIP to prevent child updates", function() {
		var count = 0
		var action = stream()
		var store = stream.scan(function (arr, value) {
			switch (typeof value) {
				case "number":
					return arr.concat(value)
				default:
					return stream.SKIP
			}
		}, [], action)
		var child = store.map(function (p) {
			count++
			return p
		})
		var result

		action(7)
		action("11")
		action(undefined)
		action({a: 1})
		action(8) // assures we didn't break the accumulator

		result = child()

		// check we got the expect result
		t.equal(result[0], 7)
		t.equal(result[1], 8)

		// check child received minimum # of updates
		t.equal(count, 3)
	})

})
