import get from 'lodash/get';
import includes from 'lodash/includes';
import mapValues from 'lodash/mapValues';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { AxisRow } from 'app/features/DRO/component/AxisRow.tsx';
import { defaultDROPosition } from 'app/features/DRO/utils/DRO';
import { mapPositionToUnits } from 'app/lib/units.ts';
import {
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    WORKFLOW_STATE_RUNNING,
} from 'app/constants';

export function ATCConfigDRO() {
    const { units: preferredUnits } = useWorkspaceState();
    const wposController = useTypedSelector(
        (state) => state.controller.wpos,
    );
    const mposController = useTypedSelector(
        (state) => state.controller.mpos,
    );
    const workflowState = useTypedSelector(
        (state) => state.controller.workflow.state,
    );
    const activeState = useTypedSelector(
        (state) => state.controller.state.status.activeState,
    );
    const isConnected = useTypedSelector(
        (state) => state.connection.isConnected,
    );

    const wpos = mapValues(
        wposController || defaultDROPosition,
        (pos) => mapPositionToUnits(pos, preferredUnits),
    );
    const mpos = mapValues(
        mposController || defaultDROPosition,
        (pos) => mapPositionToUnits(pos, preferredUnits),
    );

    const canClick = (() => {
        if (!isConnected) return false;
        if (workflowState === WORKFLOW_STATE_RUNNING) return false;
        const states = [GRBL_ACTIVE_STATE_IDLE, GRBL_ACTIVE_STATE_JOG];
        return includes(states, activeState);
    })();

    return (
        <div className="flex flex-col w-full gap-1 portrait:gap-2 space-between">
            <AxisRow
                label="X"
                axis="X"
                mpos={get(mpos, 'x', '0')}
                wpos={get(wpos, 'x', '0')}
                disabled={!canClick}
                homingMode={false}
            />
            <AxisRow
                label="Y"
                axis="Y"
                mpos={get(mpos, 'y', '0')}
                wpos={get(wpos, 'y', '0')}
                disabled={!canClick}
                homingMode={false}
            />
            <AxisRow
                label="Z"
                axis="Z"
                mpos={get(mpos, 'z', '0')}
                wpos={get(wpos, 'z', '0')}
                disabled={!canClick}
                homingMode={false}
            />
        </div>
    );
}
