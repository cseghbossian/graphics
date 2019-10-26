// prog1.js by Celine Seghbossian <cseghbos@ucsc.edu>
// Base code taken from MultiPoint.js example from Chapter 3 of WebGL Programming Guide by Matsuda and Lea

// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform bool is_red;\n' + 
  'void main() {\n' +
  '  if (is_red) {\n' +
  '    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
  '  }\n' +
  '  else { gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0); }\n' +
  '}\n';

function main() {
/*
* Functionality:
* --------------
* - Retrieves <canvas> element from driver.html
* - Retrieves and verifies rendering context for WebGL
* - Initializes shaders
* - Fetches and verifies storage locations of each variable in shader programs
* - Gets general array of vertices for two types of trees by calling tree(...)
* - Calls click(...) function for each mouse click event
*
* Outcome:
* --------
* Draws a red tree (depth=4) at location of each left click and a blue tree (depth=6) at location of each right click
*/
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get the storage location of a_Position and u_FragColor
  var is_red = gl.getUniformLocation(gl.program, 'is_red');
  if (is_red < 0) {
    console.log('Failed to get the storage location of is_red');
    return;
  }

  // Get general array of points for each type of tree
  // Later, x and y positions of click can be added to these points 
  var lp = [];
  var rp = [];
  tree(0, 0, 0, 0, 0, 50/canvas.width, 4, lp);
  tree(0, 0, 0, 0, 0, 40/canvas.width, 6, rp);

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = function(ev){ click(ev, gl, canvas, is_red, lp, rp); };

  // Specify the color for clearing <canvas>
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function initVertexBuffers(gl, v) {
/* Parameters:
* ------------
* v          :: Array of vertices to be inputted into buffer
* gl         :: WebGLProgram containing shader program
* 
* Functionality:
* --------------
* - Creates a buffer object
* - Binds the buffer object to target and writes vertices data into it
* - Assigns the buffer object to a_Position variable
*
* Outcome:
* --------
* Initializes vertex buffer by giving it a list of 3-d vertices to draw
*/
  var vertices = new Float32Array(v);
  var n = v.length/3;

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target and write vertices data into it
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  return n;
}

var clicks = [];
function click(ev, gl, canvas, is_red, lp, rp) {
/* Parameters:
* ------------
* ev         :: MouseEvent when user clicks canvas
* gl         :: WebGLProgram containing shader program
* canvas     :: HTMLElement <canvas>
* is_red     :: GLint number indicating location of is_red variable in fragment shader
* lp         :: Float array indicating the general points of a left tree (general i.e. planted at (0,0,0))
* rp         :: Float array indicating the general points of a right tree (general i.e. planted at (0,0,0))
* 
* Functionality:
* --------------
* - Uses event metadata to calculate location and type of click
* - Echos mouse position of each click to console
* - Updates an array of clicks representing positions and type of each mouse click
* - Sets appropriate attribute and uniform variables in shaders
* - Calls translateTree(...) to find vertices for tree associated with each click
* - Calls initVertexBuffers(...) to initialize vertex buffers with tree vertices of each click
* - Calls shader program to draw line segments for each click
*
* Outcome:
* --------
* Draws a red tree (depth=4) for each left click in clicks[] and a blue tree (depth=6) for each right click in clicks[]
*/ 

  var x = ev.clientX; // x coordinate of a click
  var y = ev.clientY; // y coordinate of a click
  var button = ev.button; // type of click
  var rect = ev.target.getBoundingClientRect() ;

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  // Store the coordinates to rects array
  clicks.push(x); 
  clicks.push(y);
  clicks.push(button);

  if(button==0) {
    console.log('Left click at (' + x + ', ' + y + ')\n');
  }
  else if(button == 2) {
    console.log('Right click at (' + x + ', ' + y + ')\n');
  }

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  for(var i = 0; i < clicks.length; i += 3) {

    //Left click
    if(clicks[i+2]==0){

      // Pass the bool to fragment shader
      gl.uniform1f(is_red, true);

      //Find tree vertices for tree associated with this click
      var new_lp = []; 
      translateTree(lp, clicks[i], clicks[i+1], new_lp);

      // Write the positions of vertices to a vertex shader
      var n = initVertexBuffers(gl,new_lp);
      if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
      }

      gl.drawArrays(gl.LINES, 0, new_lp.length/3);
    } 

    // Right click
    else if(clicks[i+2]==2){

      // Pass the bool to fragment shader
      gl.uniform1f(is_red, false);

      //Find tree vertices for tree associated with this click
      var new_rp = []; 
      translateTree(rp, clicks[i], clicks[i+1], new_rp);

      // Write the positions of vertices to a vertex shader
      var n = initVertexBuffers(gl,new_rp);
      if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
      }

      gl.drawArrays(gl.LINES, 0, new_rp.length/3);
    } 
    else{
      console.log('Error processing the type of a click\n');
    }

  }
}

