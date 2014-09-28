function getNodeLevel(node){
    var level = 0, children = node.children, i = 0, j = children.length, child, childLevel;

    if( j ){
        for(;i<j;i++){
            child = children[i];
            childLevel = getNodeLevel(child);
            level = Math.max(level, childLevel);
        }

        level++;
    }

    return level;
}

function orderNodes(nodes){
    var i = 0, j = nodes.length, node;

    for(;i<j;i++){
        node = nodes[i];
        node.level = getNodeLevel(node);
    }

    nodes = nodes.sort(function(a, b){
        return a.level - b.level;
    });

    //nodes = nodes.map(function(a){ return a.name; });

    return nodes;
}