var NODES_PER_LAYER = 6;

var Renderer = {};

Renderer.engine = {};
Renderer.engine.particleSystem = null;
Renderer.engine.jsonOriginData = null;
Renderer.engine.jsonChildrenData = null;
Renderer.engine.layerCount = 0;
Renderer.engine.layer = null;
Renderer.engine.ready = function(){
    return Renderer.engine.particleSystem !== null && Renderer.canvas.stage !== null;
};
Renderer.engine.loadJson = function(myUrl) {
    var json = null;
    $.ajax({
        'async': false,
        'global': false,
        'url': myUrl,
        'dataType': "json",
        'success': function (data) {
            json = data.success;
        }
    });
    return json;
};
Renderer.engine.initData = function(){
    this.jsonOriginData = this.loadJson("./data/originnode.json");
    this.jsonChildrenData = this.loadJson("./data/targetnodes.json");
    this.layerCount = Math.ceil(this.jsonChildrenData.length / NODES_PER_LAYER);
};
Renderer.engine.displayLayer = function(layer){
    if(layer !== this.layer){
        this.layer = layer;
        var edges = this.particleSystem.getEdgesFrom('centerNode');
        for(var edge in edges){
            console.log(edges[edge].node.data);
        }
        for(var i = this.layer * NODES_PER_LAYER; i < (this.layer + 1) * NODES_PER_LAYER && i < this.jsonChildrenData.length; i++){
            Renderer.node.new(i, this.jsonChildrenData[i].article);
            Renderer.edge.new('centerNode', i, this.jsonChildrenData[i].connection);
        }
    }
};
Renderer.engine.initRendering = function(){
    this.particleSystem = arbor.ParticleSystem(1000, 600, 0.5);// create the system with sensible repulsion/stiffness/friction
    this.particleSystem.parameters({gravity:true}); // use center-gravity to make the graph settle nicely (ymmv)
    this.particleSystem.fps(60);
    Renderer.canvas.init();
    this.initData();
    this.particleSystem.renderer = Renderer.loop; // our newly created renderer will have its .init() method called shortly by sys..
};

Renderer.canvas = {};
Renderer.canvas.stage = null;
Renderer.canvas.init = function(){
    this.stage = new Kinetic.Stage({
        container: 'viewport',
        width: 800,
        height: 600,
        fill: "black"
    });
    this.stage.add(Renderer.edge.layer);
    this.stage.add(Renderer.node.layer);
};
Renderer.canvas.resize = function(){
    var div = $(".ui-layout-center");
    Renderer.engine.particleSystem.screenSize(div.width(), div.height());
    Renderer.engine.particleSystem.screenPadding(80);
    this.stage.setSize(div.width(), div.height());
    Renderer.loop.redraw();
},

Renderer.node = {};
Renderer.node.layer = new Kinetic.Layer();
Renderer.node.shape = [[26,15],[0,30],[-26,15],[-26,-15],[0,-30],[26,-15]];
Renderer.node.new = function(id, data){
    Renderer.engine.particleSystem.addNode(id, this.generateData(data));
};
Renderer.node.newPolygon = function(){
    var polygon = new Kinetic.Polygon({
        points: this.shape,
        fill: "black",
        stroke: "white",
        strokeWidth: 5,
        x: 300,
        y: 300
    });
    this.layer.add(polygon);

    return polygon;
};
Renderer.node.generateData = function(data){
    return {
        nodeData: data,
        shape: this.newPolygon()
    }
};
Renderer.node.delete = function(node){};
Renderer.node.redrawAll = function(){};

Renderer.edge = {};
Renderer.edge.layer = new Kinetic.Layer();
Renderer.edge.new = function(id1, id2, data){
    Renderer.engine.particleSystem.addEdge(id1, id2, this.generateData(data));
};
Renderer.edge.newLine = function(){
    var edge =  new Kinetic.Line({
        points: [0,0,0,0],
        stroke: "white",
        strokeWidth: 2
    });

    this.layer.add(edge);

    return edge;
};
Renderer.edge.generateData = function(data){
    return {
        edgeData: data,
        shape: this.newLine()
    }
};
Renderer.edge.delete = function(node){};

Renderer.loop = {}
Renderer.loop.init = function(){
    Renderer.node.new('centerNode', Renderer.engine.jsonOriginData);
    Renderer.engine.displayLayer(0);
};
Renderer.loop.redraw = function(){
        Renderer.engine.particleSystem.eachEdge(function(edge, pt1, pt2){
            edge.data.shape.setAttr('points', [pt1, pt2]);
        });
        Renderer.engine.particleSystem.eachNode(function(node, pt){
            node.data.shape.setPosition(pt.x, pt.y);
        });
        Renderer.canvas.stage.draw();
    };

$(document).ready(function(){
    PanelsHandler.initPanels();
    Renderer.engine.initRendering();
    Renderer.canvas.resize();
});
