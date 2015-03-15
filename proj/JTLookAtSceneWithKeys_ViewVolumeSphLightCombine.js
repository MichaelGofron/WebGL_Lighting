//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
//==============================================================================
//
// LookAtTrianglesWithKey_ViewVolume.js (c) 2012 matsuda
//
//  MODIFIED 2014.02.19 J. Tumblin to 
//    --demonstrate multiple viewports (see 'draw()' function at bottom of file)
//    --draw ground plane in the 3D scene:  makeGroundPlane()

// Vertex shader program

// emissive = -1 * light_position
// eyelight pos - something
// Multiply the normal by view and normal matrix 
var VSHADER_SOURCE =
  //-------------ATTRIBUTES: of each vertex, read from our Vertex Buffer Object
  'attribute vec4 a_Position; \n' +   // vertex position (model coord sys)
  'attribute vec4 a_Normal; \n' +     // vertex normal vector (model coord sys)
//  'attribute vec4 a_color;\n' +     // Per-vertex colors? they usually 
                                      // set the Phong diffuse reflectance
  //-------------UNIFORMS: values set from JavaScript before a drawing command.
  'uniform vec3 u_Kd; \n' +           //  Instead, we'll use this 'uniform' 
                          // Phong diffuse reflectance for the entire shape
  'uniform mat4 u_ModelMatrix; \n' +
  'uniform mat4 u_NormalMatrix; \n' +   // Inverse Transpose of ModelMatrix;
  'uniform mat4 u_ProjMatrix;\n' +
                                        // (doesn't distort normal directions)
  'uniform mat4 u_ViewMatrix;\n' + // seperate view Matrix for calculations
  
  //-------------VARYING:Vertex Shader values sent per-pixel to Fragment shader:
  'varying vec3 v_Kd; \n' +             // Phong Lighting: diffuse reflectance
                                        // (I didn't make per-pixel Ke,Ka,Ks )
  'varying vec4 v_Position; \n' +       
  'varying vec3 v_Normal; \n' +         // Why Vec3? its not a point, hence w==0
//---------------
  'void main() { \n' +
    // Set the CVV coordinate values from our given vertex. This 'built-in'
    // per-vertex value gets interpolated to set screen position for each pixel.
  //'  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
      '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
     // Calculate the vertex position & normal in the WORLD coordinate system
     // and then save as 'varying', so that fragment shaders each get per-pixel
     // values (interp'd between vertices for our drawing primitive (TRIANGLE)).
  '  v_Position = u_ModelMatrix * a_Position; \n' +
    // 3D surface normal of our vertex, in world coords.  ('varying'--its value
    // gets interpolated (in world coords) for each pixel's fragment shader.
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  //   '  v_Normal = normalize(vec3(u_NormalMatrix * (u_ModelMatrix * a_Normal)));\n' +
  '  v_Kd = u_Kd; \n' +   // find per-pixel diffuse reflectance from per-vertex
                          // (no per-pixel Ke,Ka, or Ks, but you can do it...)
//  '  v_Kd = vec3(1.0, 1.0, 0.0); \n'  + // TEST; fixed at green
  '}\n';

// Fragment shader program
// need eye position world
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  
  // first light source: (YOU write a second one...)
  'uniform vec4 u_Lamp0Pos;\n' +      // Phong Illum: position
  'uniform vec3 u_Lamp0Amb;\n' +      // Phong Illum: ambient
  'uniform vec3 u_Lamp0Diff;\n' +     // Phong Illum: diffuse
  'uniform vec3 u_Lamp0Spec;\n' +     // Phong Illum: specular

  // headlight light source
  'uniform vec4 u_Lamp1Pos;\n' +      // Phong Illum: position
  'uniform vec3 u_Lamp1Amb;\n' +      // Phong Illum: ambient
  'uniform vec3 u_Lamp1Diff;\n' +     // Phong Illum: diffuse
  'uniform vec3 u_Lamp1Spec;\n' +     // Phong Illum: specular

  // 'uniform vec4 u_TotalLampPos;\n' + // changes based on which light we render
  // 'uniform vec3 u_TotalLampAmb;\n' + // Phong Illum: ambient
  // 'uniform vec3 u_TotalLampDiff;\n' + 
  // 'uniform vec3 u_TotalLampSpec;\n' + 
  
  // first material definition: you write 2nd, 3rd, etc.
  'uniform vec3 u_Ke;\n' +              // Phong Reflectance: emissive
  'uniform vec3 u_Ka;\n' +              // Phong Reflectance: ambient
  // Phong Reflectance: diffuse? -- use v_Kd instead for per-pixel value
  'uniform vec3 u_Ks;\n' +              // Phong Reflectance: specular
  //'uniform int u_Kshiny;\n' +           // Phong Reflectance: 1 < shiny < 200