function tree(x,y,z,a,b,L,n,p) {
/* Parameters:
* ------------
* x          :: float specifying starting x-component of tree (or recursive subtree)
* y          :: float specifying starting y-component of tree (or recursive subtree)
* z          :: float specifying starting z-component of tree (or recursive subtree)
* a          :: float specifying alpha angle of tree (or recursive subtree)
* b          :: float specifying beta angle of tree (or recursive subtree)
* L          :: float specifying length of segment of tree (or recursive subtree)
* n          :: int specifying recursive level
* p          :: float array where tree vertices are to be pushed
* 
* Functionality:
* --------------
* - At base level, creates a leaf segment of length L
* - At recursive levels, creates trunk segments of length L*(n+2) and makes recurisve call for each of its three subtrees
*
* Outcome:
* --------
* Fills p array with floats representing x-, y-, and z-components of vertices of tree
* Points are represented by three successive floats
* Each pair of successive points represent start and end of a line segment
* p = [x,y,z, x,y,z,    x,y,z, x,y,z,    ... ]
*/ 

  var d45 = Math.PI/4;
  var d120 = 2*Math.PI/3;
  var d240 = 4*Math.PI/3;
  var cosa = Math.cos(a);
  var sina = Math.sin(a);
  var cosb = Math.cos(b);
  var sinb = Math.sin(b);

  if(n==0) {
    // add one leaf segment of length L
    p.push(x);
    p.push(y);
    p.push(z);
    p.push(x + L*sinb*cosa);
    p.push(y + L*sinb*sina);
    p.push(z + L*cosb);
  }
  else {
    //make trunk of length L*(n+2)
    //start point
    p.push(x);
    p.push(y);
    p.push(z);
    //end point
    p.push(x + (n+2)*L*sinb*cosa);
    p.push(y + (n+2)*L*sinb*sina);
    p.push(z + (n+2)*L*cosb);
    
    //recursive calls for subtrees
    tree(x + (n+2)*L*sinb*cosa, y + (n+2)*L*sinb*sina, z + (n+2)*L*cosb, 0, b+d45, .75*L, n-1, p);
    tree(x + (n+2)*L*sinb*cosa, y + (n+2)*L*sinb*sina, z + (n+2)*L*cosb, d120, b+d45, .75*L, n-1, p);
    tree(x + (n+2)*L*sinb*cosa, y + (n+2)*L*sinb*sina, z + (n+2)*L*cosb, d240, b+d45, .75*L, n-1, p);
  }
  return;
}

function translateTree(gen_p, x, y, p) {
/* Parameters:
* ------------
* gen_p      :: float array filled with the vertices of a general left or right tree (one that starts at (0,0,0))
* x          :: float specifying starting x-component of tree 
* y          :: float specifying starting y-component of tree
* p          :: float array where translated tree vertices are to be pushed
* 
* Functionality:
* --------------
* - Translates x- and y-components by the values given by x and y
*
* Outcome:
* --------
* Fills p array with floats representing x-, y-, and z-components of vertices of translated tree(starting at (x,y,0))
* Points are represented by three successive floats
* Each pair of successive points represent start and end of a line segment
* p = [x,y,z, x,y,z,    x,y,z, x,y,z,    ... ]
*/ 
  for(var i = 0; i < gen_p.length; i +=3) {
    p.push(gen_p[i] + x);
    p.push(gen_p[i+1] + y);
    p.push(gen_p[i+2]);
  }
}

function treeString(s,n) {
/* Parameters:
* ------------
* s          :: string representation of tree at current recursion level
* n          :: current recursive depth
*
* Outcome:
* --------
* Returns string representation of tree given by the following grammar:
* variables : 0, 1
* constants: a,b,c
* axiom : 0
* rules : (1 -> 11), (0 -> 1a0b0c0)
* 
* Note: 
* -----
* only used for debugging purposes
*/
  if(n==0) {
    return s;
  }
  else {
    var ss = s.replace(/1/g, "11");
    ss = ss.replace(/0/g, "1a0b0c0");
    return treeString(ss, n-1);
  }
}


