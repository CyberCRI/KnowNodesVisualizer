PanelsHandler = {
    layout: null,

    loadEdge: function(e){
        //Edge is loaded on the right
    },

    loadNode: function(n){
        //Node is displayed on the left
    },

    hidePanels: function(){
        //Hide both panels

    }
}

$(document).ready(function(){
    PanelsHandler.layout = $("body").layout({
        defaults: {
            fxName: "slide",
            fxSpeed: "slow",
            spacing_closed: 14,
            initClosed: true,
            livePaneResizing: true,
            onresize_start: function(){
            },
            onresize: function(){sys.renderer.resize()},
            onresize_stop: function(){}
        }, west: {
            spacing_closed: 8,
            togglerLength_closed: "100%",
            minSize: 200
        }, east: {
            spacing_closed: 8,
            togglerLength_closed: "100%",
            minSize: 200
        }
    });
});