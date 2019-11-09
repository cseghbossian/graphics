// Program2 with pick functionality (Max limit: 50 trees)
// CylTree.js v0.02
/**
 * Created by Fahim Hasan Khan
 * Date: 11/05/2019
 * DISCLAIMER: Use at your own risk. There's more than one way to implement this. So, this method may be completely different than yours, your data structure, 
 * your coding style, etc. and may also require time to adapt to your code, etc. It is highly recommended the use it as a guide to complete your version (if necessary), 
 * or use it as it is and expand to add functionality for remaining assignments.
 *
 * Changelog (11/5/2019)
 * =====================
 * 1. Click (with left or right mouse button) to pick a tree. "Picking is done by left clicking on an tree. 
 * You can pick on any tree that's currently visible. You indicate that a tree has been picked by changing its color to green. 
 * You deselect an object by left clicking on the background. (To distinguish this action from creating a new tree, 
 * deselection happens only when there's a tree that's been picked. Also, only one tree can be picked at any time). 
 * Doing so will revert the color of the picked object back to its original color. Only one object can be picked at any time. 
 * If you click on another object while you currently have a picked object, nothing happens. 
 * If you want to pick a different tree, you'll have to deselect the current tree first."
 *
 * 2. Flat shading is replaced with smooth shading (diffuse only). So, normal calculation is slightly different now.
 *
 * 3. Using gl.TRIANGLE_STRIP (78 vertices per cylinder) instead of gl.TRIANGLES (~216 vertices per cylinder).
 *
 * 4. Bug fix: There was a bug in creating trees from side view leading to wrong mouse click location in Y-axis, which is fixed now (line 412). Other small bugs are fixed.
 */

// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Normal;\n' +        // Normal
  'uniform vec4 u_Translation;\n' +
  'uniform vec4 u_Color;\n' +
  'uniform vec4 u_idColor;\n' +  
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform bool u_Clicked;\n' + // Mouse is pressed
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * (a_Position + u_Translation);\n' +  
	// Make the length of the normal 1.0
  '  vec3 normal = normalize(a_Normal.xyz);\n' +
  // Dot product of the light direction and the orientation of a surface (the normal)
  '  float nDotL = max(dot(u_LightDirection, normal), 0.0);\n' + //Lambertian
	'  vec3 diffuse = u_LightColor * u_Color.rgb * nDotL;\n' +	
	// Calculate the color due to diffuse reflection
	'  if (u_Color.a == 1.0){\n' +
	'  	if (u_Clicked) {\n' + //  Draw in red if mouse is pressed
	'    	v_Color = u_idColor;\n' +
	'  	} else {\n' +
	'    	v_Color = vec4(diffuse, u_Color.a);\n' +
	'  	}}\n' +
	// Wireframe color
	'  else\n' +
	'      v_Color = vec4(1.0, 0.0, 1.0, 1.0);\n' +
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

var g_points = [];  // The array for the position of a mouse press
var mode = 0;
var clickMode = 0;
var view = 1;
var proj = 0;
var id = 0;
var selected = 0;
var aspectRatio = 1;
var SpanX = 200;
var SpanY = 200;
var g_EyeX = 0.0, g_EyeY = 0.0, g_EyeZ = 400.0; // Eye position
// var g_EyeX = 0.0, g_EyeY = -400.0, g_EyeZ = 75.0; // Eye position

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');
  canvas.oncontextmenu = () => false;
  aspectRatio = canvas.width/canvas.height;
  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

//Switch for Create/Select toggle  
  var checkbox0 = document.getElementById("myCheck0");
  checkbox0.addEventListener('change', function () {
    if (checkbox0.checked) {
      clickMode = 1;
      console.log("Selection");
    } 
    else {
      clickMode = 0;
      console.log("Creation");
    }
  });	

//Switch for Top/Side view toggle  
  var checkbox1 = document.getElementById("myCheck1");
  checkbox1.addEventListener('change', function () {
    if (checkbox1.checked) {
      g_EyeX = 0.0, g_EyeY = -400.0, g_EyeZ = 75.0;
      console.log("Sideview");
      draw(gl, u_MvpMatrix);
    } 
    else {
      g_EyeX = 0.0, g_EyeY = 0.0, g_EyeZ = 400.0;
      console.log("Topview");
      draw(gl, u_MvpMatrix);
    }
  });	

