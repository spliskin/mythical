const { TARGET, test: t } = require('../harness.js').nogen("../alt/stream.js", "==== stream.js ============")
const stream = require(TARGET)

t.group("scanMerge", function() {
	t.run("defaults to seed", function() {
		var parent1 = stream()
		var parent2 = stream()

		var child = stream.scanMerge([
			[parent1, function(out, p1) {
				return out + p1
			}],
			[parent2, function(out, p2) {
				return out + p2
			}]
		], -10)

		t.equal(child(), -10)
	})

	t.run("accumulates as expected", function() {
		var parent1 = stream()
		var parent2 = stream()

		var child = stream.scanMerge([
			[parent1, function(out, p1) {
				return out + p1
			}],
			[parent2, function(out, p2) {
				return out + p2 + p2
			}]
		], "a")

		parent1("b")
		parent2("c")
		parent1("b")

		t.equal(child(), "abccb")
	})
})
