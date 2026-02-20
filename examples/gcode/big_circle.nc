%
(600mm Diameter Circle Centered at 0,0)
G21         (Set units to mm)
G90         (Absolute positioning)
G17         (XY plane)

G0 Z5.0     (Safe height)

(Go to start point at rightmost edge of circle)
G0 X300.0 Y0.0

(Plunge to cutting depth)
G1 Z-2.0 F300

(Cut full circle in two 180-degree CCW arcs)
G3 X-300.0 Y0.0 I-300.0 J0.0 F800
G3 X300.0 Y0.0 I300.0 J0.0

(Retract)
G0 Z5.0

G0 X0 Y0
M30
%