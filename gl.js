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


	highp vec3 rgb2hsv(highp vec3 c)
	{
	    highp vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
	    highp vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
	    highp vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

	    highp float d = q.x - min(q.w, q.y);
	    highp float e = 1.0e-10;
	    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
	}

	highp vec3 hsv2rgb(highp vec3 c)
	{
	    highp vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	    highp vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
	}


	highp vec3 interpolate(highp vec4 from, highp vec4 to, highp float amt) {
		highp vec3 from_hsv = rgb2hsv(from.xyz);
		highp vec3 to_hsv = rgb2hsv(to.xyz);
		
		highp vec3 final;
		final.x = mix(from_hsv.x, to_hsv.x, amt);
		final.y = mix(from_hsv.y, to_hsv.y, amt);
		final.z = mix(from_hsv.z, to_hsv.z, amt);
		
		return hsv2rgb(final);
	}

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


	ivec2 decideOutcome(ivec2 texel, highp float dim) {

		highp vec4 outcome = vec4(0., 0., 0., 0.);

		// u d l r
		highp float r = rand(texcoord_f);

		int which = int(r * 5.0);

		ivec2 t = texel;

		if(which == 0) {
			// center
			t = texel;
		}
		else if(which == 1) {
			// up
			if(texel.y < 1) {
				// down instead
				t = ivec2(texel.x, texel.y + 1);
			} else {
				t = ivec2(texel.x, texel.y - 1);
			}
		}
		else if(which == 2) {
			// right
			if(texel.x > int(dim)-2) {
				// left instead
				t = ivec2(texel.x - 1, texel.y);
			} else {
				t = ivec2(texel.x + 1, texel.y);
			}
		}
		else if(which == 3) {
			// down
			if(texel.y > int(dim)-2) {
				// up instead
				t = ivec2(texel.x, texel.y - 1);
			} else {
				t = ivec2(texel.x, texel.y + 1);
			}
		}
		else if(which == 4) {
			// left
			if(texel.x < 1) {
				// right instead
				t = ivec2(texel.x + 1, texel.y);
			} else {
				t = ivec2(texel.x - 1, texel.y);
			}
		}

		return t;
	}

	void main() {
		if (enabled) {
			ivec2 texel = ivec2(texcoord_f * dim);
			ivec2 outcome = decideOutcome(texel, dim);


			gl_FragColor = vec4(interpolate(texture2D(sampler, texcoord_f), texture2D(sampler, (vec2(outcome)+0.5)/dim), 0.99), 1.0);
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

	const blue = [2, 2, 255, 255];
	const red = [255, 2, 2, 255]
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
