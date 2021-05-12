const { getcached } = require('../harness.js');
const { test: t, TARGET } = getcached("../alt/censor.js");

const censor = require(TARGET).censor;

t.group('interface', () => {
    t.run('check', () => {
        t.ok(typeof(censor) === 'function');
    });
});

t.group("censor", function() {
	t.group("magic missing, no extras", function() {
		t.run("returns new object", function() {
			var original = {one: "two"}
			var censored = censor(original)
			t.notEqual(censored, original)
			t.deepEqual(censored, {one: "two"})
		})
		t.run("does not modify original object", function() {
			var original = {one: "two"}
			censor(original)
			t.deepEqual(original, {one: "two"})
		})
	})

	t.group("magic present, no extras", function() {
		t.run("returns new object", function() {
			var original = {
				one: "two",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			}
			var censored = censor(original)
			t.notEqual(censored, original)
			t.deepEqual(censored, {one: "two"})
		})
		t.run("does not modify original object", function() {
			var original = {
				one: "two",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			}
			censor(original)
			t.deepEqual(original, {
				one: "two",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			})
		})
	})

	t.group("magic missing, null extras", function() {
		t.run("returns new object", function() {
			var original = {one: "two"}
			var censored = censor(original, null)
			t.notEqual(censored, original)
			t.deepEqual(censored, {one: "two"})
		})
		t.run("does not modify original object", function() {
			var original = {one: "two"}
			censor(original, null)
			t.deepEqual(original, {one: "two"})
		})
	})

	t.group("magic present, null extras", function() {
		t.run("returns new object", function() {
			var original = {
				one: "two",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			}
			var censored = censor(original, null)
			t.notEqual(censored, original)
			t.deepEqual(censored, {one: "two"})
		})
		t.run("does not modify original object", function() {
			var original = {
				one: "two",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			}
			censor(original, null)
			t.deepEqual(original, {
				one: "two",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			})
		})
	})

	t.group("magic missing, extras missing", function() {
		t.run("returns new object", function() {
			var original = {one: "two"}
			var censored = censor(original, ["extra"])
			t.notEqual(censored, original)
			t.deepEqual(censored, {one: "two"})
		})
		t.run("does not modify original object", function() {
			var original = {one: "two"}
			censor(original, ["extra"])
			t.deepEqual(original, {one: "two"})
		})
	})

	t.group("magic present, extras missing", function() {
		t.run("returns new object", function() {
			var original = {
				one: "two",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			}
			var censored = censor(original, ["extra"])
			t.notEqual(censored, original)
			t.deepEqual(censored, {one: "two"})
		})
		t.run("does not modify original object", function() {
			var original = {
				one: "two",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			}
			censor(original, ["extra"])
			t.deepEqual(original, {
				one: "two",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			})
		})
	})

	t.group("magic missing, extras present", function() {
		t.run("returns new object", function() {
			var original = {
				one: "two",
				extra: "test",
			}
			var censored = censor(original, ["extra"])
			t.notEqual(censored, original)
			t.deepEqual(censored, {one: "two"})
		})
		t.run("does not modify original object", function() {
			var original = {
				one: "two",
				extra: "test",
			}
			censor(original, ["extra"])
			t.deepEqual(original, {
				one: "two",
				extra: "test",
			})
		})
	})

	t.group("magic present, extras present", function() {
		t.run("returns new object", function() {
			var original = {
				one: "two",
				extra: "test",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			}
			var censored = censor(original, ["extra"])
			t.notEqual(censored, original)
			t.deepEqual(censored, {one: "two"})
		})
		t.run("does not modify original object", function() {
			var original = {
				one: "two",
				extra: "test",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			}
			censor(original, ["extra"])
			t.deepEqual(original, {
				one: "two",
				extra: "test",
				key: "test",
				oninit: "test",
				oncreate: "test",
				onbeforeupdate: "test",
				onupdate: "test",
				onbeforeremove: "test",
				onremove: "test",
			})
		})
	})
})
