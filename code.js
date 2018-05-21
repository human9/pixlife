var pause = false;
document.getElementById('pause').onclick = function(){
	pause = !pause;
};

const canvas = document.querySelector("#canvas");
//var context = canvas.getContext('2d');

function resize() {
	canvas.width  = window.innerWidth;
	canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

m00 = 0, m10 = 4, m20 = 8, m30 = 12, m01 = 1, m11 = 5, m21 = 9, m31 = 13, m02 = 2, m12 = 6,
			m22 = 10, m32 = 14, m03 = 3, m13 = 7, m23 = 11, m33 = 15;

function ortho(left, right, bottom, top, z_near, z_far) {

	a = 2 / (right - left);
	b = 2 / (top - bottom);
	c = -2 / (z_far - z_near);
	r = -(right + left) / (right - left);
	s = -(top + bottom) / (top - bottom);
	t = -(z_far + z_near) / (z_far - z_near);

	m = 
	[1, 0, 0, 0,
	 0, 1, 0, 0,
	 0, 0, 1, 0,
	 0, 0, 0, 1];
	m[m00] = a;
	m[m11] = b;
	m[m22] = c;
	m[m30] = r;
	m[m31] = s;
	m[m32] = t;
	m[m33] = 1;

	return m;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}


let startGL = function() {
	// Initialize the GL context
	const gl = canvas.getContext("webgl");

	// Only continue if WebGL is available and working
	if (!gl) {
		alert("Unable to initialize WebGL.");
		return;
	}

	const program = initShader(gl, vsSource, fsSource);

	const data = {
		program: program,
		attribs: {
			position: gl.getAttribLocation(program, 'position'),
			texcoord: gl.getAttribLocation(program, 'texcoord'),
		},
		uniforms: {
			projection: gl.getUniformLocation(program, 'projection'),
			dim: gl.getUniformLocation(program, 'dim'),
			enabled: gl.getUniformLocation(program, 'enabled'),
			rseed: gl.getUniformLocation(program, 'rseed'),
			sampler: gl.getUniformLocation(program, 'sampler'),
		},
	};

	const identity = 
	[1, 0, 0, 0,
	 0, 1, 0, 0,
	 0, 0, 1, 0,
	 0, 0, 0, 1]
	const mat = ortho(-1, 1, 1, -1, 1, -1);
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	const positions = [
    -1.0,  1.0,
    -1.0, -1.0,
     1.0, -1.0,
    -1.0,  1.0,
     1.0, -1.0,
     1.0,  1.0
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	const textureBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
	const tex = [
    0.0, 1.0,
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0, 
    1.0, 0.0,
    1.0, 1.0
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tex), gl.STATIC_DRAW);

	const dim = 2048;
	const tex0 = createTexture(gl, dim);
	const tex1 = createTextureF(gl, dim);

	const fb0 = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb0);
	const attachmentPoint = gl.COLOR_ATTACHMENT0;
	gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, tex0, 0);
	
	const fb1 = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb1);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, tex1, 0);

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	var flipTex = false;

	function render(t) {

		gl.viewport(0, 0, dim, dim);

		// swap which texture is being rendered to each frame
		texture = flipTex ? tex0 : tex1;
		fb = flipTex ? fb1 : fb0;
		flipTex = !flipTex;
		gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

		// Set clear color to black, fully opaque
		gl.clearColor(0.2, 0.2, 0.2, 1.0);
		// Clear the color buffer with specified clear color
		gl.clear(gl.COLOR_BUFFER_BIT);
		
		{
			const numComponents = 2;  // pull out 2 values per iteration
			const type = gl.FLOAT;    // the data in the buffer is 32bit floats
			const normalize = false;  // don't normalize
			const stride = 0;         // how many bytes to get from one set of values to the next
			                          // 0 = use type and numComponents above
			const offset = 0;         // how many bytes inside the buffer to start from

			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			gl.vertexAttribPointer(
			    data.attribs.position,
			    numComponents,
			    type,
			    normalize,
			    stride,
			    offset);
			gl.enableVertexAttribArray(data.attribs.position);
		}


		{
		    const num = 2; // every coordinate composed of 2 values
		    const type = gl.FLOAT; // the data in the buffer is 32 bit float
		    const normalize = false; // don't normalize
		    const stride = 0; // how many bytes to get from one set to the next
		    const offset = 0; // how many bytes inside the buffer to start from
		    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
		    gl.vertexAttribPointer(data.attribs.texcoord, num, type, normalize, stride, offset);
		    gl.enableVertexAttribArray(data.attribs.texcoord);
		}

		gl.useProgram(data.program);
		gl.uniform1f(data.uniforms.enabled, true);
		gl.uniform1f(data.uniforms.dim, dim);
		gl.uniform2f(data.uniforms.rseed, Math.random(), Math.random());


		{
			// Tell WebGL we want to affect texture unit 0
			gl.activeTexture(gl.TEXTURE0);

			// Bind the texture to texture unit 0
			gl.bindTexture(gl.TEXTURE_2D, texture);

			// Tell the shader we bound the texture to texture unit 0
			gl.uniform1i(data.uniforms.sampler, 0);

			const offset = 0;
			const vertexCount = 6;

			gl.drawArrays(gl.TRIANGLES, offset, vertexCount);

			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.uniform1f(data.uniforms.enabled, false);
			gl.uniformMatrix4fv(
			  data.uniforms.projection,
			  false,
			  ortho(-1, 1, -1, 1, 1, -1) );

			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
		}

		
		window.requestAnimationFrame(render);
	}