//  
  'uniform vec4 u_eyePosWorld; \n' +    // Camera/eye location in world coords.
  
  'varying vec3 v_Normal;\n' +        // Find 3D surface normal at each pix
  'varying vec4 v_Position;\n' +      // pixel's 3D pos too -- in 'world' coords
  'varying vec3 v_Kd; \n' +           // Find diffuse reflectance K_d per pix
                            // Ambient? Emissive? Specular? almost
                            // NEVER change per-vertex: I use'uniform'

  'void main() { \n' +
      // Normalize! interpolated normals aren't 1.0 in length any more
  '  vec3 normal = normalize(v_Normal); \n' +
      // Calculate the light direction vector, make it unit-length (1.0).
  //'  vec3 lightDirection = normalize(u_Lamp0Pos.xyz - v_Position.xyz);\n' +
  // calculate effect of all light sources
  // 'for (int i = 0; i < 2; i++){ \n'+
  //     'if (i==0){ \n' +
  //       'u_TotalLampPos = u_Lamp0Pos;\n' +
  //       'u_TotalLampAmb = u_Lamp0Amb;\n' +
  //       'u_TotalLampDiff = u_Lamp0Diff;\n' +
  //       'u_TotalLampSpec = u_Lamp0Spec;\n' +
  //     '}else if (i==1){\n' +
  //       'u_TotalLampPos = u_Lamp1Pos;\n' +
  //       'u_TotalLampAmb = u_Lamp1Amb;\n' +
  //       'u_TotalLampDiff = u_Lamp1Diff;\n' +
  //       'u_TotalLampSpec = u_Lamp1Spec;\n' +
  //     '}\n' + 
  '  vec3 lightDirection = normalize(u_Lamp0Pos.xyz - v_Position.xyz);\n' +
  '  vec3 secLightDirection = normalize(u_Lamp1Pos.xyz - v_Position.xyz);\n' +
      // The dot product of the light direction and the normal
      // (use max() to discard any negatives from lights below the surface)
  '  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
  '  float secNDotL = max(dot(secLightDirection, normal), 0.0); \n' +
      // The Blinn-Phong lighting model computes the specular term faster 
      // because it replaces the (V*R)^shiny weighting with (H*N)^shiny,
      // where 'halfway' vector H has a direction half-way between L and V"
      // H = norm(norm(V) + norm(L)) 
      // (see http://en.wikipedia.org/wiki/Blinn-Phong_shading_model)
  '  vec3 eyeDirection = normalize(u_eyePosWorld.xyz - v_Position.xyz); \n' +
  '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
  '  vec3 secH = normalize(secLightDirection + eyeDirection); \n' +
  '  float nDotH = max(dot(H, normal), 0.0); \n' +
  '  float secNDotH = max(dot(secH, normal), 0.0); \n' +
      // (use max() to discard any negatives from lights below the surface)
      // Apply the 'shininess' exponent K_e:
  '  float e02 = nDotH*nDotH; \n' +
  '  float e04 = e02*e02; \n' +
  '  float e08 = e04*e04; \n' +
  '  float e16 = e08*e08; \n' +
  '  float e32 = e16*e16; \n' +
  '  float e64 = e32*e32; \n' +

  // Second headlight source
  '  float secE02 = secNDotH*secNDotH; \n' +
  '  float secE04 = secE02*secE02; \n' +
  '  float secE08 = secE04*secE04; \n' +
  '  float secE16 = secE08*secE08; \n' +
  '  float secE32 = secE16*secE16; \n' +
  '  float secE64 = secE32*secE32; \n' +
      // Calculate the final color from diffuse reflection and ambient reflection
  '  vec3 emissive = u_Ke;' +
  '  vec3 ambient = (u_Lamp0Amb) * u_Ka;\n' +
  '  vec3 diffuse = (u_Lamp0Diff) * v_Kd * nDotL;\n' +
  '  vec3 speculr = (u_Lamp0Spec) * u_Ks * e64 * e64;\n' +

  // Second headlight source
  '  vec3 secAmbient = (u_Lamp1Amb) * u_Ka;\n' +
  '  vec3 secDiffuse = (u_Lamp1Diff) * v_Kd * secNDotL;\n' +
  '  vec3 secSpeculr = (u_Lamp1Spec) * u_Ks * secE64 * secE64;\n' +


  '  gl_FragColor = vec4(emissive + ambient + diffuse + speculr + secAmbient + secDiffuse + secSpeculr, 1.0);\n' +
  // '  }\n' + 
  '}\n';

  // try to not include 1 lamp

  
var floatsPerVertex = 6;  // # of Float32Array elements used for each vertex
                          // (x,y,z)position + (r,g,b)color

// Global vars for mouse click-and-drag for rotation.
var isDrag=false;   // mouse-drag: true when user holds down mouse button
var xMclik=0.0;     // last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;  // total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;

var ANGLE_STEP = 45.0;
var currentAngle = 0;
var handAngle = 45;

var lightXPos = 6.0;
var lightYPos = 6.0;
var lightZPos = 0.0;
var lightPosDifference = 20.0;

var timesLogged = 0;

// Headlight Intensity
var headLightAmbRed = 0.4;
var headLightAmbGreen = 0.4;
var headLightAmbBlue = 0.4;
var headLightDifRed = 1.0;
var headLightDifGreen = 1.0;
var headLightDifBlue = 1.0;
var headLightSpecRed = 1.0;
var headLightSpecGreen = 1.0;
var headLightSpecBlue = 1.0;

