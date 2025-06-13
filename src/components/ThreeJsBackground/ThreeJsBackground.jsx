import { useEffect, useRef } from "react";
import * as THREE from "three";

const ThreeJsEffect = ({ colorPalette = "BLUE" }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Define color palettes
    const PALETTES = {
      BLUE: {
        bg1: new THREE.Color(0.05, 0.1, 0.2),
        bg2: new THREE.Color(0.1, 0.3, 0.5),
        bg3: new THREE.Color(0.2, 0.5, 0.7),
        bg4: new THREE.Color(0.02, 0.05, 0.1),
        rayWhite: new THREE.Color(1.0, 1.0, 1.0),
        rayLight: new THREE.Color(0.6, 0.9, 1.0),
        rayDeep1: new THREE.Color(0.2, 0.6, 1.0),
        rayDeep2: new THREE.Color(0.1, 0.4, 0.8),
        outerGlow: new THREE.Color(0.4, 0.8, 1.0),
        sparkWhite: new THREE.Color(1.0, 1.0, 1.0),
        sparkColor: new THREE.Color(0.6, 0.9, 1.0),
      },
      RED: {
        bg1: new THREE.Color(0.2, 0.05, 0.05),
        bg2: new THREE.Color(0.5, 0.1, 0.1),
        bg3: new THREE.Color(0.7, 0.2, 0.2),
        bg4: new THREE.Color(0.1, 0.02, 0.02),
        rayWhite: new THREE.Color(1.0, 1.0, 1.0),
        rayLight: new THREE.Color(1.0, 0.6, 0.6),
        rayDeep1: new THREE.Color(1.0, 0.2, 0.2),
        rayDeep2: new THREE.Color(0.8, 0.1, 0.1),
        outerGlow: new THREE.Color(1.0, 0.4, 0.4),
        sparkWhite: new THREE.Color(1.0, 1.0, 1.0),
        sparkColor: new THREE.Color(1.0, 0.6, 0.6),
      },
      PURPLE: {
        bg1: new THREE.Color(0.15, 0.05, 0.2),
        bg2: new THREE.Color(0.3, 0.1, 0.5),
        bg3: new THREE.Color(0.5, 0.2, 0.7),
        bg4: new THREE.Color(0.05, 0.02, 0.1),
        rayWhite: new THREE.Color(1.0, 1.0, 1.0),
        rayLight: new THREE.Color(0.9, 0.6, 1.0),
        rayDeep1: new THREE.Color(0.6, 0.2, 1.0),
        rayDeep2: new THREE.Color(0.4, 0.1, 0.8),
        outerGlow: new THREE.Color(0.8, 0.4, 1.0),
        sparkWhite: new THREE.Color(1.0, 1.0, 1.0),
        sparkColor: new THREE.Color(0.9, 0.6, 1.0),
      },
    };

    const palette = PALETTES[colorPalette];
    let scene,
      camera,
      renderer,
      rays = [],
      backgroundMesh,
      innerGlow,
      outerGlow,
      sparks = [];

    function init() {
      scene = new THREE.Scene();
      sceneRef.current = scene;

      camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.setClearColor(0x000000);
      rendererRef.current = renderer;
      mountRef.current.appendChild(renderer.domElement);

      createBackground();
      createGlowLayers();
      createSunburst();
      camera.position.z = 8;
      animate();
    }

    function createBackground() {
      const geometry = new THREE.PlaneGeometry(50, 30);

      const backgroundVertexShader = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;

      const backgroundFragmentShader = `
        varying vec2 vUv;
        uniform float uTime;
        
        void main() {
          vec2 center = vec2(0.5, 0.5);
          float dist = distance(vUv, center);
          
          float gradient = smoothstep(0.0, 1.0, dist);
          
          vec3 color1 = vec3(${palette.bg1.r}, ${palette.bg1.g}, ${palette.bg1.b});
          vec3 color2 = vec3(${palette.bg2.r}, ${palette.bg2.g}, ${palette.bg2.b});
          vec3 color3 = vec3(${palette.bg3.r}, ${palette.bg3.g}, ${palette.bg3.b});
          vec3 color4 = vec3(${palette.bg4.r}, ${palette.bg4.g}, ${palette.bg4.b});
          
          vec3 finalColor = mix(color1, color2, smoothstep(0.0, 0.3, dist));
          finalColor = mix(finalColor, color3, smoothstep(0.3, 0.6, dist));
          finalColor = mix(finalColor, color4, smoothstep(0.6, 1.0, dist));
          
          float wave = sin(dist * 10.0 - uTime * 2.0) * 0.05;
          finalColor += wave;
          
          float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
          float shimmer = sin(angle * 8.0 + uTime * 3.0 + dist * 5.0) * 0.1 + 0.9;
          finalColor *= shimmer;
          
          float vignette = 1.0 - smoothstep(0.4, 1.0, dist) * 0.5;
          finalColor *= vignette;
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `;

      const material = new THREE.ShaderMaterial({
        vertexShader: backgroundVertexShader,
        fragmentShader: backgroundFragmentShader,
        uniforms: {
          uTime: { value: 0 },
        },
      });

      backgroundMesh = new THREE.Mesh(geometry, material);
      backgroundMesh.position.z = -1;
      scene.add(backgroundMesh);
    }

    function createGlowLayers() {
      // Inner glow - bright white core
      const innerGeometry = new THREE.PlaneGeometry(4, 4);
      const innerMaterial = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float uTime;
          
          void main() {
            vec2 center = vec2(0.5, 0.5);
            float dist = distance(vUv, center);
            
            float glow = 1.0 - smoothstep(0.0, 0.5, dist);
            glow = pow(glow, 3.0);
            
            vec3 color = vec3(1.0, 1.0, 1.0);
            float pulse = sin(uTime * 3.0) * 0.1 + 0.9;
            
            gl_FragColor = vec4(color, glow * pulse);
          }
        `,
        uniforms: {
          uTime: { value: 0 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
      });

      innerGlow = new THREE.Mesh(innerGeometry, innerMaterial);
      innerGlow.position.z = -0.5;
      scene.add(innerGlow);

      // Outer glow - colored halo
      const outerGeometry = new THREE.PlaneGeometry(12, 12);
      const outerMaterial = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float uTime;
          
          void main() {
            vec2 center = vec2(0.5, 0.5);
            float dist = distance(vUv, center);
            
            float glow = 1.0 - smoothstep(0.1, 0.8, dist);
            glow = pow(glow, 2.0);
            
            vec3 color = vec3(${palette.outerGlow.r}, ${palette.outerGlow.g}, ${palette.outerGlow.b});
            float pulse = sin(uTime * 2.0 + dist * 3.0) * 0.2 + 0.8;
            
            gl_FragColor = vec4(color, glow * pulse * 0.6);
          }
        `,
        uniforms: {
          uTime: { value: 0 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
      });

      outerGlow = new THREE.Mesh(outerGeometry, outerMaterial);
      outerGlow.position.z = -0.7;
      scene.add(outerGlow);
    }

    function createVertexShader() {
      return `
        varying vec3 vPosition;
        varying vec2 vUv;
        uniform float uTime;
        
        void main() {
          vPosition = position;
          vUv = uv;
          
          vec3 pos = position;
          float wave = sin(uTime + length(position) * 2.0) * 0.01;
          pos.z += wave;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `;
    }

    function createFragmentShader() {
      return `
        varying vec3 vPosition;
        uniform float uTime;
        uniform float uOpacity;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        
        void main() {
          float dist = length(vPosition);
          float normalizedDist = clamp(dist / 8.0, 0.0, 1.0);
          
          vec3 color = mix(uColor1, uColor2, smoothstep(0.0, 0.5, normalizedDist));
          color = mix(color, uColor3, smoothstep(0.5, 1.0, normalizedDist));
          
          float shimmer1 = sin(uTime * 3.0 + dist * 2.0) * 0.2 + 0.8;
          float shimmer2 = sin(uTime * 5.0 - dist * 3.0) * 0.1;
          float shimmer = shimmer1 + shimmer2;
          color *= shimmer;
          
          float baseGlow = exp(-dist * 0.5) * 0.3;
          color += vec3(1.0, 1.0, 1.0) * baseGlow;
          
          float alpha = pow(1.0 - normalizedDist, 1.5) * uOpacity;
          
          gl_FragColor = vec4(color, alpha);
        }
      `;
    }

    function createSpark() {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.08 + Math.random() * 0.2;

      const geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array(6);
      geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

      const sparkColor = Math.random() > 0.5 ? palette.sparkWhite : palette.sparkColor;

      const material = new THREE.LineBasicMaterial({
        color: sparkColor,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        linewidth: 4,
      });

      const spark = new THREE.Line(geometry, material);

      const sparkData = {
        mesh: spark,
        angle: angle,
        speed: speed,
        distance: 0,
        maxDistance: 10 + Math.random() * 6,
        opacity: 1.0,
        fadeSpeed: 0.015 + Math.random() * 0.015,
        size: 0.6 + Math.random() * 0.8,
        glow: new THREE.PointLight(sparkColor, 2, 3),
      };

      sparkData.glow.position.set(0, 0, 0);
      scene.add(sparkData.glow);

      scene.add(spark);
      sparks.push(sparkData);
    }

    function updateSparks() {
      if (Math.random() < 0.15 && sparks.length < 40) {
        createSpark();
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];

        spark.distance += spark.speed;
        spark.opacity -= spark.fadeSpeed;

        const x = Math.cos(spark.angle) * spark.distance;
        const y = Math.sin(spark.angle) * spark.distance;

        const vertices = spark.mesh.geometry.attributes.position.array;
        vertices[0] = Math.cos(spark.angle) * (spark.distance - spark.size);
        vertices[1] = Math.sin(spark.angle) * (spark.distance - spark.size);
        vertices[2] = 0;
        vertices[3] = x;
        vertices[4] = y;
        vertices[5] = 0.1;

        spark.mesh.geometry.attributes.position.needsUpdate = true;
        spark.mesh.material.opacity = spark.opacity;

        spark.glow.position.set(x, y, 0.1);
        spark.glow.intensity = spark.opacity * 2;

        if (spark.opacity <= 0 || spark.distance > spark.maxDistance) {
          scene.remove(spark.mesh);
          scene.remove(spark.glow);
          sparks.splice(i, 1);
        }
      }
    }

    function createSunburst() {
      const rayCount = 96;

      for (let i = 0; i < rayCount; i++) {
        const baseAngle = (i / rayCount) * Math.PI * 2;
        const angleOffset = (Math.random() - 0.5) * 0.4;
        const angle1 = baseAngle + angleOffset;
        const angle2 = baseAngle + angleOffset + 0.12 + Math.random() * 0.08;

        const rayData = {
          angle1: angle1,
          angle2: angle2,
          currentLength: Math.random() * 2,
          maxLength: 6.4 + Math.random() * 3.6,
          growthSpeed: 0.015 + Math.random() * 0.025,
          brightness: 0.6 + Math.random() * 0.4,
          phase: Math.random() * Math.PI * 2,
          colorVariant: Math.random(),
          pulseSpeed: 1.5 + Math.random() * 1.5,
          mesh: null,
        };

        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(9);
        geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

        const whiteColor = palette.rayWhite;
        const lightColor = palette.rayLight;
        const deepColor = rayData.colorVariant > 0.5 ? palette.rayDeep1 : palette.rayDeep2;

        const material = new THREE.ShaderMaterial({
          vertexShader: createVertexShader(),
          fragmentShader: createFragmentShader(),
          uniforms: {
            uTime: { value: 0 },
            uOpacity: { value: rayData.brightness },
            uColor1: { value: whiteColor },
            uColor2: { value: lightColor },
            uColor3: { value: deepColor },
          },
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        rayData.mesh = new THREE.Mesh(geometry, material);
        scene.add(rayData.mesh);
        rays.push(rayData);
      }
    }

    function updateRays() {
      const time = Date.now() * 0.001;

      rays.forEach((ray, index) => {
        ray.mesh.material.uniforms.uTime.value = time;

        const primaryPulse = Math.sin(time * ray.pulseSpeed + ray.phase) * 0.25;
        const secondaryPulse = Math.sin(time * 0.7 + index * 0.05) * 0.15;
        const pulseOffset = primaryPulse + secondaryPulse;

        ray.currentLength += ray.growthSpeed;

        if (ray.currentLength > ray.maxLength) {
          ray.currentLength = 0;
          ray.phase = Math.random() * Math.PI * 2;
          ray.pulseSpeed = 1.5 + Math.random() * 1.5;
        }

        const effectiveLength = ray.currentLength + pulseOffset;
        const clampedLength = Math.max(0, Math.min(effectiveLength, ray.maxLength));

        const vertices = ray.mesh.geometry.attributes.position.array;
        vertices[0] = 0;
        vertices[1] = 0;
        vertices[2] = 0;
        vertices[3] = Math.cos(ray.angle1) * clampedLength;
        vertices[4] = Math.sin(ray.angle1) * clampedLength;
        vertices[5] = 0;
        vertices[6] = Math.cos(ray.angle2) * clampedLength;
        vertices[7] = Math.sin(ray.angle2) * clampedLength;
        vertices[8] = 0;

        ray.mesh.geometry.attributes.position.needsUpdate = true;

        const lengthFactor = clampedLength / ray.maxLength;
        const pulseFactor = 0.7 + 0.3 * Math.sin(time * 2 + ray.phase);
        const globalPulse = 0.9 + 0.1 * Math.sin(time * 0.5);
        const opacity = lengthFactor * ray.brightness * pulseFactor * globalPulse;
        ray.mesh.material.uniforms.uOpacity.value = opacity;
      });
    }

    function animate() {
      animationIdRef.current = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;

      if (backgroundMesh && backgroundMesh.material.uniforms.uTime) {
        backgroundMesh.material.uniforms.uTime.value = time;
      }

      if (innerGlow && innerGlow.material.uniforms.uTime) {
        innerGlow.material.uniforms.uTime.value = time;
      }

      if (outerGlow && outerGlow.material.uniforms.uTime) {
        outerGlow.material.uniforms.uTime.value = time;
      }

      scene.rotation.z += 0.002 + Math.sin(time * 0.3) * 0.0005;

      updateRays();
      updateSparks();
      renderer.render(scene, camera);
    }

    function onWindowResize() {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    }

    window.addEventListener("resize", onWindowResize);
    init();

    // Cleanup
    return () => {
      window.removeEventListener("resize", onWindowResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [colorPalette]);

  return (
    <div
      ref={mountRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "#000",
        overflow: "hidden",
      }}
    />
  );
};

export default ThreeJsEffect;