//Switch for Shading/Wireframe toggle  	
	var checkbox2 = document.getElementById("myCheck2");
  checkbox2.addEventListener('change', function () {
    if (checkbox2.checked) {
      console.log("Wireframe");
      mode = 1;
      draw(gl, u_MvpMatrix);
    } 
    else {
      mode = 0;
      console.log("Solid");
      draw(gl, u_MvpMatrix);
    }
  });	

//Switch for Perspective/Orthographic toggle	
	var checkbox4 = document.getElementById("myCheck4");
  checkbox4.addEventListener('change', function () {
    if (checkbox4.checked) {
			proj = 1;
			console.log("Perspective");
			draw(gl, u_MvpMatrix);
    } 
    else {
			proj = 0;
			console.log("Orthographic");
			draw(gl, u_MvpMatrix);
    }
  });	
	
	var submit = document.getElementById('loadbutton');
  submit.addEventListener('click', function () {
    draw(gl, u_MvpMatrix);
  });

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Get the storage locations of u_ViewMatrix and u_ProjMatrix variables and u_Translate
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
  if (!u_LightColor || !u_LightDirection) { 
    console.log('Failed to get uniform variable(s) storage location');
    return;
  }
  
   // Set the light color (white)
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  // Set the light direction (in the world coordinate)
  var lightDirection = new Vector3([1, 1, 1]);
  lightDirection.normalize();     // Normalize
  gl.uniform3fv(u_LightDirection, lightDirection.elements);

  // Get the storage location of u_MvpMatrix
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  var u_Clicked = gl.getUniformLocation(gl.program, 'u_Clicked');
  if (!u_MvpMatrix || !u_Clicked) { 
    console.log('Failed to get the storage location of uniform variable');
    return;
  }
  gl.uniform1i(u_Clicked, 0); // Pass false to u_Clicked
  // Register function (event handler) to be called on a mouse press

  canvas.onmousedown = function(ev){
    if(clickMode==0) {
      clickC(ev, gl, canvas, u_MvpMatrix, u_Clicked);
    }
    else {
      clickS(ev, gl, canvas, u_MvpMatrix, u_Clicked);
    }
  }
  
  canvas.onmouseup = function(){console.log("mouse up");}
  draw(gl, u_MvpMatrix);
}

function setViewMatrix(gl, u_MvpMatrix){
	var mvpMatrix = new Matrix4();   // Model view projection matrix
	if (proj == 0){
		mvpMatrix.setOrtho(-SpanX, SpanX, -SpanY, SpanY, -2000, 2000);
	}
	else {
		mvpMatrix.setPerspective(45, aspectRatio, 1, 2000);;		
	}
	mvpMatrix.lookAt(g_EyeX, g_EyeY, g_EyeZ, 0, 0, 0, 0, 1, 0);		

	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
}

//Saving a file
function save(filename) {
  var savedata = document.createElement('a');
  savedata.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(g_points));
  savedata.setAttribute('download', filename);
  savedata.style.display = 'none';
  document.body.appendChild(savedata);
  savedata.click();
  document.body.removeChild(savedata);
}

//Loading a file
function load() {
  var Loadfile = document.getElementById("loadscene").files[0];
  var reader = new FileReader();
  reader.readAsText(Loadfile);
  reader.onload = function () {
    var len = this.result.length;
    var data = this.result.slice(1, len);
    var xyb = data.split(',');
    for (var i = 0; i < xyb.length; i=i+4) {
      g_points.push(([parseFloat(xyb[i]), parseFloat(xyb[i+1]), parseFloat(xyb[i+2]), parseFloat(xyb[i+3])]));
    }
  };	
	console.log("g_points: ", g_points);
}

//All mouse functionalities
function clickC(ev, gl, canvas, u_MvpMatrix, u_Clicked) {
  // Write the positions of vertices to a vertex shader
	var x = ev.clientX; // x coordinate of a mouse pointer
	var y = ev.clientY; // y coordinate of a mouse pointer
	var rect = ev.target.getBoundingClientRect();
	var btn = ev.button;
	x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
	y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  //if in shaded mode, create new tree
  if (mode == 0) { 
    g_points.push([x, y, btn, ++id]);
  }

	draw(gl, u_MvpMatrix);
}