// Use model, view, projection matrix
function main() {
//==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
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
//  gl.depthFunc(gl.LESS);       // WebGL default setting: (default)
  gl.enable(gl.DEPTH_TEST); 
  
  // Set the vertex coordinates and color (the blue triangle is in the front)
  var n = initVertexBuffers(gl);

  if (n < 0) {
    console.log('Failed to specify the vertex infromation');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.2, 0.2, 0.2, 1.0);

  // Setup for first light source
  setTextFields();
  submitLightVars(); 

  // Get the storage locations of uniform variables: the scene
  u_eyePosWorld = gl.getUniformLocation(gl.program, 'u_eyePosWorld');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_NormalMatrix = gl.getUniformLocation(gl.program,'u_NormalMatrix');
  u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ModelMatrix || !u_NormalMatrix || !u_ProjMatrix) {
    console.log('Failed to get matrix storage locations');
    return;
    }
  //  ... for Phong light source:
  var u_Lamp0Pos  = gl.getUniformLocation(gl.program,   'u_Lamp0Pos');
  var u_Lamp0Amb  = gl.getUniformLocation(gl.program,   'u_Lamp0Amb');
  var u_Lamp0Diff = gl.getUniformLocation(gl.program,   'u_Lamp0Diff');
  var u_Lamp0Spec = gl.getUniformLocation(gl.program,   'u_Lamp0Spec');
  if( !u_Lamp0Pos || !u_Lamp0Amb || !u_Lamp0Diff || !u_Lamp0Spec ) { // || !u_Lamp0Spec  )  ) {//|| !u_Lamp0Diff  ) { // || !u_Lamp0Spec  ) {
    console.log('Failed to get the Lamp0 storage locations');
    return;
  }

  // Headlight Light Source
  var u_Lamp1Pos  = gl.getUniformLocation(gl.program,   'u_Lamp1Pos');
  var u_Lamp1Amb  = gl.getUniformLocation(gl.program,   'u_Lamp1Amb');
  var u_Lamp1Diff = gl.getUniformLocation(gl.program,   'u_Lamp1Diff');
  var u_Lamp1Spec = gl.getUniformLocation(gl.program,   'u_Lamp1Spec');
  if( !u_Lamp1Pos || !u_Lamp1Amb  ) {//|| !u_Lamp0Diff  ) { // || !u_Lamp0Spec  ) {
    console.log('Failed to get the Lamp1 storage locations');
    return;
  }

  // ... for Phong material/reflectance:
  u_Ke = gl.getUniformLocation(gl.program, 'u_Ke');
  u_Ka = gl.getUniformLocation(gl.program, 'u_Ka');
  u_Kd = gl.getUniformLocation(gl.program, 'u_Kd');
  u_Ks = gl.getUniformLocation(gl.program, 'u_Ks');
  //var u_Kshiny = gl.getUniformLocation(gl.program, 'u_Kshiny');
  


  if(!u_Ke || !u_Ka || !u_Kd 
//     || !u_Ks || !u_Kshiny
     ) {
    console.log('Failed to get the Phong Reflectance storage locations');
    return;
  }


  if (!u_ModelMatrix) { 
    console.log('Failed to get u_ModelMatrix or u_ProjMatrix');
    return;
  }

  // Position the first light source in World coords: 
  gl.uniform4f(u_Lamp0Pos, lightXPos, lightYPos, lightZPos, 1.0);
  // Set its light output:  
  gl.uniform3f(u_Lamp0Amb,  ambRedVal, ambGreenVal, ambBlueVal);   // ambient
  gl.uniform3f(u_Lamp0Diff, difRedVal, difGreenVal, difBlueVal);   // diffuse
  gl.uniform3f(u_Lamp0Spec, specRedVal, specGreenVal, specBlueVal);   // Specular


  // // // Position the second light Source in World coords:
  gl.uniform4f(u_Lamp1Pos, g_EyeX, g_EyeY, g_EyeZ, 1.0);
  // Set its light output:  
  gl.uniform3f(u_Lamp1Amb,  headLightAmbRed, headLightAmbGreen, headLightAmbBlue);   // ambient
  gl.uniform3f(u_Lamp1Diff, headLightDifRed, headLightDifGreen, headLightDifBlue);   // diffuse
  gl.uniform3f(u_Lamp1Spec, headLightSpecRed, headLightSpecGreen, headLightSpecBlue);   // Specular

  // Set the Phong materials' reflectance:
  gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);        // Ke emissive
  gl.uniform3f(u_Ka, 0.6, 0.0, 0.0);        // Ka ambient
  gl.uniform3f(u_Kd, 0.8, 0.0, 0.0);        // Kd diffuse
  gl.uniform3f(u_Ks, 0.8, 0.8, 0.8);        // Ks specular
  //gl.uniform1i(u_Kshiny, 40);              // Kshiny shinyness exponent
  
  var ModelMatrix = new Matrix4();  // Model matrix
  var normalMatrix = new Matrix4(); // Transformation matrix for normals
  var projMatrix = new Matrix4();
  var viewMatrix = new Matrix4();

  // ModelMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ,         // eye position
  //                       g_EyePosX,g_EyePosY,g_EyePosZ,  // look-at point (origin) 
  //                       0, 1, 0);   
  
  // Register the event handler to be called on key press
  document.onkeydown = function(ev){ keydown(ev, gl, u_ModelMatrix, ModelMatrix); };
  // (Note that I eliminated the 'n' argument (no longer needed)).
  
  canvas.onmousedown  = function(ev){myMouseDown( ev, gl, canvas) }; 
            // when user's mouse button goes down, call mouseDown() function
  canvas.onmousemove =  function(ev){myMouseMove( ev, gl, canvas) };
                      // when the mouse moves, call mouseMove() function          
  canvas.onmouseup =    function(ev){myMouseUp(   ev, gl, canvas)};

  // with this perspective-camera matrix:
  // (SEE PerspectiveView.js, Chapter 7 of book)

  projMatrix.setPerspective(40, (canvas.width)/canvas.height, 1, 100);

  //viewMatrix.multiply(ModelMatrix); // mvpMatrix * modelMatrix


  // try pre-mult Perspective
  //ModelMatrix.multiply(projMatrix);

  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(ModelMatrix);
  normalMatrix.transpose();

  // Pass the transformation matrix for normals to u_NormalMatrix
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  // Pass the eye position to u_eyePosWorld
  gl.uniform4f(u_eyePosWorld, g_EyeX,g_EyeY,g_EyeZ, 1);
  // Pass the model matrix to u_ModelMatrix
  gl.uniformMatrix4fv(u_ModelMatrix, false, ModelMatrix.elements);

  // pass the matrix to u_ProjMatrix
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

  // Pass the transformation matrix for normals to u_NormalMatrix
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  // pass the matrix to u_ViewMatrix
  gl.uniformMatrix4fv(u_ViewMatrix,false,viewMatrix.elements);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  /*
  robotMaterial = [0.0, 0.0, 0.0, 1.0, // K_emit
                   0.24725, 0.2245, 0.0645, 1.0, // K_ambi
                   0.34615, 0.3143, 0.0903, 1.0, // k_diff
                   0.797357, 0.723991, 0.208006, 1.0, // k_spec
                   83.2]; // k_shiny
  */

  var tick = function(){
    currentAngle = animate(currentAngle); // Update the rotation angle
    draw(gl, u_ModelMatrix, ModelMatrix);   // Draw the triangles
    requestAnimationFrame(tick, canvas);   // Request that the browser ?calls tick
  };
  tick();
  winResize(gl,u_ModelMatrix,ModelMatrix);

}

var cubeVerts = [];
var numCubes = 1;
var cubeVertsToDraw = 0;

// set up new object
// numCubes = 12;

// Try to use 6 vertices, (x,y,z, normals)?
function makeCube(save){
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3

  var tempCubeVerts = new Float32Array([
    // Vertex coordinates and color
    //--POSITION--------------NORMAL----------//
    // front
    1.0,  1.0,  1.0,      0.0, 0.0, 1.0,  // v0 White
    -1.0,  1.0,  1.0,     0.0, 0.0, 1.0,   // v1 Magenta
    -1.0, -1.0,  1.0,     0.0, 0.0, 1.0, // v2 Red
    1.0,  1.0,  1.0,      0.0, 0.0, 1.0,  // v0 White
    -1.0, -1.0,  1.0,     0.0, 0.0, 1.0, // v2 Red
    1.0, -1.0,  1.0,      0.0, 0.0, 1.0,  // v3 Yellow

    // right
    1.0,  1.0,  1.0,      1.0, 0.0, 0.0, // v0 White
    1.0, -1.0,  1.0,      1.0, 0.0, 0.0,  // v3 Yellow
    1.0, -1.0, -1.0,      1.0, 0.0, 0.0, // v4 Green
    1.0,  1.0,  1.0,      1.0, 0.0, 0.0, // v0 White
    1.0, -1.0, -1.0,      1.0, 0.0, 0.0, // v4 Green
    1.0,  1.0, -1.0,      1.0, 0.0, 0.0, // v5 Cyan

    // up
    1.0,  1.0,  1.0,      0.0, 1.0, 0.0, // v0 White
    1.0,  1.0, -1.0,      0.0, 1.0, 0.0, // v5 Cyan
    -1.0,  1.0, -1.0,     0.0, 1.0, 0.0,  // v6 Blue
    1.0,  1.0,  1.0,      0.0, 1.0, 0.0,  // v0 White
    -1.0,  1.0, -1.0,     0.0, 1.0, 0.0,  // v6 Blue
    -1.0,  1.0,  1.0,     0.0, 1.0, 0.0,  // v1 Magenta

    // left
    -1.0,  1.0,  1.0,     -1.0, 0.0, 0.0, // v1 Magenta
    -1.0,  1.0, -1.0,     -1.0, 0.0, 0.0, // v6 Blue
    -1.0, -1.0, -1.0,     -1.0, 0.0, 0.0, // v7 Black
    -1.0,  1.0,  1.0,     -1.0, 0.0, 0.0,  // v1 Magenta
    -1.0, -1.0, -1.0,     -1.0, 0.0, 0.0,  // v7 Black
    -1.0, -1.0,  1.0,     -1.0, 0.0, 0.0,  // v2 Red

    // down
    -1.0, -1.0, -1.0,     0.0,-1.0, 0.0, // v7 Black
    1.0, -1.0, -1.0,      0.0,-1.0, 0.0,  // v4 Green
    1.0, -1.0,  1.0,      0.0,-1.0, 0.0,  // v3 Yellow
    -1.0, -1.0, -1.0,     0.0,-1.0, 0.0,   // v7 Black
    1.0, -1.0,  1.0,      0.0,-1.0, 0.0,  // v3 Yellow
    -1.0, -1.0,  1.0,     0.0,-1.0, 0.0,   // v2 Red

    // back
    1.0, -1.0, -1.0,      0.0, 0.0,-1.0,  // v4 Green
   -1.0, -1.0, -1.0,      0.0, 0.0,-1.0,   // v7 Black
   -1.0,  1.0, -1.0,      0.0, 0.0,-1.0,  // v6 Blue
    1.0, -1.0, -1.0,      0.0, 0.0,-1.0,  // v4 Green
   -1.0,  1.0, -1.0,      0.0, 0.0,-1.0,  // v6 Blue
    1.0,  1.0, -1.0,      0.0, 0.0,-1.0  // v5 Cyan
    ]);

cubeVerts = Float32Concat(cubeVerts,tempCubeVerts);
cubeVertsToDraw = cubeVerts.length/numCubes;

return tempCubeVerts;
}

