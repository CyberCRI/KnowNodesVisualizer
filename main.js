var Renderer = function(elt){
    var dom = $(elt);
    var canvas = dom.get(0);
    var ctx = canvas.getContext("2d");
    var sys = null;

    var hovered = null;
    var nearest = null;
    var _mouseP = null;

    var hexagonShape = [[26,15],[0,30],[-26,15],[-26,-15],[0,-30],[26,-15]];

    var that = {
        init:function(system){
            sys = system;

            that.resize();

            // set up some event handlers to allow for node-dragging
            that.initMouseHandling();
        },

        resize:function(){
            var body = $("body");
            canvas.width = body.width();
            canvas.height = body.height();
            sys.screenSize(canvas.width, canvas.height);
            sys.screenPadding(80); // leave an extra 80px of whitespace per side
            that.redraw();
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

                // draw a line from pt1 to pt2
                ctx.strokeStyle = "rgba(255,255,255, .8)";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(pt1.x, pt1.y);
                ctx.lineTo(pt2.x, pt2.y);
                ctx.stroke();
            });

            sys.eachNode(function(node, pt){
                // node: {mass:#, p:{x,y}, name:"", data:{}}
                // pt:   {x:#, y:#}  node position in screen coords

                //Draw Hexagon centered at pt
                ctx.beginPath();
                ctx.strokeStyle = "white";
                ctx.lineWidth = 5;
                ctx.fillStyle = "black";
                if(hovered !== null && hovered === node)
                    ctx.fillStyle = "blue";
                //Begin drawing
                ctx.moveTo(hexagonShape[0][0] + pt.x, hexagonShape[0][1] + pt.y);
                for(var i = 1; i < hexagonShape.length; i++)
                    ctx.lineTo(hexagonShape[i][0] + pt.x, hexagonShape[i][1] + pt.y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                //Print text next to it
                ctx.fillStyle = "white";
                ctx.font = "bold 12px Roboto";
                ctx.fillText(node.data.title, pt.x + 30, pt.y);
            });
        },

        initMouseHandling:function(){
            hovered = null;
            nearest = null;
            var dragged = null;
            var oldmass = 1;

            var handler = {
                moved:function(e){
                    var pos = $(canvas).offset();
                    _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top);
                    nearest = sys.nearest(_mouseP);

                    //In case no node was found
                    if(nearest && !nearest.node) return false;

                    //Find if nearest node is near enough
                    if(nearest && nearest.node !== hovered && nearest.distance <= 30){
                        console.log("Change nearest");
                        hovered = nearest.node;
                        that.redraw();
                    }
                    else if(hovered !== null && nearest.distance > 30){
                        console.log("Nulled nearest");
                        hovered = null;
                        that.redraw();
                    }

                    return false;
                },

                clicked:function(e){

                },

                dragged:function(e){},

                dropped:function(e){}
            };

            // start listening
            $(canvas).mousedown(handler.clicked);
            $(canvas).mousemove(handler.moved);
        }

    };

    return that;
};

$(document).ready(function(){
    var sys = arbor.ParticleSystem(1000, 600, 0.5); // create the system with sensible repulsion/stiffness/friction
    sys.parameters({gravity:true}); // use center-gravity to make the graph settle nicely (ymmv)
    sys.renderer = Renderer("#viewport"); // our newly created renderer will have its .init() method called shortly by sys...

    //Central node
    $.getJSON("./data/originnode.json", function(data){
        sys.addNode('centerNode', data);
    });

    //Children nodes
    $.getJSON("./data/targetnodes.json", function(data){
        for(var i = 0; i < 6; i++){
            sys.addNode(i, data.success[i].article);
            sys.addEdge('centerNode', i, data.success[i].connection);
        }
    });
});
