// Program3 
// prog3.js by Celine Seghbossian
// Base code taken from CylTree.js by Fahim Hasan Knan


// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Normal;\n' +        // Normal
  'uniform vec4 u_Translation;\n' +
  'uniform mat4 m_Transformation;\n' +
  'uniform vec4 u_Color;\n' +
  'uniform vec4 u_idColor;\n' +  
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform bool u_Clicked;\n' + // Mouse is pressed
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * m_Transformation * (a_Position + u_Translation);\n' +  
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
var matrices = [];
var sphereMatrix = new Matrix4();
var mode = 0;
var clickMode = 0;
var view = 1;
var proj = 0;
var id = 0;
var selected = 0;
var aspectRatio = 1.5;
var SpanX = 500;
var SpanY = 500;
var g_EyeX = 0.0, g_EyeY = 0.0, g_EyeZ = 1000.0; // Eye position

function main() {
/*
* Functionality:
* --------------
* - Retrieves <canvas> element from driver.html
* - Retrieves and verifies rendering context for WebGL
* - Maintains event listeners to handle toggle switches and file load/save
* - Fetches and verifies storage locations of each variable in shader programs
* - Calls click(...) function for each mouse click event
* - Calls draw(...) function for every click/toggle
* - Calls appropriate event functions when mouse is clicked/dragged/scrolled
*
* Outcome:
* --------
* Draws a red tree at location of each left click and a blue tree at location of each right click
* In selection mode, applies transformations to selected tree
* By default, has all switches toggled off
*/
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

  /////////////////////DEBUG//////////////////////////////

  // var M = new Matrix4();
  // M.setScale(3,3,3);
  // console.log(M);

  // var MM = new Matrix4();
  // MM.setScale(5,5,5);
  // console.log(MM);

  // M.multiply(MM);
  // console.log(M);

  /////////////////////DEBUG//////////////////////////////

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
      clickC(ev, gl, canvas, u_MvpMatrix);
    }
    else {
      clickS(ev, gl, canvas, u_MvpMatrix, u_Clicked);
    }
  }
  //scaling
  canvas.onmousewheel = function(ev) {
    if(clickMode==1){
      setTransMatrix(0,0,0,0,ev.wheelDelta);
      draw(gl, u_MvpMatrix);
    }
  }
  
  draw(gl, u_MvpMatrix);
}

function setViewMatrix(gl, u_MvpMatrix){
/* Parameters:
* ------------
* u_MvpMatrix  :: location of view matrix in shader
* gl           :: WebGLProgram containing shader program
*
* Outcome:
* --------
* Sets view matrix depending on viewing modes determined by toggle switches
*/
	var mvpMatrix = new Matrix4();   // Model view projection matrix
	if (proj == 0){
    mvpMatrix.setOrtho(-SpanX, SpanX, -SpanY, SpanY, -2000, 2000);
    mvpMatrix.lookAt(g_EyeX, g_EyeY, g_EyeZ, 0, 0, 0, 0, 1, 0);	
	}
	else {
    mvpMatrix.setPerspective(45, aspectRatio, 1, 2000);
    mvpMatrix.lookAt(g_EyeX, g_EyeY, g_EyeY+500, 0, 0, 0, 0, 1, 0);			
	}
		

	gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
}

//Saving a file
function save(filename) {
/* Parameters:
* ------------
* filename  :: filename to save output to
*
* Outcome:
* --------
* Saves click metadata from g_points[] into a file called filename
* Creates filename if it doesn't already exist
*/
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
/* Outcome:
* ---------
* Loads click data from file chosen by user
*/
  var Loadfile = document.getElementById("loadscene").files[0];
  var reader = new FileReader();
  reader.readAsText(Loadfile);
  reader.onload = function () {
    var len = this.result.length;
    var data = this.result.slice(1, len);
    var xyb = data.split(',');
    for (var i = 0; i < xyb.length; i=i+5) {
      g_points.push(([parseFloat(xyb[i]), parseFloat(xyb[i+1]), parseFloat(xyb[i+2]), parseFloat(xyb[i+3]),parseFloat(xyb[i+4])]));
    }
  };	
	console.log("g_points: ", g_points);
}

