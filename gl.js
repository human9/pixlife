/* 
 * gl.js
 * Keep all webgl boilerplate over here
 */

// Vertex shader program

const vsSource = `
	attribute vec4 position;
	attribute vec2 texcoord;

	uniform mat4 projection;

	varying highp vec2 texcoord_f;

	void main() {
		texcoord_f = texcoord;
		gl_Position = projection * position;
	}
`;

const fsSource = `

	varying highp vec2 texcoord_f;
	uniform highp float dim;
	uniform highp vec2 rseed;
	uniform sampler2D sampler;
	uniform bool enabled;

	highp float rand(vec2 co)
	{
		co = co * rseed * dim * 10.;
	    highp float a = 12.9898;
	    highp float b = 78.233;
	    highp float c = 43758.5453;
	    highp float dt= dot(co.xy ,vec2(a,b));
	    highp float sn= mod(dt,3.14);
	    return fract(sin(sn) * c);
	}


	highp vec4 decideOutcome(ivec2 texel) {

		highp vec4 outcome = vec4(rand(texcoord_f),0.,0.,0.);

		// u d l r
		highp float r = rand(texcoord_f);

		int n = 5;
		if(texel.x < 1 || texel.x > int(dim)-2) {
			n - 1;
		}
		if(texel.y < 1 || texel.y > int(dim)-2) {
			n - 1;
		}
		
		which = int(r * n);

		switch(which) {
			case 0:
				if(texel.x < 1) {

				} else {
					break;
				}
			case 1:
				break;
			case 2:
				break;

		}
		if(texel.x < 1) {
			n - 1;
		}
		else if(texel.x > int(dim)-2) {
			n - 1;
		}
		
		if(texel.y < 1) {
			n - 1;
		}
		else if(texel.y > int(dim)-2) {
			n - 1;
		}


		return outcome;
	}

	void main() {
		if (enabled) {
			ivec2 texel = ivec2(texcoord_f * dim);
			gl_FragColor = decideOutcome(texel);
		}
		else {
			gl_FragColor = texture2D(sampler, texcoord_f);
		}
	}
`;

/*
 *  Combine vertex&fragment source into compiled shader program
 */
function initShader(gl, vsSource, fsSource) {
 
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

/*
 *  Compile individual shader
 */
function compileShader(gl, type, source) {
 
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function initBuffers(gl) {


	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	const positions = [
		1.0,  1.0,
		-1.0,  1.0,
		1.0, -1.0,
		-1.0, -1.0,
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	const textureBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
	const tex = [
	0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tex), gl.STATIC_DRAW);

	return {
		position: positionBuffer,
		texcoords: textureBuffer,
	};

}

function createTexture(gl, dim) {
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	const blue = [0, 0, 255, 255];
	const red = [255, 0, 0, 255]
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
  
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	return texture;
}