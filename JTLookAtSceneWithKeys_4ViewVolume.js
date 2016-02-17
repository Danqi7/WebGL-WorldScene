//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
//==============================================================================
//
// LookAtTrianglesWithKey_ViewVolume.js (c) 2012 matsuda
//
//  MODIFIED 2014.02.19 J. Tumblin to 
//    --demonstrate multiple viewports (see 'draw()' function at bottom of file)
//    --draw ground plane in the 3D scene:  makeGroundPlane()

// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Normals;\n' + 
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +

  'uniform mat4 u_NormalMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
  
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +

  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normals));\n' +
  // Dot product of the light direction and the orientation of a surface (the normal)
  '  float nDotL = max(dot(u_LightDirection, normal), 0.0);\n' +
  // Calculate the color due to diffuse reflection
  '  vec3 diffuse = u_LightColor * vec3(a_Color) * nDotL;\n' +
  '  v_Color = vec4(diffuse, a_Color.a);\n' +
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
  
var floatsPerVertex = 11;  // # of Float32Array elements used for each vertex
                          // (x,y,z,w)position + (r,g,b)color + (n1,n2,n3,n4) normals
var ANGLE_STEP = 45.0; 

var jointAngle = 25;

function main() 
{
//==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  //winResize(currentAngle, u_ViewMatrix, viewMatrix, ModelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix, projMatrix, u_ProjMatrix);
  //winResize();
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

  // NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
  // unless the new Z value is closer to the eye than the old one..
  gl.depthFunc(gl.LESS);       // WebGL default setting:
  gl.enable(gl.DEPTH_TEST); 
  
  // Set the vertex coordinates and color (the blue triangle is in the front)
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to specify the vertex information');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.25, 0.2, 0.25, 1.0);

  // Get handle to graphics system's storage location of u_ModelMatrix
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) 
  { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  var ModelMatrix = new Matrix4();

  // get handle for projection, light color and normals
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
  if (!u_ModelMatrix || !u_NormalMatrix || !u_LightColor || !u_LightDirection) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  var normalMatrix = new Matrix4();

  // Set the light color (white)
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  // Set the light direction (in the world coordinate)
  var lightDirection = new Vector3([0, 0, 1]);
  lightDirection.normalize();     // Normalize
  gl.uniform3fv(u_LightDirection, lightDirection.elements);

  // Get the graphics system storage locations of
  // the uniform variables u_ViewMatrix and u_ProjMatrix.
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  if (!u_ViewMatrix || !u_ProjMatrix) { 
    console.log('Failed to get u_ViewMatrix or u_ProjMatrix');
    return -1;
  }
  var currentAngle = 0;
  // Create a JavaScript matrix to specify the view transformation
  var viewMatrix = new Matrix4();
  // Register the event handler to be called on key press
  document.onkeydown= function(ev){keydown(ev, gl, currentAngle, u_ViewMatrix, viewMatrix, ModelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix, projMatrix, u_ProjMatrix)};
  // (Note that I eliminated the 'n' argument (no longer needed)).
  
  // Create the matrix to specify the camera frustum, 
  // and pass it to the u_ProjMatrix uniform in the graphics system
  var projMatrix = new Matrix4();
 
  // with this perspective-camera matrix:
  // (SEE PerspectiveView.js, Chapter 7 of book)

  projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);

  // YOU TRY IT: make an equivalent camera using matrix-cuon-mod.js
  // perspective-camera matrix made by 'frustum()' function..
  
  // Send this matrix to our Vertex and Fragment shaders through the
  // 'uniform' variable u_ProjMatrix:
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

  // ANIMATION: create 'tick' variable whose value is this function:
  //----------------- 
  var tick = function() {
    currentAngle = animate(currentAngle);  
    winResize(gl, currentAngle, u_ViewMatrix, viewMatrix, ModelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix, projMatrix, u_ProjMatrix);
    //draw(gl, currentAngle, u_ViewMatrix, viewMatrix, ModelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix, projMatrix, u_ProjMatrix);   // Draw shapes
  // console.log('currentAngle=',currentAngle); // put text in console.
    requestAnimationFrame(tick, canvas);   
                      // Request that the browser re-draw the webpage
                      // (causes webpage to endlessly re-draw itself)
  };
  tick();             // start (and continue) animation: draw current image
  // draw(gl, currentAngle, u_ViewMatrix, viewMatrix, ModelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix);
     // Draw the triangles
}

// Record the last time we called 'animate()':  (used for animation timing)
var g_last = Date.now();

function animate(angle) 
{
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
  if(angle >  120.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
  if(angle < -120.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
  
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}


function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

  var xcount = 100;     // # of lines to draw in x,y to make the grid.
  var ycount = 100;   
  var xymax = 100.0;     // grid size; extends to cover +/-xymax in x and y.
  var xColr = new Float32Array([1.0, 1.0, 0.3]);  // bright yellow
  var yColr = new Float32Array([0.5, 1.0, 0.5]);  // bright green.
  
  // Create an (global) array to hold this ground-plane's vertices:
  gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
            // draw a grid made of xcount+ycount lines; 2 vertices per line.
            
  var xgap = xymax/(xcount-1);    // HALF-spacing between lines in x,y;
  var ygap = xymax/(ycount-1);    // (why half? because v==(0line number/2))
  
  // First, step thru x values as we make vertical lines of constant-x:
  for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
    if(v%2==0) {  // put even-numbered vertices at (xnow, -xymax, 0)
      gndVerts[j  ] = -xymax + (v  )*xgap;  // x
      gndVerts[j+1] = -xymax;               // y
      gndVerts[j+2] = 0.0;                  // z
    }
    else {        // put odd-numbered vertices at (xnow, +xymax, 0).
      gndVerts[j  ] = -xymax + (v-1)*xgap;  // x
      gndVerts[j+1] = xymax;                // y
      gndVerts[j+2] = 0.0;                  // z
    }
    gndVerts[j+3] = 1.0;  //w
    gndVerts[j+4] = xColr[0];     // red
    gndVerts[j+5] = xColr[1];     // grn
    gndVerts[j+6] = xColr[2];     // blu
    gndVerts[j+7] = 0;
    gndVerts[j+8] = 0;
    gndVerts[j+9] = 1;
    gndVerts[j+10] = 0;
  }
  // Second, step thru y values as wqe make horizontal lines of constant-y:
  // (don't re-initialize j--we're adding more vertices to the array)
  for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
    if(v%2==0) {    // put even-numbered vertices at (-xymax, ynow, 0)
      gndVerts[j  ] = -xymax;               // x
      gndVerts[j+1] = -xymax + (v  )*ygap;  // y
      gndVerts[j+2] = 0.0;                  // z
    }
    else {          // put odd-numbered vertices at (+xymax, ynow, 0).
      gndVerts[j  ] = xymax;                // x
      gndVerts[j+1] = -xymax + (v-1)*ygap;  // y
      gndVerts[j+2] = 0.0;                  // z
    }
    gndVerts[j+3] = 1.0;  //w
    gndVerts[j+4] = yColr[0];     // red
    gndVerts[j+5] = yColr[1];     // grn
    gndVerts[j+6] = yColr[2];     // blu
    gndVerts[j+7] = 0;
    gndVerts[j+8] = 0;
    gndVerts[j+9] = 1;
    gndVerts[j+10] = 0;
  }
}

