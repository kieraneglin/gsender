import Button from 'app/components/Button';
import { unloadTool } from 'app/features/ATC/utils/ATCFunctions.ts';
import LoadToolPopover from 'app/features/ATC/components/LoadToolPopover.tsx';
import { PiEmpty } from 'react-icons/pi';
import { CurrentToolInfo } from 'app/features/ATC/components/CurrentToolInfo.tsx';
import { useToolChange } from 'app/features/ATC/utils/ToolChangeContext.tsx';
export function ToolDisplay() {
    const { tools, disabled, loadToolOpen, setLoadToolOpen } = useToolChange();

    return (
        <div className="w-full h-full flex flex-col gap-4">
            <CurrentToolInfo disabled={disabled} />
            <div className="mt-auto grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                <LoadToolPopover
                    isOpen={loadToolOpen}
                    setIsOpen={setLoadToolOpen}
                    tools={tools}
                    disabled={disabled}
                    buttonSize="lg"
                    buttonClassName="h-14 text-base"
                />
                <Button
                    className="flex flex-row gap-2 items-center h-14 text-base"
                    variant="secondary"
                    size="lg"
                    onClick={unloadTool}
                    disabled={disabled}
                >
                    <PiEmpty />
                    Unload
                </Button>
            </div>
        </div>
    );
}
