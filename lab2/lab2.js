// lab2.js by Celine Seghbossian <cseghbos@ucsc.edu>
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
var r = 0;  // determines render mode
var v = 0;  // determines view mode
var n = 0;  //determines if normals show

function main() {
  reload();
}

function initVertexBuffers(gl) {
/* Parameters:
* ------------
* gl         :: WebGLProgram containing shader program
* 
* Functionality:
* --------------
* - Calculates all points by calling dodecagons(...) and findNormSegments(...)
* - Calculates colors of each point by calling findColors(...)
* - Initializes array buffers by calling initArrayBuffers(...)
* - Creates index arrays for polygons, lines, and norms
* - Creates buffer objects for indices, vertices, and colors and fills them
* - Calls draw functions with appropriate toggle settings for flat shading, wireframes, and normals
*
* Outcome:
* --------
* Initializes vertex and array buffers with appropriate toggle settings
*/
  //Find all vertices
  var ve = dodecagons();
  var nn = findNormSegments(ve);
  ve = ve.concat(nn);

  //index 0-71 are dodecagon vertices
  //index 72-143 are normal end points
  var vertices = new Float32Array(ve);

  var c = findColors(nn);

  var green = [  
    //green normals
    0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,  
    0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,  
    0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,  
    0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,  
    0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,  
    0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0
  ];

  var colors = new Float32Array(c.concat(green));

  var polygons = new Uint8Array([       // Indices of the vertices to turn into triangles
    0,12,13,  0,13,1,  1,13,14,  1,14,2,  2,14,15,  2,15,3,  3,15,16,  3,16,4,  
    4,16,17,  4,17,5,  5,17,18,  5,18,6,  6,18,19,  6,19,7,  7,19,20,  7,20,8,
    8,20,21,  8,21,9,  9,21,22,  9,22,10,  10,22,23,  10,23,11,  11,23,12,  11,12,0
  ]);


  var lines = new Uint8Array([
    //wireframe
    0,12,12,13,  0,13,13,1,  1,13,13,14,  1,14,14,2, 2,14,14,15, 2,15,15,3,  3,15,15,16,  3,16,16,4, 
    4,16,16,17,  4,17,17,5,  5,17,17,18,  5,18,18,6,  6,18,18,19,  6,19,19,7,  7,19,19,20,  7,20,20,8,
    8,20,20,21,  8,21,21,9,  9,21,21,22,  9,22,22,10,  10,22,22,23,  10,23,23,11,  11,23,23,12,  11,12,12,0,
    0,1,1,2,  2,3,3,4,  4,5,5,6,  6,7,7,8,  8,9,9,10,  10,11,11,0,
  ]);

  var norms = new Uint8Array([
    //wireframe
    0,12,12,13,  0,13,13,1,  1,13,13,14,  1,14,14,2, 2,14,14,15, 2,15,15,3,  3,15,15,16,  3,16,16,4, 
    4,16,16,17,  4,17,17,5,  5,17,17,18,  5,18,18,6,  6,18,18,19,  6,19,19,7,  7,19,19,20,  7,20,20,8,
    8,20,20,21,  8,21,21,9,  9,21,21,22,  9,22,22,10,  10,22,22,23,  10,23,23,11,  11,23,23,12,  11,12,12,0,
    0,1,1,2,  2,3,3,4,  4,5,5,6,  6,7,7,8,  8,9,9,10,  10,11,11,0,
    //norms
    0,24, 1,25, 2,26, 3,27, 4,28, 5,29, 6,30, 7,31, 8,32, 9,33, 10,34, 11,35, 12,36,
    13,37, 14,38, 15,39, 16,40, 17,41, 18,42, 19,43, 20,44, 21,45, 22,46, 23,47
  ]);

  // Create a buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) 
    return -1;

  // Write the vertex coordinates and color to the buffer object
  if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position'))
    return -1;
  if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color'))
    return -1;

  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  //display normals
  if(n%2==1) {
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, norms, gl.STATIC_DRAW);
    gl.drawElements(gl.LINES, norms.length, gl.UNSIGNED_BYTE, 0);
    return norms.length;
  }

  //wireframe
  if(r%2==1) {
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, lines, gl.STATIC_DRAW);
    return lines.length;
  }
  //flat shading
  else {
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, polygons, gl.STATIC_DRAW);
    return polygons.length;
  }

}