function clickS(ev, gl, canvas, u_MvpMatrix, u_Clicked) {
  // Write the positions of vertices to a vertex shader
	var downX = ev.clientX; 
  var downY = ev.clientY; 
  var downBtn = ev.button;
	var rect = ev.target.getBoundingClientRect();
  var x_in_canvas = ev.clientX - rect.left, y_in_canvas = rect.bottom - ev.clientY;
  console.log("downX", downX);
  console.log("downY", downY);
  //collect mouse release info
  var upX = 0;
  var upY = 0;
  var upBtn = -1;
  canvas.onmouseup = function(ev) {
    upX = ev.clientX;
    upY = ev.clientY;
    upBtn = ev.button;
    console.log("upX", upX);
    console.log("upY", upY);
    console.log("upBtn", upBtn);

  }

	gl.uniform1i(u_Clicked,1); // Pass true to u_Clicked
  draw(gl, u_MvpMatrix);

	var pixels = new Uint8Array(4); // Array for storing the pixel value
	gl.readPixels(x_in_canvas, y_in_canvas, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  idx = Math.round(pixels[0]/5);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
	gl.uniform1i(u_Clicked,0); // Pass false to u_Clicked(rewrite the cube)	

	if (mode == 0) { //if shaded
		if (selected == 0) { //if no selected tree
      if(pixels[0] != 0) { //if clicking on tree for selection
				g_points[(idx-1)][2]++;
				selected = idx;
			}
		}
		else if (selected > 0) { //if there is selected tree
			if (pixels[0] == 0) { //if pressing on white
				g_points[(selected-1)][2]--; 
				selected = 0;
			}
		}
	}

	draw(gl, u_MvpMatrix);
}

// function click(ev, gl, canvas, u_MvpMatrix, u_Clicked) {
//   // Write the positions of vertices to a vertex shader
// 	var x = ev.clientX; // x coordinate of a mouse pointer
// 	var y = ev.clientY; // y coordinate of a mouse pointer
// 	var rect = ev.target.getBoundingClientRect();
// 	var btn = ev.button;
// 	x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
// 	y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
//   var x_in_canvas = ev.clientX - rect.left, y_in_canvas = rect.bottom - ev.clientY;
  
// 	gl.uniform1i(u_Clicked,1); // Pass true to u_Clicked
//   draw(gl, u_MvpMatrix);

// 	var pixels = new Uint8Array(4); // Array for storing the pixel value
// 	gl.readPixels(x_in_canvas, y_in_canvas, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
//   idx = Math.round(pixels[0]/5);

// 	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
// 	gl.uniform1i(u_Clicked,0); // Pass false to u_Clicked(rewrite the cube)	

// 	if (mode == 0){ //if shaded
// 		if (selected == 0){ //if no selected tree
//       if (pixels[0] == 0){ //if click background
//         if(clickMode==0) { //if creation mode
//           g_points.push([x, y, btn, ++id]);
//         }
// 			}
// 			else{ //if clicking on tree for selection
// 				g_points[(idx-1)][2]++;
// 				selected = idx;
// 				}
// 			}
// 		else if (selected > 0){ //if there is selected tree
// 			if (pixels[0] == 0){ //if pressing on white
// 				g_points[(selected-1)][2]--; 
// 				selected = 0;
// 				}
// 			}
// 		}

// 	draw(gl, u_MvpMatrix);
// }

//Draw function
function draw(gl, u_MvpMatrix) {
	setViewMatrix(gl, u_MvpMatrix);
	console.log(g_points);
	var len = g_points.length;
	for(var i = 0; i < len; i++) {
		var xy = g_points[i];
		drawTree(gl, xy);
  }
}

//Draw a tree 
function drawTree(gl, xy) {
  if(xy[2] == 0)
	var v = new Float32Array(treeR2);
  else
	var v = new Float32Array(treeR2);  
 
  var n = v.length;
  for(var i = 0; i < n; i=i+6) {
	  var d = Math.sqrt((v[i]-v[i+3])*(v[i]-v[i+3])+(v[i+1]-v[i+4])*(v[i+1]-v[i+4])+(v[i+2]-v[i+5])*(v[i+2]-v[i+5]));
	drawCylinder(gl, v[i],v[i+1],v[i+2], v[i+3],v[i+4],v[i+5], d, xy);
  }
}

function drawCylinder(gl, x1, y1, z1, x2, y2, z2, d, xy) {
	r1 = d/10;
	r2 = d/20;
	sides = 12;
	var cylinder = [];
	var normals = [];

	for(var i = 0; i < 12; i++) {
		var x = Math.cos((i/6)*(Math.PI));
		var y = Math.sin((i/6)*(Math.PI));
		cylinder.push(x1+r1*x,y1+r1*y,z1, x2+r2*x,y2+r2*y,z2);
	}
	
	for(var i = 0; i < 6; i++)
		cylinder.push(cylinder[i]);
	
	for(var i = 0; i < cylinder.length-6; i=i+3) {
		var v1 = [cylinder[i], cylinder[i+1], cylinder[i+2]];
    var v2 = [cylinder[i+3], cylinder[i+4], cylinder[i+5]];
    var v3 = [cylinder[i+6], cylinder[i+7], cylinder[i+8]];
    if(i%2 == 0){
			var v23 = [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
			var v21 = [v3[0] - v2[0], v3[1] - v2[1], v3[2] - v2[2]];
		}
		else{
			var v21 = [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
			var v23 = [v3[0] - v2[0], v3[1] - v2[1], v3[2] - v2[2]];
		}

		// Calculate Normals
		var N = [];
		var N1 = v23[1]*v21[2] - v23[2]*v21[1];
		var N2 = v21[0]*v23[2] - v21[2]*v23[0];
		var N3 = v23[0]*v21[1] - v23[1]*v21[0];

    N.push(N1, N2 ,N3);
    var Vmag = Math.sqrt(N[0]**2 + N[1]**2 + N[2]**2);        
		
		N[0] = N[0]/Vmag;
    N[1] = N[1]/Vmag;
    N[2] = N[2]/Vmag;
		normals.push(N[0],N[1],N[2]);
	}
	
	for(var i = 0; i < 6; i++)
		normals.push(normals[i]);
  
  var vertices = new Float32Array(cylinder);
  var n = cylinder.length/3;

  // Create a buffer object
  var vertexbuffer = gl.createBuffer();  
  if (!vertexbuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexbuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // Assign the buffer object to a_Position and enable the assignment
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  
  var vN = new Float32Array(normals);

  // Create a buffer object
  var normalbuffer = gl.createBuffer();  
  if (!normalbuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, normalbuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vN, gl.STATIC_DRAW);

  // Assign the buffer object to a_Position and enable the assignment
  var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if(a_Normal < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);
  
  // Pass the translation distance to the vertex shader
  var u_Translation = gl.getUniformLocation(gl.program, 'u_Translation');
  if (!u_Translation) {
    console.log('Failed to get the storage location of u_Translation');
    return;
  }

  gl.uniform4f(u_Translation, SpanX*xy[0], (400/g_EyeZ)*SpanY*xy[1], 0, 0);

  var u_Color = gl.getUniformLocation(gl.program, 'u_Color');
  if (!u_Color) {
    console.log('Failed to get the storage location of u_Color');
    return;
  }
  
  var u_idColor = gl.getUniformLocation(gl.program, 'u_idColor');
  if (!u_idColor) {
    console.log('Failed to get the storage location of u_idColor');
    return;
  }
  
  var r_id = xy[3]/51; //Encoding tree id as color value (max 50 trees)
  
  gl.uniform4f(u_idColor, r_id, 1.0, 0.0, 1.0);

  // Clear <canvas>
  // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
  // Draw
  if (mode == 0){
    if(xy[2] == 0){
      gl.uniform4f(u_Color, 1.0, 0.0, 0.0, 1.0);
    }
    else if (xy[2] == 2){
      gl.uniform4f(u_Color, 0.0, 0.0, 1.0, 1.0);
    }
    else if (xy[2] == 1 || xy[2] == 3){
      gl.uniform4f(u_Color, 0.0, 1.0, 0.0, 1.0);
    }
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
  }
  else if (mode == 1){
    gl.uniform4f(u_Color, 1.0, 0.0, 1.0, 0);
    gl.drawArrays(gl.LINES, 0, n);
  }
}
