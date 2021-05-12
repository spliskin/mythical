const { getcached } = require('../harness.js');
const { test: t, TARGET } = getcached("../alt/pathname/build.js");

const buildPathname = require(TARGET).buildPathname;

t.group('interface', () => {
    t.run('check', () => {
        t.ok(typeof(buildPathname) === 'function');
    });
});

t.group("buildPathname", function() {
	function test(prefix) {
		t.run("returns path if no params", function () {
			var string = buildPathname(prefix + "/route/foo", undefined)

			t.equal(string, prefix + "/route/foo")
		})
		t.run("skips interpolation if no params", function () {
			var string = buildPathname(prefix + "/route/:id", undefined)

			t.equal(string, prefix + "/route/:id")
		})
		t.run("appends query strings", function () {
			var string = buildPathname(prefix + "/route/foo", {a: "b", c: 1})

			t.equal(string, prefix + "/route/foo?a=b&c=1")
		})
		t.run("inserts template parameters at end", function () {
			var string = buildPathname(prefix + "/route/:id", {id: "1"})

			t.equal(string, prefix + "/route/1")
		})
		t.run("inserts template parameters at beginning", function () {
			var string = buildPathname(prefix + "/:id/foo", {id: "1"})

			t.equal(string, prefix + "/1/foo")
		})
		t.run("inserts template parameters at middle", function () {
			var string = buildPathname(prefix + "/route/:id/foo", {id: "1"})

			t.equal(string, prefix + "/route/1/foo")
		})
		t.run("inserts variadic paths", function () {
			var string = buildPathname(prefix + "/route/:foo...", {foo: "id/1"})

			t.equal(string, prefix + "/route/id/1")
		})
		t.run("inserts variadic paths with initial slashes", function () {
			var string = buildPathname(prefix + "/route/:foo...", {foo: "/id/1"})

			t.equal(string, prefix + "/route//id/1")
		})
		t.run("skips template parameters at end if param missing", function () {
			var string = buildPathname(prefix + "/route/:id", {param: 1})

			t.equal(string, prefix + "/route/:id?param=1")
		})
		t.run("skips template parameters at beginning if param missing", function () {
			var string = buildPathname(prefix + "/:id/foo", {param: 1})

			t.equal(string, prefix + "/:id/foo?param=1")
		})
		t.run("skips template parameters at middle if param missing", function () {
			var string = buildPathname(prefix + "/route/:id/foo", {param: 1})

			t.equal(string, prefix + "/route/:id/foo?param=1")
		})
		t.run("skips variadic template parameters if param missing", function () {
			var string = buildPathname(prefix + "/route/:foo...", {param: "/id/1"})

			t.equal(string, prefix + "/route/:foo...?param=%2Fid%2F1")
		})
		t.run("handles escaped values", function() {
			var data = buildPathname(prefix + "/route/:foo", {"foo": ";:@&=+$,/?%#"})

			t.equal(data, prefix + "/route/%3B%3A%40%26%3D%2B%24%2C%2F%3F%25%23")
		})
		t.run("handles unicode", function() {
			var data = buildPathname(prefix + "/route/:ö", {"ö": "ö"})

			t.equal(data, prefix + "/route/%C3%B6")
		})
		t.run("handles zero", function() {
			var string = buildPathname(prefix + "/route/:a", {a: 0})

			t.equal(string, prefix + "/route/0")
		})
		t.run("handles false", function() {
			var string = buildPathname(prefix + "/route/:a", {a: false})

			t.equal(string, prefix + "/route/false")
		})
		t.run("handles dashes", function() {
			var string = buildPathname(prefix + "/:lang-:region/route", {
				lang: "en",
				region: "US"
			})

			t.equal(string, prefix + "/en-US/route")
		})
		t.run("handles dots", function() {
			var string = buildPathname(prefix + "/:file.:ext/view", {
				file: "image",
				ext: "png"
			})

			t.equal(string, prefix + "/image.png/view")
		})
		t.run("merges query strings", function() {
			var string = buildPathname(prefix + "/item?a=1&b=2", {c: 3})

			t.equal(string, prefix + "/item?a=1&b=2&c=3")
		})
		t.run("merges query strings with other parameters", function() {
			var string = buildPathname(prefix + "/item/:id?a=1&b=2", {id: "foo", c: 3})

			t.equal(string, prefix + "/item/foo?a=1&b=2&c=3")
		})
		t.run("consumes template parameters without modifying query string", function() {
			var string = buildPathname(prefix + "/item/:id?a=1&b=2", {id: "foo"})

			t.equal(string, prefix + "/item/foo?a=1&b=2")
		})
	}

	t.group("absolute", () => test(""))
	t.group("relative", () => test(".."))
	t.group("absolute + domain", () => test("https://example.com"))
	t.group("absolute + `file:`", () => test("file://"))
})
