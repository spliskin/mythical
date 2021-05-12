const { getcached } = require('../harness.js');
const { test: t, TARGET } = getcached("../alt/querystring/build.js");

let buildQueryString = require(TARGET).buildQueryString;

t.group('interface', () => {
    t.run('check', () => {
        t.ok(typeof(buildQueryString) === 'function');
    });
});

t.group("buildQueryString", () => {
	t.run("handles flat object", () => {
		var string = buildQueryString({a: "b", c: 1})

		t.equal(string, "a=b&c=1")
	})
	t.run("handles escaped values", () => {
		var data = buildQueryString({";:@&=+$,/?%#": ";:@&=+$,/?%#"})

		t.equal(data, "%3B%3A%40%26%3D%2B%24%2C%2F%3F%25%23=%3B%3A%40%26%3D%2B%24%2C%2F%3F%25%23")
	})
	t.run("handles unicode", () => {
		var data = buildQueryString({"ö": "ö"})

		t.equal(data, "%C3%B6=%C3%B6")
	})
	t.run("handles nested object", () => {
		var string = buildQueryString({a: {b: 1, c: 2}})

		t.equal(string, "a%5Bb%5D=1&a%5Bc%5D=2")
	})
	t.run("handles deep nested object", () => {
		var string = buildQueryString({a: {b: {c: 1, d: 2}}})

		t.equal(string, "a%5Bb%5D%5Bc%5D=1&a%5Bb%5D%5Bd%5D=2")
	})
	t.run("handles nested array", () => {
		var string = buildQueryString({a: ["x", "y"]})

		t.equal(string, "a%5B0%5D=x&a%5B1%5D=y")
	})
	t.run("handles array w/ dupe values", () => {
		var string = buildQueryString({a: ["x", "x"]})

		t.equal(string, "a%5B0%5D=x&a%5B1%5D=x")
	})
	t.run("handles deep nested array", () => {
		var string = buildQueryString({a: [["x", "y"]]})

		t.equal(string, "a%5B0%5D%5B0%5D=x&a%5B0%5D%5B1%5D=y")
	})
	t.run("handles deep nested array in object", () => {
		var string = buildQueryString({a: {b: ["x", "y"]}})

		t.equal(string, "a%5Bb%5D%5B0%5D=x&a%5Bb%5D%5B1%5D=y")
	})
	t.run("handles deep nested object in array", () => {
		var string = buildQueryString({a: [{b: 1, c: 2}]})

		t.equal(string, "a%5B0%5D%5Bb%5D=1&a%5B0%5D%5Bc%5D=2")
	})
	t.run("handles date", () => {
		var string = buildQueryString({a: new Date(0)})

		t.equal(string, "a=" + encodeURIComponent(new Date(0).toString()))
	})
	t.run("turns null into value-less string (like jQuery)", () => {
		var string = buildQueryString({a: null})

		t.equal(string, "a")
	})
	t.run("turns undefined into value-less string (like jQuery)", () => {
		var string = buildQueryString({a: undefined})

		t.equal(string, "a")
	})
	t.run("turns empty string into value-less string (like jQuery)", () => {
		var string = buildQueryString({a: ""})

		t.equal(string, "a")
	})
	t.run("handles zero", () => {
		var string = buildQueryString({a: 0})

		t.equal(string, "a=0")
	})
	t.run("handles false", () => {
		var string = buildQueryString({a: false})

		t.equal(string, "a=false")
	})
})