function makeRock()
{
    rockVerts = new Float32Array([
     //0,1,2
     0.25,   0.50,   0.25, 1.0,   1.0,  1.0,  1.0,  0,0,1,0, // v0 White
    -0.25,   0.50,   0.25, 1.0,   1.0,  0.0,  1.0,  0,0,1,0, // v1 Magenta
    -0.25,  -0.50,   0.25, 1.0,   1.0,  0.0,  0.0,  0,0,1,0, // v2 Red
    //0,2,3
     0.25,   0.50,   0.25, 1.0,   1.0,  1.0,  1.0,  0,0,1,0,
    -0.25,  -0.50,   0.25, 1.0,   1.0,  0.0,  0.0,  0,0,1,0,
     0.25,  -0.50,   0.25, 1.0,   1.0,  1.0,  0.0,  0,0,1,0,

     //0,3,4
     0.25,   0.50,   0.25, 1.0,   1.0,  1.0,  1.0,  1,0,0,0,
     0.25,  -0.50,   0.25, 1.0,   1.0,  1.0,  0.0,  1,0,0,0,
     0.25,  -0.50,  -0.25, 1.0,   0.0,  1.0,  0.0,  1,0,0,0,

     //0,4,5
     0.25,   0.50,   0.25, 1.0,   1.0,  1.0,  1.0,  1,0,0,0,
     0.25,  -0.50,  -0.25, 1.0,   0.0,  1.0,  0.0,  1,0,0,0,
     0.25,   0.50,  -0.25, 1.0,   0.0,  1.0,  1.0,  1,0,0,0,

     //0, 5, 6,  
     0.25,   0.50,   0.25, 1.0,   1.0,  1.0,  1.0,    0,1,0,0,
     0.25,   0.50,  -0.25, 1.0,   0.0,  1.0,  1.0,    0,1,0,0,
     -0.25,  0.50,  -0.25, 1.0,   0.0,  0.0,  1.0,    0,1,0,0,

     //0, 6, 1,
      0.25,   0.50,   0.25, 1.0,    1.0,  1.0,  1.0,    0,1,0,0,
     -0.25,   0.50,  -0.25, 1.0,    0.0,  0.0,  1.0,    0,1,0,0,
     -0.25,   0.50,   0.25, 1.0,    1.0,  0.0,  1.0,    0,1,0,0,

     //1, 6, 7, 
     -0.25,   0.50,   0.25, 1.0,    1.0,  0.0,  1.0,    -1,0,0,0,   
     -0.25,   0.50,  -0.25, 1.0,    0.0,  0.0,  1.0,    -1,0,0,0,
     -0.25,  -0.50,  -0.25, 1.0,    0.0,  0.0,  0.0,    -1,0,0,0,

     //1, 7, 2, 
     -0.25,   0.50,   0.25, 1.0,    1.0,  0.0,  1.0,    -1,0,0,0,
     -0.25,  -0.50,  -0.25, 1.0,    0.0,  0.0,  0.0,    -1,0,0,0,
     -0.25,  -0.50,   0.25, 1.0,    1.0,  0.0,  0.0,    -1,0,0,0,

     //7, 4, 3,
     -0.25,  -0.50,  -0.25, 1.0,    0.0,  0.0,  0.0,     0,-1,0,0,
      0.25,  -0.50,  -0.25, 1.0,    0.0,  1.0,  0.0,     0,-1,0,0,
      0.25,  -0.50,   0.25, 1.0,    1.0,  1.0,  0.0,     0,-1,0,0,

     //7, 3, 2,
     -0.25,  -0.50,  -0.25, 1.0,    0.0,  0.0,  0.0,     0,-1,0,0,
      0.25,  -0.50,   0.25, 1.0,    1.0,  1.0,  0.0,     0,-1,0,0,
     -0.25,  -0.50,   0.25, 1.0,    1.0,  0.0,  0.0,     0,-1,0,0,

     //4, 7, 6,
      0.25,  -0.50,  -0.25, 1.0,     0.0,  1.0,  0.0,     0,0,-1,0,
     -0.25,  -0.50,  -0.25, 1.0,     0.0,  0.0,  0.0,     0,0,-1,0,
     -0.25,   0.50,  -0.25, 1.0,     0.0,  0.0,  1.0,     0,0,-1,0,

     //4, 6, 5,
      0.25,  -0.50,  -0.25,  1.0,   0.0,  1.0,  0.0,     0,0,-1,0,
     -0.25,   0.50,  -0.25,  1.0,   0.0,  0.0,  1.0,     0,0,-1,0,
      0.25,   0.50,  -0.25,  1.0,   0.0,  1.0,  1.0,     0,0,-1,0,
     

     //1,8,0
     -0.25,   0.50,   0.25, 1.0,   1.0,  0.0,  1.0,  0,0,1,0,
      0.00,   0.854,  0.00, 1.0,   1.0,  1.0,  0.0,  0,0,1,0,
      0.25,   0.50,   0.25, 1.0,   1.0,  1.0,  1.0,  0,0,1,0,

     //8,0,5
     0.00,   0.854,  0.00, 1.0,    1.0,  1.0,  0.0,   0,0,1,0,
     0.25,   0.50,   0.25, 1.0,    1.0,  1.0,  1.0,   0,0,1,0,
     0.25,   0.50,  -0.25,  1.0,   0.0,  1.0,  1.0,   0,0,-1,0,

     //8,6,5
     0.00,   0.854,  0.00, 1.0,    1.0,  1.0,  0.0,   0,0,1,0,
     -0.25,   0.50,  -0.25, 1.0,   0.0,  0.0,  1.0,   0,0,-1,0,
     0.25,   0.50,  -0.25,  1.0,   0.0,  1.0,  1.0,   0,0,-1,0,

     //8,1,6
     0.00,   0.854,  0.00, 1.0,    1.0,  1.0,  0.0,   0,0,1,0,
    -0.25,   0.50,   0.25, 1.0,   1.0,  0.0,  1.0,    0,0,1,0,
    -0.25,   0.50,  -0.25, 1.0,    0.0,  0.0,  1.0,   0,0,-1,0,

    //9,2,3
     0.00,  -0.854, 0.00, 1.0,    0.0,  1.0,  0.0,      0,0,1,0,
    -0.25,  -0.50,   0.25, 1.0,    1.0,  0.0,  0.0,     0,-1,0,0,
     0.25,  -0.50,   0.25, 1.0,    1.0,  1.0,  0.0,     0,-1,0,0,

    //9,3,4,
     0.00,  -0.854,  0.00, 1.0,    0.0,  1.0,  0.0,      0,0,1,0,
     0.25,  -0.50,   0.25, 1.0,    1.0,  1.0,  0.0,     0,-1,0,0,
     0.25,  -0.50,  -0.25, 1.0,   0.0,  1.0,  0.0,      1,0,0,0,

    //9,7,4,
    0.00,  -0.854,   0.00, 1.0,    0.0,  1.0,  0.0,      0,0,1,0,
    -0.25,  -0.50,  -0.25, 1.0,   0.0,  0.0,  0.0,     0,0,-1,0,
    0.25,  -0.50,   -0.25, 1.0,    0.0,  1.0,  0.0,      1,0,0,0,

    //9,7,2,
    0.00,  -0.854,   0.00, 1.0,    0.0,  1.0,  0.0,      0,0,1,0,
    -0.25,  -0.50,  -0.25, 1.0,   0.0,  0.0,  0.0,     0,0,-1,0,
    -0.25,  -0.50,   0.25, 1.0,    1.0,  0.0,  0.0,     0,-1,0,0,

    //10,0,3,
    0.554, 0.00, 0.00, 1.0,       1.0,  1.0,  0.0,      0,0,1,0,
    0.25,  0.50, 0.25, 1.0,       1.0,  1.0,  1.0,      0,0,1,0,
    0.25,  -0.50,   0.25, 1.0,    1.0,  1.0,  0.0,     0,-1,0,0,

    //10,3,4
    0.554, 0.00, 0.00, 1.0,       1.0,  1.0,  0.0,      0,0,1,0,
    0.25,  -0.50,   0.25, 1.0,    1.0,  1.0,  0.0,     0,-1,0,0,
    0.25,  -0.50,   -0.25, 1.0,    0.0,  1.0,  0.0,      1,0,0,0,

    //10,4,5
    0.554, 0.00, 0.00, 1.0,       1.0,  1.0,  0.0,      0,0,1,0,
    0.25,  -0.50,   -0.25, 1.0,    0.0,  1.0,  0.0,      1,0,0,0,
    0.25,   0.50,  -0.25,  1.0,   0.0,  1.0,  1.0,   0,0,-1,0,

    //10,0,5
     0.554, 0.00, 0.00, 1.0,       1.0,  1.0,  0.0,      0,0,1,0,
     0.25,  0.50, 0.25, 1.0,       1.0,  1.0,  1.0,      0,0,1,0,
     0.25,   0.50,  -0.25,  1.0,   0.0,  1.0,  1.0,      0,0,-1,0,

    //11,1,2
    -0.554, 0.00, 0.00, 1.0,       0.0,  1.0,  0.0,       0,0,1,0,
    -0.25,   0.50,   0.25, 1.0,   1.0,  0.0,  1.0,    0,0,1,0,
    -0.25,  -0.50,   0.25, 1.0,    1.0,  0.0,  0.0,     0,-1,0,0,

    //11,1,6
     -0.554, 0.00, 0.00, 1.0,       0.0,  1.0,  0.0,       0,0,1,0,
     -0.25,   0.50,   0.25, 1.0,   1.0,  0.0,  1.0,    0,0,1,0,

    //11,6,7,
     -0.554, 0.00, 0.00, 1.0,       0.0,  1.0,  0.0,       0,0,1,0,
     -0.25,   0.50,  -0.25, 1.0,    0.0,  0.0,  1.0,      0,0,-1,0,
     -0.25,  -0.50,  -0.25, 1.0,    0.0,  0.0,  0.0,     0,-1,0,0,

    //11,2,7
     -0.554, 0.00, 0.00, 1.0,       0.0,  1.0,  0.0,       0,0,1,0,
     -0.25,  -0.50,   0.25, 1.0,    1.0,  0.0,  0.0,     0,-1,0,0,
     -0.25,  -0.50,  -0.25, 1.0,    0.0,  0.0,  0.0,     0,-1,0,0,




   //0.25,   0.50,   0.25, 1.0,   1.0,  1.0,  1.0,  0,0,1,0, // v0 White
   // -0.25,   0.50,   0.25, 1.0,   1.0,  0.0,  1.0,  0,0,1,0, // v1 Magenta
   // -0.25,  -0.50,   0.25, 1.0,   1.0,  0.0,  0.0,  0,0,1,0, // v2 Red
     //0.25,  -0.50,   0.25,     1.0,  1.0,  0.0,  // v3 Yellow
     //0.25,  -0.50,  -0.25,     0.0,  1.0,  0.0,  // v4 Green
     //0.25,   0.50,  -0.25,     0.0,  1.0,  1.0,  // v5 Cyan
   // -0.25,   0.50,  -0.25,     0.0,  0.0,  1.0,  // v6 Blue
    //-0.25,  -0.50,  -0.25,     0.0,  0.0,  0.0,   // v7 Black

    // 0.00,  0.354,  0.00, 1.0,    1.0,  1.0,  0.0,  0,0,1,0,  //v8
    // 0.00,  -0.354, 0.00, 1.0,    0.0,  1.0,  0.0,  0,0,1,0, //v9
    // 0.554, 0.00, 0.00, 1.0,      1.0,  1.0,  0.0,  0,0,1,0, //v10
    // -0.554, 0.00, 0.00, 1.0,      0.0,  1.0,  0.0,  0,0,1,0, //v11
  ]);

console.log("number of rock: ", rockVerts.length);

}

