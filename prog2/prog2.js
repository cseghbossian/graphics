// prog2.js by Celine Seghbossian <cseghbos@ucsc.edu>
// Base code taken from ColoredCube.js from Chapter 7 of WebGL Programming Guide by Matsuda and Lea

// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

//GLOBAL VARIABLES
var r = 0;                    // determines render mode
var v = 0;                    // determines view mode
var n = 0;                    // determines if normals show
var p = 0;                    // determines projection mode

var leftTree = [];            // line segments for r4 tree centered at (0,0,0)
var rightTree = [];           // line segments for r6 tree centered at (0,0,0)
var cylinderVerts = [];       // vertices for cylinder of length 10 centered at (0,0,0)
var cylinderLines = [];       // indices for line segments for wireframe cylinder
var cylinderTriangles = [];   // indices for line segments for shaded cylinder
var cylinderNorms = [];       // indices for normal vectors
var clicks = [];              // click data (x-coord, y-coord, type)

function main() {
  //debugging area~~~~~~~~~~~~~
  var Rx = new Matrix4();
  var Ry = new Matrix4();
  var T = new Matrix4();
  var S = new Matrix4();
  findMatrices(3,5,8,2,2,40, T, Rx, Ry, S);
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~

  // Generate global tree/cylinder data 
  generateCylinderData();
  generateTreeData();

  reload();
}

function tree(x,y,z,a,b,L,n,p) {
  /* Parameters:
  * ------------
  * x          :: float specifying starting x-coordinate of tree (or recursive subtree)
  * y          :: float specifying starting y-coordinate of tree (or recursive subtree)
  * z          :: float specifying starting z-coordinate of tree (or recursive subtree)
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
  * Fills p array with floats representing x-, y-, and z-coordinates of vertices of tree
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

function findNormalComponents(p) { 
/*
* Parameters:
* ------------
* p           :: array holding x, y, and z coordinates of all 24 points (hard coded for 24 points
* 
* Functionality:
* --------------
* - Uses points in p to find two vectors on each plane (side of dodecagonal cylinder)
* - Return list of x,y,z components of normals corresponding to each vertex in p
*
*/
  var norms = [];
  for(var i = 0; i < 36; i += 6) {
    //vector1 from point0 (i,i+1,i+2) to point1 (i+3,i+4,i+5)
    var x1 = p[i+3] - p[i];
    var y1 = p[i+4] - p[i+1];
    var z1 = p[i+5] - p[i+2];
    //vector2 from point0 (i,i+1,i+2) to point13 (i+39,i+40,i+41)
    var x2 = p[i+39] - p[i];
    var y2 = p[i+40] - p[i+1];
    var z2 = p[i+41] - p[i+2];
    //make normals for first dodecagon
    norms = norms.concat(findCross(x1,y1,z1,x2,y2,z2)); //point i
    norms = norms.concat(findCross(x1,y1,z1,x2,y2,z2)); // point i+1
   
  }
  //concat array with itself to have normals for both dodecagons
  return norms.concat(norms.slice(0)); //return list of x,y,z components of normals corresponding to each vertex
}

function findNormSegments(p) {
/*
* Parameters:
* ------------
* p           :: array holding x, y, and z coordinates of all 24 points
* 
* Functionality:
* --------------
* - Calls findNormalComponents(...) to find x, y, and z components of each normal
* - Returns array of end points for each norm vector
* - Starting points of each normal are the points in p
*
*/
  //find x,y,z components of normals
  var comps = findNormalComponents(p);
  var segments = [];
  var ex,ey,ez, len;
  for(var i = 0; i < p.length; i+=3) {
    //calculate length of normal 
    len = Math.sqrt(Math.pow(comps[i],2)+Math.pow(comps[i+1],2)+Math.pow(comps[i+2],2));
    //calculate normalized end point
    ex = p[i]+comps[i]/len;
    ey = p[i+1]+comps[i+1]/len;
    ez = p[i+2]+comps[i+2]/len;
    //push normalized end point
    segments.push(ex,ey,ez);
  }
  return segments;
}

