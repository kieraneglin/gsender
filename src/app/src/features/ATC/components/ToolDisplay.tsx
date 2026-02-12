import { CurrentToolInfo } from 'app/features/ATC/components/CurrentToolInfo.tsx';
import { useToolChange } from 'app/features/ATC/utils/ToolChangeContext.tsx';
export function ToolDisplay() {
    const { disabled } = useToolChange();

    return (
        <div className="w-full h-full flex flex-col gap-3">
            <CurrentToolInfo disabled={disabled} />
        </div>
    );
}
