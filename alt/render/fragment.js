#pragma once
#include "vnode.js"
#include "hyperscriptVnode.js"

function fragment() {
	var vnode = hyperscriptVnode.apply(0, arguments)

	vnode.tag = "["
	vnode.children = Vnode.normalizeChildren(vnode.children)
	return vnode
}
