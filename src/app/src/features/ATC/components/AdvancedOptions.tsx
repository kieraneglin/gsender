import { Download, Upload } from 'lucide-react';
import Button from 'app/components/Button';
import { LuHardHat } from 'react-icons/lu';
import { useToolChange } from 'app/features/ATC/utils/ToolChangeContext.tsx';
import { ATCIConfiguration } from 'app/features/ATC/components/Configuration';
import { ToolDisplayModal } from 'app/features/ATC/components/ToolDisplayModal.tsx';

export function AdvancedOptions() {
    const {
        disabled,
        setLoadToolMode,
        setLoadToolOpen,
        currentTool,
    } = useToolChange();
    const handleManualLoad = () => {
        setLoadToolMode('load');
        setLoadToolOpen(true);
    };

    const handleManualUnload = () => {
        setLoadToolMode('save');
        setLoadToolOpen(true);
    };

    return (
        <div className="flex h-full w-full flex-col gap-4">
            <div className="flex items-center justify-end gap-2">
                <ATCIConfiguration compact />
                <ToolDisplayModal />
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50/60 p-3">
                <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <LuHardHat className="h-3.5 w-3.5" />
                    <span>Manual</span>
                </div>
                <Button
                    onClick={handleManualLoad}
                    size="sm"
                    disabled={disabled}
                    variant="ghost"
                    className="justify-start gap-2 text-gray-600"
                >
                    <Download className="h-4 w-4" />
                    Manual Load
                </Button>
                <Button
                    onClick={handleManualUnload}
                    size="sm"
                    disabled={disabled || currentTool === 0}
                    variant="ghost"
                    className="justify-start gap-2 text-gray-600"
                >
                    <Upload className="h-4 w-4" />
                    Manual Unload
                </Button>
            </div>
        </div>
    );
}
