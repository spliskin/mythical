const { getcached, getcachedTarget } = require('../harness.js');
const { test: t, TARGET } = getcached("../alt/pathname/compileTemplate.js");

const parsePathname = require(getcachedTarget("../alt/pathname/parse.js")).parsePathname;
const compileTemplate = require(TARGET).compileTemplate;

t.group('interface', () => {
    t.run('check', () => {
        t.ok(typeof(parsePathname) === 'function');
        t.ok(typeof(compileTemplate) === 'function');
    });
});

t.group("compileTemplate", () => {
	t.run("checks empty string", () => {
		var data = parsePathname("/")
		t.equal(compileTemplate("/")(data), true)
		t.deepEqual(data.params, {})
	})
	t.run("checks identical match", () => {
		var data = parsePathname("/foo")
		t.equal(compileTemplate("/foo")(data), true)
		t.deepEqual(data.params, {})
	})
	t.run("checks identical mismatch", () => {
		var data = parsePathname("/bar")
		t.equal(compileTemplate("/foo")(data), false)
		t.deepEqual(data.params, {})
	})
	t.run("checks single parameter", () => {
		var data = parsePathname("/1")
		t.equal(compileTemplate("/:id")(data), true)
		t.deepEqual(data.params, {id: "1"})
	})
	t.run("checks single variadic parameter", () => {
		var data = parsePathname("/some/path")
		t.equal(compileTemplate("/:id...")(data), true)
		t.deepEqual(data.params, {id: "some/path"})
	})
	t.run("checks single parameter with extra match", () => {
		var data = parsePathname("/1/foo")
		t.equal(compileTemplate("/:id/foo")(data), true)
		t.deepEqual(data.params, {id: "1"})
	})
	t.run("checks single parameter with extra mismatch", () => {
		var data = parsePathname("/1/bar")
		t.equal(compileTemplate("/:id/foo")(data), false)
		t.deepEqual(data.params, {})
	})
	t.run("checks single variadic parameter with extra match", () => {
		var data = parsePathname("/some/path/foo")
		t.equal(compileTemplate("/:id.../foo")(data), true)
		t.deepEqual(data.params, {id: "some/path"})
	})
	t.run("checks single variadic parameter with extra mismatch", () => {
		var data = parsePathname("/some/path/bar")
		t.equal(compileTemplate("/:id.../foo")(data), false)
		t.deepEqual(data.params, {})
	})
	t.run("checks multiple parameters", () => {
		var data = parsePathname("/1/2")
		t.equal(compileTemplate("/:id/:name")(data), true)
		t.deepEqual(data.params, {id: "1", name: "2"})
	})
	t.run("checks incomplete multiple parameters", () => {
		var data = parsePathname("/1")
		t.equal(compileTemplate("/:id/:name")(data), false)
		t.deepEqual(data.params, {})
	})
	t.run("checks multiple parameters with extra match", () => {
		var data = parsePathname("/1/2/foo")
		t.equal(compileTemplate("/:id/:name/foo")(data), true)
		t.deepEqual(data.params, {id: "1", name: "2"})
	})
	t.run("checks multiple parameters with extra mismatch", () => {
		var data = parsePathname("/1/2/bar")
		t.equal(compileTemplate("/:id/:name/foo")(data), false)
		t.deepEqual(data.params, {})
	})
	t.run("checks multiple parameters, last variadic, with extra match", () => {
		var data = parsePathname("/1/some/path/foo")
		t.equal(compileTemplate("/:id/:name.../foo")(data), true)
		t.deepEqual(data.params, {id: "1", name: "some/path"})
	})
	t.run("checks multiple parameters, last variadic, with extra mismatch", () => {
		var data = parsePathname("/1/some/path/bar")
		t.equal(compileTemplate("/:id/:name.../foo")(data), false)
		t.deepEqual(data.params, {})
	})
	t.run("checks multiple separated parameters", () => {
		var data = parsePathname("/1/sep/2")
		t.equal(compileTemplate("/:id/sep/:name")(data), true)
		t.deepEqual(data.params, {id: "1", name: "2"})
	})
	t.run("checks incomplete multiple separated parameters", () => {
		var data = parsePathname("/1")
		t.equal(compileTemplate("/:id/sep/:name")(data), false)
		t.deepEqual(data.params, {})
		data = parsePathname("/1/sep")
		t.equal(compileTemplate("/:id/sep/:name")(data), false)
		t.deepEqual(data.params, {})
	})
	t.run("checks multiple separated parameters missing sep", () => {
		var data = parsePathname("/1/2")
		t.equal(compileTemplate("/:id/sep/:name")(data), false)
		t.deepEqual(data.params, {})
	})
	t.run("checks multiple separated parameters with extra match", () => {
		var data = parsePathname("/1/sep/2/foo")
		t.equal(compileTemplate("/:id/sep/:name/foo")(data), true)
		t.deepEqual(data.params, {id: "1", name: "2"})
	})
	t.run("checks multiple separated parameters with extra mismatch", () => {
		var data = parsePathname("/1/sep/2/bar")
		t.equal(compileTemplate("/:id/sep/:name/foo")(data), false)
		t.deepEqual(data.params, {})
	})
	t.run("checks multiple separated parameters, last variadic, with extra match", () => {
		var data = parsePathname("/1/sep/some/path/foo")
		t.equal(compileTemplate("/:id/sep/:name.../foo")(data), true)
		t.deepEqual(data.params, {id: "1", name: "some/path"})
	})
	t.run("checks multiple separated parameters, last variadic, with extra mismatch", () => {
		var data = parsePathname("/1/sep/some/path/bar")
		t.equal(compileTemplate("/:id/sep/:name.../foo")(data), false)
		t.deepEqual(data.params, {})
	})
	t.run("checks multiple parameters + prefix", () => {
		var data = parsePathname("/route/1/2")
		t.equal(compileTemplate("/route/:id/:name")(data), true)
		t.deepEqual(data.params, {id: "1", name: "2"})
	})
	t.run("checks incomplete multiple parameters + prefix", () => {
		var data = parsePathname("/route/1")
		t.equal(compileTemplate("/route/:id/:name")(data), false)
		t.deepEqual(data.params, {})
	})
	t.run("checks multiple parameters + prefix with extra match", () => {
		var data = parsePathname("/route/1/2/foo")
		t.equal(compileTemplate("/route/:id/:name/foo")(data), true)
		t.deepEqual(data.params, {id: "1", name: "2"})
	})
	t.run("checks multiple parameters + prefix with extra mismatch", () => {
		var data = parsePathname("/route/1/2/bar")
		t.equal(compileTemplate("/route/:id/:name/foo")(data), false)
		t.deepEqual(data.params, {})
	})
	t.run("checks multiple parameters + prefix, last variadic, with extra match", () => {
		var data = parsePathname("/route/1/some/path/foo")
		t.equal(compileTemplate("/route/:id/:name.../foo")(data), true)
		t.deepEqual(data.params, {id: "1", name: "some/path"})
	})
	t.run("checks multiple parameters + prefix, last variadic, with extra mismatch", () => {
		var data = parsePathname("/route/1/some/path/bar")
		t.equal(compileTemplate("/route/:id/:name.../foo")(data), false)
		t.deepEqual(data.params, {})
	})
	t.run("checks multiple separated parameters + prefix", () => {
		var data = parsePathname("/route/1/sep/2")
		t.equal(compileTemplate("/route/:id/sep/:name")(data), true)
		t.deepEqual(data.params, {id: "1", name: "2"})
	})
	t.run("checks incomplete multiple separated parameters + prefix", () => {
		var data = parsePathname("/route/1")
		t.equal(compileTemplate("/route/:id/sep/:name")(data), false)
		t.deepEqual(data.params, {})
		var data = parsePathname("/route/1/sep")
		t.equal(compileTemplate("/route/:id/sep/:name")(data), false)
		t.deepEqual(data.params, {})
	})
	t.run("checks multiple separated parameters + prefix missing sep", () => {
		var data = parsePathname("/route/1/2")
		t.equal(compileTemplate("/route/:id/sep/:name")(data), false)
		t.deepEqual(data.params, {})
	})
	t.run("checks multiple separated parameters + prefix with extra match", () => {
		var data = parsePathname("/route/1/sep/2/foo")
		t.equal(compileTemplate("/route/:id/sep/:name/foo")(data), true)
		t.deepEqual(data.params, {id: "1", name: "2"})
	})
	t.run("checks multiple separated parameters + prefix with extra mismatch", () => {
		var data = parsePathname("/route/1/sep/2/bar")
		t.equal(compileTemplate("/route/:id/sep/:name/foo")(data), false)
		t.deepEqual(data.params, {})
	})
	t.run("checks multiple separated parameters + prefix, last variadic, with extra match", () => {
		var data = parsePathname("/route/1/sep/some/path/foo")
		t.equal(compileTemplate("/route/:id/sep/:name.../foo")(data), true)
		t.deepEqual(data.params, {id: "1", name: "some/path"})
	})
	t.run("checks multiple separated parameters + prefix, last variadic, with extra mismatch", () => {
		var data = parsePathname("/route/1/sep/some/path/bar")
		t.equal(compileTemplate("/route/:id/sep/:name.../foo")(data), false)
		t.deepEqual(data.params, {})
	})
	t.run("checks query params match", () => {
		var data = parsePathname("/route/1?foo=bar")
		t.equal(compileTemplate("/route/:id?foo=bar")(data), true)
		t.deepEqual(data.params, {foo: "bar", id: "1"})
	})
	t.run("checks query params mismatch", () => {
		var data = parsePathname("/route/1?foo=bar")
		t.equal(compileTemplate("/route/:id?foo=1")(data), false)
		t.deepEqual(data.params, {foo: "bar"})
		t.equal(compileTemplate("/route/:id?bar=foo")(data), false)
		t.deepEqual(data.params, {foo: "bar"})
	})
	t.run("checks dot before dot", () => {
		var data = parsePathname("/file.test.png/edit")
		t.equal(compileTemplate("/:file.:ext/edit")(data), true)
		t.deepEqual(data.params, {file: "file.test", ext: "png"})
	})
	t.run("checks dash before dot", () => {
		var data = parsePathname("/file-test.png/edit")
		t.equal(compileTemplate("/:file.:ext/edit")(data), true)
		t.deepEqual(data.params, {file: "file-test", ext: "png"})
	})
	t.run("checks dot before dash", () => {
		var data = parsePathname("/file.test-png/edit")
		t.equal(compileTemplate("/:file-:ext/edit")(data), true)
		t.deepEqual(data.params, {file: "file.test", ext: "png"})
	})
	t.run("checks dash before dash", () => {
		var data = parsePathname("/file-test-png/edit")
		t.equal(compileTemplate("/:file-:ext/edit")(data), true)
		t.deepEqual(data.params, {file: "file-test", ext: "png"})
	})
})
