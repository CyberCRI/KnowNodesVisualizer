
var NODES_PER_LAYER = 6;


var Renderer = function(canvas){
    var canvas = $(canvas).get(0);
    var ctx = canvas.getContext("2d");
    var particleSystem;
    var shape = [[26,15],[0,30],[-26,15],[-26,-15],[0,-30],[26,-15]];

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
            //
            // the particle system will call the init function once, right before the
            // first frame is to be drawn. it's a good place to set up the canvas and
            // to pass the canvas size to the particle system
            //
            // save a reference to the particle system for use in the .redraw() loop
            particleSystem = system

            // inform the system of the screen dimensions so it can map coords for us.
            // if the canvas is ever resized, screenSize should be called again with
            // the new dimensions
            particleSystem.screenSize(canvas.width, canvas.height)
            particleSystem.screenPadding(80) // leave an extra 80px of whitespace per side

            // set up some event handlers to allow for node-dragging
            that.initMouseHandling()

            that.initLayers()
            that.initData();
            that.updateData();
        },

        initData: function(){
            //console.log("initData");

            var data = that.loadJson("./data/originnode.json");
            data.alpha = 1;
            particleSystem.addNode('centerNode', data);

            that.jsonData = that.loadJson("./data/targetnodes.json");
            for ( var i=0; i < that.jsonData.success.length; i++){
                that.jsonData.success[i].article.layer = Math.floor(i / NODES_PER_LAYER);
            }
            that.layerCount = Math.ceil(that.jsonData.success.length / NODES_PER_LAYER);
        },

        updateData:function(){
            //console.log("updateData");
            $.each(particleSystem.getEdgesFrom('centerNode'), function(i, v){
                if(v.data.layer !== that.layer) {
                    particleSystem.tweenNode(v.target, 1, {alpha: 0});
                }
            });
            that.displayLayer(that.layer);
        },

        displayLayer: function(layer){
            //console.log("addLayer("+layer+")");
            for ( var i=layer*NODES_PER_LAYER; i < (layer+1)*NODES_PER_LAYER && i < that.jsonData.success.length; i++){
                var newNode = particleSystem.addNode(i, that.jsonData.success[i].article);
                particleSystem.addEdge('centerNode', i, that.jsonData.success[i].connection);
                that.jsonData.success[i].article.alpha = 0.01;
                particleSystem.tweenNode(newNode, 0.5, {alpha: 1});
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

            particleSystem.eachEdge(function(edge, pt1, pt2){
                // edge: {source:Node, target:Node, length:#, data:{}}
                // pt1:  {x:#, y:#}  source position in screen coords
                // pt2:  {x:#, y:#}  target position in screen coords

                var edgeAlpha = edge.source.data.alpha;
                if(edge.target.data.alpha < edgeAlpha) {edgeAlpha = edge.target.data.alpha;}

                if (edgeAlpha === 0) return

                // draw a line from pt1 to pt2
                ctx.strokeStyle = "rgba(255,255,255, "+edgeAlpha+")";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(pt1.x, pt1.y);
                ctx.lineTo(pt2.x, pt2.y);//, {alpha: 0});
                ctx.stroke();
            })

            particleSystem.eachNode(function(node, pt){
                // node: {mass:#, p:{x,y}, name:"", data:{}}
                // pt:   {x:#, y:#}  node position in screen coords

                if (node.data.alpha === 0){
                    particleSystem.pruneNode(node);
                    return
                };

                //Draw Hexagon centered at pt
                ctx.beginPath();
                ctx.strokeStyle = "rgba(255,255,255, "+node.data.alpha+")";
                ctx.lineWidth = 5;
                var fillAlpha = 1;
                if (node.data.alpha === 0) {fillAlpha = 0;}
                ctx.fillStyle= "rgba(0,0,0, "+fillAlpha+")";
                ctx.moveTo(shape[0][0] + pt.x, shape[0][1] + pt.y);
                for(var i = 1; i < shape.length; i++)
                    ctx.lineTo(shape[i][0] + pt.x, shape[i][1] + pt.y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                //Print text next to it
                ctx.fillStyle = "rgba(255,255,255, "+node.data.alpha+")";
                ctx.font = "bold 12px Roboto";
                ctx.fillText(node.data.title, pt.x + 30, pt.y);
                
            })
        },

        initMouseHandling:function(){
            // no-nonsense drag and drop (thanks springy.js)
            var dragged = null;

            // set up a handler object that will initially listen for mousedowns then
            // for moves and mouseups while dragging
            var handler = {
                clicked:function(e){
                    /*
                    var pos = $(canvas).offset();
                    _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
                    dragged = particleSystem.nearest(_mouseP);

                    if (dragged && dragged.node !== null){
                        // while we're dragging, don't let physics move the node
                        dragged.node.fixed = true
                    }

                    $(canvas).bind('mousemove', handler.dragged)
                    $(window).bind('mouseup', handler.dropped)
                    */
                    return false
                },

                dragged:function(e){
                    /*
                    var pos = $(canvas).offset();
                    var s = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)

                    if (dragged && dragged.node !== null){
                        var p = particleSystem.fromScreen(s)
                        dragged.node.p = p
                    }
                    */
                    return false
                },

                dropped:function(e){
                    /*
                    if (dragged===null || dragged.node===undefined) return
                    if (dragged.node !== null) dragged.node.fixed = false
                    dragged.node.tempMass = 1000
                    dragged = null
                    $(canvas).unbind('mousemove', handler.dragged)
                    $(window).unbind('mouseup', handler.dropped)
                    _mouseP = null
                    */
                    return false
                },

                lastScrollTop: 0,
                scrolled:function(e){
                    var newLayer = 0;
                    var st = $(this).scrollTop();
                    //console.log("st="+st+",   lastScrollTop="+handler.lastScrollTop);
                    var diff = handler.lastScrollTop - st;
                    var absDiff = Math.abs(diff);
                    if((absDiff < 20 && st < 20 && st >= -20)
                        || (absDiff < 10 && (st >= 20 || st <= 20) )
                        || ((diff > 0) && (st > 250)) //270 - 240 = +30
                        || ((diff < 0) && (st < 0)) //-70 - -40 = -30
                        ){
                        //console.log("st="+st+",   lastScrollTop="+handler.lastScrollTop+", abort");
                        return
                    }
                    //console.log("st="+st+",   lastScrollTop="+handler.lastScrollTop+", apply");

                    if (st > handler.lastScrollTop){
                        newLayer = Math.max(that.layer - 1, 0);
                    } else {
                        newLayer = Math.min(that.layer + 1,  that.layerCount-1);
                    }
                    handler.lastScrollTop = st;
                    $(that).trigger({type:'layer', layer: newLayer});
                    return false;
                }
            }

            // start listening
            $(canvas).mousedown(handler.clicked);
            $(window).scroll(handler.scrolled);

        },

        layer: 0,
        initLayers: function(){
            layer = 0;
        }/*,


        switchLayer: function(e){
            if (e.layer != Math.floor(layer / NODES_PER_LAYER)){
              canvas.stop(true).fadeTo(e.dt,0, function(){
                if (particleSystem) particleSystem.stop()
                //$(this).hide()?
              })
            }else{
              canvas.stop(true).css('opacity',0).show().fadeTo(e.dt,1,function(){
                that.resize()
              })
              if (particleSystem) particleSystem.start()
            }
        }
        */

    }

    return that;
}



$(document).ready(function(){
    var sys = arbor.ParticleSystem(1000, 600, 0.5) // create the system with sensible repulsion/stiffness/friction
    sys.parameters({gravity:true}) // use center-gravity to make the graph settle nicely (ymmv)
    sys.renderer = Renderer("#viewport") // our newly created renderer will have its .init() method called shortly by sys...

    $(sys.renderer).bind('layer', function(e){
        sys.renderer.onLayerChange(e.layer);
    })

});
