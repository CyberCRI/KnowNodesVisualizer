var NODES_PER_LAYER = 6;

var Renderer = function(elt){
    var hoverRadius = 30;
    var hexagonShape = [[26,15],[0,30],[-26,15],[-26,-15],[0,-30],[26,-15]];

    var dom = $(elt);
    var canvas = dom.get(0);
    var ctx = canvas.getContext("2d");
    var sys = null;

    var hovered = null;
    var nearest = null;
    var mousePosition = null;

    var nearestDifferentThanHovered = function(){
        return (nearest && nearest.node !== hovered);
    };

    var nearestIsCloseEnough = function(){
        return nearest.distance <= hoverRadius;
    };

    var updateHovered = function(){
        if(nearestDifferentThanHovered() && nearestIsCloseEnough()){
            hovered = nearest.node;
            that.redraw();
        }
        else if(hovered !== null && !nearestIsCloseEnough()){
            hovered = null;
            that.redraw();
        }
    };

    var that = {

        jsonData: null,
        layerCount: 0,

        loadJson:function(myUrl) {
            var json = null;
            $.ajax({
                'async': false,
                'global': false,
                'url': myUrl,
                'dataType': "json",
                'success': function (data) {
                    json = data;
                }
            });
            return json;
        },

        init:function(system){
            sys = system;

            that.resize();

            // set up some event handlers to allow for node-dragging
            that.initMouseHandling();

            that.initLayers();
            that.initData();
            that.updateData();
        },

        resize:function(){
            var body = $(".ui-layout-center");
            canvas.width = body.width();
            canvas.height = body.height();
            sys.screenSize(canvas.width, canvas.height);
            sys.screenPadding(80); // leave an extra 80px of whitespace per side
            that.redraw();
	},

        initData: function(){
            //console.log("initData");

            var data = that.loadJson("./data/originnode.json");
            data.alpha = 1;
            sys.addNode('centerNode', data);

            that.jsonData = that.loadJson("./data/targetnodes.json");
            for ( var i=0; i < that.jsonData.success.length; i++){
                that.jsonData.success[i].article.layer = Math.floor(i / NODES_PER_LAYER);
            }
            that.layerCount = Math.ceil(that.jsonData.success.length / NODES_PER_LAYER);
        },

        updateData:function(){
            //console.log("updateData");
            $.each(sys.getEdgesFrom('centerNode'), function(i, v){
                if(v.data.layer !== that.layer) {
                    sys.tweenNode(v.target, 1, {alpha: 0});
                }
            });
            that.displayLayer(that.layer);
        },

        displayLayer: function(layer){
            //console.log("addLayer("+layer+")");
            for ( var i=layer*NODES_PER_LAYER; i < (layer+1)*NODES_PER_LAYER && i < that.jsonData.success.length; i++){
                var newNode = sys.addNode(i, that.jsonData.success[i].article);
                sys.addEdge('centerNode', i, that.jsonData.success[i].connection);
                that.jsonData.success[i].article.alpha = 0.01;
                sys.tweenNode(newNode, 0.5, {alpha: 1});
            }
        },

        onLayerChange:function(layer){
            //console.log("onLayerChange("+layer+"): old layer "+that.layer);
            if(that.layer !== layer) {
                //console.log("apply changes")
                that.layer = layer;
                that.updateData();
            }
        },

        redraw:function(){
            //
            // redraw will be called repeatedly during the run whenever the node positions
            // change. the new positions for the nodes can be accessed by looking at the
            // .p attribute of a given node. however the p.x & p.y values are in the coordinates
            // of the particle system rather than the screen. you can either map them to
            // the screen yourself, or use the convenience iterators .eachNode (and .eachEdge)
            // which allow you to step through the actual node objects but also pass an
            // x,y point in the screen's coordinate system
            //
            ctx.fillStyle = "black";
            ctx.fillRect(0,0, canvas.width, canvas.height);

            sys.eachEdge(function(edge, pt1, pt2){
                // edge: {source:Node, target:Node, length:#, data:{}}
                // pt1:  {x:#, y:#}  source position in screen coords
                // pt2:  {x:#, y:#}  target position in screen coords

                var edgeAlpha = edge.source.data.alpha;
                if(edge.target.data.alpha < edgeAlpha) {edgeAlpha = edge.target.data.alpha;}

                if (edgeAlpha === 0) return;

                // draw a line from pt1 to pt2
                ctx.strokeStyle = "rgba(255,255,255, "+edgeAlpha+")";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(pt1.x, pt1.y);
                ctx.lineTo(pt2.x, pt2.y);
                ctx.stroke();
            });

            sys.eachNode(function(node, pt){
                // node: {mass:#, p:{x,y}, name:"", data:{}}
                // pt:   {x:#, y:#}  node position in screen coords

                if (node.data.alpha === 0){
                    sys.pruneNode(node);
                    return
                }

                //Draw Hexagon centered at pt
                ctx.beginPath();
                ctx.strokeStyle = "rgba(255,255,255, "+node.data.alpha+")";
                ctx.lineWidth = 5;
                var fillAlpha = 1;
                if (node.data.alpha === 0) {fillAlpha = 0;}
                ctx.fillStyle= "rgba(0,0,0, "+fillAlpha+")";
                if(hovered !== null && hovered === node)
                    ctx.fillStyle = "rgba(0,0,255, "+fillAlpha+")";
                //Begin drawing
                ctx.moveTo(hexagonShape[0][0] + pt.x, hexagonShape[0][1] + pt.y);
                for(var i = 1; i < hexagonShape.length; i++)
                    ctx.lineTo(hexagonShape[i][0] + pt.x, hexagonShape[i][1] + pt.y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                //Print text next to it
                ctx.fillStyle = "rgba(255,255,255, "+node.data.alpha+")";
                ctx.font = "bold 12px Roboto";
                ctx.fillText(node.data.title, pt.x + 30, pt.y);
            });
        },

        initMouseHandling:function(){
            hovered = null;
            nearest = null;
            var dragged = null;
            scrollAvailable = true;

            var handler = {
                moved:function(e){
                    var pos = $(canvas).offset();
                    mousePosition = arbor.Point(e.pageX-pos.left, e.pageY-pos.top);
                    nearest = sys.nearest(mousePosition);

                    updateHovered();

                    return false;
                },

                clicked:function(e){
                    if(hovered){
                        PanelsHandler.layout.open('west');
                    }
                    else
                        PanelsHandler.layout.close('west');
                },

                dragged:function(e){},

                dropped:function(e){},

                scrolled:function(e, delta, deltaX, deltaY){
                    console.log("scrolled");

                    var newLayer = 0;

                    if(deltaY !== 0){
                        scrollAvailable = false;

                        if (deltaY < 0){
                            newLayer = Math.max(that.layer - 1, 0);
                        } else{
                            newLayer = Math.min(that.layer + 1,  that.layerCount - 1);
                        }

                        $(that).trigger({type:'layer', layer: newLayer});
                    }

                    return false;
                    }
            }

            // start listening
            $('canvas').mousedown(handler.clicked);
            $('canvas').mousemove(handler.moved);
            $('canvas').mousewheel(handler.scrolled);

        },

        layer: 0,
        initLayers: function(){
            layer = 0;
        }

    };

    return that;
};

$(document).ready(function(){
    sys = arbor.ParticleSystem(1000, 600, 0.5); // create the system with sensible repulsion/stiffness/friction
    sys.parameters({gravity:true}); // use center-gravity to make the graph settle nicely (ymmv)
    sys.renderer = Renderer("#viewport"); // our newly created renderer will have its .init() method called shortly by sys...

    $(sys.renderer).bind('layer', function(e){
        sys.renderer.onLayerChange(e.layer);
    })

});
