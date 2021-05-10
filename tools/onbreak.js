var _list = [];
var _installed = false;

function _emitter() {
    var stop = false;
    for(var i=0, m=_list.length; stop !== false && i < m; i++) {
        stop = !_list[i]();
    }
    if (stop) process.exit();
}

function onbreak(fn) {
    if (typeof fn !== 'function') return;

    if (!_installed) {
        _installed = true;
        process.on('SIGINT', _emitter);
    }

    if (_list.indexOf(fn) == -1)
        _list.push(fn);
}

onbreak.isInstalled = () => _installed;

exports = module.exports = onbreak;