//All mouse functionalities
function clickC(ev, gl, canvas, u_MvpMatrix) {
/* Parameters:
* ------------
* ev              :: MouseEvent when user clicks canvas
* gl              :: WebGLProgram containing shader program
* canvas          :: HTMLElement <canvas>
* u_MvpMatrix     :: GLint number indicating location of u_MvpMatrix variable in fragment shader
*
* Outcome:
* --------
* Saves click data into an array g_points[] if create && flat-shading mode 
* Pushes identity matrix into matrices[], corresponding to click
*/
  // Write the positions of vertices to a vertex shader
	var x = ev.clientX; // x coordinate of a mouse pointer
	var y = ev.clientY; // y coordinate of a mouse pointer
	var rect = ev.target.getBoundingClientRect();
	var btn = ev.button;
	x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
	y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  //if in shaded mode, create new tree
  if (mode == 0) { 
    if (btn==1) {
      btn=0;
    }
    var tmatrix = new Matrix4();

    g_points.push([x, y, btn, ++id, 1]);
    matrices.push(tmatrix);
  }

  draw(gl, u_MvpMatrix);
}

function clickS(ev, gl, canvas, u_MvpMatrix, u_Clicked) {
/* Parameters:
* ------------
* ev              :: MouseEvent when user clicks down on canvas
* gl              :: WebGLProgram containing shader program
* canvas          :: HTMLElement <canvas>
* u_MvpMatrix     :: GLint number indicating location of u_MvpMatrix variable in fragment shader
* u_Clicked       :: GLint number indicating location of u_Clicked variable in fragment shader
*
* Functionality:
* --------------
* - Records mouse up event data and determines if drag or click
* - If click, selects/deselects tree and updates selected global variable and color data in g_points[]
* - If drag, calls setTransMatrix() which updates matrices[]
*
* Outcome:
* --------
* Updates the selected tree's matrix depending on mouse events (if select && flat-shading mode)
* Does nothing in wireframe mode
*/
  //if wireframe, do nothing
  if(mode!=0){ 
    return;
  }
  // Write the positions of vertices to a vertex shader
	var downX = ev.clientX; 
  var downY = ev.clientY; 
  var upX = 0;
  var upY = 0;
  var btn = ev.button;
	var rect = ev.target.getBoundingClientRect();
  var x_in_canvas = ev.clientX - rect.left, y_in_canvas = rect.bottom - ev.clientY;

  canvas.onmouseup = function(ev) {
    //collect mouse up info
    upX = ev.clientX;
    upY = ev.clientY;
    upBtn = ev.button;

    //click(not drag)
    if(Math.abs(downX-upX)<5 && Math.abs(downY-upY)<5) { 
      // Read pixels at click location
      gl.uniform1i(u_Clicked,1);
      draw(gl, u_MvpMatrix);
      var pixels = new Uint8Array(4);
      gl.readPixels(x_in_canvas, y_in_canvas, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      idx = Math.round(pixels[0]/5);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
      gl.uniform1i(u_Clicked,0);

      //select
      if (selected == 0) { //if no selected tree
        if(pixels[0] != 0) { //if clicking on tree for selection
          g_points[(idx-1)][2]++;
          selected = idx;
        }
      }
      //deselect
      else { //if there is selected tree
        if (pixels[0] == 0) { //if pressing on white
          g_points[(selected-1)][2]--; 
          selected = 0;
        }
      }
    } 
    //drag
    else{
      if(clickMode==1){
        setTransMatrix(downX, downY, upX, upY, btn);
      }
    }

  draw(gl, u_MvpMatrix);
  }
}

function setTransMatrix(downX, downY, upX, upY, btn) {
/* Parameters:
* ------------
* downX     :: x-coord of mouse down event
* downY     :: y-coord of mouse down event
* upX       :: x-coord of mouse up event
* upY       :: y-coord of mouse up event
* btn       :: 0,1,2 for left,middle,right OR a multiple of 120 for scrolling
*
* Functionality:
* --------------
* - Determines type of transformation from mouse data
* - Updates cumulative matrix in matrices[] with new transformation 
*
* Outcome:
* --------
* Updates the selected tree's matrix depending on mouse events (if select && flat-shading mode)
*/
  if(selected==0) {
    return;
  }
  
  var cMatrix = new Matrix4();
  cMatrix.set(matrices[selected-1]);
  
  
  var invMatrix = new Matrix4();
  invMatrix.setInverseOf(cMatrix);
  console.log("cMatrix after=",cMatrix);
  console.log("invMatrix=",invMatrix);
  
  var newMatrix = new Matrix4();
  //console.log("newMatrix=",newMatrix);

  //rotating
  if(btn == 2) {
    if(Math.abs(downX-upX) > Math.abs(downY-upY)){
      console.log("rotating about z-axis", downX-upX);
      var rad = (downX-upX)*Math.PI/30;
      newMatrix.rotate(rad, 0, 0, 1);
    }
    else {
      console.log("rotating about x-axis", downY-upY);
      var rad = (downY-upY)*Math.PI/15;
      newMatrix.rotate(rad, 1, 0, 0);
    }
  }
  //translating along x, y
  else if(btn == 0) {
    console.log("translating on x- and y-axes"); 
    var xdisp = upX - downX;
    var ydisp = downY - upY;
    newMatrix.translate(xdisp/2, ydisp/2, 0);
  }
  //translating along z
  else if(btn==1) {
    console.log("translating on z-axis");
    newMatrix.translate(0, 0, (downY-upY)/2);
  }
  //scaling
  else {
    console.log("scaling", btn);
    var sFactor = 1 + (0.1*btn/120);
    if(g_points[selected-1][4]*sFactor>=0.5 || g_points[selected-1][4]<=2){
      g_points[selected-1][4]*=sFactor;
      newMatrix.scale(sFactor, sFactor, sFactor);
    }
  }

  //return to origin
  matrices[selected-1].multiply(invMatrix);
  matrices[selected-1].translate(-(SpanX*g_points[selected-1][0]),-(SpanY*g_points[selected-1][1]),0);

  
  matrices[selected-1].multiply(newMatrix);
  matrices[selected-1].multiply(cMatrix);
  matrices[selected-1].translate((SpanX*g_points[selected-1][0]),(SpanY*g_points[selected-1][1]),0);

}

//Draw function
function draw(gl, u_MvpMatrix) {
/* Parameters:
* ------------
* gl              :: WebGLProgram containing shader program
* u_MvpMatrix     :: GLint number indicating location of u_MvpMatrix variable in fragment shader
*
* Outcome:
* --------
* Draws each tree stored in g_points by calling drawTree(...)
*/
	setViewMatrix(gl, u_MvpMatrix);
  //console.log(g_points);
  drawOrb(gl);
	var len = g_points.length;
	for(var i = 0; i < len; i++) {
		var xy = g_points[i];
		drawTree(gl, xy);
  }
  console.log(g_points);
}

function drawOrb(gl) {
  var SPHERE_DIV = 13;

  var i, ai, si, ci;
  var j, aj, sj, cj;
  var p1, p2;

  var positions = [];
  var indices = [];

  // Generate coordinates
  for (j = 0; j <= SPHERE_DIV; j++) {
    aj = j * Math.PI / SPHERE_DIV;
    sj = Math.sin(aj);
    cj = Math.cos(aj);
    for (i = 0; i <= SPHERE_DIV; i++) {
      ai = i * 2 * Math.PI / SPHERE_DIV;
      si = Math.sin(ai);
      ci = Math.cos(ai);

      positions.push(si * sj * 5);  // X
      positions.push(cj * 5);       // Y
      positions.push(ci * sj * 5);  // Z
    }
  }

  // Generate indices
  for (j = 0; j < SPHERE_DIV; j++) {
    for (i = 0; i < SPHERE_DIV; i++) {
      p1 = j * (SPHERE_DIV+1) + i;
      p2 = p1 + (SPHERE_DIV+1);

      indices.push(p1);
      indices.push(p2);
      indices.push(p1 + 1);

      indices.push(p1 + 1);
      indices.push(p2);
      indices.push(p2 + 1);
    }
  }

  // Write the vertex property to buffers (coordinates and normals)
  // Same data can be used for vertex and normal
  // In order to make it intelligible, another buffer is prepared separately
  if (!initArrayBuffer(gl, 'a_Position', new Float32Array(positions), gl.FLOAT, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', new Float32Array(positions), gl.FLOAT, 3))  return -1;
  
  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  // Pass the translation distance to the vertex shader
  var u_Translation = gl.getUniformLocation(gl.program, 'u_Translation');
  if (!u_Translation) {
    console.log('Failed to get the storage location of u_Translation');
    return;
  }
  gl.uniform4f(u_Translation, 0, 0, 0, 0);

  // Pass the mouse transformation to the vertex shader
  var m_Transformation = gl.getUniformLocation(gl.program, 'm_Transformation');
  if (!m_Transformation) {
    console.log('Failed to get the storage location of m_Transformation');
    return;
  }
  gl.uniformMatrix4fv(m_Transformation, false, sphereMatrix.elements);
  
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
    
  gl.uniform4f(u_idColor, 1.0, 1.0, 0.0, 1.0);

  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);  
}

function initArrayBuffer(gl, attribute, data, type, num) {
  // Create a buffer object
  var buffer = gl.createBuffer();
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

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}

//Draw a tree 
function drawTree(gl, xy) {
/* Parameters:
* ------------
* gl              :: WebGLProgram containing shader program
* u_MvpMatrix     :: GLint number indicating location of u_MvpMatrix variable in fragment shader
* xy              :: a 4-tuple from g_points containing click data: (x-coord, y-coord, type, index)
*
* Outcome:
* --------
* Draws each cylinder inside tree by calling drawCylinder(...)
*/
  if(xy[2] == 0 || xy[2] == 1)
	var v = new Float32Array(treeR2);
  else
	var v = new Float32Array(treeR3);  
 
  var n = v.length;
  for(var i = 0; i < n; i=i+6) {
	  var d = Math.sqrt((v[i]-v[i+3])*(v[i]-v[i+3])+(v[i+1]-v[i+4])*(v[i+1]-v[i+4])+(v[i+2]-v[i+5])*(v[i+2]-v[i+5]));
	drawCylinder(gl, v[i],v[i+1],v[i+2], v[i+3],v[i+4],v[i+5], d, xy);
  }
}

function drawCylinder(gl, x1, y1, z1, x2, y2, z2, d, xy) {
/* Parameters:
* ------------
* gl              :: WebGLProgram containing shader program
* u_MvpMatrix     :: GLint number indicating location of u_MvpMatrix variable in fragment shader
* (x1,y1,z1)      :: center of top of cylinder
* (x2,y2,z2)      :: center of base of cylinder
* xy              :: a 4-tuple from g_points containing click data: (x-coord, y-coord, type, index)
* d               :: distance between two points
*
* Functionality
* -------------
* Calculates vertices and normals for cylinder
* Creates and fills normal and vertex buffers
* Passes translation vector to shader
* Calls draw function for LINES or TRIANGLES, depending on render mode
*/
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
  gl.uniform4f(u_Translation, SpanX*xy[0], SpanY*xy[1], 0, 0);

  // Pass the mouse transformation to the vertex shader
  var m_Transformation = gl.getUniformLocation(gl.program, 'm_Transformation');
  if (!m_Transformation) {
    console.log('Failed to get the storage location of m_Transformation');
    return;
  }
  var tMatrix = matrices[xy[3]-1].elements;
  gl.uniformMatrix4fv(m_Transformation, false, tMatrix);
  
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