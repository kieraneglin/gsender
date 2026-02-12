import { Download, Upload } from 'lucide-react';
import { useToolChange } from 'app/features/ATC/utils/ToolChangeContext.tsx';
import { ATCIConfiguration } from 'app/features/ATC/components/Configuration';
import { ToolDisplayModal } from 'app/features/ATC/components/ToolDisplayModal.tsx';
import { LongPressButton } from 'app/components/LongPressButton';
import {
    releaseToolFromSpindle,
    unloadTool,
} from 'app/features/ATC/utils/ATCFunctions.ts';

export function AdvancedOptions() {
    const {
        disabled,
        setLoadToolMode,
        setLoadToolOpen,
    } = useToolChange();

    const handleManualLoad = () => {
        setLoadToolMode('load');
        setLoadToolOpen(true);
    };


    return (
        <div className="flex h-full w-full flex-col gap-4">
            <div className="flex items-center justify-end gap-2">
                <ATCIConfiguration compact />
                <ToolDisplayModal />

            </div>

            <div className="flex flex-col gap-2 border-t border-gray-200 pt-3">
                <LongPressButton
                    disabled={disabled}
                    label="Load"
                    icon={<Download className="h-5 w-5" />}
                    onClick={() => setLoadToolOpen(true)}
                    onTLongPress={handleManualLoad}
                />
                <LongPressButton
                    disabled={disabled}
                    label="Unload"
                    icon={<Upload className="h-5 w-5" />}
                    onClick={unloadTool}
                    onLongPress={releaseToolFromSpindle}
                />
                <span className="text-right text-xs text-gray-400">
                    Hold for manual
                </span>
            </div>
        </div>
    );
}
