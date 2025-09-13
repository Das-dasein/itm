precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_scale;
uniform vec2 u_c;  
uniform int u_iterations;
uniform float u_int_eps; 
uniform float escape_radius;

// --- Complex arithmetic helpers ---

vec2 c_add(vec2 a, vec2 b) { return a + b; }
vec2 c_sub(vec2 a, vec2 b) { return a - b; }
vec2 c_mul(vec2 a, vec2 b) { return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x); }
vec2 c_div(vec2 a, vec2 b) {
    float den = b.x*b.x + b.y*b.y + 1e-12;
    return vec2((a.x*b.x + a.y*b.y)/den, (a.y*b.x - a.x*b.y)/den);
}
float c_abs(vec2 a) { return length(a); }
vec2 c_scale(vec2 a, float s) { return a * s; }

vec2 c_cos(vec2 z) {
    float x = z.x;
    float y = z.y;
    return vec2(cos(x) * cosh(y), -sin(x) * sinh(y));
}

// --- Complex Collatz function ---
// f(z) = (7z + 2 - cos(π z) * (5z + 2)) / 4
vec2 f_map(vec2 z) {
    const float PI = 3.141592653589793;
    vec2 sevenZ = c_scale(z, 7.0);
    vec2 fiveZ  = c_scale(z, 5.0);
    vec2 two = vec2(2.0, 0.0);
    vec2 A = c_add(sevenZ, two);
    vec2 B = c_add(fiveZ, two);
    vec2 cosTerm = c_cos(c_scale(z, PI));
    vec2 mult = c_mul(cosTerm, B);
    vec2 numer = c_sub(A, mult);
    return c_scale(numer, 0.25);
}

vec3 palette(float t) {
    vec3 gold   = vec3(1.0, 0.88, 0.2);
    vec3 orange = vec3(1.0, 0.45, 0.06);
    vec3 mag    = vec3(0.92, 0.0, 0.5);
    vec3 purple = vec3(0.5, 0.08, 0.6);
    vec3 indigo = vec3(0.15, 0.06, 0.45);

    if(t < 0.25){
        float u = t / 0.25;
        return mix(gold, orange, smoothstep(0.0,1.0,u));
    } else if(t < 0.5){
        float u = (t - 0.25) / 0.25;
        return mix(orange, mag, smoothstep(0.0,1.0,u));
    } else if(t < 0.75){
        float u = (t - 0.5) / 0.25;
        return mix(mag, purple, smoothstep(0.0,1.0,u));
    } else {
        float u = (t - 0.75) / 0.25;
        return mix(purple, indigo, smoothstep(0.0,1.0,u));
    }
}

void main() {
    vec2 uv = (gl_FragCoord.xy / u_resolution.xy);
    float aspect = u_resolution.x / u_resolution.y;
    vec2 centered = (uv - 0.5) * vec2(aspect, 1.0);
    vec2 z = u_center + centered * u_scale;
    vec2 coord = z;

    float iter = 0.0;
    float smoothIter = 0.0;
    bool escaped = false;

    for (int i = 0; i < 2000; ++i) {
        if (i >= u_iterations) break;

        z = f_map(z);
        iter += 1.0;

        float mag = c_abs(z);
        if (mag > escape_radius) {
            float log_mag = log(mag);
            float log_escape = log(escape_radius);
            float nu = log2(log_mag / log_escape);
            smoothIter = iter + 1.0 - nu;
            escaped = true;
            break;
        }
    }

    if (!escaped) {
        smoothIter = iter;
    }

    float itNorm = smoothIter / float(u_iterations);
    itNorm = clamp(itNorm, 0.0, 1.0);

    float gamma = 0.25;
    float bands = pow(itNorm, gamma);
    vec3 col = palette(bands);

    float pixelSize = u_scale / u_resolution.y;  
    float gridThickness = 1.5 * pixelSize;

    vec3 axisColor = vec3(0.95);

    if (abs(coord.x) < gridThickness) {
        col = mix(col, axisColor, 0.95);
    }
    if (abs(coord.y) < gridThickness) {
        col = mix(col, axisColor, 0.95);
    }

    float distToNearestIntX = abs(fract(coord.x + 0.5) - 0.5);
    if (distToNearestIntX < gridThickness) {
        col = mix(col, axisColor * 0.7, 0.5);
    }

    float distToNearestIntY = abs(fract(coord.y + 0.5) - 0.5);
    if (distToNearestIntY < gridThickness) {
        col = mix(col, axisColor * 0.7, 0.5);
    }

    gl_FragColor = vec4(col, 1.0);
}