function Float32Concat(first, second)
{
    var firstLength = first.length,
        result = new Float32Array(firstLength + second.length);

    result.set(first);
    result.set(second, firstLength);

    return result;
}


// change groundgrid to have no colors?
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

    // normals for grid
    gndVerts[j+3] = 1;
    gndVerts[j+4] = 1;
    gndVerts[j+5] = 1;
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

    gndVerts[j+3] = 1;
    gndVerts[j+4] = 1;
    gndVerts[j+5] = 1;
  }
}

// make Sphere will have a normal vector
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
      }
      else {  // put odd# vertices around the slice's lower edge;
              // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
              //          theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
        sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);    // x
        sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);    // y
        sphVerts[j+2] = cos1;                                       // z
      }
      // set normal vertices
      sphVerts[j+3] = sphVerts[j]; // set to x
      sphVerts[j+4] = sphVerts[j+1]; // set to y
      sphVerts[j+5] = sphVerts[j+2]; // set to z
    }
  }
}

function initVertexBuffers(gl) {
//==============================================================================

  // make our 'forest' of triangular-shaped trees:
  /*
  forestVerts = new Float32Array([
    // Vertex coordinates and color
     0.0,  0.5,  -0.4,  0.4,  1.0,  0.4, // The back green one
    -0.5, -0.5,  -0.4,  0.4,  1.0,  0.4,
     0.5, -0.5,  -0.4,  1.0,  0.4,  0.4, 
   
     0.5,  0.4,  -0.2,  1.0,  0.4,  0.4, // The middle yellow one
    -0.5,  0.4,  -0.2,  1.0,  1.0,  0.4,
     0.0, -0.6,  -0.2,  1.0,  1.0,  0.4, 

     0.0,  0.5,   0.0,  0.4,  0.4,  1.0,  // The front blue one 
    -0.5, -0.5,   0.0,  0.4,  0.4,  1.0,
     0.5, -0.5,   0.0,  1.0,  0.4,  0.4, 
  ]);
  */

  // Make our 'ground plane' and 'torus' shapes too:
  
  makeGroundGrid();
  /*
  // Robot
  makeCube(); // robot body
  makeCube(); // robot right shoulder
  makeCube(); // robot right arm
  makeCube(); // robot right arm end
  makeCube(); // robot right leg
  makeCube(); // robot left leg
  makeCube(); // robot left arm
  makeCube(); // another robot joint

  // 2nd Robot
  makeCube(); // robot body
  makeCube(); // robot right shoulder
  makeCube(); // robot right arm
  makeCube(); // robot right arm end
  makeCube(); // robot right leg
  makeCube(); // robot left leg
  makeCube(); // robot left arm
  makeCube(); // another robot joint

  // 3rd Robot
  makeCube(); // robot body
  makeCube(); // robot right shoulder
  makeCube(); // robot right arm
  makeCube(); // robot right arm end
  makeCube(); // robot right leg
  makeCube(); // robot left leg
  makeCube(); // robot left arm
  makeCube(); // another robot joint
  */

  makeCube(); // light source

  // Test Sphere
  makeSphere();


  // How much space to store all the shapes in one array?
  // (no 'var' means this is a global variable)
  //mySiz = gndVerts.length + cubeVerts.length + sphVerts.length;
  mySiz = sphVerts.length + gndVerts.length + cubeVerts.length;
  // How many vertices total?
  var nn = mySiz / floatsPerVertex;
  console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);

  // Copy all shapes into one big Float32 array:
  var verticesColors = new Float32Array(mySiz);
  // Copy them:  remember where to start for each shape:
  /*
  forestStart = 0;              // we store the forest first.
  for(i=0,j=0; j< forestVerts.length; i++,j++) {
    verticesColors[i] = forestVerts[j];
    }
    */

/*
  gndStart = 0;           // next we'll store the ground-plane;
  for(i=0,j=0; j< gndVerts.length; i++, j++) {
    verticesColors[i] = gndVerts[j];
    }
  robotBodyStart = i;
  for (j=0; j<cubeVerts.length;i++,j++){
    verticesColors[i] = cubeVerts[j];
  }

  robotRightLegStart = robotBodyStart + cubeVertsToDraw;
  robotLeftLegStart = robotRightLegStart + cubeVertsToDraw;
  robotLeftArmStart = robotLeftLegStart + cubeVertsToDraw;
  robotRightShoulderStart = robotLeftArmStart + cubeVertsToDraw;
  robotRightArmStart = robotRightShoulderStart + cubeVertsToDraw;

  secRobotBodyStart = robotRightArmStart + cubeVertsToDraw;
  secRobotRightLegStart = secRobotBodyStart + cubeVertsToDraw;
  secRobotLeftLegStart = secRobotRightLegStart + cubeVertsToDraw;
  secRobotLeftArmStart = secRobotLeftLegStart + cubeVertsToDraw;
  secRobotRightShoulderStart = secRobotLeftArmStart + cubeVertsToDraw;
  secRobotRightArmStart = secRobotRightShoulderStart + cubeVertsToDraw;

  thirdRobotBodyStart = secRobotRightArmStart + cubeVertsToDraw;
  thirdRobotRightLegStart = thirdRobotBodyStart + cubeVertsToDraw;
  thirdRobotLeftLegStart = thirdRobotRightLegStart + cubeVertsToDraw;
  thirdRobotLeftArmStart = thirdRobotLeftLegStart + cubeVertsToDraw;
  thirdRobotRightShoulderStart = thirdRobotLeftArmStart + cubeVertsToDraw;
  thirdRobotRightArmStart = thirdRobotRightShoulderStart + cubeVertsToDraw;

  sphStart = thirdRobotRightArmStart + cubeVertsToDraw;
  for (j = 0; j < sphVerts.length; i++, j++){
    verticesColors[i] = sphVerts[j];
  }
  */
  sphStart = 0;
  for (j=0,i=0; j < sphVerts.length; i++,j++){
    verticesColors[i] = sphVerts[j];
  }
  gndStart = i;
  for (j = 0; j < gndVerts.length; j++, i++){
    verticesColors[i] = gndVerts[j];
  }
  cubeVertStart = i;
  for (j=0; j<cubeVerts.length; j++,i++){
    verticesColors[i] = cubeVerts[j];
  }



  
  // Create a buffer object
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
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);
  // Assign the buffer object to a_Color and enable the assignment

  var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0){
    console.log("Failed to get the storage location of a_Normal");
    return -1;
  }
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_Normal);


  return mySiz/floatsPerVertex; // return # of vertices
}

