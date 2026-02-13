import cn from 'classnames';
import { ToolChange } from './types';
import Button from 'app/components/Button';
import { TbSwitch3 } from 'react-icons/tb';
import { ArrowRight } from 'lucide-react';
import { useTypedSelector } from 'app/hooks/useTypedSelector.ts';
import { RootState } from 'app/store/redux';
import { useEffect, useState } from 'react';
import { lookupToolName } from 'app/features/ATC/utils/ATCFunctions.ts';
import pubsub from 'pubsub-js';
import Tooltip from 'app/components/Tooltip';
import { ToolProbeState } from 'app/features/ATC/types.ts';
import { ToolStatusBadges } from 'app/features/ATC/components/ui/ToolStatusBadges.tsx';

interface ToolTimelineItemProps {
    tool: ToolChange;
    isActive: boolean;
    isLast: boolean;
    progress: number;
    isRemapped: boolean;
    isManual?: boolean;
    remapValue?: number;
    probeState?: ToolProbeState;
    handleRemap?: (number) => void;
}

export function ToolTimelineItem({
    tool,
    isActive,
    isLast,
    handleRemap,
    isRemapped,
    isManual = false,
    remapValue,
    probeState = 'unprobed',
}: ToolTimelineItemProps) {
    const [label, setLabel] = useState('');
    const MAX_LABEL_LENGTH = 15;

    const truncateLabel = (value: string) => {
        if (!value || value.length <= MAX_LABEL_LENGTH) {
            return value;
        }
        return `${value.slice(0, MAX_LABEL_LENGTH - 3)}...`;
    };

    const isConnected = useTypedSelector(
        (state: RootState) => state.connection.isConnected,
    );

    useEffect(() => {
        const toolLookup = isRemapped ? remapValue : tool.toolNumber;
        setLabel(lookupToolName(toolLookup));
    }, [tool, isRemapped, remapValue]);

    useEffect(() => {
        const token = pubsub.subscribe('toolmap:updated', () => {
            const toolLookup = isRemapped ? remapValue : tool.toolNumber;
            setLabel(lookupToolName(toolLookup));
        });
        return () => {
            pubsub.unsubscribe(token);
        };
    }, [tool, isRemapped, remapValue]);

    return (
        <div className="relative">
            <div
                className={cn(
                    'relative rounded-xl transition-all duration-300 overflow-hidden border',
                    isActive
                        ? 'bg-blue-50 border-blue-500 shadow-lg dark:bg-blue-900/35 dark:border-blue-500'
                        : 'bg-gray-50 border-gray-200 dark:bg-gray-800/35 dark:border-gray-700',
                )}
                style={{ minHeight: 96 }}
            >
                <div
                    className="absolute left-0 top-0 h-full w-2"
                    style={{ backgroundColor: tool.color }}
                />
                <div className="flex items-stretch gap-3 px-5 py-3">
                    <div className="flex items-center flex-shrink-0">
                        <div
                            className="relative z-10 flex items-center justify-center rounded-full h-9 w-9 font-bold text-lg text-white"
                            style={{ backgroundColor: tool.color }}
                        >
                            <span>{tool.index}</span>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                        <div className="flex min-w-0 flex-col gap-2">
                            <div
                                className={cn(
                                    'font-semibold transition-colors flex flex-col gap-1 items-start',
                                    'text-base text-gray-900 dark:text-gray-100',
                                )}
                            >
                                <div className="flex flex-wrap gap-x-2 gap-y-1 items-center justify-start leading-none">
                                    <span
                                        className={cn(
                                            isRemapped && 'line-through',
                                            'inline-flex items-center',
                                        )}
                                    >
                                        {tool.label || `T${tool.toolNumber}`}
                                    </span>
                                    {isRemapped && (
                                        <>
                                            <ArrowRight className="h-4 w-4" />
                                            <span className="no-underline inline-flex items-center gap-1">
                                                T{remapValue}
                                            </span>
                                        </>
                                    )}
                                    {label !== '-' && label && (
                                        <Tooltip content={label} side="top">
                                            <span className="text-gray-500 dark:text-gray-400 text-sm leading-none font-medium">
                                                {truncateLabel(label)}
                                            </span>
                                        </Tooltip>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <ToolStatusBadges
                                        probeState={probeState}
                                        isManual={isManual}
                                        size="md"
                                        className="[&>div:last-child]:min-w-[112px]"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end self-center justify-center gap-2">
                            <div className="flex items-center gap-3">
                                <span
                                    className={cn(
                                        'transition-colors whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400',
                                    )}
                                >
                                    Line {tool.startLine}
                                    {tool.endLine && ` - ${tool.endLine}`}
                                </span>
                                {isConnected && (
                                    <Button
                                        className="!w-auto !h-8"
                                        onClick={handleRemap}
                                        size="xs"
                                    >
                                        <TbSwitch3 />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {!isLast && (
                <div className="flex justify-center py-1">
                    <div
                        className={cn(
                            'w-0.5 h-4 rounded-full transition-all duration-300',
                            isActive
                                ? 'bg-gray-400 dark:bg-gray-500'
                                : 'bg-gray-300/50 dark:bg-gray-600/50',
                        )}
                    />
                </div>
            )}
        </div>
    );
}