function initArrayBuffer(gl, data, num, type, attribute) {
/* Parameters:
* ------------
* gl         :: WebGLProgram containing shader program
* data       :: Values to fill into buffer
* num        :: dimension of points/vectors
* type       :: type of values (e.g. gl.FLOAT)
* attribute  :: name of attribute in shader to bind buffer to
* 
* Functionality:
* --------------
* - Calculates all points by calling dodecagons(...) and findNormSegments(...)
* - Calculates colors of each point by calling findColors(...)
* - Initializes array buffers by calling initArrayBuffers
* - Creates index arrays for polygons, lines, and norms
* - Creates buffer objects for indices, vertices, and colors and fills them
* - Calls draw functions with appropriate toggle settings for flat shading, wireframes, and normals
*
* Outcome:
* --------
* Initializes vertex buffer with appropriate toggle settings
*/
  var buffer = gl.createBuffer();   // Create a buffer object
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

function findCross(x1,y1,z1,x2,y2,z2) {
/*
* Parameters:
* ------------
* x1, y1, z1         :: x, y, and z components of first vector
* x2, y2, z2         :: x, y, and z components of second vector
* 
* Functionality:
* --------------
* - Returns x, y, and z components of the cross product of two vectors
*
*/
  x = (y1*z2)-(z1*y2);
  y = (z1*x2)-(x1*z2);
  z = (x1*y2)-(y1*x2);
  return [x,y,z];
}

function findNormalComponents(p) { 
/*
* Parameters:
* ------------
* p           :: array holding x, y, and z coordinates of all 24 points (only works for 24 points)
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
  var d = [];
  //base
  for(i = 0; i < 12; i++) {
    var x = r*Math.cos(i*(2*Math.PI/12));
    var y = r*Math.sin(i*(2*Math.PI/12));
    var z = 0 ;
    d.push(x,y,z);
  }
  //top
  for(i = 0; i < 12; i++) {
    var x = 0.5*r*Math.cos(i*(2*Math.PI/12));
    var y = 0.5*r*Math.sin(i*(2*Math.PI/12));
    var z = 10;
    d.push(x,y,z);
  }
  return d;
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

function findColors(nn) {
/*
* Parameters:
* ------------
* nn           :: array holding x, y, and z components of all 24 normal vectors
* 
* Functionality:
* --------------
* - Returns color of each point
* - Assumes a pure white light <1,1,1> coming from <1,1,1>
* - Assumes material is red (RBG = (1,0,0))
*
*/
  var colors = [];
  for(var i = 0; i < 72; i+=3) {
    var cos = cosBetween(nn[i], nn[i+1],nn[i+2],1,1,1);
    colors.push(cos,0,0);
  }
  return colors;
}

function cosBetween(x1, y1, z1, x2, y2, z2) {
/*
* Parameters:
* ------------
* x1, y1, z1         :: x, y, and z components of first vector
* x2, y2, z2         :: x, y, and z components of second vector
* 
* Functionality:
* --------------
* - Returns the cosine of the angle between two vectors
*
*/
  var len1 = Math.sqrt(Math.pow(x1,2)+Math.pow(y1,2)+Math.pow(z1,2));
  var len2 = Math.sqrt(Math.pow(x2,2)+Math.pow(y2,2)+Math.pow(z2,2));
  var dot = x1*x2 + y1*y2 + z1*z2;
  return dot/(len1*len2);
}