var eyeTheta = 0;

// Attempt to change the position
var g_EyeX = 0.20, g_EyeY = 0.25, g_EyeZ = 4.25; 
//var g_EyePosX = 0.0; g_EyePosY = 0; g_EyePosZ = 10;
var g_EyePosX = 0; g_EyePosY = 1; g_EyePosZ = 0;
// Global vars for Eye position. 
// NOTE!  I moved eyepoint BACKWARDS from the forest: from g_EyeZ=0.25
// a distance far enough away to see the whole 'forest' of trees within the
// 30-degree field-of-view of our 'perspective' camera.  I ALSO increased
// the 'keydown()' function's effect on g_EyeX position.


// Must go in direction of look at point
// Check look at location minus present location
// if > 0, add 1 to position
function keydown(ev, gl, u_ModelMatrix, ModelMatrix) {
//------------------------------------------------------
//HTML calls this'Event handler' or 'callback function' when we press a key:
    var constDisp = 0.3;

    if (ev.keyCode == 40){ // down arrow
        g_EyeZ += constDisp;
        g_EyePosZ += constDisp;
    }else if(ev.keyCode == 39) { // The right arrow key was pressed
        g_EyeX += constDisp;    // INCREASED for perspective camera)
        g_EyePosX += constDisp;
    } else if (ev.keyCode == 38){ // up arrow
        g_EyeZ -= constDisp;
        g_EyePosZ -= constDisp;
    }else if (ev.keyCode == 37) { // The left arrow key was pressed
        g_EyeX -= constDisp;    // INCREASED for perspective camera)
        g_EyePosX -= constDisp;
    }else if (ev.keyCode == 65){ // a key was pressed
        g_EyeY += constDisp;
        g_EyePosY += constDisp;
    }else if (ev.keyCode == 83){ // s key was pressed
        g_EyeY -= constDisp;
        g_EyePosY -= constDisp;
    }
    else { return; } // Prevent the unnecessary drawing  
    gl.uniform4f(u_eyePosWorld, g_EyeX,g_EyeY,g_EyeZ, 1); // adjust for different eye posiit
    draw(gl, u_ModelMatrix, ModelMatrix);
}

function myMouseDown(ev, gl, canvas) {
//==============================================================================
// Called when user PRESSES down any mouse button;
//                  (Which button?    console.log('ev.button='+ev.button);   )
//    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
//  console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
  
  isDrag = true;                      // set our mouse-dragging flag
  xMclik = x;                         // record where mouse-dragging began
  yMclik = y;
};


function myMouseMove(ev, gl, canvas) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
//                  (Which button?   console.log('ev.button='+ev.button);    )
//    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

  if(isDrag==false) return;       // IGNORE all mouse-moves except 'dragging'

  // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);

  // find how far we dragged the mouse:
  xMdragTot += (x - xMclik);          // Accumulate change-in-mouse-position,&
  yMdragTot += (y - yMclik);
  // AND use any mouse-dragging we found to update quaternions qNew and qTot.
  //dragQuat(x - xMclik, y - yMclik);
  //g_EyePosX += (x - xMclik) * 3;
  eyeTheta += (x-xMclik);
  g_EyePosX = g_EyeX + 7*Math.cos(eyeTheta);
  g_EyePosZ = g_EyeZ + 7*Math.sin(eyeTheta);
  g_EyePosY += (y - yMclik) * 3;

  xMclik = x;                         // Make NEXT drag-measurement from here.
  yMclik = y;
  
};

function myMouseUp(ev, gl, canvas) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
//                  (Which button?   console.log('ev.button='+ev.button);    )
//    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
//  console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
  
  isDrag = false;                     // CLEAR our mouse-dragging flag, and
  // accumulate any final bit of mouse-dragging we did:
  xMdragTot += (x - xMclik);
  yMdragTot += (y - yMclik);
//  console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);

  // AND use any mouse-dragging we found to update quaternions qNew and qTot;
  //dragQuat(x - xMclik, y - yMclik);
  //g_EyePosX += (x - xMclik) * 3;

  g_EyePosY += (y - yMclik) * 3;
  eyeTheta += (x-xMclik);
  g_EyePosX = g_EyeX + 7*Math.cos(eyeTheta);
  g_EyePosZ = g_EyeZ + 7*Math.sin(eyeTheta);

  console.log("Eye position x == " + g_EyePosX);
  console.log("Eye position y == " + g_EyePosY);

  console.log("Eye Look at x == " + g_EyePosX);
  console.log("Eye Look at z == " + g_EyePosZ);

};


