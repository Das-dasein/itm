import { useEffect, useRef, useState } from 'react';
import { collatz_tree_branch } from './tree.js';
import collatz_data from '../collatz.txt?raw';
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
    const transformRef = useRef(d3.zoomIdentity);
    const zoomRef = useRef(null);
    const bboxRef = useRef({ minX: 0, maxX: 0, minY: 0, maxY: 0, w: 1, h: 1 });

    useEffect(() => {
        const angle_rad = angle * Math.PI / 180;
        const newBranches = collatz_sequence.slice(range[0], range[1])
            .map(branch => collatz_tree_branch(angle_rad, branch.seq));
        setBranches(newBranches);
    }, [angle, range]);

    const computeBBox = () => {
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
        bboxRef.current = { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
    };

    const drawVisible = () => {
        const canvas = canvasRef.current;
        if (!canvas || !branches.length) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = Math.max(1, Math.floor(canvas.clientWidth));
        const displayHeight = Math.max(1, Math.floor(canvas.clientHeight));

        if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
            canvas.width = displayWidth * dpr;
            canvas.height = displayHeight * dpr;
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.scale(dpr, dpr);

        ctx.translate(transformRef.current.x, transformRef.current.y);
        ctx.scale(transformRef.current.k, transformRef.current.k);

        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1 / transformRef.current.k;
        ctx.strokeStyle = 'rgb(100, 200, 100)';

        for (const pts of branches) {
            if (!pts.length) continue;
            ctx.beginPath();
            ctx.moveTo(pts[0].x, -pts[0].y);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, -pts[i].y);
            ctx.stroke();
        }

        ctx.restore();
    };

    const centerBranches = () => {
        const canvas = canvasRef.current;
        if (!canvas || !branches.length) return;

        const { w, h, minX, minY } = bboxRef.current;
        const cssW = Math.max(1, Math.floor(canvas.clientWidth));
        const cssH = Math.max(1, Math.floor(canvas.clientHeight));

        const scale = Math.min(cssW / w, cssH / h) * 0.9;
        const tx = (cssW - w * scale) / 2 - minX * scale;
        const ty = (cssH - h * scale) / 2 - minY * scale;

        const newTransform = d3.zoomIdentity.translate(tx, ty).scale(scale);

        if (zoomRef.current) {
            d3.select(canvas).call(zoomRef.current.transform, newTransform);
        } else {
            transformRef.current = newTransform;
            drawVisible();
        }
    };

    useEffect(() => {
        if (!branches.length) return;
        computeBBox();
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
