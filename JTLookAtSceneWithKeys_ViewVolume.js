 //3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
//==============================================================================
//
// LookAtTrianglesWithKey_ViewVolume.js (c) 2012 matsuda
//
//  MODIFIED 2014.02.19 J. Tumblin to 
//		--demonstrate multiple viewports (see 'draw()' function at bottom of file)
//		--draw ground plane in the 3D scene:  makeGroundPlane()

// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec3 a_Normal;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform vec3 u_LightDirection;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  'float light3 = 0.7 * clamp(dot(vec3(0,0,1),a_Normal),0.0,1.0) + 0.3;\n' + 
  //'  float light3 = clamp((0.7 * dot(vec3(0,0,1),a_Normal) + 0.3),0.0,1.0);\n' +  // light is coming from upwards direction
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * a_Position;\n' +
  '  v_Color = a_Color * light3;\n' + // multiply by light3 clamped single float value, obtain different colors
  '}\n';
  // clamp((3 * dot(vec3(0,0,1),a_Normal) + 7),0,1))
  // clamp( dot(vec3(0,0,1),a_Normal),0.0,1.0)

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';
  
var floatsPerVertex = 9;	// # of Float32Array elements used for each vertex
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

function main() {
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
//	gl.depthFunc(gl.LESS);			 // WebGL default setting: (default)
	gl.enable(gl.DEPTH_TEST); 
	
  // Set the vertex coordinates and color (the blue triangle is in the front)
  var n = initVertexBuffers(gl);

  if (n < 0) {
    console.log('Failed to specify the vertex infromation');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.2, 0.2, 0.2, 1.0);

  // Get the storage locations of u_ViewMatrix and u_ProjMatrix variables
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_LightDirection = gl.getUniformLocation(gl.program,'u_LightDirection');
  if (!u_ViewMatrix || !u_ProjMatrix) { 
    console.log('Failed to get u_ViewMatrix or u_ProjMatrix');
    return;
  }



  // Create the matrix to specify the view matrix
  var viewMatrix = new Matrix4();
  // Register the event handler to be called on key press
  document.onkeydown = function(ev){ keydown(ev, gl, u_ViewMatrix, viewMatrix); };
	// (Note that I eliminated the 'n' argument (no longer needed)).
	
  canvas.onmousedown  = function(ev){myMouseDown( ev, gl, canvas) }; 
            // when user's mouse button goes down, call mouseDown() function
  canvas.onmousemove =  function(ev){myMouseMove( ev, gl, canvas) };
                      // when the mouse moves, call mouseMove() function          
  canvas.onmouseup =    function(ev){myMouseUp(   ev, gl, canvas)};

  // Create the matrix to specify the viewing volume and pass it to u_ProjMatrix
  var projMatrix = new Matrix4();
	// with this perspective-camera matrix:
	// (SEE PerspectiveView.js, Chapter 7 of book)

  projMatrix.setPerspective(40, (canvas.width/2)/canvas.height, 1, 100);

  var lightDirection = new Vector3([0.5, 3.0, 4.0]);
  lightDirection.normalize(); //

  // YOU TRY IT: make an equivalent camera using matrix-cuon-mod.js
  // perspective-camera matrix made by 'frustum()' function..
  
	// Send this matrix to our Vertex and Fragment shaders through the
	// 'uniform' variable u_ProjMatrix:
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

  robotMaterial = [0.0, 0.0, 0.0, 1.0, // K_emit
                   0.24725, 0.2245, 0.0645, 1.0, // K_ambi
                   0.34615, 0.3143, 0.0903, 1.0, // k_diff
                   0.797357, 0.723991, 0.208006, 1.0, // k_spec
                   83.2]; // k_shiny

  var tick = function(){
    currentAngle = animate(currentAngle); // Update the rotation angle
    draw(gl, u_ViewMatrix, viewMatrix);   // Draw the triangles
    requestAnimationFrame(tick, canvas);   // Request that the browser ?calls tick
  };
  tick();
  winResize(gl,u_ViewMatrix,viewMatrix);

}