function makeSphere() {
//==============================================================================
// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
// equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
// sphere from one triangle strip.
  var slices = 13;    // # of slices of the sphere along the z axis. >=3 req'd
                      // (choose odd # or prime# to avoid accidental symmetry)
  var sliceVerts  = 27; // # of vertices around the top edge of the slice
                      // (same number of vertices on bottom of slice, too)
  var topColr = new Float32Array([0.7, 0.7, 0.7]);  // North Pole: light gray
  var equColr = new Float32Array([0.3, 0.7, 0.3]);  // Equator:    bright green
  var botColr = new Float32Array([0.9, 0.9, 0.9]);  // South Pole: brightest gray.
  var sliceAngle = Math.PI/slices;  // lattitude angle spanned by one slice.

  // Create a (global) array to hold this sphere's vertices:
  sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
                    // # of vertices * # of elements needed to store them. 
                    // each slice requires 2*sliceVerts vertices except 1st and
                    // last ones, which require only 2*sliceVerts-1.
                    
  // Create dome-shaped top slice of sphere at z=+1
  // s counts slices; v counts vertices; 
  // j counts array elements (vertices * elements per vertex)
  var cos0 = 0.0;         // sines,cosines of slice's top, bottom edge.
  var sin0 = 0.0;
  var cos1 = 0.0;
  var sin1 = 0.0; 
  var j = 0;              // initialize our array index
  var isLast = 0;
  var isFirst = 1;
  for(s=0; s<slices; s++) { // for each slice of the sphere,
    // find sines & cosines for top and bottom of this slice
    if(s==0) {
      isFirst = 1;  // skip 1st vertex of 1st slice.
      cos0 = 1.0;   // initialize: start at north pole.
      sin0 = 0.0;
    }
    else {          // otherwise, new top edge == old bottom edge
      isFirst = 0;  
      cos0 = cos1;
      sin0 = sin1;
    }               // & compute sine,cosine for new bottom edge.
    cos1 = Math.cos((s+1)*sliceAngle);
    sin1 = Math.sin((s+1)*sliceAngle);
    // go around the entire slice, generating TRIANGLE_STRIP verts
    // (Note we don't initialize j; grows with each new attrib,vertex, and slice)
    if(s==slices-1) isLast=1; // skip last vertex of last slice.
    for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) { 
      if(v%2==0)
      {       // put even# vertices at the the slice's top edge
              // (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
              // and thus we can simplify cos(2*PI(v/2*sliceVerts))  
        sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts);  
        sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);  
        sphVerts[j+2] = cos0;   
        sphVerts[j+3] = 1.0;      
      }
      else {  // put odd# vertices around the slice's lower edge;
              // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
              //          theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
        sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);    // x
        sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);    // y
        sphVerts[j+2] = cos1;                                       // z
        sphVerts[j+3] = 1.0;                                        // w.   
      }
      if(s==0) {  // finally, set some interesting colors for vertices:
        sphVerts[j+4]=topColr[0]; 
        sphVerts[j+5]=topColr[1]; 
        sphVerts[j+6]=topColr[2]; 
        }
      else if(s==slices-1) {
        sphVerts[j+4]=botColr[0]; 
        sphVerts[j+5]=botColr[1]; 
        sphVerts[j+6]=botColr[2]; 
      }
      else {
          sphVerts[j+4]=Math.random();// equColr[0]; 
          sphVerts[j+5]=Math.random();// equColr[1]; 
          sphVerts[j+6]=Math.random();// equColr[2];          
      }
      sphVerts[j+7] = 0;
      sphVerts[j+8] = 0;
      sphVerts[j+9] = 1;
      sphVerts[j+10] = 0;
    }
  }
}


