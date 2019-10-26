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
var r = 0;  // determines render mode
var v = 0;  // determines view mode
var n = 0;  //determines if normals show

function main() {

  var Rx = new Matrix4();
  var Ry = new Matrix4();
  var T = new Matrix4();
  findMatrices(3,5,8,2,2,40, T, Rx, Ry);
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

function findMatrices(x1, y1, z1, x2, y2, z2, T, Rx, Ry) {
  //set translation matrix
  T.setTranslate(-x1,-y1,-z1);

  //calculate translated end point
  var p2x = x2-x1;
  var p2y = y2-y1;
  var p2z = z2-z1;
  var length = Math.sqrt(Math.pow(p2x,2)+Math.pow(p2y,2)+Math.pow(p2z,2));

  //some calculations for finding rotation matrices
  var alpha = Math.asin(p2y/(Math.sqrt(Math.pow(p2y,2)+Math.pow(p2z,2))));
  var beta = Math.asin(p2x/length);

  //set Rx to rotate alpha radians around x-axis
  Rx.setRotate(alpha,1,0,0);

  //set Ry to rotate -beta radians around y-axis
  Ry.setRotate(-beta,0,1,0);
  
  //taking inverse makes no difference but leaving this here for principal
  T.invert; 
  Rx.invert;
  Ry.invert;

}