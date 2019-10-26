// ClickedPoints.js by Celine Seghbossian <cseghbos@ucsc.edu>
// Base code taken from Chapter 2 of WebGL Programming Guide by Matsuda and Lea

// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute float point_size;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = point_size;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform bool is_round;\n' + 
  'void main() {\n' +
  '  if (is_round) {\n' +
  '    float dist = distance(gl_PointCoord, vec2(0.5, 0.5));\n' +
  '    if(dist < 0.5) {\n' +
  '      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
  '    } else { discard; }\n' +
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
* - Calls click(...) function for each mouse click event
*
* Outcome:
* --------
* Draws a red circle (radius=10) at location of each left click and a blue square (side=10) at location of each right click
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

  // Get the storage location of a_Position, point_size, and u_FragColor
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  var point_size = gl.getAttribLocation(gl.program, 'point_size');
  var is_round = gl.getUniformLocation(gl.program, 'is_round');

  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }
  if (point_size < 0) {
    console.log('Failed to get the storage location of point_size');
    return;
  }
  if (is_round < 0) {
    console.log('Failed to get the storage location of is_round');
    return;
  }

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = function(ev){ click(ev, gl, canvas, a_Position, point_size, is_round); };

  // Specify the color for clearing <canvas>
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var clicks = []; // The array for the position and type of a click

function click(ev, gl, canvas, a_Position, point_size, is_round) {
/* Parameters:
* ------------
* ev         :: MouseEvent when user clicks canvas
* gl         :: WebGLProgram containing shader program
* canvas     :: HTMLElement <canvas>
* a_Position :: GLint number indicating location of a_Position variable in vertex shader 
* point_size :: GLint number indicating location of point_size variable in vertex shader 
* is_round   :: GLint number indicating location of is_round variable in fragment shader 
* 
* Functionality:
* --------------
* - Uses event metadata to calculate location and type of click
* - Echos mouse position of each click to console
* - Updates an array of clicks representing positions and type of each mouse click
* - Sets appropriate attribute and uniform variables in shaders
* - Calls shader program for each click in clicks array
*
* Outcome:
* --------
* Draws a red circle (radius=10) for each left click in clicks[] and a blue square (side=10) for each right click in clicks[]
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

  var len = clicks.length;
  for(var i = 0; i < len; i += 3) {

    //Left click
    if(clicks[i+2]==0){
      // Pass the position of a point to vertex shader
      gl.vertexAttrib3f(a_Position, clicks[i], clicks[i+1], 0.0);

      // Pass the point size of a left click to vertex shader
      gl.vertexAttrib1f(point_size, 20.0);

      // Pass the bool to fragment shader
      gl.uniform1f(is_round, true);

      // Draw
      gl.drawArrays(gl.POINTS, 0, 1);
    } 

    // Right click
    else if(clicks[i+2]==2){
      // Pass the position of a point to vertex shader
      gl.vertexAttrib3f(a_Position, clicks[i], clicks[i+1], 0.0);

      // Pass the point size of a right click to vertex shader
      gl.vertexAttrib1f(point_size, 10.0);

      // Pass the bool to fragment shader
      gl.uniform1f(is_round, false);

      // Draw
      gl.drawArrays(gl.POINTS, 0, 1);
    } 
    else{
      console.log('Error processing the type of a click\n');
    }

  }
}