function makeDiamond()
{
  diaVerts = new Float32Array([
     //0,1,2
     0.25,   0.50,   0.25, 1.0,   1.0,  1.0,  1.0,  0,0,1,0, // v0 White
    -0.25,   0.50,   0.25, 1.0,   1.0,  0.0,  1.0,  0,0,1,0, // v1 Magenta
    -0.25,  -0.50,   0.25, 1.0,   1.0,  0.0,  0.0,  0,0,1,0, // v2 Red
    //0,2,3
     0.25,   0.50,   0.25, 1.0,   1.0,  1.0,  1.0,  0,0,1,0,
    -0.25,  -0.50,   0.25, 1.0,   1.0,  0.0,  0.0,  0,0,1,0,
     0.25,  -0.50,   0.25, 1.0,   1.0,  1.0,  0.0,  0,0,1,0,

     //0,3,4
     0.25,   0.50,   0.25, 1.0,   1.0,  1.0,  1.0,  1,0,0,0,
     0.25,  -0.50,   0.25, 1.0,   1.0,  1.0,  0.0,  1,0,0,0,
     0.25,  -0.50,  -0.25, 1.0,   0.0,  1.0,  0.0,  1,0,0,0,

     //0,4,5
     0.25,   0.50,   0.25, 1.0,   1.0,  1.0,  1.0,  1,0,0,0,
     0.25,  -0.50,  -0.25, 1.0,   0.0,  1.0,  0.0,  1,0,0,0,
     0.25,   0.50,  -0.25, 1.0,   0.0,  1.0,  1.0,  1,0,0,0,

     //0, 5, 6,  
     0.25,   0.50,   0.25, 1.0,   1.0,  1.0,  1.0,    0,1,0,0,
     0.25,   0.50,  -0.25, 1.0,   0.0,  1.0,  1.0,    0,1,0,0,
     -0.25,  0.50,  -0.25, 1.0,   0.0,  0.0,  1.0,    0,1,0,0,

     //0, 6, 1,
      0.25,   0.50,   0.25, 1.0,    1.0,  1.0,  1.0,    0,1,0,0,
     -0.25,   0.50,  -0.25, 1.0,    0.0,  0.0,  1.0,    0,1,0,0,
     -0.25,   0.50,   0.25, 1.0,    1.0,  0.0,  1.0,    0,1,0,0,

     //1, 6, 7, 
     -0.25,   0.50,   0.25, 1.0,    1.0,  0.0,  1.0,    -1,0,0,0,   
     -0.25,   0.50,  -0.25, 1.0,    0.0,  0.0,  1.0,    -1,0,0,0,
     -0.25,  -0.50,  -0.25, 1.0,    0.0,  0.0,  0.0,    -1,0,0,0,

     //1, 7, 2, 
     -0.25,   0.50,   0.25, 1.0,    1.0,  0.0,  1.0,    -1,0,0,0,
     -0.25,  -0.50,  -0.25, 1.0,    0.0,  0.0,  0.0,    -1,0,0,0,
     -0.25,  -0.50,   0.25, 1.0,    1.0,  0.0,  0.0,    -1,0,0,0,

     //7, 4, 3,
     -0.25,  -0.50,  -0.25, 1.0,    0.0,  0.0,  0.0,     0,-1,0,0,
      0.25,  -0.50,  -0.25, 1.0,    0.0,  1.0,  0.0,     0,-1,0,0,
      0.25,  -0.50,   0.25, 1.0,    1.0,  1.0,  0.0,     0,-1,0,0,

     //7, 3, 2,
     -0.25,  -0.50,  -0.25, 1.0,    0.0,  0.0,  0.0,     0,-1,0,0,
      0.25,  -0.50,   0.25, 1.0,    1.0,  1.0,  0.0,     0,-1,0,0,
     -0.25,  -0.50,   0.25, 1.0,    1.0,  0.0,  0.0,     0,-1,0,0,

     //4, 7, 6,
      0.25,  -0.50,  -0.25, 1.0,     0.0,  1.0,  0.0,     0,0,-1,0,
     -0.25,  -0.50,  -0.25, 1.0,     0.0,  0.0,  0.0,     0,0,-1,0,
     -0.25,   0.50,  -0.25, 1.0,     0.0,  0.0,  1.0,     0,0,-1,0,

     //4, 6, 5,
      0.25,  -0.50,  -0.25,  1.0,   0.0,  1.0,  0.0,     0,0,-1,0,
     -0.25,   0.50,  -0.25,  1.0,   0.0,  0.0,  1.0,     0,0,-1,0,
      0.25,   0.50,  -0.25,  1.0,   0.0,  1.0,  1.0,     0,0,-1,0,
     

     //1,8,0
     -0.25,   0.50,   0.25, 1.0,   1.0,  0.0,  1.0,  0,0,1,0,
      0.00,   0.854,  0.00, 1.0,   1.0,  1.0,  0.0,  0,0,1,0,
      0.25,   0.50,   0.25, 1.0,   1.0,  1.0,  1.0,  0,0,1,0,

     //8,0,5
     0.00,   0.854,  0.00, 1.0,    1.0,  1.0,  0.0,   0,0,1,0,
     0.25,   0.50,   0.25, 1.0,    1.0,  1.0,  1.0,   0,0,1,0,
     0.25,   0.50,  -0.25,  1.0,   0.0,  1.0,  1.0,   0,0,-1,0,

     //8,6,5
     0.00,   0.854,  0.00, 1.0,    1.0,  1.0,  0.0,   0,0,1,0,
     -0.25,   0.50,  -0.25, 1.0,   0.0,  0.0,  1.0,   0,0,-1,0,
     0.25,   0.50,  -0.25,  1.0,   0.0,  1.0,  1.0,   0,0,-1,0,

     //8,1,6
     0.00,   0.854,  0.00, 1.0,    1.0,  1.0,  0.0,   0,0,1,0,
    -0.25,   0.50,   0.25, 1.0,   1.0,  0.0,  1.0,    0,0,1,0,
    -0.25,   0.50,  -0.25, 1.0,    0.0,  0.0,  1.0,   0,0,-1,0,

    //9,2,3
     0.00,  -0.854, 0.00, 1.0,    0.0,  1.0,  0.0,      0,0,1,0,
    -0.25,  -0.50,   0.25, 1.0,    1.0,  0.0,  0.0,     0,-1,0,0,
     0.25,  -0.50,   0.25, 1.0,    1.0,  1.0,  0.0,     0,-1,0,0,

    //9,3,4,
     0.00,  -0.854,  0.00, 1.0,    0.0,  1.0,  0.0,      0,0,1,0,
     0.25,  -0.50,   0.25, 1.0,    1.0,  1.0,  0.0,     0,-1,0,0,
     0.25,  -0.50,  -0.25, 1.0,   0.0,  1.0,  0.0,      1,0,0,0,

    //9,7,4,
    0.00,  -0.854,   0.00, 1.0,    0.0,  1.0,  0.0,      0,0,1,0,
    -0.25,  -0.50,  -0.25, 1.0,   0.0,  0.0,  0.0,     0,0,-1,0,
    0.25,  -0.50,   -0.25, 1.0,    0.0,  1.0,  0.0,      1,0,0,0,

    //9,7,2,
    0.00,  -0.854,   0.00, 1.0,    0.0,  1.0,  0.0,      0,0,1,0,
    -0.25,  -0.50,  -0.25, 1.0,   0.0,  0.0,  0.0,     0,0,-1,0,
    -0.25,  -0.50,   0.25, 1.0,    1.0,  0.0,  0.0,     0,-1,0,0,


   //0.25,   0.50,   0.25, 1.0,   1.0,  1.0,  1.0,  0,0,1,0, // v0 White
   // -0.25,   0.50,   0.25, 1.0,   1.0,  0.0,  1.0,  0,0,1,0, // v1 Magenta
   // -0.25,  -0.50,   0.25, 1.0,   1.0,  0.0,  0.0,  0,0,1,0, // v2 Red
     //0.25,  -0.50,   0.25,     1.0,  1.0,  0.0,  // v3 Yellow
     //0.25,  -0.50,  -0.25,     0.0,  1.0,  0.0,  // v4 Green
     //0.25,   0.50,  -0.25,     0.0,  1.0,  1.0,  // v5 Cyan
   // -0.25,   0.50,  -0.25,     0.0,  0.0,  1.0,  // v6 Blue
    //-0.25,  -0.50,  -0.25,     0.0,  0.0,  0.0,   // v7 Black

    // 0.00,  0.354,  0.00, 1.0,    1.0,  1.0,  0.0,  0,0,1,0,  //v8
    // 0.00,  -0.354, 0.00, 1.0,    0.0,  1.0,  0.0,  0,0,1,0, //v9
  ]);

console.log("number of diamonds: ", diaVerts.length);


}

