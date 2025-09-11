export function collatz_tree_branch(angle, sequence) {
    const points = [{x: 0, y: 0}];
    let current_x = 0;
    let current_y = 0;
    const step_length = 10;
    let current_angle = Math.PI / 2;

    for (let i = sequence.length - 1; i > -1; i--) {
        const n = sequence[i];
        
        if (n % 2 === 0) {
            current_angle += angle;
        } else {
            current_angle -= angle;
        }
        
        current_x += Math.cos(current_angle) * step_length;
        current_y += Math.sin(current_angle) * step_length;

        points.push({ x: current_x, y: current_y });
    }
    
    return points;
}