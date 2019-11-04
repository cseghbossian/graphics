// Program2
// CylTree.js
/**
 * Created by Fahim Hasan Khan
 * Date: 10/29/2019
 * DISCLAIMER: Use at your own risk. There's more than one way to implement this. So, this method may be completely different than yours, your data structure, your coding style, etc. and may also require time to adapt to your code, etc. It is highly recommended the use it as a guide to complete your version (if necessary), or use it as it is and expand to add functionality for remaining assignments.
 */

// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
//  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +        // Normal
  'uniform vec4 u_Translation;\n' +
  'uniform vec4 u_Color;\n' +
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
  'uniform mat4 u_MvpMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * (a_Position + u_Translation);\n' +  
	// Make the length of the normal 1.0
    '  vec3 normal = normalize(a_Normal.xyz);\n' +
    // Dot product of the light direction and the orientation of a surface (the normal)
    '  float nDotL = max(dot(u_LightDirection, normal), 0.0);\n' +
    // Calculate the color due to diffuse reflection
    '  vec3 diffuse = u_LightColor * u_Color.rgb * nDotL;\n' +
	'  if (u_Color.a == 1.0)\n' +
	'      v_Color = vec4(diffuse, u_Color.a);\n' +
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
//  '  gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

var g_points = [];  // The array for the position of a mouse press
var mode = 0;
var view = 1;
var proj = 0;
var aspectRatio = 1;
var SpanX = 200;
var SpanY = 200;

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
  
      var checkbox1 = document.getElementById("myCheck1");
    checkbox1.addEventListener('change', function () {
        if (checkbox1.checked) {
			view = 0;
			console.log("Sideview");
			draw(gl, u_MvpMatrix);
        } else {
			view = 1;
			console.log("Topview");
			draw(gl, u_MvpMatrix);
        }
    });	
	
	var checkbox2 = document.getElementById("myCheck2");
    checkbox2.addEventListener('change', function () {
        if (checkbox2.checked) {
			console.log("Solid");
			mode = 1;
			draw(gl, u_MvpMatrix);
        } else {
			mode = 0;
			console.log("Wireframe");
			draw(gl, u_MvpMatrix);
        }
    });	
	
	var checkbox4 = document.getElementById("myCheck4");
    checkbox4.addEventListener('change', function () {
        if (checkbox4.checked) {
			proj = 1;
			console.log("Orthographic");
			draw(gl, u_MvpMatrix);
        } else {
			proj = 0;
			console.log("Perspective");
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
//  if (!u_Translate || !u_LightColor || !u_LightDirection) { 
//    console.log('Failed to get uniform variable(s) storage location');
//    return;
//  }
  
   // Set the light color (white)
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  // Set the light direction (in the world coordinate)
  var lightDirection = new Vector3([1, 1, 1]);
  lightDirection.normalize();     // Normalize
  gl.uniform3fv(u_LightDirection, lightDirection.elements);

  // Get the storage location of u_MvpMatrix
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  if (!u_MvpMatrix) { 
    console.log('Failed to get the storage location of u_MvpMatrix');
    return;
  }
    // Register function (event handler) to be called on a mouse press
  //document.onkeydown = function(ev){ keydown(ev, gl, u_MvpMatrix, mvpMatrix); };

  canvas.onmousedown = function(ev){ click(ev, gl, canvas, u_MvpMatrix); };
  draw(gl, u_MvpMatrix);
}

function setViewMatrix(gl, u_MvpMatrix){
	var mvpMatrix = new Matrix4();   // Model view projection matrix
	if (proj == 0){
		mvpMatrix.setOrtho(-SpanX, SpanX, -SpanY, SpanY, -1000, 1000);
	}
	else {
		mvpMatrix.setPerspective(60, aspectRatio, 1, 2000);;		
	}
	
	if (view == 0){
		mvpMatrix.lookAt(0, -400, 75, 0, 0, 0, 0, 1, 0);
	}
	else {
		mvpMatrix.lookAt(0, 0, 400, 0, 0, 0, 0, 1, 0);		
	}

	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
}

function save(filename) {
  var savedata = document.createElement('a');
  savedata.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(g_points));
  savedata.setAttribute('download', filename);
  savedata.style.display = 'none';
  document.body.appendChild(savedata);
  savedata.click();
  document.body.removeChild(savedata);
}

function load() {
    var Loadfile = document.getElementById("loadscene").files[0];
    var reader = new FileReader();
    reader.readAsText(Loadfile);
    reader.onload = function () {
        var len = this.result.length;
        var data = this.result.slice(1, len);
        var xyb = data.split(',');
        for (var i = 0; i < xyb.length; i=i+3) {
			g_points.push(([parseFloat(xyb[i]), parseFloat(xyb[i+1]), parseFloat(xyb[i+2])]));
        }
    };	
	console.log("g_points: ", g_points);
}

function click(ev, gl, canvas, u_MvpMatrix, mvpMatrix) {
	
  // Write the positions of vertices to a vertex shader
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();
  var btn = ev.button;
  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  // Store the coordinates to g_points array
  g_points.push([x, y, btn]);
  draw(gl, u_MvpMatrix);
}

function draw(gl, u_MvpMatrix) {
	setViewMatrix(gl, u_MvpMatrix);

//	console.log(g_points);
	var len = g_points.length;
	for(var i = 0; i < len; i++) {
		var xy = g_points[i];
		drawTree(gl, u_MvpMatrix, xy);
  }
}

function drawTree(gl, u_MvpMatrix, xy) {
  if(xy[2] == 0)
	var v = new Float32Array(treeR3);
  else
	var v = new Float32Array(treeR4);  
 
  var n = v.length;
  //console.log(n);
  var r1 = 0;
  var r2 = 0;
  for(var i = 0; i < n; i=i+6) {
    //length of branch
	var d = Math.sqrt((v[i]-v[i+3])*(v[i]-v[i+3])+(v[i+1]-v[i+4])*(v[i+1]-v[i+4])+(v[i+2]-v[i+5])*(v[i+2]-v[i+5]));
	drawCylinder(gl, u_MvpMatrix, v[i],v[i+1],v[i+2], v[i+3],v[i+4],v[i+5], d, xy);
  }
}

function drawCylinder(gl, u_MvpMatrix, x1, y1, z1, x2, y2, z2, d, xy) {
	r1 = d/10;
	r2 = d/20;
	sides = 12;
	var cylinder = [];
	var Circle1 = [];
	var Circle2 = [];
	var normals = [];

    for (var i = 0; i <= sides; i++) {
		Circle1.push(r1 * Math.cos(i * Math.PI / 6), r1 * Math.sin(i * Math.PI / 6));
        Circle2.push(r2 * Math.cos(i * Math.PI / 6), r2 * Math.sin(i * Math.PI / 6));       
    }
	
	for (var i = 0; i < (sides*2); i=i+2) {
        cylinder.push(x2+Circle2[i], y2+Circle2[i+1], z2, 
		x1+Circle1[i], y1+Circle1[i+1], z1, 
		x2+Circle2[i+2], y2+Circle2[i+3], z2, 
		x2+Circle2[i+2], y2+Circle2[i+3], z2, 
		x1+Circle1[i], y1+Circle1[i+1], z1, 
		x1+Circle1[i+2], y1+Circle1[i+3], z1);
    }

    for (var i = 0; i <cylinder.length; i=i+9) {
        // Create Vectors
		var v1 = [cylinder[i], cylinder[i+1], cylinder[i+2]];
        var v2 = [cylinder[i+3], cylinder[i+4], cylinder[i+5]];
        var v3 = [cylinder[i+6], cylinder[i+7], cylinder[i+8]];
        var v21 = [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
        var v23 = [v3[0] - v2[0], v3[1] - v2[1], v3[2] - v2[2]];
        
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
        normals = normals.concat(N, N, N);
    }
  
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

  // Set the matrix to be used for to set the camera view
  //mvpMatrix.LookAt(g_EyeX, g_EyeY, g_EyeZ, 0, 0, 0, 0, 1, 0);

  // Pass the view projection matrix
  //gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
  
    // Pass the translation distance to the vertex shader
  var u_Translation = gl.getUniformLocation(gl.program, 'u_Translation');
  if (!u_Translation) {
    console.log('Failed to get the storage location of u_Translation');
    return;
  }

  gl.uniform4f(u_Translation, SpanX*xy[0], SpanY*xy[1], 0, 0);  
  
  var u_Color = gl.getUniformLocation(gl.program, 'u_Color');
  if (!u_Color) {
    console.log('Failed to get the storage location of u_Color');
    return;
  }
  // Clear <canvas>
  //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
  // Draw
  if (mode == 0){
	if(xy[2] == 0)
		gl.uniform4f(u_Color, 1, 0, 0, 1);
	else if (xy[2] == 2)
		gl.uniform4f(u_Color, 0, 0, 1, 1);
	gl.drawArrays(gl.TRIANGLES, 0, n);
  }
  else if (mode == 1){
	gl.uniform4f(u_Color, 0, 0, 0, 0);
	gl.drawArrays(gl.LINES, 0, n);
  }
}
