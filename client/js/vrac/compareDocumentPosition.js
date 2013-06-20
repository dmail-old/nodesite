// from http://stackoverflow.com/questions/8334286/cross-browser-compare-document-position

// en gros crossNode
function recursivelyWalk(nodes, cb) {
    for (var i = 0, len = nodes.length; i < len; i++) {
        var node = nodes[i];
        var ret = cb(node);
        if (ret) {
            return ret;
        }
        if (node.childNodes && node.childNodes.length) {
            var ret = recursivelyWalk(node.childNodes, cb);
            if (ret) {
                return ret;
            }
        }
    }
}

function testNodeForComparePosition(node, other) {
    if (node === other) {
        return true;
    }
}

function compareDocumentPosition(other) {
    function identifyWhichIsFirst(node) {
        if (node === other) {
            return "other";
        } else if (node === reference) {
            return "reference";
        }
    }

    var reference = this,
        referenceTop = this,
        otherTop = other;

    if (this === other) {
        return 0;
    }
    while (referenceTop.parentNode) {
        referenceTop = referenceTop.parentNode;
    }
    while (otherTop.parentNode) {
        otherTop = otherTop.parentNode;
    }

    if (referenceTop !== otherTop) {
        return Node.DOCUMENT_POSITION_DISCONNECTED;
    }

    var children = reference.childNodes;
    var ret = recursivelyWalk(
        children,
        testNodeForComparePosition.bind(null, other)
    );
    if (ret) {
        return Node.DOCUMENT_POSITION_CONTAINED_BY +
            Node.DOCUMENT_POSITION_FOLLOWING;
    }

    var children = other.childNodes;
    var ret = recursivelyWalk(
        children,
        testNodeForComparePosition.bind(null, reference)
    );
    if (ret) {
        return Node.DOCUMENT_POSITION_CONTAINS +
            Node.DOCUMENT_POSITION_PRECEDING;
    }

    var ret = recursivelyWalk(
        [referenceTop],
        identifyWhichIsFirst
    );
    if (ret === "other") {
        return Node.DOCUMENT_POSITION_PRECEDING;
    } else {
        return Node.DOCUMENT_POSITION_FOLLOWING;
    }
}
