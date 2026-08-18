/**
 * modules/mesh-background.js
 * Malha 3D em perspectiva atrás do headline da Hero (WebGL), em modo
 * monocromático: linhas pretas no tema claro, brancas no tema escuro.
 *
 * WebGL puro, sem biblioteca. Antes isto rodava sobre Three.js r128 vinda
 * de CDN: 150 KB comprimidos — mais que o dobro do site inteiro somado —
 * para desenhar um plano em wireframe. Do pacote todo, o módulo usava oito
 * primitivas, e os shaders já eram escritos à mão. O que a biblioteca de
 * fato entregava era matriz de projeção, uma grade de vértices e o
 * boilerplate de GL; tudo isso está abaixo, em ~200 linhas.
 *
 * Os shaders são os MESMOS de antes, palavra por palavra (só ganharam as
 * declarações que a Three.js injetava automaticamente). É isso que garante
 * que a malha continue idêntica na tela.
 *
 * Orçamento de execução (por que isto não custa bateria à toa):
 *  - só desenha enquanto a Hero está visível (IntersectionObserver);
 *  - resize é reduzido a um quadro por requestAnimationFrame;
 *  - sob prefers-reduced-motion desenha UM quadro estático e para o laço;
 *  - devicePixelRatio limitado a 2 (em telas 3x, o custo por pixel
 *    triplicaria sem ganho visual perceptível numa malha de linhas finas);
 *  - zero alocação por quadro: matrizes e buffers são criados uma vez.
 *
 * Degradação graciosa em cada etapa: sem WebGL, com o shader falhando ou
 * com o contexto perdido pelo navegador, a função retorna em silêncio — o
 * contêiner é `position: absolute` e aria-hidden, então some sem deixar
 * buraco no layout e sem erro no console. O headline continua idêntico.
 */

import { prefersReducedMotion } from '../utils/motion.js';

const CONTAINER_SELECTOR = '[data-mesh-bg]';
const THEME_TOGGLE_ID = 'navbar-theme-toggle';

const REVEAL_DURATION_SECONDS = 2.5;
const ROTATION_PER_FRAME = 0.0007;

/* Geometria do plano, nos mesmos valores que PlaneGeometry(40, 40, 40, 40)
   produzia: 40x40 de tamanho, 40x40 segmentos → grade de 41x41 vértices. */
const PLANE_SIZE = 40;
const PLANE_SEGMENTS = 40;

/* Câmera: PerspectiveCamera(60, aspect, 0.1, 100) em position (0, 2, 5).
   Detalhe que decide o enquadramento: uma câmera da Three.js com `position`
   definido mas sem lookAt() NÃO olha para a origem — ela continua olhando
   para -Z. Por isso a matriz de visão aqui é translação pura, sem rotação. */
const FOV_DEGREES = 60;
const NEAR = 0.1;
const FAR = 100;
const CAMERA_Y = 2;
const CAMERA_Z = 5;

/* mesh.rotation.x/.y iniciais e mesh.position.y do código anterior. */
const MESH_ROTATION_X = -Math.PI / 2;
const MESH_ROTATION_Y = -Math.PI / 3;
const MESH_POSITION_Y = -1.5;

const COLOR_LIGHT_THEME = [0, 0, 0];
const COLOR_DARK_THEME = [1, 1, 1];

/* As quatro primeiras linhas eram injetadas pela Three.js em todo shader de
   vértice (projectionMatrix, modelViewMatrix, position, uv). Em WebGL puro
   é preciso declará-las. Daí para baixo, nada mudou. */
const vertexShader = /* glsl */ `
  uniform mat4 projectionMatrix;
  uniform mat4 modelViewMatrix;
  attribute vec3 position;
  attribute vec2 uv;

  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation;

  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vUv = uv;
    vec3 pos = position;

    float noiseFreq = 0.08;
    float noiseAmp = 0.4;
    vec2 noisePos = vec2(pos.x * noiseFreq + uTime * 0.08, pos.y * noiseFreq - uTime * 0.05);

    float elevation = snoise(noisePos) * noiseAmp;
    elevation += snoise(noisePos * 1.5) * (noiseAmp * 0.2);

    vElevation = elevation;
    pos.z += elevation;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

/* A Three.js injetava a precisão (highp) no topo de todo shader de
   fragmento. O #ifdef cai para mediump em GPUs móveis que não oferecem
   highp no estágio de fragmento, em vez de falhar a compilação. */
const fragmentShader = /* glsl */ `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  uniform vec3 uColor;
  uniform float uProgress;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    float dist = distance(vUv, vec2(0.5));
    float alpha = smoothstep(0.5, 0.0, dist);

    float reveal = smoothstep(dist, dist + 0.1, uProgress * 1.2 - 0.1);
    alpha *= reveal;

    float intensity = clamp(vElevation * 1.2 + 0.8, 0.45, 1.15);
    vec3 finalColor = mix(uColor, uColor * intensity, 0.3);

    gl_FragColor = vec4(finalColor, alpha * 0.45);
  }