function dodecagons() {
/*
* Functionality:
* --------------
* - Returns array of 24 points depicting a tapered cylinder
* - Base has radius = 1 and is centered at (0,0,0)
* - Top has radius = 1/2 and is centered at (0,0,10)
*
*/
  d = []
  //base
  for(i = 0; i < 12; i++) {
    x = r*Math.cos(i*(2*Math.PI/12))
    y = r*Math.sin(i*(2*Math.PI/12))
    z = 0 
    d.push(x,y,z);
  }
  //top
  for(i = 0; i < 12; i++) {
    x = 0.5*r*Math.cos(i*(2*Math.PI/12))
    y = 0.5*r*Math.sin(i*(2*Math.PI/12))
    z = l 
    d.push(x,y,z);
  }
  return d;
}

function findMatrices(x1, y1, z1, x2, y2, z2, T, Rx, Ry, S) {
  //set translation matrix
  T.setTranslate(-x1,-y1,-z1);

  //calculate translated end point
  var p2x = x2-x1;
  var p2y = y2-y1;
  var p2z = z2-z1;

  //some calculations for finding rotation matrices
  var length = Math.sqrt(Math.pow(p2x,2)+Math.pow(p2y,2)+Math.pow(p2z,2));
  var alpha = Math.asin(p2y/(Math.sqrt(Math.pow(p2y,2)+Math.pow(p2z,2))));
  var beta = Math.asin(p2x/length);

  //set Rx to rotate alpha radians around x-axis
  Rx.setRotate(alpha,1,0,0);

  //set Ry to rotate -beta radians around y-axis
  Ry.setRotate(-beta,0,1,0);

  //set S to scale
  var scale = length/10;

  S.setScale(scale,scale,scale);
  
  //taking inverse makes no difference but leaving this here for principal
  T.invert; 
  Rx.invert;
  Ry.invert;
  S.invert;

}

function toggleRender() {
/*
* Functionality:
* --------------
* - Updates render counter
* - Hides normals if in shaded mode
*
* Outcome:
* --------
* Page reloads with render mode switched between wireframe and flat shading
*/
  r++;
  if(r%2==0) {n=0;}
  reload();
}

function toggleView() {
/*
* Functionality:
* --------------
* - Updates view counter
*
* Outcome:
* --------
* Page reloads and switches between two views
*/
  v++;
  reload();
}

function toggleNormals() {
/*
* Functionality:
* --------------
* - Updates normal counter
* - Switches to shaded mode if normals toggled on
*
* Outcome:
* --------
* Page reloads with normals switched between hidden and showing
*/
  n++;
  if(n%2==1) {r=1;}
  reload();
}

function toggleProjection() {
/*
* Functionality:
* --------------
* - Updates normal counter
* - Switches to shaded mode if normals toggled on
*
* Outcome:
* --------
* Page reloads with normals switched between hidden and showing
*/
  p++;
}

