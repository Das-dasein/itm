import React, { useEffect, useState } from 'react';
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
    const svgRef = React.useRef();

    const update = () => {
        const g = d3.select("#collatz-container");
        g.selectAll("*").remove();

        for (const branch of collatz_sequence.slice(range[0], range[1])) {
            const angle_rad = angle * Math.PI / 180;
            const points = collatz_tree_branch(angle_rad, branch.seq);
            const line = d3.line()
                .x(d => d.x)
                .y(d => -d.y)
                .curve(d3.curveBasis);

            g.append('path')
                .attr('d', line(points))
                .attr('stroke', 'rgb(100, 200, 100')
                .attr('fill', 'none')
                .attr('stroke-opacity', 0.3);
        }
    };

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        const g = d3.select("#collatz-container");

        svg.call(
            d3.zoom()
                .scaleExtent([0.1, 10])
                .on("zoom", (event) => {
                    g.attr("transform", event.transform);
                })
        );
        update();
    }, []);

    return (
        <>
            <label>
                Угол:
                <input type="number" value={angle} onInput={(e) => setAngle(parseFloat(e.target.value))} step={1} min={0} max={90} />
            </label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label style={{ marginTop: 0 }}>
                    От:
                    <input
                        type="number"
                        value={range[0]}
                        onInput={(e) => setRange([parseInt(e.target.value), range[1]])}
                        min={1} max={collatz_sequence.length - 1}
                        step={1}
                    />
                </label>
                <label style={{ marginTop: 0 }}>
                    До:
                    <input
                        type="number"
                        value={range[1]}
                        onInput={(e) => setRange([range[0], parseInt(e.target.value)])}
                        min={1} max={collatz_sequence.length - 1}
                        step={1}
                    />
                </label>
                <button style={{ marginTop: 0 }} onClick={() => update()}>Обновить</button>
            </div>

            <svg ref={svgRef} width="100%" height="600" viewBox="-300 -50 600 600" style={{ border: '1px solid black', marginTop: '1rem' }}>
                <g id="collatz-container" />
            </svg>
        </>
    )
}