function makeCylinder() {
//==============================================================================
// Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
// 'stepped spiral' design described in notes.
// Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
//
 var ctrColr = new Float32Array([0.2, 0.2, 0.2]); // dark gray
 var topColr = new Float32Array([0.4, 0.7, 0.4]); // light green
 var botColr = new Float32Array([0.5, 0.5, 1.0]); // light blue
 var capVerts = 16; // # of vertices around the topmost 'cap' of the shape
 var botRadius = 1.6;   // radius of bottom of cylinder (top always 1.0)
 
 // Create a (global) array to hold this cylinder's vertices;
 cylVerts = new Float32Array(  ((capVerts*6) -2) * floatsPerVertex);
                    // # of vertices * # of elements needed to store them. 

  // Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
  // v counts vertices: j counts array elements (vertices * elements per vertex)
  for(v=1,j=0; v<2*capVerts; v++,j+=floatsPerVertex) {  
    // skip the first vertex--not needed.
    if(v%2==0)
    {       // put even# vertices at center of cylinder's top cap:
      cylVerts[j  ] = 0.0;      // x,y,z,w == 0,0,1,1
      cylVerts[j+1] = 0.0;  
      cylVerts[j+2] = 1.0; 
      cylVerts[j+3] = 1.0;      // r,g,b = topColr[]
      cylVerts[j+4]=ctrColr[0]; 
      cylVerts[j+5]=ctrColr[1]; 
      cylVerts[j+6]=ctrColr[2];
    }
    else {  // put odd# vertices around the top cap's outer edge;
            // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
            //          theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
      cylVerts[j  ] = Math.cos(Math.PI*(v-1)/capVerts);     // x
      cylVerts[j+1] = Math.sin(Math.PI*(v-1)/capVerts);     // y
      //  (Why not 2*PI? because 0 < =v < 2*capVerts, so we
      //   can simplify cos(2*PI * (v-1)/(2*capVerts))
      cylVerts[j+2] = 1.0;  // z
      cylVerts[j+3] = 1.0;  // w.
      // r,g,b = topColr[]
      cylVerts[j+4]=topColr[0]; 
      cylVerts[j+5]=topColr[1]; 
      cylVerts[j+6]=topColr[2];     
    }

    cylVerts[j+7] = 0;
    cylVerts[j+8] = 0;
    cylVerts[j+9] = 1;
    cylVerts[j+10] = 0;

  }
  // Create the cylinder side walls, made of 2*capVerts vertices.
  // v counts vertices within the wall; j continues to count array elements
  for(v=0; v< 2*capVerts; v++, j+=floatsPerVertex) {
    if(v%2==0)  // position all even# vertices along top cap:
    {   
        cylVerts[j  ] = Math.cos(Math.PI*(v)/capVerts);   // x
        cylVerts[j+1] = Math.sin(Math.PI*(v)/capVerts);   // y
        cylVerts[j+2] = 1.0;  // z
        cylVerts[j+3] = 1.0;  // w.
        // r,g,b = topColr[]
        cylVerts[j+4]=topColr[0]; 
        cylVerts[j+5]=topColr[1]; 
        cylVerts[j+6]=topColr[2];     
    }
    else    // position all odd# vertices along the bottom cap:
    {
        cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v-1)/capVerts);   // x
        cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v-1)/capVerts);   // y
        cylVerts[j+2] =-1.0;  // z
        cylVerts[j+3] = 1.0;  // w.
        // r,g,b = topColr[]
        cylVerts[j+4]=botColr[0]; 
        cylVerts[j+5]=botColr[1]; 
        cylVerts[j+6]=botColr[2];     
    }
    
    cylVerts[j+7] = 0;
    cylVerts[j+8] = 0;
    cylVerts[j+9] = 1;
    cylVerts[j+10] = 0;
  }
  // Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
  // v counts the vertices in the cap; j continues to count array elements
  for(v=0; v < (2*capVerts -1); v++, j+= floatsPerVertex) {
    if(v%2==0) {  // position even #'d vertices around bot cap's outer edge
      cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v)/capVerts);   // x
      cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v)/capVerts);   // y
      cylVerts[j+2] =-1.0;  // z
      cylVerts[j+3] = 1.0;  // w.
      // r,g,b = topColr[]
      cylVerts[j+4]=botColr[1]; 
      cylVerts[j+5]=botColr[0]; 
      cylVerts[j+6]=botColr[2];   
    }
    else {        // position odd#'d vertices at center of the bottom cap:
      cylVerts[j  ] = 0.0;      // x,y,z,w == 0,0,-1,1
      cylVerts[j+1] = 0.0;  
      cylVerts[j+2] =-1.0; 
      cylVerts[j+3] = 1.0;      // r,g,b = botColr[]
      cylVerts[j+4]=botColr[1]; 
      cylVerts[j+5]=botColr[0]; 
      cylVerts[j+6]=botColr[2];
    }

    
    cylVerts[j+7] = 0;
    cylVerts[j+8] = 0;
    cylVerts[j+9] = 1;
    cylVerts[j+10] = 0;
  }


  console.log("number of cylinder: ", diaVerts.length);
}