function createTexture(gl, dim) {
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	const blue = [20, 20, 199, 255];
	const red = [199, 20, 20, 255]
	var sq = []
	for(var i = 0; i < dim*dim; i++) {
		if(i % dim < dim/2) {
			sq.push.apply(sq, red)
		} else {
			sq.push.apply(sq, blue)
		}
	}
	const data = new Uint8Array(sq);  // opaque blue

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, dim, dim, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

	  const image = new Image();
	  image.onload = function() {
	    gl.bindTexture(gl.TEXTURE_2D, texture);
	    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
	    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

	    // WebGL1 has different requirements for power of 2 images
	    // vs non power of 2 images so check if the image is a
	    // power of 2 in both dimensions.
	    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
	       // Yes, it's a power of 2. Generate mips.
	       gl.generateMipmap(gl.TEXTURE_2D);
	    } else {
	       // No, it's not a power of 2. Turn of mips and set
	       // wrapping to clamp to edge
	       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	    }




	  };
	  image.src = "img.jpg";
  
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	return texture;
}
function createTextureF(gl, dim) {
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	const blue = [20, 20, 199, 255];
	const red = [199, 20, 20, 255]
	var sq = []
	for(var i = 0; i < dim*dim; i++) {
		if(i % dim < dim/2) {
			sq.push.apply(sq, red)
		} else {
			sq.push.apply(sq, blue)
		}
	}
	const data = new Uint8Array(sq);  // opaque blue

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, dim, dim, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

	  const image = new Image();
	  image.onload = function() {
	    gl.bindTexture(gl.TEXTURE_2D, texture);
	    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
	    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

	    // WebGL1 has different requirements for power of 2 images
	    // vs non power of 2 images so check if the image is a
	    // power of 2 in both dimensions.
	    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
	       // Yes, it's a power of 2. Generate mips.
	       gl.generateMipmap(gl.TEXTURE_2D);
	    } else {
	       // No, it's not a power of 2. Turn of mips and set
	       // wrapping to clamp to edge
	       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	    }

	    window.requestAnimationFrame(render);


	  };
	  image.src = "img.jpg";
  
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	return texture;
}
	
}


startGL();

/*
var dim = 128
var sq = []
for(var i = 0; i < dim*dim; i++) {
		sq.push((i % 128)/128 * 360)
}

var t0 = performance.now();

function loop(t)
{ 
	var dt = (t - t0) / 1000; // delta t, in seconds
	t0 = t;

	var fy = 0;

	var size = Math.min(canvas.height, canvas.width) / dim;

	let newArray = []; newArray.length = dim*dim

	if (!pause) {
		for(var i = 0; i < sq.length; i++) {
			newArray[i] = decideOutcome(i)
			context.fillStyle = 'hsl(' + newArray[i] + ', 90%, 60%)'
			context.fillRect((i % dim)*size, Math.floor(i/dim) * size, size, size);
		}

		sq = newArray;
	}

	window.requestAnimationFrame(loop);
}

function decideOutcome(i) {


	opts = []

	function op(b) {
		opts.push(b)
	}

	op(sq[i])
	if(i % dim == 0) {
		// first column
		op(sq[i+1]) // search right
	}
	else if(i % dim == dim-1) {
		//last column
		op(sq[i-1]) // search left
	}
	else {
		op(sq[i+1]) // search right
		op(sq[i-1]) // search left
	}

	if(i < dim) {
		// first row
		op(sq[i+dim]) // search down
	}
	else if(i >= sq.length - dim) {
		// last row
		op(sq[i-dim]) // search up
	}
	else {
		op(sq[i+dim]) // search down
		op(sq[i-dim]) // search up
	}

	end =  opts[Math.floor(Math.random() * opts.length)]
	return (end - sq[i]) * 0.99 + sq[i];

}

window.requestAnimationFrame(loop);
*/