function draw(gl, u_ModelMatrix, ModelMatrix) {
//==============================================================================
  
  // Clear <canvas> color AND DEPTH buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var canvas = document.getElementById('webgl');

  //var ModelMatrix = new Matrix4();

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
              canvas.width,           // changed to canvas to adjust for difference  
              canvas.height);                //in viewport and canvas height

              //gl.drawingBufferWidth/2,        // viewport width, height.
              //gl.drawingBufferHeight);          

  var pAspect = ((gl.drawingBufferWidth/2) / gl.drawingBufferHeight);
              
  // Set the matrix to be used for to set the camera view
  var projMatrix = new Matrix4();
  projMatrix.setPerspective(40, (canvas.width)/canvas.height, 1, 100);
  gl.uniformMatrix4fv(u_ProjMatrix,false,projMatrix.elements);

  var viewMatrix = new Matrix4();
  viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ,         // eye position
                        g_EyePosX,g_EyePosY,g_EyePosZ,  // look-at point (origin) 
                        0, 1, 0);                       // up vector (+y)

  // Adjust lamp position
  var u_Lamp0Pos  = gl.getUniformLocation(gl.program,   'u_Lamp0Pos');
  gl.uniform4f(u_Lamp0Pos, lightXPos, lightYPos, lightZPos, 1.0);

  // adjust lamp ambience, diffuse, and spectral light
  var u_Lamp0Amb  = gl.getUniformLocation(gl.program,   'u_Lamp0Amb');
  var u_Lamp0Diff = gl.getUniformLocation(gl.program,   'u_Lamp0Diff');
  var u_Lamp0Spec = gl.getUniformLocation(gl.program,   'u_Lamp0Spec');

  gl.uniform3f(u_Lamp0Amb, ambRedVal, ambGreenVal, ambBlueVal);   // Ambient
  gl.uniform3f(u_Lamp0Diff, difRedVal, difGreenVal, difBlueVal);   // Ambient
  gl.uniform3f(u_Lamp0Spec, specRedVal, specGreenVal, specBlueVal);   // Ambient

  // adjust headlight position
  var u_Lamp1Pos  = gl.getUniformLocation(gl.program,   'u_Lamp1Pos');
  gl.uniform4f(u_Lamp1Pos, g_EyeX, g_EyeY, g_EyeZ, 1.0);

  // Pass the view matrix
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  // Draw the scene:
  drawMyScene(gl, u_ModelMatrix, ModelMatrix);
}

var g_last = Date.now();

function sphereAnimate(angle){
  angle += 30;
  angle %= 360;
}

