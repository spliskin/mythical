const { getcached } = require('../harness.js');
const { test: t, TARGET } = getcached("../alt/pathname/parse.js");

const parsePathname = require(TARGET).parsePathname;

t.group('interface', () => {
    t.run('check', () => {
        t.ok(typeof(parsePathname) === 'function');
    });
});

t.group("parsePathname", () => {
	t.run("parses empty string", () => {
		var data = parsePathname("")
		t.deepEqual(data, {
			path: "/",
			params: {}
		})
	})
	t.run("parses query at start", () => {
		var data = parsePathname("?a=b&c=d")
		t.deepEqual(data, {
			path: "/",
			params: {a: "b", c: "d"}
		})
	})
	t.run("ignores hash at start", () => {
		var data = parsePathname("#a=b&c=d")
		t.deepEqual(data, {
			path: "/",
			params: {}
		})
	})
	t.run("parses query, ignores hash at start", () => {
		var data = parsePathname("?a=1&b=2#c=3&d=4")
		t.deepEqual(data, {
			path: "/",
			params: {a: "1", b: "2"}
		})
	})
	t.run("parses root", () => {
		var data = parsePathname("/")
		t.deepEqual(data, {
			path: "/",
			params: {}
		})
	})
	t.run("parses root + query at start", () => {
		var data = parsePathname("/?a=b&c=d")
		t.deepEqual(data, {
			path: "/",
			params: {a: "b", c: "d"}
		})
	})
	t.run("parses root, ignores hash at start", () => {
		var data = parsePathname("/#a=b&c=d")
		t.deepEqual(data, {
			path: "/",
			params: {}
		})
	})
	t.run("parses root + query, ignores hash at start", () => {
		var data = parsePathname("/?a=1&b=2#c=3&d=4")
		t.deepEqual(data, {
			path: "/",
			params: {a: "1", b: "2"}
		})
	})
	t.run("parses route", () => {
		var data = parsePathname("/route/foo")
		t.deepEqual(data, {
			path: "/route/foo",
			params: {}
		})
	})
	t.run("parses route + empty query", () => {
		var data = parsePathname("/route/foo?")
		t.deepEqual(data, {
			path: "/route/foo",
			params: {}
		})
	})
	t.run("parses route + empty hash", () => {
		var data = parsePathname("/route/foo?")
		t.deepEqual(data, {
			path: "/route/foo",
			params: {}
		})
	})
	t.run("parses route + empty query + empty hash", () => {
		var data = parsePathname("/route/foo?#")
		t.deepEqual(data, {
			path: "/route/foo",
			params: {}
		})
	})
	t.run("parses route + query", () => {
		var data = parsePathname("/route/foo?a=1&b=2")
		t.deepEqual(data, {
			path: "/route/foo",
			params: {a: "1", b: "2"}
		})
	})
	t.run("parses route + hash", () => {
		var data = parsePathname("/route/foo?c=3&d=4")
		t.deepEqual(data, {
			path: "/route/foo",
			params: {c: "3", d: "4"}
		})
	})
	t.run("parses route + query, ignores hash", () => {
		var data = parsePathname("/route/foo?a=1&b=2#c=3&d=4")
		t.deepEqual(data, {
			path: "/route/foo",
			params: {a: "1", b: "2"}
		})
	})
	t.run("parses route + query, ignores hash with lots of junk slashes", () => {
		var data = parsePathname("//route/////foo//?a=1&b=2#c=3&d=4")
		t.deepEqual(data, {
			path: "/route/foo",
			params: {a: "1", b: "2"}
		})
	})
	t.run("doesn't comprehend protocols", () => {
		var data = parsePathname("https://example.com/foo/bar")
		t.deepEqual(data, {
			path: "/https:/example.com/foo/bar",
			params: {}
		})
	})
})