var cubeVerts = [];
var numCubes = 6;
var cubeVertsToDraw = 0;

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

  // var cubeVerts = new Float32Array([
  //   // Vertex coordinates and color
  //    1.0,  1.0,  1.0,     1.0,  1.0,  1.0,  // v0 White
  //   -1.0,  1.0,  1.0,     1.0,  0.0,  1.0,  // v1 Magenta
  //   -1.0, -1.0,  1.0,     1.0,  0.0,  0.0,  // v2 Red
  //    1.0, -1.0,  1.0,     1.0,  1.0,  0.0,  // v3 Yellow
  //    1.0, -1.0, -1.0,     0.0,  1.0,  0.0,  // v4 Green
  //    1.0,  1.0, -1.0,     0.0,  1.0,  1.0,  // v5 Cyan
  //   -1.0,  1.0, -1.0,     0.0,  0.0,  1.0,  // v6 Blue
  //   -1.0, -1.0, -1.0,     0.0,  0.0,  0.0   // v7 Black
  // ]);

  var tempCubeVerts = new Float32Array([
    // Vertex coordinates and color
    //--POSITION-------------COLOR---------------NORMAL----------//
    // front
    1.0,  1.0,  1.0,     1.0,  1.0,  1.0,     1.0, 1.0, 1.0,  // v0 White
    -1.0,  1.0,  1.0,     1.0,  0.0,  1.0,    1.0, 1.0, 1.0,  // v1 Magenta
    -1.0, -1.0,  1.0,     1.0,  0.0,  0.0,    1.0, 1.0, 1.0, // v2 Red
    1.0,  1.0,  1.0,     1.0,  1.0,  1.0,     1.0, 1.0, 1.0,  // v0 White
    -1.0, -1.0,  1.0,     1.0,  0.0,  0.0,    1.0, 1.0, 1.0, // v2 Red
    1.0, -1.0,  1.0,     1.0,  1.0,  0.0,     1.0, 1.0, 1.0,  // v3 Yellow

    // right
    1.0,  1.0,  1.0,     1.0,  1.0,  1.0,     1.0, 1.0, 1.0, // v0 White
    1.0, -1.0,  1.0,     1.0,  1.0,  0.0,     1.0, 1.0, 1.0,  // v3 Yellow
    1.0, -1.0, -1.0,     0.0,  1.0,  0.0,     1.0, 1.0, 1.0, // v4 Green
    1.0,  1.0,  1.0,     1.0,  1.0,  1.0,     1.0, 1.0, 1.0, // v0 White
    1.0, -1.0, -1.0,     0.0,  1.0,  0.0,     1.0, 1.0, 1.0, // v4 Green
    1.0,  1.0, -1.0,     0.0,  1.0,  1.0,     1.0, 1.0, 1.0, // v5 Cyan

    // up
    1.0,  1.0,  1.0,     1.0,  1.0,  1.0,     1.0, 1.0, 1.0, // v0 White
    1.0,  1.0, -1.0,     0.0,  1.0,  1.0,     1.0, 1.0, 1.0, // v5 Cyan
    -1.0,  1.0, -1.0,     0.0,  0.0,  1.0,    1.0, 1.0, 1.0,  // v6 Blue
    1.0,  1.0,  1.0,     1.0,  1.0,  1.0,     1.0, 1.0, 1.0,  // v0 White
    -1.0,  1.0, -1.0,     0.0,  0.0,  1.0,    1.0, 1.0, 1.0,  // v6 Blue
    -1.0,  1.0,  1.0,     1.0,  0.0,  1.0,    1.0, 1.0, 1.0,  // v1 Magenta

    // left
    -1.0,  1.0,  1.0,     1.0,  0.0,  1.0,    1.0, 1.0, 1.0, // v1 Magenta
    -1.0,  1.0, -1.0,     0.0,  0.0,  1.0,    1.0, 1.0, 1.0, // v6 Blue
    -1.0, -1.0, -1.0,     0.0,  0.0,  0.0,    1.0, 1.0, 1.0, // v7 Black
    -1.0,  1.0,  1.0,     1.0,  0.0,  1.0,    1.0, 1.0, 1.0,  // v1 Magenta
    -1.0, -1.0, -1.0,     0.0,  0.0,  0.0,    1.0, 1.0, 1.0,  // v7 Black
    -1.0, -1.0,  1.0,     1.0,  0.0,  0.0,    1.0, 1.0, 1.0,  // v2 Red

    // down
    -1.0, -1.0, -1.0,     0.0,  0.0,  0.0,    1.0, 1.0, 1.0, // v7 Black
    1.0, -1.0, -1.0,     0.0,  1.0,  0.0,     1.0, 1.0, 1.0,  // v4 Green
    1.0, -1.0,  1.0,     1.0,  1.0,  0.0,     1.0, 1.0, 1.0,  // v3 Yellow
    -1.0, -1.0, -1.0,     0.0,  0.0,  0.0,    1.0, 1.0, 1.0,   // v7 Black
    1.0, -1.0,  1.0,     1.0,  1.0,  0.0,     1.0, 1.0, 1.0,  // v3 Yellow
    -1.0, -1.0,  1.0,     1.0,  0.0,  0.0,    1.0, 1.0, 1.0,   // v2 Red

    // back
    1.0, -1.0, -1.0,     0.0,  1.0,  0.0,     1.0, 1.0, 1.0,  // v4 Green
   -1.0, -1.0, -1.0,     0.0,  0.0,  0.0,     1.0, 1.0, 1.0,   // v7 Black
   -1.0,  1.0, -1.0,     0.0,  0.0,  1.0,     1.0, 1.0, 1.0,  // v6 Blue
    1.0, -1.0, -1.0,     0.0,  1.0,  0.0,     1.0, 1.0, 1.0,  // v4 Green
   -1.0,  1.0, -1.0,     0.0,  0.0,  1.0,     1.0, 1.0, 1.0,  // v6 Blue
    1.0,  1.0, -1.0,     0.0,  1.0,  1.0,     1.0, 1.0, 1.0   // v5 Cyan
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


// might be problem using xcount = 2;
function makeAxes(){

  axVerts = new Float32Array([

    //-Position-------COLOR------NORMAL--------------//
      -100,0,0,     1, 0, 0,    1, 1, 1,
       100,0,0,     1, 0, 0,    1, 1, 1,
       0,-100,0,    0, 1, 0,    1, 1, 1,
       0, 100,0,    0, 1, 0,    1, 1, 1,
       0, 0,-100,   0, 0, 1,    1, 1, 1,
       0, 0, 100,   0, 0, 1,    1, 1, 1
    ]);
}

// should coalesce into one function
function makeJointAxes(pointArray){

  var x = pointArray[0];
  var axDif = 100;
  var xPos = x + axDif;
  var xNeg = x - axDif;
  var y = pointArray[1];
  var yPos = y + axDif;
  var yNeg = y - axDif;
  var z = pointArray[2];
  var zPos = z + axDif;
  var zNeg = z - axDif;

  var newAxVerts = new Float32Array([
    //--Position-----COLOR-----NORMAL--------------//
        xNeg,0,0,    1,0,0,     1,1,1,
        xPos,0,0,    1,0,0,     1,1,1,
        0,yNeg,0,    0,1,0,     1,1,1,
        0,yPos,0,    0,1,0,     1,1,1,
        0,0,zNeg,    0,0,1,     1,1,1,
        0,0,zPos,    0,0,1,     1,1,1
    ]);
  return newAxVerts;
}

function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

	var xcount = 100;			// # of lines to draw in x,y to make the grid.
	var ycount = 100;		
	var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
 	var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
 	var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.
 	
	// Create an (global) array to hold this ground-plane's vertices:
	gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
						// draw a grid made of xcount+ycount lines; 2 vertices per line.
						
	var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
	var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
	
	// First, step thru x values as we make vertical lines of constant-x:
	for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
		if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
			gndVerts[j  ] = -xymax + (v  )*xgap;	// x
			gndVerts[j+1] = -xymax;								// y
			gndVerts[j+2] = 0.0;									// z
		}
		else {				// put odd-numbered vertices at (xnow, +xymax, 0).
			gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
			gndVerts[j+1] = xymax;								// y
			gndVerts[j+2] = 0.0;									// z
		}
		gndVerts[j+3] = xColr[0];			// red
		gndVerts[j+4] = xColr[1];			// grn
		gndVerts[j+5] = xColr[2];			// blu

    // normals for grid
    gndVerts[j+6] = 1;
    gndVerts[j+7] = 1;
    gndVerts[j+8] = 1;
	}
	// Second, step thru y values as wqe make horizontal lines of constant-y:
	// (don't re-initialize j--we're adding more vertices to the array)
	for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
		if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
			gndVerts[j  ] = -xymax;								// x
			gndVerts[j+1] = -xymax + (v  )*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
		}
		else {					// put odd-numbered vertices at (+xymax, ynow, 0).
			gndVerts[j  ] = xymax;								// x
			gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
		}
		gndVerts[j+3] = yColr[0];			// red
		gndVerts[j+4] = yColr[1];			// grn
		gndVerts[j+5] = yColr[2];			// blu

    gndVerts[j+6] = 1;
    gndVerts[j+7] = 1;
    gndVerts[j+8] = 1;
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
  makeAxes();

  // Robot
  makeCube(); // robot body
  makeCube(); // robot right shoulder
  makeCube(); // robot right arm
  makeCube(); // robot right arm end
  makeCube(); // robot right leg
  makeCube(); // robot left leg
  makeCube(); // robot left arm
  makeCube(); // another robot joint


	// How much space to store all the shapes in one array?
	// (no 'var' means this is a global variable)
	mySiz = gndVerts.length + axVerts.length + cubeVerts.length;
	
  // How many vertices total?
	var nn = mySiz / floatsPerVertex;
	console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);

	// Copy all shapes into one big Float32 array:
  var verticesColors = new Float32Array(mySiz);
	// Copy them:  remember where to start for each shape:
	/*
  forestStart = 0;							// we store the forest first.
  for(i=0,j=0; j< forestVerts.length; i++,j++) {
  	verticesColors[i] = forestVerts[j];
		}
    */

	gndStart = 0;						// next we'll store the ground-plane;
	for(i=0,j=0; j< gndVerts.length; i++, j++) {
		verticesColors[i] = gndVerts[j];
		}
  axStart = i;
  for (j=0; j< axVerts.length; i++,j++){
    verticesColors[i] = axVerts[j];
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
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 9, 0);
  gl.enableVertexAttribArray(a_Position);
  // Assign the buffer object to a_Color and enable the assignment
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 9, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);

  var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0){
    console.log("Failed to get the storage location of a_Normal");
    return -1;
  }
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * 9, FSIZE * 6);
  gl.enableVertexAttribArray(a_Normal);



  // must change to add normal vectors like previous vectors


  return mySiz/floatsPerVertex;	// return # of vertices
}

