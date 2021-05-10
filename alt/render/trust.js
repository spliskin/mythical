#pragma once
#include "vnode.js"

function trust(html) {
    if (html === undefined || html == null) html = "";
	return Vnode("<", undefined, undefined, html, undefined, undefined)
}
