const {
    jspp, test, path, basename, resolve, fileexists
} = require('../../tools/runner.js');

const BASEPATH = resolve("../alt");
const BUILDPATH = resolve("../tmp");
let SOURCE = null;
let TARGET = null;
let cache = {};

function setupgen() {
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
        test.title(prep.title);
        test.titlePad(64);

        setupgen();
    }
}

function getcached(file) {
    if (!file in cache) return false;
    const prep = cache[file];
    test.title(prep.title);
    test.titlePad(64);
    return { test, TARGET: prep.target};
}

function getcachedTarget(file) {
    if (!file in cache) return false;
    return cache[file].target;
}

function harness(sourcePath, title=false, titlepad=64) {
    SOURCE = resolve(sourcePath);
    var frag = SOURCE.replace(BASEPATH, '');
    TARGET = path.join(BUILDPATH, path.dirname(frag), basename(frag) + ".out.js");

    if (title)
        test.title(title);

    if (titlepad)
        test.titlePad(64);

    setupgen();

    return {
        test,
        SOURCE,
        TARGET
    };
}

function nogen(sourcePath, title=false, titlepad=64) {
    SOURCE = resolve(sourcePath);
    TARGET = SOURCE;

    if (title)
        test.title(title);

    if (titlepad)
        test.titlePad(64);

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
