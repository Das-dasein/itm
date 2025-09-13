import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import fragmentShader from './fractal.glsl?raw';

export default function Fractal() {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const geometry = new THREE.PlaneGeometry(2, 2);

        const uniforms = {
            u_time: { value: 0.0 },
            u_resolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
            u_center: { value: new THREE.Vector2(0.0, 0.0) },
            u_scale: { value: 2.5 },
            u_c: { value: new THREE.Vector2(0.0, 0.0) },
            u_iterations: { value: 256 },
            u_int_eps: { value: 8e-3 },
            escape_radius: { value: 1e3 },
        };

        const material = new THREE.ShaderMaterial({
            fragmentShader,
            vertexShader: `void main(){ gl_Position = vec4(position,1.0); }`,
            uniforms,
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        let isPointerDown = false;
        let lastPointer = new THREE.Vector2();
        let draggingId = null;

        function screenDeltaToComplex(dx, dy) {
            const aspect = renderer.domElement.width / renderer.domElement.height;
            const ndx = dx / renderer.domElement.width * 2.0;
            const ndy = -dy / renderer.domElement.height * 2.0;
            return new THREE.Vector2(ndx * (uniforms.u_scale.value * 0.5) * aspect,
                ndy * (uniforms.u_scale.value * 0.5));
        }

        renderer.domElement.addEventListener('pointerdown', (e) => {
            renderer.domElement.setPointerCapture(e.pointerId);
            isPointerDown = true;
            draggingId = e.pointerId;
            lastPointer.set(e.clientX, e.clientY);
        });

        renderer.domElement.addEventListener('pointermove', (e) => {
            if (!isPointerDown || e.pointerId !== draggingId) return;
            const cur = new THREE.Vector2(e.clientX, e.clientY);
            const delta = new THREE.Vector2().subVectors(cur, lastPointer);
            lastPointer.copy(cur);

            const cDelta = screenDeltaToComplex(delta.x, delta.y);
            uniforms.u_center.value.x -= cDelta.x;
            uniforms.u_center.value.y -= cDelta.y;
        });

        renderer.domElement.addEventListener('pointerup', (e) => {
            renderer.domElement.releasePointerCapture(e.pointerId);
            if (e.pointerId === draggingId) {
                isPointerDown = false;
                draggingId = null;
            }
        });

        renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = Math.exp(e.deltaY * 0.0012);
            const rect = renderer.domElement.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const aspect = renderer.domElement.width / renderer.domElement.height;
            const mouseCentered = new THREE.Vector2((x - 0.5) * aspect * uniforms.u_scale.value,
                (y - 0.5) * uniforms.u_scale.value * -1.0);
            const oldScale = uniforms.u_scale.value;
            const newScale = oldScale * zoomFactor;
            uniforms.u_scale.value = THREE.MathUtils.clamp(newScale, 5e-4, 1e6);

            const worldUnderMouseBefore = new THREE.Vector2().copy(uniforms.u_center.value).add(mouseCentered);
            const mouseCenteredAfter = new THREE.Vector2((x - 0.5) * aspect * uniforms.u_scale.value,
                (y - 0.5) * uniforms.u_scale.value * -1.0);
            const worldUnderMouseAfter = new THREE.Vector2().copy(uniforms.u_center.value).add(mouseCenteredAfter);
            const deltaWorld = worldUnderMouseBefore.sub(worldUnderMouseAfter);
            uniforms.u_center.value.add(deltaWorld);
        }, { passive: false });

        let lastTouchDist = 0;
        renderer.domElement.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                const a = e.touches[0], b = e.touches[1];
                lastTouchDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            }
        }, { passive: true });

        renderer.domElement.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                const a = e.touches[0], b = e.touches[1];
                const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
                const factor = lastTouchDist > 0 ? dist / lastTouchDist : 1.0;
                const zoomFactor = 1.0 / factor; 
                const newScale = uniforms.u_scale.value * zoomFactor;
                uniforms.u_scale.value = THREE.MathUtils.clamp(newScale, 5e-4, 1e6);
                lastTouchDist = dist;
                e.preventDefault();
            }
        }, { passive: false });

        function onResize() {
            const w = container.clientWidth;
            const h = container.clientHeight;
            renderer.setSize(w, h);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            uniforms.u_resolution.value.set(renderer.domElement.width, renderer.domElement.height);
        }
        window.addEventListener('resize', onResize);

        function animate() {
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);

        onResize();
    }, [containerRef]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '50vh', position: 'relative' }}>
        </div>
    )
}