function makeRoboticarm()
{
//make a list of vertces that make robotic arms
armVerts = new Float32Array([
     //0,1,2
     0.25,   0.50,   0.25, 1.0,   1.0,  1.0,  1.0,  0,0,1,0, // v0 White
    -0.25,   0.50,   0.25, 1.0,   1.0,  0.0,  1.0,  0,0,1,0, // v1 Magenta
    -0.25,  -0.50,   0.25, 1.0,   1.0,  0.0,  0.0,  0,0,1,0, // v2 Red
    //0,2,3
     0.25,   0.50,   0.25, 1.0,   1.0,  1.0,  1.0,  0,0,1,0,
    -0.25,  -0.50,   0.25, 1.0,   1.0,  0.0,  0.0,  0,0,1,0,
     0.25,  -0.50,   0.25, 1.0,   1.0,  1.0,  0.0,  0,0,1,0,

     //0,3,4
     0.25,   0.50,   0.25, 1.0,   1.0,  1.0,  1.0,  1,0,0,0,
     0.25,  -0.50,   0.25, 1.0,   1.0,  1.0,  0.0,  1,0,0,0,
     0.25,  -0.50,  -0.25, 1.0,   0.0,  1.0,  0.0,  1,0,0,0,

     //0,4,5
     0.25,   0.50,   0.25, 1.0,   1.0,  1.0,  1.0,  1,0,0,0,
     0.25,  -0.50,  -0.25, 1.0,   0.0,  1.0,  0.0,  1,0,0,0,
     0.25,   0.50,  -0.25, 1.0,   0.0,  1.0,  1.0,  1,0,0,0,

     //0, 5, 6,  
     0.25,   0.50,   0.25, 1.0,   1.0,  1.0,  1.0,    0,1,0,0,
     0.25,   0.50,  -0.25, 1.0,   0.0,  1.0,  1.0,    0,1,0,0,
     -0.25,  0.50,  -0.25, 1.0,   0.0,  0.0,  1.0,    0,1,0,0,

     //0, 6, 1,
      0.25,   0.50,   0.25, 1.0,    1.0,  1.0,  1.0,    0,1,0,0,
     -0.25,   0.50,  -0.25, 1.0,    0.0,  0.0,  1.0,    0,1,0,0,
     -0.25,   0.50,   0.25, 1.0,    1.0,  0.0,  1.0,    0,1,0,0,

     //1, 6, 7, 
     -0.25,   0.50,   0.25, 1.0,    1.0,  0.0,  1.0,    -1,0,0,0,   
     -0.25,   0.50,  -0.25, 1.0,    0.0,  0.0,  1.0,    -1,0,0,0,
     -0.25,  -0.50,  -0.25, 1.0,    0.0,  0.0,  0.0,    -1,0,0,0,

     //1, 7, 2, 
     -0.25,   0.50,   0.25, 1.0,    1.0,  0.0,  1.0,    -1,0,0,0,
     -0.25,  -0.50,  -0.25, 1.0,    0.0,  0.0,  0.0,    -1,0,0,0,
     -0.25,  -0.50,   0.25, 1.0,    1.0,  0.0,  0.0,    -1,0,0,0,

     //7, 4, 3,
     -0.25,  -0.50,  -0.25, 1.0,    0.0,  0.0,  0.0,     0,-1,0,0,
      0.25,  -0.50,  -0.25, 1.0,    0.0,  1.0,  0.0,     0,-1,0,0,
      0.25,  -0.50,   0.25, 1.0,    1.0,  1.0,  0.0,     0,-1,0,0,

     //7, 3, 2,
     -0.25,  -0.50,  -0.25, 1.0,    0.0,  0.0,  0.0,     0,-1,0,0,
      0.25,  -0.50,   0.25, 1.0,    1.0,  1.0,  0.0,     0,-1,0,0,
     -0.25,  -0.50,   0.25, 1.0,    1.0,  0.0,  0.0,     0,-1,0,0,

     //4, 7, 6,
      0.25,  -0.50,  -0.25, 1.0,     0.0,  1.0,  0.0,     0,0,-1,0,
     -0.25,  -0.50,  -0.25, 1.0,     0.0,  0.0,  0.0,     0,0,-1,0,
     -0.25,   0.50,  -0.25, 1.0,     0.0,  0.0,  1.0,     0,0,-1,0,

     //4, 6, 5,
      0.25,  -0.50,  -0.25,  1.0,   0.0,  1.0,  0.0,     0,0,-1,0,
     -0.25,   0.50,  -0.25,  1.0,   0.0,  0.0,  1.0,     0,0,-1,0,
      0.25,   0.50,  -0.25,  1.0,   0.0,  1.0,  1.0,     0,0,-1,0,
     //0,2,3


     //0.25,  -0.50,   0.25,     1.0,  1.0,  0.0,  // v3 Yellow
     //0.25,  -0.50,  -0.25,     0.0,  1.0,  0.0,  // v4 Green
     //0.25,   0.50,  -0.25,     0.0,  1.0,  1.0,  // v5 Cyan
   // -0.25,   0.50,  -0.25,     0.0,  0.0,  1.0,  // v6 Blue
    //-0.25,  -0.50,  -0.25,     0.0,  0.0,  0.0,   // v7 Black
  ]);

console.log("what the heck: ", armVerts.length);


}

function makeAxes()
{
  axesVerts = new Float32Array([
     0.0,  0.0,  0.0, 1.0,    0.3,  0.3,  0.3,         0,0,1,0,// X axis line (origin: gray)
     1.3,  0.0,  0.0, 1.0,    1.0,  0.3,  0.3,         0,0,1,0,//              (endpoint: red)
     
     0.0,  0.0,  0.0, 1.0,    0.3,  0.3,  0.3,         0,0,1,0,// Y axis line (origin: white)
     0.0,  1.3,  0.0, 1.0,    0.3,  1.0,  0.3,         0,0,1,0,//            (endpoint: green)

     0.0,  0.0,  0.0, 1.0,    0.3,  0.3,  0.3,         0,0,1,0,// Z axis line (origin:white)
     0.0,  0.0,  1.3, 1.0,    0.3,  0.3,  1.0,         0,0,1,0,//            (endpoint: blue)

    ])
  console.log("number of axes", axesVerts.length);
}

function initVertexBuffers(gl) {
//==============================================================================
  
  // Make our 'ground plane'; can you make a'torus' shape too?
  // (recall the 'basic shapes' starter code...)
  makeGroundGrid();
  makeRoboticarm();
  makeDiamond();
  makeRock();
  makeCylinder();
  makeSphere();
  makeAxes();

  // How much space to store all the shapes in one array?
  // (no 'var' means this is a global variable)
  mySiz = gndVerts.length + armVerts.length + diaVerts.length + rockVerts.length + cylVerts.length + sphVerts.length + axesVerts.length;

  //console.log("forestVerts numeber is ", forestVerts.length);
  console.log("gndVerts numeber is ", gndVerts.length);
   console.log("armVerts numeber is ", armVerts.length);

  // How many vertices total?
  var nn = mySiz / floatsPerVertex;
  console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);

  // Copy all shapes into one big Float32 array:
  var verticesColors = new Float32Array(mySiz);
  // Copy them:  remember where to start for each shape:
  gndStart = 0;           // next we'll store the ground-plane;
  for(i=0,j=0; j< gndVerts.length; i++, j++) {
    verticesColors[i] = gndVerts[j];
    }
  armStart = i;
  for (j=0; j < armVerts.length; i++,j++)
  {
    verticesColors[i] = armVerts[j];
  }
  diaStart = i;
  for (j=0; j < diaVerts.length; i++,j++)
  {
    verticesColors[i] = diaVerts[j];
  }
  rockStart = i;
  for (j=0; j < rockVerts.length; i++,j++)
  {
    verticesColors[i] = rockVerts[j];
  }
  cylStart = i;
  for (j=0; j < cylVerts.length; i++,j++)
  {
    verticesColors[i] = cylVerts[j];
  }
  sphStart = i;
  for (j=0; j < sphVerts.length; i++,j++)
  {
    verticesColors[i] = sphVerts[j];
  }
  axesStart = i;
  for (j=0; j < axesVerts.length; i++,j++)
  {
    verticesColors[i] = axesVerts[j];
  }


    

  
  // Create a vertex buffer object (VBO)
  var vertexColorbuffer = gl.createBuffer();  
  if (!vertexColorbuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Write vertex information to buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  // Assign the buffer object to a_Position and enable the assignment
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, FSIZE * 11, 0);
  gl.enableVertexAttribArray(a_Position);
  // Assign the buffer object to a_Color and enable the assignment
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 11, FSIZE * 4);
  gl.enableVertexAttribArray(a_Color);

  var a_Normals = gl.getAttribLocation(gl.program, 'a_Normals');
  if(a_Normals < 0) {
    console.log('Failed to get the storage location of a_Normals');
    return -1;
  }

  // Use handle to specify how to retrieve color data from our VBO:
  gl.vertexAttribPointer(
    a_Normals,        // choose Vertex Shader attribute to fill with data
    4,              // how many values? 1,2,3 or 4. (we're using R,G,B)
    gl.FLOAT,       // data type for each value: usually gl.FLOAT
    false,          // did we supply fixed-point data AND it needs normalizing?
    FSIZE * 11,       // Stride -- how many bytes used to store each vertex?
                    // (x,y,z,w, r,g,b) * bytes/value
    FSIZE * 7);     // Offset -- how many bytes from START of buffer to the
                    // value we will actually use?  Need to skip over x,y,z,w
                    
  gl.enableVertexAttribArray(a_Normals);  

  // Unbind the buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return mySiz/floatsPerVertex; // return # of vertices
}