function reload() {
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
  // Set the clear color and enable the depth test
  gl.clearColor(.3, 0, .25, 0.4);
  gl.enable(gl.DEPTH_TEST);

  //set VIEW and PROJECTION MODE
  setView(gl);

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = function(ev){ click(ev, canvas); };

  // Set the vertex information
  var b = initVertexBuffers(gl);
  if (b < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Set RENDER MODE
  if(r%2==1) {
    gl.drawElements(gl.LINES, b, gl.UNSIGNED_BYTE, 0);
  }
  else {
    //flat shading
    gl.drawElements(gl.TRIANGLES, b, gl.UNSIGNED_BYTE, 0);
  }

}

function generateTreeData() {
  //generate tree data
  tree(0, 0, 0, 0, 0, 50/canvas.width, 5, leftTree);
  tree(0, 0, 0, 0, 0, 40/canvas.width, 7, rightTree);
}

function generateCylinderData() {
  //generate cylinder data
  var ve = dodecagons();
  var nn = findNormSegments(ve);
  ve = ve.concat(nn);

  //index 0-71 are dodecagon vertices
  //index 72-143 are normal end points
  cylinderVerts = new Float32Array(ve);

  cylinderLines = new Uint8Array([
    //wireframe
    0,12,12,13,  0,13,13,1,  1,13,13,14,  1,14,14,2, 2,14,14,15, 2,15,15,3,  3,15,15,16,  3,16,16,4, 
    4,16,16,17,  4,17,17,5,  5,17,17,18,  5,18,18,6,  6,18,18,19,  6,19,19,7,  7,19,19,20,  7,20,20,8,
    8,20,20,21,  8,21,21,9,  9,21,21,22,  9,22,22,10,  10,22,22,23,  10,23,23,11,  11,23,23,12,  11,12,12,0,
    0,1,1,2,  2,3,3,4,  4,5,5,6,  6,7,7,8,  8,9,9,10,  10,11,11,0,
  ]);

  cylinderTriangles = new Uint8Array([       // Indices of the vertices to turn into triangles
    0,12,13,  0,13,1,  1,13,14,  1,14,2,  2,14,15,  2,15,3,  3,15,16,  3,16,4,  
    4,16,17,  4,17,5,  5,17,18,  5,18,6,  6,18,19,  6,19,7,  7,19,20,  7,20,8,
    8,20,21,  8,21,9,  9,21,22,  9,22,10,  10,22,23,  10,23,11,  11,23,12,  11,12,0
  ]);

  cylinderNorms = new Uint8Array([
    //wireframe
    // 0,12,12,13,  0,13,13,1,  1,13,13,14,  1,14,14,2, 2,14,14,15, 2,15,15,3,  3,15,15,16,  3,16,16,4, 
    // 4,16,16,17,  4,17,17,5,  5,17,17,18,  5,18,18,6,  6,18,18,19,  6,19,19,7,  7,19,19,20,  7,20,20,8,
    // 8,20,20,21,  8,21,21,9,  9,21,21,22,  9,22,22,10,  10,22,22,23,  10,23,23,11,  11,23,23,12,  11,12,12,0,
    // 0,1,1,2,  2,3,3,4,  4,5,5,6,  6,7,7,8,  8,9,9,10,  10,11,11,0,

    //norms
    0,24, 1,25, 2,26, 3,27, 4,28, 5,29, 6,30, 7,31, 8,32, 9,33, 10,34, 11,35, 12,36,
    13,37, 14,38, 15,39, 16,40, 17,41, 18,42, 19,43, 20,44, 21,45, 22,46, 23,47
  ]);
}

function setView(gl) {
  // Get the storage location of u_MvpMatrix
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  if (!u_MvpMatrix) {
    console.log('Failed to get the storage location of u_MvpMatrix');
    return;
  }

  // Set the eye point and the viewing volume
  var mvpMatrix = new Matrix4();
  //(0,0,∞)
  if(v%2==1) {
    mvpMatrix.setOrtho(-2,2,-2,2,0,13);
    mvpMatrix.lookAt(0, 0, 12.5, 0, 0, 0, 0, 1, 0);
  }
  //(0, -∞, 75)
  else {
    mvpMatrix.setPerspective(30, 1, 1, 100);
    mvpMatrix.lookAt(0, -40 , 20, 0, 0, 0, 0, 1, 0);
  }

  // Pass the model view projection matrix to u_MvpMatrix
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
}

function initVertexBuffers(gl, vv) {
  /* Parameters:
  * ------------
  * vv         :: Array of vertices to be inputted into buffer
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
    var vertices = new Float32Array(vv);
    var n = vv.length/3;
  
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

function click(ev, canvas) {
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
  reload();
}