var eyeTheta = 0;

var g_EyeX = 0.20, g_EyeY = 0.25, g_EyeZ = 4.25; 
var g_EyePosX = 5.2; g_EyePosY = 0; g_EyePosZ = 4.25;
// Global vars for Eye position. 
// NOTE!  I moved eyepoint BACKWARDS from the forest: from g_EyeZ=0.25
// a distance far enough away to see the whole 'forest' of trees within the
// 30-degree field-of-view of our 'perspective' camera.  I ALSO increased
// the 'keydown()' function's effect on g_EyeX position.


// Must go in direction of look at point
// Check look at location minus present location
// if > 0, add 1 to position
function keydown(ev, gl, u_ViewMatrix, viewMatrix) {
//------------------------------------------------------
//HTML calls this'Event handler' or 'callback function' when we press a key:
    var constDisp = 0.3;

    if (ev.keyCode == 40){ // down arrow
        g_EyeZ += constDisp;
        g_EyePosZ += constDisp;
    }else if(ev.keyCode == 39) { // The right arrow key was pressed
        g_EyeX += constDisp;		// INCREASED for perspective camera)
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
    draw(gl, u_ViewMatrix, viewMatrix);
    draw(gl, u_ViewMatrix, viewMatrix);    
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

var orthoLeft = -35.0, orthoRight = 35.0, orthoTop = 35.0, orthoBot = -35.0,
orthoBack = 35.0, orthoFront = -35.0;

function increaseLeft(){
  orthoLeft+= 2;
}

function decreaseLeft(){
  orthoLeft-= 2;
}
function increaseRight(){
  orthoRight+= 2;
}
function decreaseRight(){
  orthoRight-= 2;
}
function increaseTop(){
  orthoTop+= 2;
}
function decreaseTop(){
  orthoTop-= 2;
}

function increaseBot(){
  orthoBot+= 2;
}

function decreaseBot(){
  orthoBot-= 2;
}

function increaseBack(){
  orthoBack+= 2;
}
function decreaseBack(){
  orthoBack-= 2;
}
function increaseFront(){
  orthoFront+=2;
}
function decreaseFront(){
  orthoFront-=2;
}



function draw(gl, u_ViewMatrix, viewMatrix) {
//==============================================================================
  
  // Clear <canvas> color AND DEPTH buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var canvas = document.getElementById('webgl');

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
  gl.viewport(0,  														// Viewport lower-left corner
							0,															// (x,y) location(in pixels)
  						canvas.width,           // changed to canvas to adjust for difference  
              canvas.height);                //in viewport and canvas height

              //gl.drawingBufferWidth/2, 				// viewport width, height.
  						//gl.drawingBufferHeight);          

  var pAspect = ((gl.drawingBufferWidth/2) / gl.drawingBufferHeight);
  						
  // Set the matrix to be used for to set the camera view
  viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ,        	// eye position
  											g_EyePosX,g_EyePosY,g_EyePosZ,  // look-at point (origin) 
  											0, 1, 0);							         	// up vector (+y)

  var projMatrix = new Matrix4();
  // must change look at point
  projMatrix.setPerspective(40, pAspect, 1, 100);

  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  
  // Pass the view projection matrix
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

	// Draw the scene:
	drawMyScene(gl, u_ViewMatrix, viewMatrix);
}

var g_last = Date.now();

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

// Must have different objects
function drawMyScene(myGL, myu_ViewMatrix, myViewMatrix) {
//===============================================================================
// Called ONLY from within the 'draw()' function
// Assumes already-correctly-set View matrix and Proj matrix; 
// draws all items in 'world' coords.

	// DON'T clear <canvas> or you'll WIPE OUT what you drew 
	// in all previous viewports!
	// myGL.clear(gl.COLOR_BUFFER_BIT);  						
  
  // Draw the 'forest' in the current 'world' coord system:
  // (where +y is 'up', as defined by our setLookAt() function call above...)
  /*
  myGL.drawArrays(myGL.TRIANGLES, 				// use this drawing primitive, and
  						  forestStart/floatsPerVertex,	// start at this vertex number, and
  						  forestVerts.length/floatsPerVertex);	// draw this many vertices.
  */
 // Rotate to make a new set of 'world' drawing axes: 
 // old one had "+y points upwards", but
  myViewMatrix.rotate(-90.0, 1,0,0); // new one has "+z points upwards",
   																		// made by rotating -90 deg on +x-axis.
  																		// Move those new drawing axes to the 
  																		// bottom of the trees:
  myViewMatrix.translate(0.0, 0.0, -0.6);	
	myViewMatrix.scale(0.4, 0.4,0.4);		// shrink the drawing axes 
																			//for nicer-looking ground-plane, and
  // Pass the modified view matrix to our shaders:
  myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
  
  // Now, using these drawing axes, draw our ground plane: 
  myGL.drawArrays(myGL.LINES,							// use this drawing primitive, and
  							gndStart/floatsPerVertex,	// start at this vertex number, and
  							gndVerts.length/floatsPerVertex);		// draw this many vertices

  myGL.drawArrays(myGL.LINES,
                axStart/floatsPerVertex,
                axVerts.length/floatsPerVertex);

  myViewMatrix.translate(0,0,2.5);

  pushMatrix(myViewMatrix); // full body
  myViewMatrix.scale(1.5,1.5,1.5);
  myViewMatrix.rotate(currentAngle,0,0,1);
  myGL.uniformMatrix4fv(myu_ViewMatrix,false,myViewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                robotBodyStart/floatsPerVertex,
                cubeVertsToDraw/floatsPerVertex);

  pushMatrix(myViewMatrix); // right leg
  myViewMatrix.translate(0.4,0,-1.2);
  myViewMatrix.scale(0.3,0.6,0.5);
  myGL.uniformMatrix4fv(myu_ViewMatrix,false,myViewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                  robotRightLegStart/floatsPerVertex,
                  cubeVertsToDraw/floatsPerVertex);
  myViewMatrix = popMatrix(); // right leg

  pushMatrix(myViewMatrix); // left leg
  myViewMatrix.translate(-0.4,0,-1.2);
  myViewMatrix.scale(0.3,0.6,0.5);
  myGL.uniformMatrix4fv(myu_ViewMatrix,false,myViewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                  robotLeftLegStart/floatsPerVertex,
                  cubeVertsToDraw/floatsPerVertex);
  myViewMatrix = popMatrix();

  pushMatrix(myViewMatrix); // left arm
  myViewMatrix.translate(-1.4,0,0);
  myViewMatrix.scale(0.4,0.7,0.7);
  myGL.uniformMatrix4fv(myu_ViewMatrix,false,myViewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                  robotLeftArmStart/floatsPerVertex,
                  cubeVertsToDraw/floatsPerVertex);
  myViewMatrix = popMatrix();

  pushMatrix(myViewMatrix); // right arm shoulder
  myViewMatrix.translate(1.2,0,0.4);
  myViewMatrix.scale(0.2,0.2,0.2);
  myViewMatrix.rotate(currentAngle,0,1,0);
  myGL.uniformMatrix4fv(myu_ViewMatrix,false,myViewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                 robotRightShoulderStart/floatsPerVertex,
                 cubeVertsToDraw/floatsPerVertex);

  pushMatrix(myViewMatrix); // right arm 
  myViewMatrix.translate(3.0,0,-1.4);
  myViewMatrix.scale(2.0,2.6,2.6);
  myViewMatrix.rotate(currentAngle,0,1,0);
  myGL.uniformMatrix4fv(myu_ViewMatrix,false,myViewMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLES,
                robotRightArmStart/floatsPerVertex,
                cubeVertsToDraw/floatsPerVertex);


  
  myViewMatrix = popMatrix(); // right arm 
  myViewMatrix = popMatrix(); // right arm shoulder

  myViewMatrix = popMatrix(); // full body
}

function winResize(gl,u_ViewMatrix,viewMatrix) {
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

  var u_ViewMatrix = nuGL.getUniformLocation(nuGL.program, 'u_ViewMatrix');
  //  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  var viewMatrix = new Matrix4();


  draw(nuGL,u_ViewMatrix,viewMatrix);
}