var g_EyeX = 0.0, g_EyeY = 0.25, g_EyeZ = 4.25; 
// Global vars for Eye position. 
// NOTE!  I moved eyepoint BACKWARDS from the forest: from g_EyeZ=0.25
// a distance far enough away to see the whole 'forest' of trees within the
// 30-degree field-of-view of our 'perspective' camera.  I ALSO increased
// the 'keydown()' function's effect on g_EyeX position.


function keydown(ev, gl, currentAngle, u_ViewMatrix, viewMatrix, ModelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix, projMatrix, u_ProjMatrix) {
//------------------------------------------------------
//HTML calls this'Event handler' or 'callback function' when we press a key:

    if(ev.keyCode == 39) { // The right arrow key was pressed
//      g_EyeX += 0.01;
        g_EyeX += 0.05;    // INCREASED for perspective camera)
    } else 
    if (ev.keyCode == 37) { // The left arrow key was pressed
//      g_EyeX -= 0.01;
        g_EyeX -= 0.05;    // INCREASED for perspective camera)
    } // Prevent the unnecessary drawing
    if (ev.keyCode == 38){
      g_EyeY += 0.05;
    }else
    if (ev.keyCode == 40){
      g_EyeY -= 0.05;
    }
    else{
      return;
    }
    draw(gl, currentAngle, u_ViewMatrix, viewMatrix, ModelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix, projMatrix, u_ProjMatrix);    
}

function draw(gl, currentAngle, u_ViewMatrix, viewMatrix, ModelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix, projMatrix, u_ProjMatrix, width, height) {
//==============================================================================
  
  // Clear <canvas> color AND DEPTH buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  var canvas = document.getElementById("webgl")
  //winResize();
  //normalMatrix.setIdentity();
  // Using OpenGL/ WebGL 'viewports':
  // these determine the mapping of CVV to the 'drawing context',
  // (for WebGL, the 'gl' context describes how we draw inside an HTML-5 canvas)
  // Details? see
  //
  //  https://www.khronos.org/registry/webgl/specs/1.0/#2.3
  // Draw in the FIRST of several 'viewports'
  //------------------------------------------
  // CHANGE from our default viewport:
  // gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  // to a smaller one:
  gl.viewport(0,                              // Viewport lower-left corner
              0,                              // (x,y) location(in pixels)
              //gl.drawingBufferWidth/2,
              width/2,        // viewport width, height.
              //gl.drawingBufferHeight/2
              height);
  
  // Set the matrix to be used for to set the camera view
  viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ,  // eye position
                        0, 0, 0,                // look-at point (origin)
                        0, 1, 0);               // up vector (+y)

  // Pass the view projection matrix
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  // Draw the scene:
  drawMyScene(gl, currentAngle, u_ViewMatrix, viewMatrix, ModelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix, projMatrix, u_ProjMatrix, 1, width, height);
 
    // Draw in the SECOND of several 'viewports'
  //------------------------------------------
  gl.viewport(//gl.drawingBufferWidth/2,
              width/2,        // Viewport lower-left corner
              0,                              // location(in pixels)
              //gl.drawingBufferWidth/2,
              width/2,
              height);        // viewport width, height.
              //gl.drawingBufferHeight/2);

   
  // but use a different 'view' matrix:
  viewMatrix.setLookAt(-g_EyeX, g_EyeY, g_EyeZ, // eye position
                      0, 0, 0,                  // look-at point 
                      0, 1, 0);                 // up vector

  // Pass the view projection matrix to our shaders:
  //gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  // Draw the scene:
  drawMyScene(gl, currentAngle, u_ViewMatrix, viewMatrix, ModelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix, projMatrix, u_ProjMatrix, 0, width, height);
    
        // Draw in the THIRD of several 'viewports'
  //------------------------------------------
  /*gl.viewport(0                   ,         // Viewport lower-left corner
              gl.drawingBufferHeight/2,     // location(in pixels)
              gl.drawingBufferWidth/2,        // viewport width, height.
              gl.drawingBufferHeight/2);
  */
  // but use a different 'view' matrix:
  /*viewMatrix.setLookAt(g_EyeY, g_EyeX, g_EyeZ,  // eye position,
                        0, 0, 0,                // look-at point,
                        0, 1, 0);               // 'up' vector.
  // Pass the view projection matrix to our shaders:
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  
  // Draw the scene:
  drawMyScene(gl, u_ViewMatrix, viewMatrix);
  */

}

