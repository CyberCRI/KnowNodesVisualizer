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

    },

    initPanels: function(){
        this.layout =  $("body").layout({
            defaults: {
                fxName: "slide",
                fxSpeed: "slow",
                spacing_closed: 14,
                initClosed: true,
                livePaneResizing: true
            },

            west: {
                spacing_closed: 8,
                togglerLength_closed: "100%",
                minSize: 200
            },

            center: {
                onresize_start: function(){},
                onresize_end: function(){Renderer.canvas.resize();}
            },

            east: {
                spacing_closed: 8,
                togglerLength_closed: "100%",
                minSize: 200
            }
        });
    }
}