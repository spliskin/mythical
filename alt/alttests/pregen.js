const { precache, test } = require('./harness.js');

precache([
    "../alt/censor.js",
    "../alt/querystring/build.js",
    "../alt/querystring/parse.js",
    "../alt/pathname/build.js",
    "../alt/pathname/parse.js",
    "../alt/pathname/compileTemplate.js",
    "../alt/request.js",
])
.then(() => {
    test.reset();
    require('./util/test-censor.js');
    require('./querystring/test-buildQueryString.js');
    require('./querystring/test-parseQueryString.js');
    require('./pathname/test-buildPathname.js');
    require('./pathname/test-parsePathname.js');
    require('./pathname/test-compileTemplate.js');
    require('./request/test-request.js');
    require('./stream/test-scan.js');
    require('./stream/test-scanMerge.js');
    require('./stream/test-stream.js');

    test.finalize();
});