function drawMyScene(myGL, currentAngle, myu_ViewMatrix, myViewMatrix, modelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix, projMatrix, u_ProjMatrix, times, width, height) {
//===============================================================================
// Called ONLY from within the 'draw()' function
// Assumes already-correctly-set View matrix and Proj matrix; 
// draws all items in 'world' coords.

  // DON'T clear <canvas> or you'll WIPE OUT what you drew 
  // in all previous viewports!
  // myGL.clear(myGL.COLOR_BUFFER_BIT);
  var canvas = document.getElementById("webgl")
  if (times == 1)
  {
  projMatrix.setPerspective(30, width/height, 1, 100);
  myGL.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
  }
  else
  {
    // REPLACE this orthographic camera matrix:
  projMatrix.setOrtho(-1.0, 1.0,          // left,right;
                      -1.0, 1.0,          // bottom, top;
                      -2, 6000.0);       // near, far; (always >=0)
    
  myGL.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
  }



                     
  modelMatrix.setIdentity();
  //normalMatrix.setIdentity();
  // Draw the 'forest' in the current 'world' coord system:
  // (where +y is 'up', as defined by our setLookAt() function call above...)
 // myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  pushMatrix(modelMatrix);


  //=======arm base===========
  modelMatrix.setTranslate(-0.5,-0.45,1.0);
  modelMatrix.rotate(currentAngle+25,0,1,0);
  modelMatrix.scale(0.3,0.3,0.3);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  // Pass the transformation matrix for normals to u_NormalMatrix
  myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  myGL.drawArrays(myGL.TRIANGLES,
                armStart/floatsPerVertex,
                armVerts.length/floatsPerVertex);
  //pushMatrix(modelMatrix);
  //modelMatrix.
  pushMatrix(modelMatrix);
  modelMatrix.translate(0,-0.455,0);
  myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  myGL.drawArrays(myGL.LINES,
                axesStart/floatsPerVertex,
                axesVerts.length/floatsPerVertex);

  //=====second arm base==========
  modelMatrix = popMatrix();
  modelMatrix.rotate(currentAngle*0.13, 0,0,1);
  modelMatrix.translate(0.0,0.85,0.0);
  modelMatrix.scale(0.7,0.7,0.7);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  // Pass the transformation matrix for normals to u_NormalMatrix
  myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  myGL.drawArrays(myGL.TRIANGLES,
                armStart/floatsPerVertex,
                armVerts.length/floatsPerVertex);
  
  pushMatrix(modelMatrix);

  
  //======upper=======
  modelMatrix.rotate(25,1,0,0);
  modelMatrix.translate(0.08,0.0,0.5);
  modelMatrix.scale(0.4,0.4,0.4);
  modelMatrix.rotate(currentAngle*0.3, 1,0,0);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  // Pass the transformation matrix for normals to u_NormalMatrix
  myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                armStart/floatsPerVertex,
                armVerts.length/floatsPerVertex);

  
  modelMatrix.translate(0.0,0.8,0.25);
  modelMatrix.scale(0.7,0.7,0.7);
  modelMatrix.rotate(45,1,0,0);
  modelMatrix.rotate(currentAngle*0.45, 0,1,0);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  // Pass the transformation matrix for normals to u_NormalMatrix
  myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                armStart/floatsPerVertex,
                armVerts.length/floatsPerVertex);
  
  //======upper=========
  modelMatrix = popMatrix();

  modelMatrix.rotate(-25,1,0,0);
  modelMatrix.translate(0.08,0.0,-0.5);
  modelMatrix.scale(0.4,0.4,0.4);
  modelMatrix.rotate(-currentAngle*0.3, 1,0,0);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  // Pass the transformation matrix for normals to u_NormalMatrix
  myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                armStart/floatsPerVertex,
                armVerts.length/floatsPerVertex);

  modelMatrix.translate(0.0,0.8,-0.25);
  modelMatrix.scale(0.7,0.7,0.7);
  modelMatrix.rotate(-45,1,0,0);
  modelMatrix.rotate(currentAngle*0.45, 0,1,0);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  // Pass the transformation matrix for normals to u_NormalMatrix
  myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                armStart/floatsPerVertex,
                armVerts.length/floatsPerVertex);
  



  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  //======diamond=========
  normalMatrix.setIdentity();
  modelMatrix.rotate(-90,0,1,0);
  modelMatrix.rotate(-45,1,0,0);
  modelMatrix.scale(0.5,0.5,0.5);
  modelMatrix.translate(-1,1,0);
  modelMatrix.translate(-1,0,0);
  modelMatrix.rotate(currentAngle,0,1,0);
  myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  
  myGL.drawArrays(myGL.TRIANGLES,
                  diaStart/floatsPerVertex,
                  diaVerts.length/floatsPerVertex);


  modelMatrix.rotate(180,0,1,0);
  modelMatrix.rotate(90,1,0,0);
  modelMatrix.rotate(currentAngle,0,1,0);
  modelMatrix.scale(0.7,0.7,0.7);
  myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  
  myGL.drawArrays(myGL.TRIANGLES,
                  diaStart/floatsPerVertex,
                  diaVerts.length/floatsPerVertex);  

  //=========rock==========
   modelMatrix = popMatrix();
   pushMatrix(modelMatrix);
   modelMatrix.scale(0.3,0.3,0.3);
   modelMatrix.rotate(-45,1,1,0);
   modelMatrix.translate(-2,2,0);
   modelMatrix.rotate(currentAngle,1,1,1);
  // modelMatrix.rotate(currentAngle,1,1,0);
   pushMatrix(modelMatrix);
   myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
   myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
   myGL.drawArrays(myGL.TRIANGLES,
                rockStart/floatsPerVertex,
                rockVerts.length/floatsPerVertex);
   pushMatrix(modelMatrix);
   modelMatrix = popMatrix();
   

   modelMatrix.rotate(120,1,1,0);
   modelMatrix.translate(1,-1,0.5);
   modelMatrix.rotate(currentAngle*0.1,1,1,1);

   myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
   myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
   myGL.drawArrays(myGL.TRIANGLES,
                rockStart/floatsPerVertex,
                rockVerts.length/floatsPerVertex);

   modelMatrix = popMatrix();

   modelMatrix.rotate(-150,1,1,0);
   modelMatrix.translate(1,0.5,0.5);
   //modelMatrix.rotate(currentAngle*0.01,1,0,0);

   myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
   myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
   myGL.drawArrays(myGL.TRIANGLES,
                rockStart/floatsPerVertex,
                rockVerts.length/floatsPerVertex);


   //=====cylinder=======
  //modelMatrix.setIdentity();
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  modelMatrix.scale(0.2,0.2,0.2);
  modelMatrix.rotate(-90, 1,0,0);
  modelMatrix.translate(3,-2,-2);
  myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,
                cylStart/floatsPerVertex,
                cylVerts.length/floatsPerVertex);

  modelMatrix.scale(0.5,0.5,0.5);
  modelMatrix.translate(0,0,3);
  myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,
                cylStart/floatsPerVertex,
                cylVerts.length/floatsPerVertex);

  //=======sphere=======
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  modelMatrix.scale(0.8,0.8,-0.8);              // convert to left-handed coord sys
                                          // to match WebGL display canvas.
  modelMatrix.scale(0.3,0.3,0.3);
  modelMatrix.translate(1,0,-5);
  modelMatrix.rotate(currentAngle,0,1,0);
  myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,
                sphStart/floatsPerVertex,
                sphVerts.length/floatsPerVertex);

  //======Axes=============
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  modelMatrix.setTranslate(0,-0.6,0);
  modelMatrix.scale(3.0,3.0,3.0);
  //modelMatrix.translate();
  myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  myGL.drawArrays(myGL.LINES,
                axesStart/floatsPerVertex,
                axesVerts.length/floatsPerVertex);



  //==========grid==========
  modelMatrix = popMatrix();
  //modelMatrix.setIdentity();
  myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

 // Rotate to make a new set of 'world' drawing axes: 
 // old one had "+y points upwards", but
  myViewMatrix.rotate(-90.0, 1,0,0);  // new one has "+z points upwards",
                                      // made by rotating -90 deg on +x-axis.
                                      // Move those new drawing axes to the 
                                      // bottom of the trees:
  myViewMatrix.translate(0.0, 0.0, -0.6); 
  myViewMatrix.scale(0.4, 0.4,0.4);   // shrink the drawing axes 
                                      //for nicer-looking ground-plane, and
  // Pass the modified view matrix to our shaders:
  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
  
  // Now, using these drawing axes, draw our ground plane: 
  myGL.drawArrays(myGL.LINES,             // use this drawing primitive, and
                  gndStart/floatsPerVertex, // start at this vertex number, and
                  gndVerts.length/floatsPerVertex);   // draw this many vertices

}

function winResize(gl, currentAngle, u_ViewMatrix, viewMatrix, ModelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix, projMatrix, u_ProjMatrix) {
//==============================================================================
// Called when user re-sizes their browser window , because our HTML file
// contains:  <body onload="main()" onresize="winResize()">

  var nuCanvas = document.getElementById('webgl');  // get current canvas
  // var nuGL = getWebGLContext(nuCanvas);             // and context:

  //Report our current browser-window contents:

  // console.log('nuCanvas width,height=', nuCanvas.width, nuCanvas.height);   
 // console.log('Browser window: innerWidth,innerHeight=', 
                                // innerWidth, innerHeight); // http://www.w3schools.com/jsref/obj_window.asp

  
  //Make canvas fill the top 3/4 of our browser window:
  nuCanvas.width = Math.min(innerWidth*0.75, innerHeight*1.5);
  nuCanvas.height = Math.min(innerWidth*0.75/2, innerHeight*0.75);
  //IMPORTANT!  need to re-draw screen contents
  draw(gl, currentAngle, u_ViewMatrix, viewMatrix, ModelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix, projMatrix, u_ProjMatrix, nuCanvas.width, nuCanvas.height); 
     
}
