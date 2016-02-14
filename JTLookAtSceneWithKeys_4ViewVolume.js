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

function main() 
{
//==============================================================================
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
  document.onkeydown= function(ev){keydown(ev, gl, currentAngle, u_ViewMatrix, viewMatrix, ModelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix)};
  // (Note that I eliminated the 'n' argument (no longer needed)).
  
  // Create the matrix to specify the camera frustum, 
  // and pass it to the u_ProjMatrix uniform in the graphics system
  var projMatrix = new Matrix4();
  // REPLACE this orthographic camera matrix:
/*  projMatrix.setOrtho(-1.0, 1.0,          // left,right;
                      -1.0, 1.0,          // bottom, top;
                      0.0, 2000.0);       // near, far; (always >=0)
*/
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
    currentAngle = animate(currentAngle);  // Update the rotation angle
    draw(gl, currentAngle, u_ViewMatrix, viewMatrix, ModelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix);   // Draw shapes
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

function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  if(newAngle > 180.0) newAngle = newAngle - 360.0;
  if(newAngle <-180.0) newAngle = newAngle + 360.0;
  return newAngle;
}

function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

  var xcount = 100;     // # of lines to draw in x,y to make the grid.
  var ycount = 100;   
  var xymax = 50.0;     // grid size; extends to cover +/-xymax in x and y.
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

console.log("what the heck: ", armVerts.length)


}

function initVertexBuffers(gl) {
//==============================================================================
  
  // Make our 'ground plane'; can you make a'torus' shape too?
  // (recall the 'basic shapes' starter code...)
  makeGroundGrid();
  makeRoboticarm();

  // How much space to store all the shapes in one array?
  // (no 'var' means this is a global variable)
  mySiz = gndVerts.length + armVerts.length;

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

var g_EyeX = 0.20, g_EyeY = 0.25, g_EyeZ = 4.25; 
// Global vars for Eye position. 
// NOTE!  I moved eyepoint BACKWARDS from the forest: from g_EyeZ=0.25
// a distance far enough away to see the whole 'forest' of trees within the
// 30-degree field-of-view of our 'perspective' camera.  I ALSO increased
// the 'keydown()' function's effect on g_EyeX position.


function keydown(ev, gl, currentAngle, u_ViewMatrix, viewMatrix, ModelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix) {
//------------------------------------------------------
//HTML calls this'Event handler' or 'callback function' when we press a key:

    if(ev.keyCode == 39) { // The right arrow key was pressed
//      g_EyeX += 0.01;
        g_EyeX += 0.1;    // INCREASED for perspective camera)
    } else 
    if (ev.keyCode == 37) { // The left arrow key was pressed
//      g_EyeX -= 0.01;
        g_EyeX -= 0.1;    // INCREASED for perspective camera)
    } else { return; } // Prevent the unnecessary drawing
    draw(gl, currentAngle, u_ViewMatrix, viewMatrix, ModelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix);    
}

function draw(gl, currentAngle, u_ViewMatrix, viewMatrix, ModelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix) {
//==============================================================================
  
  // Clear <canvas> color AND DEPTH buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
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
              gl.drawingBufferWidth/2,        // viewport width, height.
              gl.drawingBufferHeight/2);
              
  // Set the matrix to be used for to set the camera view
  viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ,  // eye position
                        0, 0, 0,                // look-at point (origin)
                        0, 1, 0);               // up vector (+y)

  // Pass the view projection matrix
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  // Draw the scene:
  drawMyScene(gl, currentAngle, u_ViewMatrix, viewMatrix, ModelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix);
 
    // Draw in the SECOND of several 'viewports'
  //------------------------------------------
  gl.viewport(gl.drawingBufferWidth/2,        // Viewport lower-left corner
              0,                              // location(in pixels)
              gl.drawingBufferWidth/2,        // viewport width, height.
              gl.drawingBufferHeight/2);

  // but use a different 'view' matrix:
  viewMatrix.setLookAt(-g_EyeX, g_EyeY, g_EyeZ, // eye position
                      0, 0, 0,                  // look-at point 
                      0, 1, 0);                 // up vector

  // Pass the view projection matrix to our shaders:
  //gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  // Draw the scene:
  drawMyScene(gl, currentAngle, u_ViewMatrix, viewMatrix, ModelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix);
    
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

function drawMyScene(myGL, currentAngle, myu_ViewMatrix, myViewMatrix, modelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix) {
//===============================================================================
// Called ONLY from within the 'draw()' function
// Assumes already-correctly-set View matrix and Proj matrix; 
// draws all items in 'world' coords.

  // DON'T clear <canvas> or you'll WIPE OUT what you drew 
  // in all previous viewports!
  // myGL.clear(myGL.COLOR_BUFFER_BIT);             
  modelMatrix.setIdentity();
  normalMatrix.setIdentity();
  // Draw the 'forest' in the current 'world' coord system:
  // (where +y is 'up', as defined by our setLookAt() function call above...)
 // myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  pushMatrix(modelMatrix);

  modelMatrix.setTranslate(-0.5,-0.1,0.0);
  modelMatrix.rotate(currentAngle+25,0,1,0);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  // Pass the transformation matrix for normals to u_NormalMatrix
  myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  myGL.drawArrays(myGL.TRIANGLES,
                armStart/floatsPerVertex,
                armVerts.length/floatsPerVertex);

  modelMatrix.translate(0.0,1.2,0);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  // Pass the transformation matrix for normals to u_NormalMatrix
  myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  myGL.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                armStart/floatsPerVertex,
                armVerts.length/floatsPerVertex);


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