`;

/**
 * Reproduz PlaneGeometry(size, size, segments, segments) da Three.js:
 * posições, uv e os índices de LINHA do modo wireframe.
 *
 * O wireframe da Three.js não desenha só a grade: ele percorre os dois
 * triângulos de cada quadrado e emite as 3 arestas de cada um, deduplicando
 * as compartilhadas. O resultado tem uma DIAGONAL por quadrado — replicar
 * isso é o que mantém a densidade visual da malha igual à de antes.
 */
const createPlane = (size, segments) => {
  const vertexCount = segments + 1;
  const half = size / 2;
  const step = size / segments;

  const positions = new Float32Array(vertexCount * vertexCount * 3);
  const uvs = new Float32Array(vertexCount * vertexCount * 2);

  for (let iy = 0; iy < vertexCount; iy += 1) {
    const y = iy * step - half;
    for (let ix = 0; ix < vertexCount; ix += 1) {
      const index = iy * vertexCount + ix;
      positions[index * 3] = ix * step - half;
      positions[index * 3 + 1] = -y; // PlaneGeometry empurra (x, -y, 0)
      positions[index * 3 + 2] = 0;
      uvs[index * 2] = ix / segments;
      uvs[index * 2 + 1] = 1 - iy / segments;
    }
  }

  /* Mesma ordem de triângulos da Three.js: (a, b, d) e (b, c, d). */
  const edges = [];
  const seen = new Set();
  const addEdge = (start, end) => {
    const key = start < end ? `${start}_${end}` : `${end}_${start}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push(start, end);
  };

  for (let iy = 0; iy < segments; iy += 1) {
    for (let ix = 0; ix < segments; ix += 1) {
      const a = ix + vertexCount * iy;
      const b = ix + vertexCount * (iy + 1);
      const c = ix + 1 + vertexCount * (iy + 1);
      const d = ix + 1 + vertexCount * iy;

      addEdge(a, b); addEdge(b, d); addEdge(d, a);
      addEdge(b, c); addEdge(c, d); addEdge(d, b);
    }
  }

  return { positions, uvs, indices: new Uint16Array(edges) };
};

/** Matriz de projeção em perspectiva simétrica, coluna-maior (como a GL espera). */
const perspectiveMatrix = (out, fovDegrees, aspect, near, far) => {
  const f = 1 / Math.tan((fovDegrees * Math.PI) / 360);
  const range = 1 / (near - far);

  out[0] = f / aspect; out[1] = 0; out[2] = 0;                     out[3] = 0;
  out[4] = 0;          out[5] = f; out[6] = 0;                     out[7] = 0;
  out[8] = 0;          out[9] = 0; out[10] = (far + near) * range; out[11] = -1;
  out[12] = 0;         out[13] = 0; out[14] = 2 * far * near * range; out[15] = 0;
  return out;
};

/**
 * modelView = view * model, resolvido à mão porque os dois fatores são
 * simples: a visão é translação pura (0, -2, -5) e o modelo é
 * translação (0, -1.5, 0) aplicada depois da rotação. O produto de duas
 * translações é a soma delas, então sobra a rotação Euler XYZ com a coluna
 * de translação já somada — sem multiplicar duas matrizes 4x4 por quadro.
 *
 * A parte rotacional segue exatamente Matrix4.makeRotationFromEuler na
 * ordem 'XYZ' (o default da Three.js), transcrita para não introduzir erro
 * de derivação.
 */
const modelViewMatrix = (out, rotationX, rotationY, rotationZ) => {
  const c1 = Math.cos(rotationX), s1 = Math.sin(rotationX);
  const c2 = Math.cos(rotationY), s2 = Math.sin(rotationY);
  const c3 = Math.cos(rotationZ), s3 = Math.sin(rotationZ);

  const ae = c1 * c3, af = c1 * s3, be = s1 * c3, bf = s1 * s3;

  out[0] = c2 * c3;
  out[1] = af + be * s2;
  out[2] = bf - ae * s2;
  out[3] = 0;

  out[4] = -c2 * s3;
  out[5] = ae - bf * s2;
  out[6] = be + af * s2;
  out[7] = 0;

  out[8] = s2;
  out[9] = -s1 * c2;
  out[10] = c1 * c2;
  out[11] = 0;

  out[12] = 0;
  out[13] = MESH_POSITION_Y - CAMERA_Y;
  out[14] = -CAMERA_Z;
  out[15] = 1;
  return out;
};

const compileShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

const createProgram = (gl) => {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
  if (!vertex || !fragment) return null;

  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  /* Os objetos de shader já podem ser liberados: o programa linkado os
     mantém vivos internamente. */
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
};

const createMesh = (container) => {
  const canvas = document.createElement('canvas');

  /* premultipliedAlpha: true reproduz o default da WebGLRenderer da
     Three.js — junto com o blendFunc(ONE, ONE_MINUS_SRC_ALPHA) mais abaixo,
     é o par que define como a malha se mistura com o fundo da página. Trocar
     um sem o outro muda o brilho das linhas. */
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
    powerPreference: 'high-performance',
  });
  if (!gl) return; // navegador sem WebGL disponível: silêncio, sem canvas.

  const program = createProgram(gl);
  if (!program) return; // shader não compilou: idem.

  container.append(canvas);

  const plane = createPlane(PLANE_SIZE, PLANE_SEGMENTS);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, plane.positions, gl.STATIC_DRAW);

  const uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, plane.uvs, gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, plane.indices, gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'position');
  const uvLocation = gl.getAttribLocation(program, 'uv');
  const uniforms = {
    projectionMatrix: gl.getUniformLocation(program, 'projectionMatrix'),
    modelViewMatrix: gl.getUniformLocation(program, 'modelViewMatrix'),
    uColor: gl.getUniformLocation(program, 'uColor'),
    uTime: gl.getUniformLocation(program, 'uTime'),
    uProgress: gl.getUniformLocation(program, 'uProgress'),
  };

  gl.useProgram(program);
  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(uvLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);

  /* material.transparent + material.depthWrite: false, traduzidos para
     estado de GL. clearColor com alpha 0 deixa a página aparecer atrás. */
  gl.enable(gl.DEPTH_TEST);
  gl.depthMask(false);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  /* Alocadas uma vez e reescritas no lugar a cada quadro — o laço de render
     não deve alocar nada. */
  const projection = new Float32Array(16);
  const modelView = new Float32Array(16);

  const root = document.documentElement;
  const themeInput = document.getElementById(THEME_TOGGLE_ID);
  const darkSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

  /* O tema deixou de ser "checkbox marcado = escuro": o toggle agora inverte
     a preferência do sistema (ver base/tokens.css). Em vez de repetir essa
     lógica aqui — e arriscar que as duas saiam de sincronia —, lemos o
     color-scheme que o próprio CSS resolveu. O XOR só entra como reserva,
     para navegadores sem suporte a color-scheme. */
  const isDarkTheme = () => {
    const scheme = getComputedStyle(root).colorScheme;
    if (scheme === 'dark') return true;
    if (scheme === 'light') return false;
    return darkSchemeQuery.matches !== Boolean(themeInput?.checked);
  };

  let width = container.clientWidth || window.innerWidth;
  let height = container.clientHeight || window.innerHeight;

  const applySize = () => {
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    gl.viewport(0, 0, canvas.width, canvas.height);
    perspectiveMatrix(projection, FOV_DEGREES, width / height, NEAR, FAR);
  };

  applySize();

  let rotationZ = 0;
  let frameId = null;
  let resizeFrameId = null;
  let isVisible = false;

  /* Equivalente mínimo de THREE.Clock: o tempo zera a cada vez que a Hero
     volta a ficar visível, então o reveal do shader se repete — mesmo
     comportamento de antes. */
  let elapsed = 0;
  let lastTick = 0;
  let clockRunning = false;

  const clockStart = () => {
    elapsed = 0;
    lastTick = performance.now();
    clockRunning = true;
  };

  const clockStop = () => {
    clockRunning = false;
  };

  const elapsedSeconds = () => {
    if (!clockRunning) return elapsed;
    const now = performance.now();
    elapsed += (now - lastTick) / 1000;
    lastTick = now;
    return elapsed;
  };

  const draw = (isStatic) => {
    modelViewMatrix(modelView, MESH_ROTATION_X, MESH_ROTATION_Y, rotationZ);

    gl.useProgram(program);
    gl.uniformMatrix4fv(uniforms.projectionMatrix, false, projection);
    gl.uniformMatrix4fv(uniforms.modelViewMatrix, false, modelView);
    gl.uniform3fv(uniforms.uColor, isDarkTheme() ? COLOR_DARK_THEME : COLOR_LIGHT_THEME);

    const seconds = elapsedSeconds();
    gl.uniform1f(uniforms.uTime, isStatic ? 0 : seconds);
    gl.uniform1f(
      uniforms.uProgress,
      isStatic ? 1 : Math.min(seconds / REVEAL_DURATION_SECONDS, 1),
    );

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.LINES, plane.indices.length, gl.UNSIGNED_SHORT, 0);
  };

  const renderFrame = () => {
    frameId = null;
    if (!isVisible) return;

    const isStatic = prefersReducedMotion();
    if (!isStatic) rotationZ -= ROTATION_PER_FRAME;

    draw(isStatic);

    /* Sob movimento reduzido, o quadro acima é o único desenhado: nenhum
       novo rAF é agendado, e o custo de GPU cai a zero depois dele. */
    if (!isStatic) frameId = requestAnimationFrame(renderFrame);
  };

  /* Um único laço por vez. Sem esta guarda, uma segunda chamada (troca de
     visibilidade em sequência rápida) agendaria um rAF paralelo e a malha
     passaria a girar no dobro da velocidade, consumindo o dobro de GPU. */
  const start = () => {
    if (frameId !== null) return;
    frameId = requestAnimationFrame(renderFrame);
  };

  const stop = () => {
    if (frameId === null) return;
    cancelAnimationFrame(frameId);
    frameId = null;
  };

  /* O evento resize dispara dezenas de vezes por segundo ao arrastar a
     borda da janela, e realocar o buffer de desenho a cada chamada é caro.
     Agrupar em um rAF reduz isso a, no máximo, uma realocação por quadro
     exibido. */
  const handleResize = () => {
    if (resizeFrameId !== null) return;
    resizeFrameId = requestAnimationFrame(() => {
      resizeFrameId = null;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      applySize();
      if (!isVisible || frameId === null) draw(prefersReducedMotion());
    });
  };

  /* Repinta uma vez quando o tema muda com o laço parado (movimento
     reduzido, ou Hero fora da viewport) — senão a malha ficaria na cor
     antiga até a próxima vez que algo a redesenhasse. */
  const handleThemeChange = () => {
    if (frameId === null) draw(prefersReducedMotion());
  };

  const visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) {
        clockStart();
        start();
      } else {
        clockStop();
        stop();
      }
    },
    { threshold: 0 },
  );

  visibilityObserver.observe(container);
  window.addEventListener('resize', handleResize, { passive: true });
  themeInput?.addEventListener('change', handleThemeChange);
  darkSchemeQuery.addEventListener?.('change', handleThemeChange);

  /* A aba oculta já não recebe rAF, mas o observer continua achando o
     elemento "visível" — parar explicitamente evita um quadro perdido na
     volta e deixa o estado coerente. */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (isVisible) start();
  });

  /* O navegador pode descartar o contexto WebGL (troca de GPU, pressão de
     memória). Sem este listener, o laço continuaria chamando draw() em um
     contexto morto, enchendo o console de erros a 60 vezes por segundo. */
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    stop();
  });
};