function animate(angle){
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;

  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
  if(angle >   15.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
  if(angle <  -80.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
  
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  handAngle += ((ANGLE_STEP*elapsed)/1000.0 * 5);
  handAngle %= 360;
  return newAngle %= 360;
}

var firstLightMov = true;

// Must have different objects
function drawMyScene(myGL, myu_ModelMatrix, myModelMatrix) {

  normalMatrix = new Matrix4();
  myModelMatrix = new Matrix4();
  //console.log(myModelMatrix);
  // ModelMatrix.multiply(ModelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  //normalMatrix.setInverseOf(myModelMatrix);
  //normalMatrix.transpose();

  //gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
//===============================================================================
// Called ONLY from within the 'draw()' function
// Assumes already-correctly-set View matrix and Proj matrix; 
// draws all items in 'world' coords.

  // DON'T clear <canvas> or you'll WIPE OUT what you drew 
  // in all previous viewports!
  // myGL.clear(gl.COLOR_BUFFER_BIT);             
  
  // Draw the 'forest' in the current 'world' coord system:
  // (where +y is 'up', as defined by our setLookAt() function call above...)

// Rotate to make a new set of 'world' drawing axes: 
 // old one had "+y points upwards", but
 // myModelMatrix
 
 pushMatrix(myModelMatrix);
 if(timesLogged < 2){
  console.log(myModelMatrix.elements);
 }
  myModelMatrix.rotate(-90.0, 1,0,0); // new one has "+z points upwards",
                                      // made by rotating -90 deg on +x-axis.
                                      // Move those new drawing axes to the 
                                      // bottom of the trees:
if(timesLogged < 2){
  console.log(myModelMatrix.elements);
  //timesLogged++;
}

  myGL.uniformMatrix4fv(myu_ModelMatrix, false, myModelMatrix.elements);

  var tmpMatrix = new Matrix4();
  tmpMatrix.setInverseOf(myModelMatrix);
  tmpMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, tmpMatrix.elements);
 /*
  myModelMatrix.translate(0.0, 0.0, -0.6);  
  myModelMatrix.scale(0.4, 0.4,0.4);    // shrink the drawing axes 
                                      //for nicer-looking ground-plane, and
  
  // Pass the modified view matrix to our shaders:
  myGL.uniformMatrix4fv(myu_ModelMatrix, false, myModelMatrix.elements);
  
    // no grid for grids
  gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);        // Ke emissive
  gl.uniform3f(u_Ka, 0.6, 0.0, 0.0);        // Ka ambient
  gl.uniform3f(u_Kd, 0.8, 0.0, 0.0);        // Kd diffuse
  gl.uniform3f(u_Ks, 0.8, 0.8, 0.8);        // Ks specular
  */

  // Now, using these drawing axes, draw our ground plane: 
  myGL.drawArrays(myGL.LINES,             // use this drawing primitive, and
                gndStart/floatsPerVertex, // start at this vertex number, and
                gndVerts.length/floatsPerVertex);   // draw this many vertices

  myModelMatrix = popMatrix();
/*
  myModelMatrix.translate(0,0,2.5);

  pushMatrix(myModelMatrix); // full body
  myModelMatrix.scale(1.5,1.5,1.5);
  myModelMatrix.rotate(currentAngle,0,0,1);
  myGL.uniformMatrix4fv(myu_ModelMatrix,false,myModelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                robotBodyStart/floatsPerVertex,
                cubeVertsToDraw/floatsPerVertex);

  pushMatrix(myModelMatrix); // right leg
  myModelMatrix.translate(0.4,0,-1.2);
  myModelMatrix.scale(0.3,0.6,0.5);
  myGL.uniformMatrix4fv(myu_ModelMatrix,false,myModelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                  robotRightLegStart/floatsPerVertex,
                  cubeVertsToDraw/floatsPerVertex);
  myModelMatrix = popMatrix(); // right leg

  pushMatrix(myModelMatrix); // left leg
  myModelMatrix.translate(-0.4,0,-1.2);
  myModelMatrix.scale(0.3,0.6,0.5);
  myGL.uniformMatrix4fv(myu_ModelMatrix,false,myModelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                  robotLeftLegStart/floatsPerVertex,
                  cubeVertsToDraw/floatsPerVertex);
  myModelMatrix = popMatrix();

  pushMatrix(myModelMatrix); // left arm
  myModelMatrix.translate(-1.4,0,0);
  myModelMatrix.scale(0.4,0.7,0.7);
  myGL.uniformMatrix4fv(myu_ModelMatrix,false,myModelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                  robotLeftArmStart/floatsPerVertex,
                  cubeVertsToDraw/floatsPerVertex);
  myModelMatrix = popMatrix();

  pushMatrix(myModelMatrix); // right arm shoulder
  myModelMatrix.translate(1.2,0,0.4);
  myModelMatrix.scale(0.2,0.2,0.2);
  myModelMatrix.rotate(currentAngle,0,1,0);
  myGL.uniformMatrix4fv(myu_ModelMatrix,false,myModelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                 robotRightShoulderStart/floatsPerVertex,
                 cubeVertsToDraw/floatsPerVertex);

  pushMatrix(myModelMatrix); // right arm 
  myModelMatrix.translate(3.0,0,-1.4);
  myModelMatrix.scale(2.0,2.6,2.6);
  myModelMatrix.rotate(currentAngle,0,1,0);
  myGL.uniformMatrix4fv(myu_ModelMatrix,false,myModelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                robotRightArmStart/floatsPerVertex,
                cubeVertsToDraw/floatsPerVertex);


  
  myModelMatrix = popMatrix(); // right arm 
  myModelMatrix = popMatrix(); // right arm shoulder

  myModelMatrix = popMatrix(); // full body


  myModelMatrix.translate(10.0,0,0.0);

  //setToGold();
  gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);        // Ke emissive
  gl.uniform3f(u_Ka, 0.24725, 0.2245, 0.0645);        // Ka ambient
  gl.uniform3f(u_Kd, 0.34615, 0.3143, 0.0903);        // Kd diffuse
  gl.uniform3f(u_Ks, 0.797357, 0.723991, 0.208006);        // Ks specular

  pushMatrix(myModelMatrix); // full body
  myModelMatrix.scale(1.5,1.5,1.5);
  myModelMatrix.rotate(currentAngle,0,0,1);
  myGL.uniformMatrix4fv(myu_ModelMatrix,false,myModelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                secRobotBodyStart/floatsPerVertex,
                cubeVertsToDraw/floatsPerVertex);

  pushMatrix(myModelMatrix); // right leg
  myModelMatrix.translate(0.4,0,-1.2);
  myModelMatrix.scale(0.3,0.6,0.5);
  myGL.uniformMatrix4fv(myu_ModelMatrix,false,myModelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                  secRobotRightLegStart/floatsPerVertex,
                  cubeVertsToDraw/floatsPerVertex);
  myModelMatrix = popMatrix(); // right leg

  pushMatrix(myModelMatrix); // left leg
  myModelMatrix.translate(-0.4,0,-1.2);
  myModelMatrix.scale(0.3,0.6,0.5);
  myGL.uniformMatrix4fv(myu_ModelMatrix,false,myModelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                  secRobotLeftLegStart/floatsPerVertex,
                  cubeVertsToDraw/floatsPerVertex);
  myModelMatrix = popMatrix();

  pushMatrix(myModelMatrix); // left arm
  myModelMatrix.translate(-1.4,0,0);
  myModelMatrix.scale(0.4,0.7,0.7);
  myGL.uniformMatrix4fv(myu_ModelMatrix,false,myModelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                  secRobotLeftArmStart/floatsPerVertex,
                  cubeVertsToDraw/floatsPerVertex);
  myModelMatrix = popMatrix();

  pushMatrix(myModelMatrix); // right arm shoulder
  myModelMatrix.translate(1.2,0,0.4);
  myModelMatrix.scale(0.2,0.2,0.2);
  myModelMatrix.rotate(currentAngle,0,1,0);
  myGL.uniformMatrix4fv(myu_ModelMatrix,false,myModelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                 secRobotRightShoulderStart/floatsPerVertex,
                 cubeVertsToDraw/floatsPerVertex);

  pushMatrix(myModelMatrix); // right arm 
  myModelMatrix.translate(3.0,0,-1.4);
  myModelMatrix.scale(2.0,2.6,2.6);
  myModelMatrix.rotate(currentAngle,0,1,0);
  myGL.uniformMatrix4fv(myu_ModelMatrix,false,myModelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                secRobotRightArmStart/floatsPerVertex,
                cubeVertsToDraw/floatsPerVertex);
  
  myModelMatrix = popMatrix(); // right arm 
  myModelMatrix = popMatrix(); // right arm shoulder

  myModelMatrix = popMatrix(); // full body

  myModelMatrix.translate(-20,0,0);

  // set to silver
  gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);        // Ke emissive
  gl.uniform3f(u_Ka, 0.23125, 0.23125, 0.23125);        // Ka ambient
  gl.uniform3f(u_Kd, 0.2775, 0.2775, 0.2775);        // Kd diffuse
  gl.uniform3f(u_Ks, 0.773911, 0.773911, 0.773911);        // Ks specular

  pushMatrix(myModelMatrix); // full body
  myModelMatrix.scale(1.5,1.5,1.5);
  myModelMatrix.rotate(currentAngle,0,0,1);
  myGL.uniformMatrix4fv(myu_ModelMatrix,false,myModelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                thirdRobotBodyStart/floatsPerVertex,
                cubeVertsToDraw/floatsPerVertex);

  pushMatrix(myModelMatrix); // right leg
  myModelMatrix.translate(0.4,0,-1.2);
  myModelMatrix.scale(0.3,0.6,0.5);
  myGL.uniformMatrix4fv(myu_ModelMatrix,false,myModelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                  thirdRobotRightLegStart/floatsPerVertex,
                  cubeVertsToDraw/floatsPerVertex);
  myModelMatrix = popMatrix(); // right leg

  pushMatrix(myModelMatrix); // left leg
  myModelMatrix.translate(-0.4,0,-1.2);
  myModelMatrix.scale(0.3,0.6,0.5);
  myGL.uniformMatrix4fv(myu_ModelMatrix,false,myModelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                  thirdRobotLeftLegStart/floatsPerVertex,
                  cubeVertsToDraw/floatsPerVertex);
  myModelMatrix = popMatrix();

  pushMatrix(myModelMatrix); // left arm
  myModelMatrix.translate(-1.4,0,0);
  myModelMatrix.scale(0.4,0.7,0.7);
  myGL.uniformMatrix4fv(myu_ModelMatrix,false,myModelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                  thirdRobotLeftArmStart/floatsPerVertex,
                  cubeVertsToDraw/floatsPerVertex);
  myModelMatrix = popMatrix();

  pushMatrix(myModelMatrix); // right arm shoulder
  myModelMatrix.translate(1.2,0,0.4);
  myModelMatrix.scale(0.2,0.2,0.2);
  myModelMatrix.rotate(currentAngle,0,1,0);
  myGL.uniformMatrix4fv(myu_ModelMatrix,false,myModelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                 thirdRobotRightShoulderStart/floatsPerVertex,
                 cubeVertsToDraw/floatsPerVertex);

  pushMatrix(myModelMatrix); // right arm 
  myModelMatrix.translate(3.0,0,-1.4);
  myModelMatrix.scale(2.0,2.6,2.6);
  myModelMatrix.rotate(currentAngle,0,1,0);
  myGL.uniformMatrix4fv(myu_ModelMatrix,false,myModelMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                thirdRobotRightArmStart/floatsPerVertex,
                cubeVertsToDraw/floatsPerVertex);


  
  myModelMatrix = popMatrix(); // right arm 
  myModelMatrix = popMatrix(); // right arm shoulder

  myModelMatrix = popMatrix(); // full body
    // Make test sphere
    */
  pushMatrix(myModelMatrix); // sphere

  // try to create temp model
  myModelMatrix.translate(0,1.3,0);
  myModelMatrix.rotate(currentAngle,0,0,1);
  myGL.uniformMatrix4fv(myu_ModelMatrix,false,myModelMatrix.elements);

  var tmpMatrix = new Matrix4();
  tmpMatrix.setInverseOf(myModelMatrix);
  tmpMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, tmpMatrix.elements);

  myGL.drawArrays(myGL.TRIANGLE_STRIP,
                  sphStart/floatsPerVertex,
                  sphVerts.length/floatsPerVertex);
  myModelMatrix = popMatrix();


  pushMatrix(myModelMatrix); // sphere source of light
  myModelMatrix.translate(lightXPos,lightYPos,lightZPos);

  myModelMatrix.scale(0.5,0.5,0.5);
  myGL.uniformMatrix4fv(myu_ModelMatrix,false,myModelMatrix.elements);

  var tmpMatrix = new Matrix4();
  tmpMatrix.setInverseOf(myModelMatrix);
  tmpMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, tmpMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,
                  sphStart/floatsPerVertex,
                  sphVerts.length/floatsPerVertex);
  myModelMatrix = popMatrix();

