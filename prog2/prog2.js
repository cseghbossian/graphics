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
  tree(0, 0, 0, 0, 0, 50/canvas.width, 5, lp);
  tree(0, 0, 0, 0, 0, 40/canvas.width, 7, rp);

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = function(ev){ click(ev, gl, canvas, is_red, lp, rp); };

  // Specify the color for clearing <canvas>
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
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

function reload() {
/*
* Functionality:
* --------------
* - Retrieves <canvas> element from driver.html
* - Retrieves and verifies rendering context for WebGL
* - Initializes shaders
* - Initializes vertex buffers by calling initVertexBuffer(...)
* - Fetches and verifies storage locations of each variable in shader programs
* - Sets viewing point and render mode depending on counter values
* - Calls draw function 
*
* Outcome:
* --------
* Sets proper parameters and draws cylinder upon each toggle of switch(es)
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

  // Set the clear color and enable the depth test
  gl.clearColor(.3, 0, .25, 0.4);
  gl.enable(gl.DEPTH_TEST);

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
  //flat shading
  else {
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