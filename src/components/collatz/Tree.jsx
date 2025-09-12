import React, { useEffect, useRef, useState } from 'react';
import { collatz_tree_branch } from './tree.js';
import collatz_data from './collatz.txt?raw';
import * as d3 from 'd3';

export default function Tree() {
    const collatz_sequence = d3.csvParse(collatz_data).map(row => ({
        n: row['n'],
        seq: row['seq'].split(', ').map(Number)
    }));

    const [angle, setAngle] = useState(45);
    const [range, setRange] = useState([1, 100]);
    const [branches, setBranches] = useState([]);

    const canvasRef = useRef(null);
    const offscreenCanvasRef = useRef(null);
    const transformRef = useRef(d3.zoomIdentity);
    const zoomRef = useRef(null);
    const bboxRef = useRef({ minX: 0, maxX: 0, minY: 0, maxY: 0, offW: 1, offH: 1 });

    useEffect(() => {
        offscreenCanvasRef.current = document.createElement('canvas');
    }, []);

    useEffect(() => {
        const angle_rad = angle * Math.PI / 180;
        const newBranches = collatz_sequence.slice(range[0], range[1])
            .map(branch => collatz_tree_branch(angle_rad, branch.seq));
        setBranches(newBranches);
    }, [angle, range]);

    const ensureVisibleCanvasSize = () => {
        const canvas = canvasRef.current;
        if (!canvas) return { displayWidth: 0, displayHeight: 0, dpr: 1 };
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = Math.max(1, Math.floor(canvas.clientWidth));
        const displayHeight = Math.max(1, Math.floor(canvas.clientHeight));
        const needResize = canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr;
        if (needResize) {
            canvas.width = displayWidth * dpr;
            canvas.height = displayHeight * dpr;
        }
        return { displayWidth, displayHeight, dpr };
    };

    const drawToOffscreen = () => {
        const offscreen = offscreenCanvasRef.current;
        if (!offscreen || !branches.length) return;

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        branches.forEach(branch => {
            branch.forEach(p => {
                minX = Math.min(minX, p.x);
                maxX = Math.max(maxX, p.x);
                minY = Math.min(minY, -p.y);
                maxY = Math.max(maxY, -p.y);
            });
        });

        if (!isFinite(minX)) return;

        const offW = Math.max(1, maxX - minX);
        const offH = Math.max(1, maxY - minY);
        const dpr = window.devicePixelRatio || 1;

        offscreen.width = Math.ceil(offW * dpr);
        offscreen.height = Math.ceil(offH * dpr);

        const ctx = offscreen.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, offscreen.width, offscreen.height);

        ctx.setTransform(dpr, 0, 0, dpr, -minX * dpr, -minY * dpr);

        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgb(100, 200, 100)';

        for (const pts of branches) {
            if (!pts.length) continue;
            ctx.beginPath();
            ctx.moveTo(pts[0].x, -pts[0].y);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, -pts[i].y);
            ctx.stroke();
        }

        bboxRef.current = { minX, maxX, minY, maxY, offW, offH };
    };

    const drawVisible = () => {
        const canvas = canvasRef.current;
        const offscreen = offscreenCanvasRef.current;
        if (!canvas || !offscreen) return;

        const ctx = canvas.getContext('2d');
        const { displayWidth, displayHeight, dpr } = ensureVisibleCanvasSize();
        if (!displayWidth || !displayHeight) return;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        ctx.translate(transformRef.current.x, transformRef.current.y);
        ctx.scale(transformRef.current.k, transformRef.current.k);

        const offscreenCSSW = offscreen.width / dpr;
        const offscreenCSSH = offscreen.height / dpr;

        ctx.drawImage(offscreen, 0, 0, offscreenCSSW, offscreenCSSH);

        ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    const centerBranches = () => {
        const canvas = canvasRef.current;
        const off = offscreenCanvasRef.current;
        if (!canvas || !off || !branches.length) return;

        const cssW = Math.max(1, Math.floor(canvas.clientWidth));
        const cssH = Math.max(1, Math.floor(canvas.clientHeight));
        const { offW, offH } = bboxRef.current;
        if (!offW || !offH) return;

        const scale = Math.min(cssW / offW, cssH / offH) * 0.9;
        const tx = (cssW - offW * scale) / 2;
        const ty = (cssH - offH * scale) / 2;

        const newTransform = d3.zoomIdentity.translate(tx, ty).scale(scale);

        const canvasSel = d3.select(canvas);
        if (zoomRef.current) {
            canvasSel.transition().call(zoomRef.current.transform, newTransform);
        } else {
            transformRef.current = newTransform;
            drawVisible();
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const zoom = d3.zoom()
            .scaleExtent([0.1, 20])
            .on('zoom', (event) => {
                transformRef.current = event.transform;
                drawVisible();
            });

        zoomRef.current = zoom;
        d3.select(canvas).call(zoom);

        const onResize = () => {
            ensureVisibleCanvasSize();
            drawVisible();
        };
        window.addEventListener('resize', onResize);

        return () => {
            d3.select(canvas).on('.zoom', null);
            window.removeEventListener('resize', onResize);
        };
    }, []);

    useEffect(() => {
        if (!branches.length) return;
        drawToOffscreen();
        centerBranches();
        drawVisible();
    }, [branches]);

    return (
        <>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <label style={{ marginTop: 0 }}>
                    Угол:
                    <input
                        type="number"
                        inputMode="numeric"
                        value={angle}
                        onChange={e => setAngle(parseFloat(e.target.value))}
                        step={1}
                        min={0}
                        max={90}
                    />
                </label>
                <label style={{ marginTop: 0 }}>
                    От:
                    <input
                        type="number"
                        inputMode="numeric"
                        value={range[0]}
                        onChange={e => setRange([parseInt(e.target.value), range[1]])}
                        min={1}
                        max={collatz_sequence.length - 1}
                        step={1}
                    />
                </label>
                <label style={{ marginTop: 0 }}>
                    До:
                    <input
                        type="number"
                        inputMode="numeric"
                        value={range[1]}
                        onChange={e => setRange([range[0], parseInt(e.target.value)])}
                        min={1}
                        max={collatz_sequence.length - 1}
                        step={1}
                    />
                </label>
            </div>

            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                style={{
                    marginTop: '1rem',
                    width: '100%',
                    height: '50vh',
                    display: 'block',
                    touchAction: 'none'
                }}
            />
        </>
    );
}