/* Distância antes da viewport em que a malha começa a ser construída. 200px
   dá tempo de compilar os shaders enquanto o usuário ainda rola, então ela
   já está pronta quando entra em cena. */
const WARMUP_MARGIN = '200px';

export function initMeshBackground() {
  const containers = document.querySelectorAll(CONTAINER_SELECTOR);
  if (!containers.length) return;

  /* Sem IntersectionObserver, constrói tudo de uma vez (comportamento
     anterior) — o site continua funcionando, só sem o adiamento. */
  if (!('IntersectionObserver' in window)) {
    containers.forEach(createMesh);
    return;
  }

  /* Construção adiada, e não apenas o desenho.
     createMesh() é caro mesmo sem desenhar um quadro: cria o contexto WebGL,
     compila e linka os shaders e sobe os buffers da malha. Fazer isso para
     TODOS os contêineres na carga custava caro no thread principal — com a
     segunda malha (Contato/rodapé), o Total Blocking Time medido saltou de
     60 ms para 1.540 ms, mesmo ela estando fora da tela o tempo todo.

     Agora cada malha só é construída quando chega perto da viewport. A da
     Hero, que já nasce visível, é construída na hora — nada mudou para ela.
     A do rodapé sai por completo do carregamento inicial. */
  const warmup = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        /* Uma vez só: depois de construída, quem controla o desenho é o
           observer de visibilidade criado dentro de createMesh(). */
        observer.unobserve(entry.target);
        createMesh(entry.target);
      });
    },
    { rootMargin: WARMUP_MARGIN },
  );

  containers.forEach((container) => warmup.observe(container));
}