if(timesLogged < 2)
  console.log(myModelMatrix.elements);
timesLogged++;

}

function winResize(gl,u_ModelMatrix,ModelMatrix) {
//==============================================================================
// Called when user re-sizes their browser window , because our HTML file
// contains:  <body onload="main()" onresize="winResize()">

  var nuCanvas = document.getElementById('webgl');  // get current canvas
  var nuGL = getWebGLContext(nuCanvas);

  //Report our current browser-window contents:

  console.log('nuCanvas width,height=', nuCanvas.width, nuCanvas.height);   
  console.log('Browser window: innerWidth,innerHeight=', 
                                innerWidth, innerHeight); // http://www.w3schools.com/jsref/obj_window.asp

  
  //Make canvas fill the top 3/4 of our browser window:
  nuCanvas.width = innerWidth;
  nuCanvas.height = innerHeight*3/4;

  var u_ModelMatrix = nuGL.getUniformLocation(nuGL.program, 'u_ModelMatrix');
  var ModelMatrix = new Matrix4();


  draw(nuGL,u_ModelMatrix,ModelMatrix);
}

function increaseLightXPos(){
  lightXPos += lightPosDifference;
}

function decreaseLightXPos(){
  lightXPos -= lightPosDifference;
}

function increaseLightYPos(){
  lightYPos += lightPosDifference;
}

function decreaseLightYPos(){
  lightYPos -= lightPosDifference;
}

function increaseLightZPos(){
  lightZPos += lightPosDifference;
}

function decreaseLightZPos(){
  lightZPos -= lightPosDifference;
}

function submitLightVars(){
  var ambRed = document.getElementById("Lamp0AmbRed");
  var ambGreen = document.getElementById("Lamp0AmbGreen");
  var ambBlue = document.getElementById("Lamp0AmbBlue");
  var difRed = document.getElementById("Lamp0DiffRed");
  var difGreen = document.getElementById("Lamp0DiffGreen");
  var difBlue = document.getElementById("Lamp0DiffBlue");
  var specRed = document.getElementById("Lamp0SpecRed");
  var specGreen = document.getElementById("Lamp0SpecGreen");
  var specBlue = document.getElementById("Lamp0SpecBlue");

  if (!(greaterThanZeroLessThanOne(ambRed.value) || greaterThanZeroLessThanOne(ambGreen.value) || greaterThanZeroLessThanOne(ambBlue.value) || greaterThanZeroLessThanOne(difRed.value) || greaterThanZeroLessThanOne(difBlue.value) || greaterThanZeroLessThanOne(difGreen.value) || greaterThanZeroLessThanOne(specRed.value) || greaterThanZeroLessThanOne(specGreen.value) || greaterThanZeroLessThanOne(specBlue.value))){
    alert("Enter values between 0.0 and 1.0");
    return;
  }

  ambRedVal = ambRed.value;
  ambGreenVal = ambGreen.value;
  ambBlueVal = ambBlue.value;
  difRedVal = difRed.value;
  difGreenVal = difGreen.value;
  difBlueVal = difBlue.value;
  specRedVal = specRed.value;
  specGreenVal = specGreen.value;
  specBlueVal = specBlue.value;

}

function setTextFields(){
  var ambRed = document.getElementById("Lamp0AmbRed");
  var ambGreen = document.getElementById("Lamp0AmbGreen");
  var ambBlue = document.getElementById("Lamp0AmbBlue");
  var difRed = document.getElementById("Lamp0DiffRed");
  var difGreen = document.getElementById("Lamp0DiffGreen");
  var difBlue = document.getElementById("Lamp0DiffBlue");
  var specRed = document.getElementById("Lamp0SpecRed");
  var specGreen = document.getElementById("Lamp0SpecGreen");
  var specBlue = document.getElementById("Lamp0SpecBlue");

  ambRed.value = 0.4;
  ambGreen.value = 0.4;
  ambBlue.value = 0.4;
  difRed.value = 1.0;
  difGreen.value = 1.0;
  difBlue.value = 1.0;
  specRed.value = 1.0;
  specGreen.value = 1.0;
  specBlue.value = 1.0;

}

function greaterThanZeroLessThanOne(num){
  if (num >= 0 && num <= 1){
    return true;
  }
  return false;
}

function setToRedPlastic(){
  var canvas = document.getElementById('webgl');
  var gl = getWebGLContext(canvas);

  var u_Ke = gl.getUniformLocation(gl.program, 'u_Ke');
  var u_Ka = gl.getUniformLocation(gl.program, 'u_Ka');
  var u_Kd = gl.getUniformLocation(gl.program, 'u_Kd');
  var u_Ks = gl.getUniformLocation(gl.program, 'u_Ks');

  gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);        // Ke emissive
  gl.uniform3f(u_Ka, 0.6, 0.0, 0.0);        // Ka ambient
  gl.uniform3f(u_Kd, 0.8, 0.0, 0.0);        // Kd diffuse
  gl.uniform3f(u_Ks, 0.8, 0.8, 0.8);        // Ks specular
}

function setToGold(){
  var canvas = document.getElementById('webgl');
  var gl = getWebGLContext(canvas);

  var u_Ke = gl.getUniformLocation(gl.program, 'u_Ke');
  var u_Ka = gl.getUniformLocation(gl.program, 'u_Ka');
  var u_Kd = gl.getUniformLocation(gl.program, 'u_Kd');
  var u_Ks = gl.getUniformLocation(gl.program, 'u_Ks');

  gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);        // Ke emissive
  gl.uniform3f(u_Ka, 0.24725, 0.2245, 0.0645);        // Ka ambient
  gl.uniform3f(u_Kd, 0.34615, 0.3143, 0.0903);        // Kd diffuse
  gl.uniform3f(u_Ks, 0.797357, 0.723991, 0.208006);        // Ks specular
}

