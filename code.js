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

	const dim = 1024;
	const tex0 = createTexture(gl, dim);
	const tex1 = createTexture(gl, dim);

	const fb0 = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb0);
	const attachmentPoint = gl.COLOR_ATTACHMENT0;
	gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, tex0, 0);
	
	const fb1 = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb1);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, tex1, 0);

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	var flipTex = false;

	window.requestAnimationFrame(render);

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

		gl.uniformMatrix4fv(
		  data.uniforms.projection,
		  false,
		  identity);

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

			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
		}

		
		window.requestAnimationFrame(render);
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
