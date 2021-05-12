const {
    jspp, test, path, basename, resolve, fileexists
} = require('../../tools/runner.js');

const BASEPATH = resolve("../alt");
const BUILDPATH = resolve("../tmp");
let SOURCE = null;
let TARGET = null;
let cache = {};

function setupgen(title='') {
    test.group('generation', () => {
        test.run('source exists', () => {
            test.ok(fileexists(SOURCE));
        });

        test.run('preprocess', () => {
            test.equal(jspp(...jspp.getDefaults(),
                '-target', 'node',
                '-I', resolve('../alt'),
                '-o', TARGET,
                SOURCE),
            0);
        });

        test.run('output exists', () => test.ok(fileexists(TARGET)));
    });
    test.title(title);
}

function prepare(sourcePath) {
    const source = resolve(sourcePath);
    var frag = source.replace(BASEPATH, '');
    const target = path.join(BUILDPATH, path.dirname(frag), basename(frag) + ".out.js");

    return {
        source,
        target,
        title: `==== ${frag} ============`
    };
}

function precache(list) {
    for(const entry of list) {
        const prep = prepare(entry);
        cache[entry] = prep;

        SOURCE = prep.source;
        TARGET = prep.target;

        setupgen(prep.title);
    }
    return test.finalize();
}

function getcached(file) {
    if (!file in cache) return false;
    const prep = cache[file];
    return { test, TARGET: prep.target, title: prep.title };
}

function getcachedTarget(file) {
    if (!file in cache) return false;
    return cache[file].target;
}

function harness(sourcePath, title='', titlepad=64) {
    SOURCE = resolve(sourcePath);
    var frag = SOURCE.replace(BASEPATH, '');
    TARGET = path.join(BUILDPATH, path.dirname(frag), basename(frag) + ".out.js");

    setupgen(title);

    return {
        test,
        SOURCE,
        TARGET
    };
}

function nogen(sourcePath, title='', titlepad=64) {
    SOURCE = resolve(sourcePath);
    TARGET = SOURCE;

    test.title(title);

    return {
        harness,
        test,
        SOURCE,
        TARGET
    };
};


exports = module.exports = {
    harness,
    nogen,
    precache,
    getcached,
    getcachedTarget,
    jspp,
    test,
    resolve,
    basename,
    fileexists,
    path,
}
