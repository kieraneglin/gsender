/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import chunk from 'lodash/chunk';
import concaveman from 'concaveman';

self.onmessage = ({ data }) => {
    const {
        isLaser = false,
        parsedData = [],
        mode,
        bbox,
        zTravel,
        outlineSpeed = null,
    } = data;

    const getOutlineGcode = (concavity = 20) => {
        let vertices = [];
        parsedData.forEach((n) => vertices.push(n.toFixed(3)));
        vertices = chunk(vertices, 3);

        //const fileHull = hull(vertices);
        let fileHull = concaveman(vertices);
        fileHull = fileHull.slice(1); // Pop the first element since it's the same as the last and will result in weird movements.

        const gCode = convertPointsToGCode(fileHull, isLaser, outlineSpeed);

        return gCode;
    };

    const getSimpleOutline = () => {
        const movementModal = outlineSpeed ? 'G1' : 'G0';
        const feedrateCmd = outlineSpeed ? `F${outlineSpeed}` : '';

        if (parsedData && parsedData.length <= 0) {
            const gcode = [
                '%X0=posx,Y0=posy,Z0=posz',
                '%MM=modal.distance',
                `G21 G91 G0 Z${zTravel}`,
                'G90',
            ];
            if (outlineSpeed) {
                gcode.push(`${movementModal} ${feedrateCmd}`);
            }
            gcode.push(
                `${movementModal} X0 Y0`,
                `${movementModal} X[${bbox.min.x}] Y[${bbox.max.y}]`,
                `${movementModal} X[${bbox.max.x}] Y[${bbox.max.y}]`,
                `${movementModal} X[${bbox.max.x}] Y[${bbox.min.y}]`,
                `${movementModal} X[${bbox.min.x}] Y[${bbox.min.y}]`,
                `${movementModal} X[X0] Y[Y0]`,
                `G21 G91 G0 Z-${zTravel}`,
                '[MM]',
            );
            return gcode;
        } else {
            const gcode = [
                '%X0=posx,Y0=posy,Z0=posz',
                '%MM=modal.distance',
                `G21 G91 G0 Z${zTravel}`,
                'G90',
            ];
            if (outlineSpeed) {
                gcode.push(`${movementModal} ${feedrateCmd}`);
            }
            gcode.push(
                `${movementModal} X0 Y0`,
                `${movementModal} X[xmin] Y[ymax]`,
                `${movementModal} X[xmax] Y[ymax]`,
                `${movementModal} X[xmax] Y[ymin]`,
                `${movementModal} X[xmin] Y[ymin]`,
                `${movementModal} X[X0] Y[Y0]`,
                `G21 G91 G0 Z-${zTravel}`,
                '[MM]',
            );
            return gcode;
        }
    };

    function convertPointsToGCode(points, isLaser = false, customSpeed = null) {
        const gCode = [];
        // Use G1 if we have a custom speed, or if laser is enabled
        const movementModal = customSpeed || isLaser ? 'G1' : 'G0';
        gCode.push('%X0=posx,Y0=posy,Z0=posz');
        gCode.push('%MM=modal.distance');
        gCode.push(`G21 G91 G0 Z${zTravel}`);

        // Set feedrate: use custom speed if provided, otherwise use laser default
        if (isLaser) {
            const feedrate = customSpeed || 3000;
            gCode.push(`G1F${feedrate} M3 S1`);
        } else if (customSpeed) {
            gCode.push(`G1F${customSpeed}`);
        }
        points.forEach((point) => {
            const [x, y] = point;
            gCode.push(`G21 G90 ${movementModal} X${x} Y${y}`);
        });
        if (isLaser) {
            gCode.push('M5 S0');
        }
        gCode.push('G0 X[X0] Y[Y0]');
        gCode.push(`G21 G91 G0 Z-${zTravel}`);

        gCode.push('[MM]');
        return gCode;
    }
    let outlineGcode;
    if (mode === 'Square') {
        outlineGcode = getSimpleOutline();
    } else {
        outlineGcode = getOutlineGcode();
    }
    //const outlineGcode = getOutlineGcode();
    postMessage({ outlineGcode });
};
