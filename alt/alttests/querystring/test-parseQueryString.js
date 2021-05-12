const { getcached } = require('../harness.js');
const { test: t, TARGET } = getcached("../alt/querystring/parse.js");

let parseQueryString = require(TARGET).parseQueryString;

t.group('interface', () => {
    t.run('check', () => {
        t.ok(typeof(parseQueryString) === 'function');
    });
});

t.group('parseQueryString', () => {
    t.run("works", () => {
        var data = parseQueryString("?aaa=bbb")
        t.deepEqual(data, {aaa: "bbb"})
    })
    t.run("parses empty string", () => {
        var data = parseQueryString("")
        t.deepEqual(data, {})
    })
    t.run("parses flat object", () => {
        var data = parseQueryString("?a=b&c=d")
        t.deepEqual(data, {a: "b", c: "d"})
    })
    t.run("handles escaped values", () => {
        var data = parseQueryString("?%3B%3A%40%26%3D%2B%24%2C%2F%3F%25%23=%3B%3A%40%26%3D%2B%24%2C%2F%3F%25%23")
        t.deepEqual(data, {";:@&=+$,/?%#": ";:@&=+$,/?%#"})
    })
    t.run("handles escaped slashes followed by a number", function () {
        var data = parseQueryString("?hello=%2Fen%2F1")
        t.equal(data.hello, "/en/1")
    })
    t.run("handles escaped square brackets", () => {
        var data = parseQueryString("?a%5B%5D=b")
        t.deepEqual(data, {"a": ["b"]})
    })
    t.run("handles escaped unicode", () => {
        var data = parseQueryString("?%C3%B6=%C3%B6")
        t.deepEqual(data, {"ö": "ö"})
    })
    t.run("handles unicode", () => {
        var data = parseQueryString("?ö=ö")
        t.deepEqual(data, {"ö": "ö"})
    })
    t.run("parses without question mark", () => {
        var data = parseQueryString("a=b&c=d")
        t.deepEqual(data, {a: "b", c: "d"})
    })
    t.run("parses nested object", () => {
        var data = parseQueryString("a[b]=x&a[c]=y")
        t.deepEqual(data, {a: {b: "x", c: "y"}})
    })
    t.run("parses deep nested object", () => {
        var data = parseQueryString("a[b][c]=x&a[b][d]=y")
        t.deepEqual(data, {a: {b: {c: "x", d: "y"}}})
    })
    t.run("parses nested array", () => {
        var data = parseQueryString("a[0]=x&a[1]=y")
        t.deepEqual(data, {a: ["x", "y"]})
    })
    t.run("parses deep nested array", () => {
        var data = parseQueryString("a[0][0]=x&a[0][1]=y")
        t.deepEqual(data, {a: [["x", "y"]]})
    })
    t.run("parses deep nested object in array", () => {
        var data = parseQueryString("a[0][c]=x&a[0][d]=y")
        t.deepEqual(data, {a: [{c: "x", d: "y"}]})
    })
    t.run("parses deep nested array in object", () => {
        var data = parseQueryString("a[b][0]=x&a[b][1]=y")
        t.deepEqual(data, {a: {b: ["x", "y"]}})
    })
    t.run("parses array without index", () => {
        var data = parseQueryString("a[]=x&a[]=y&b[]=w&b[]=z")
        t.deepEqual(data, {a: ["x", "y"], b: ["w", "z"]})
    })
    t.run("casts booleans", () => {
        var data = parseQueryString("a=true&b=false")
        t.deepEqual(data, {a: true, b: false})
    })
    t.run("does not cast numbers", () => {
        var data = parseQueryString("a=1&b=-2.3&c=0x10&d=1e2&e=Infinity")
        t.deepEqual(data, {a: "1", b: "-2.3", c: "0x10", d: "1e2", e: "Infinity"})
    })
    t.run("does not cast NaN", () => {
        var data = parseQueryString("a=NaN")
        t.equal(data.a, "NaN")
    })
    t.run("does not casts Date", () => {
        var data = parseQueryString("a=1970-01-01")
        t.equal(typeof data.a, "string")
        t.equal(data.a, "1970-01-01")
    })
    t.run("does not cast empty string to number", () => {
        var data = parseQueryString("a=")
        t.deepEqual(data, {a: ""})
    })
    t.run("does not cast void to number", () => {
        var data = parseQueryString("a")
        t.deepEqual(data, {a: ""})
    })
    t.run("prefers later values", () => {
        var data = parseQueryString("a=1&b=2&a=3")
        t.deepEqual(data, {a: "3", b: "2"})
    })
    t.run("doesn't pollute prototype directly, censors `__proto__`", () => {
        var prev = Object.prototype.toString
        var data = parseQueryString("a=b&__proto__%5BtoString%5D=123")
        t.equal(Object.prototype.toString, prev)
        t.deepEqual(data, {a: "b"})
    })
    t.run("doesn't pollute prototype indirectly, retains `constructor`", () => {
        var prev = Object.prototype.toString
        var data = parseQueryString("a=b&constructor%5Bprototype%5D%5BtoString%5D=123")
        t.equal(Object.prototype.toString, prev)
        // The deep matcher is borked here.
        t.deepEqual(Object.keys(data), ["a", "constructor"])
        t.equal(data.a, "b")
        t.deepEqual(data.constructor, {prototype: {toString: "123"}})
    })
});
