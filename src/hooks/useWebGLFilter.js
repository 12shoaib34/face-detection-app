import { useRef, useEffect, useCallback } from 'react';

// WebGL shader for high-performance filter rendering
const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  
  uniform vec2 u_resolution;
  uniform mat3 u_transform;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec3 position = u_transform * vec3(a_position, 1.0);
    vec2 clipSpace = ((position.xy / u_resolution) * 2.0) - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    v_texCoord = a_texCoord;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  
  uniform sampler2D u_texture;
  uniform float u_opacity;
  uniform vec3 u_color;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec4 texColor = texture2D(u_texture, v_texCoord);
    vec3 blendedColor = mix(texColor.rgb, u_color, 0.3);
    gl_FragColor = vec4(blendedColor, texColor.a * u_opacity);
  }
`;

export const useWebGLFilter = (canvasRef) => {
  const glRef = useRef(null);
  const programRef = useRef(null);
  const textureCache = useRef(new Map());

  const createShader = useCallback((gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }, []);

  const createProgram = useCallback((gl, vertexShader, fragmentShader) => {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    
    return program;
  }, []);

  const initWebGL = useCallback(() => {
    if (!canvasRef.current) return false;

    const gl = canvasRef.current.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      console.error('WebGL not supported');
      return false;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);

    if (!program) return false;

    glRef.current = gl;
    programRef.current = program;

    // Enable alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    return true;
  }, [canvasRef, createShader, createProgram]);

  const loadTexture = useCallback((imageSrc) => {
    const gl = glRef.current;
    if (!gl) return null;

    if (textureCache.current.has(imageSrc)) {
      return textureCache.current.get(imageSrc);
    }

    const texture = gl.createTexture();
    const image = new Image();
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([255, 255, 255, 255]));

    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      
      // Set texture parameters for non-power-of-2 textures
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };

    image.src = imageSrc;
    textureCache.current.set(imageSrc, texture);
    
    return texture;
  }, []);

  const renderFilter = useCallback((filterData) => {
    const gl = glRef.current;
    const program = programRef.current;
    
    if (!gl || !program) return;

    gl.useProgram(program);

    // Set up geometry
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);

    const texCoords = new Float32Array([
      0, 1,
      1, 1,
      0, 0,
      1, 0,
    ]);

    // Create and bind buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    // Set attributes
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    // Set uniforms
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const transformLocation = gl.getUniformLocation(program, 'u_transform');
    const textureLocation = gl.getUniformLocation(program, 'u_texture');
    const opacityLocation = gl.getUniformLocation(program, 'u_opacity');
    const colorLocation = gl.getUniformLocation(program, 'u_color');

    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniformMatrix3fv(transformLocation, false, filterData.transform || [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1,
    ]);
    gl.uniform1i(textureLocation, 0);
    gl.uniform1f(opacityLocation, filterData.opacity || 1.0);
    gl.uniform3fv(colorLocation, filterData.color || [1, 1, 1]);

    // Bind texture
    if (filterData.texture) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, filterData.texture);
    }

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      initWebGL();
    }

    return () => {
      // Cleanup
      if (glRef.current) {
        const gl = glRef.current;
        textureCache.current.forEach(texture => {
          gl.deleteTexture(texture);
        });
        textureCache.current.clear();
      }
    };
  }, [canvasRef, initWebGL]);

  return {
    loadTexture,
    renderFilter,
    isWebGLSupported: !!glRef.current,
  };
};