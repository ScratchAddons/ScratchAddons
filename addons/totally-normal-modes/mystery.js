// Based on https://github.com/scratchfoundation/scratch-render/compare/b3cfeb0...hotfix/totally-normal-2021
// Modified to use WebGL directly instead of twgl.js

let initialized = false;
let enabled = false;

let renderer = null;
let gl = null;
let framebuffer = null;
let texture = null;
let mouseCoords = [0, 0];

export async function init(addon) {
  const vm = addon.tab.traps.vm;
  await new Promise((resolve) => {
    if (vm.editingTarget) return resolve();
    vm.runtime.once("PROJECT_LOADED", resolve);
  });

  initialized = true;
  renderer = vm.runtime.renderer;
  gl = renderer._gl;

  renderer._shaderManager._shaderCache["mystery"] = {};

  const oldGlShaderSource = gl.shaderSource;
  gl.shaderSource = function (shader, source) {
    // modify shaders to support mystery mode
    source = source
      .split("\n")
      .map(
        (line) =>
          ({
            // sprite.vert
            "\tgl_Position = vec4(a_position * 2.0, 0, 1);": `
              ${line}
              #elif defined(DRAW_MODE_mystery)
              gl_Position = vec4(a_position * vec2(-2.0, 2.0), 0.0, 1.0);
              v_texCoord = a_texCoord;
            `,
            // sprite.frag
            "#endif // DRAW_MODE_background": `
              ${line}
              #ifdef DRAW_MODE_mystery
              uniform vec2 u_mousePosition;
              #endif // DRAW_MODE_mystery
            `,
            "\tvec2 texcoord0 = v_texCoord;": `
              ${line}
              #ifdef DRAW_MODE_mystery
              vec2 mysteryCoord = texcoord0;
              vec2 offset = vec2(u_mousePosition.x, 1.0 - u_mousePosition.y);
              mysteryCoord -= offset;
              const float SCALE_FACTOR = 0.85;
              mysteryCoord *= vec2(SCALE_FACTOR, SCALE_FACTOR);
              mysteryCoord += offset;
              #endif // DRAW_MODE_mystery
            `,
            "\tgl_FragColor = texture2D(u_skin, texcoord0);": `
              ${line}
              #ifdef DRAW_MODE_mystery
              const vec4 SHADOW_COLOR = vec4(0.0, 0.0, 0.0, 0.5);
              const float SHADOW_BLUR = 0.0025;

              float shadowSample1 = texture2D(u_skin, mysteryCoord + vec2(SHADOW_BLUR, SHADOW_BLUR)).a;
              float shadowSample2 = texture2D(u_skin, mysteryCoord + vec2(-SHADOW_BLUR, SHADOW_BLUR)).a;
              float shadowSample3 = texture2D(u_skin, mysteryCoord + vec2(SHADOW_BLUR, -SHADOW_BLUR)).a;
              float shadowSample4 = texture2D(u_skin, mysteryCoord + vec2(-SHADOW_BLUR, -SHADOW_BLUR)).a;

              float shadowAlpha = (shadowSample1 + shadowSample2 + shadowSample3 + shadowSample4) * 0.25;

              vec4 shadow = SHADOW_COLOR * shadowAlpha;
              gl_FragColor = gl_FragColor + (shadow * (1.0 - gl_FragColor.a));
              #endif // DRAW_MODE_mystery
            `,
          })[line] || line
      )
      .join("\n");
    oldGlShaderSource.call(this, shader, source);
  };

  const oldDraw = renderer.draw;
  renderer.draw = function () {
    if (!enabled) return oldDraw.call(this);
    const oldDrawThese = renderer._drawThese;
    renderer._drawThese = function (drawList, ...args) {
      // draw all layers except for the bottom layer onto the mystery buffer
      drawList = drawList.slice(1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      oldDrawThese.call(this, drawList, ...args);

      // draw bottom layer to main buffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      oldDrawThese.call(this, [this._drawList[0]], ...args);

      this._doExitDrawRegion();
      const newShader = this._shaderManager.getShader("mystery", 0);
      this._regionId = newShader;

      // draw mystery buffer to main buffer
      gl.useProgram(newShader.program);
      for (const attribName of Object.keys(this._bufferInfo.attribs)) {
        if (!newShader.attribSetters[attribName]) continue;
        newShader.attribSetters[attribName](this._bufferInfo.attribs[attribName]);
      }
      const uniforms = {
        u_skin: texture,
        u_mousePosition: mouseCoords,
      };
      for (const uniformName of Object.keys(uniforms)) {
        if (!newShader.uniformSetters[uniformName]) continue;
        newShader.uniformSetters[uniformName](uniforms[uniformName]);
      }
      gl.drawArrays(gl.TRIANGLES, 0, this._bufferInfo.numElements);
    };
    oldDraw.call(this);
    renderer._drawThese = oldDrawThese;
  };

  const oldResize = renderer.resize;
  renderer.resize = function (pixelsWide, pixelsTall) {
    const oldWidth = this.canvas.width;
    const oldHeight = this.canvas.height;
    const newWidth = pixelsWide * window.devicePixelRatio;
    const newHeight = pixelsTall * window.devicePixelRatio;

    oldResize.call(this, pixelsWide, pixelsTall);
    if (!enabled) return;

    if (newWidth !== oldWidth || newHeight !== oldHeight) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, newWidth, newHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      this.draw();
    }
  };
}

export async function update(addon, mode) {
  const wasEnabled = enabled;
  enabled = addon.tab.editorMode === "editor" && mode === "mystery";
  if (enabled && !wasEnabled) {
    if (!initialized) await init(addon);
    framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  } else if (!enabled && wasEnabled) {
    gl.deleteFramebuffer(framebuffer);
    gl.deleteTexture(texture);
    framebuffer = null;
    texture = null;
  }
}

export function setMousePosition(x, y) {
  if (!initialized) return;
  const rect = renderer.canvas.getBoundingClientRect();
  mouseCoords[0] = (x - rect.left) / rect.width;
  mouseCoords[1] = (y - rect.top) / rect.height;
}
