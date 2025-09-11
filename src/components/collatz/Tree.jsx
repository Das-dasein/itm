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
    const canvasRef = useRef();
    const transformRef = useRef(d3.zoomIdentity);

    useEffect(() => {
        const angle_rad = angle * Math.PI / 180;
        const newBranches = collatz_sequence.slice(range[0], range[1])
            .map(branch => collatz_tree_branch(angle_rad, branch.seq));
        setBranches(newBranches);
    }, [angle, range]);

    const centerBranches = () => {
        if (!canvasRef.current || !branches.length) return;

        const canvas = canvasRef.current;
        const width = canvas.width;
        const height = canvas.height;

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        branches.forEach(branch => {
            branch.forEach(p => {
                minX = Math.min(minX, p.x);
                maxX = Math.max(maxX, p.x);
                minY = Math.min(minY, -p.y);
                maxY = Math.max(maxY, -p.y);
            });
        });

        const scaleX = width / (maxX - minX);
        const scaleY = height / (maxY - minY);
        const scale = Math.min(scaleX, scaleY) * 0.9;

        const tx = (width - (minX + maxX) * scale) / 2;
        const ty = (height - (minY + maxY) * scale) / 2;

        const newTransform = d3.zoomIdentity.translate(tx, ty).scale(scale);

        const canvasSel = d3.select(canvas);
        canvasSel.call(d3.zoom().transform, newTransform);

        transformRef.current = newTransform;
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);

        ctx.save();
        ctx.translate(transformRef.current.x, transformRef.current.y);
        ctx.scale(transformRef.current.k, transformRef.current.k);

        for (const points of branches) {
            if (!points.length) continue;
            ctx.beginPath();
            ctx.moveTo(points[0].x, -points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, -points[i].y);
            }
            ctx.strokeStyle = 'hsl(224, 100%, 85%)';
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.restore();
    };

    useEffect(() => {
        centerBranches();
        draw();
    }, [branches]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const zoom = d3.zoom()
            .scaleExtent([0.5, 8])
            .on('zoom', (event) => {
                transformRef.current = event.transform;
                draw();
            });

        d3.select(canvas).call(zoom);

        return () => d3.select(canvas).on('.zoom', null);
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
