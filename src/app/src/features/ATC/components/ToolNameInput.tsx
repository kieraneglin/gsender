import { useEffect, useMemo, useState } from 'react';
import {
    lookupToolName,
    setToolName,
} from 'app/features/ATC/utils/ATCFunctions.ts';
import { Input } from 'app/components/shadcn/Input.tsx';

const MOCK_TOOL_OPTIONS = [
    '1/8in End Mill',
    '1/4in End Mill',
    '1/2in End Mill',
    '90deg V-Bit',
    '30deg V-Bit',
    'Downcut Spiral',
    'Upcut Spiral',
    'Ball Nose 1/8in',
    'Ball Nose 1/4in',
    'Surfacing Bit 1in',
    'Drill Bit 1/8in',
    'Chamfer Bit 45deg',
];

export function ToolNameInput({
    id = 0,
    nickname = '-',
}: {
    id: number;
    nickname: string;
}) {
    const [name, setName] = useState('-');
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const storedName = lookupToolName(id);
        const initialName = storedName === '-' ? nickname : storedName;
        setName(initialName === '-' ? '' : initialName);
    }, []);

    function handleNameRemap(e) {
        const value = e.target.value;
        setToolName(id, value);
        setName(value);
    }

    const filteredOptions = useMemo(() => {
        const normalizedName = name === '-' ? '' : name;
        const query = normalizedName.trim().toLowerCase();
        if (!query) return MOCK_TOOL_OPTIONS;
        return MOCK_TOOL_OPTIONS.filter((option) =>
            option.toLowerCase().includes(query),
        );
    }, [name]);

    return (
        <div className="text-xs text-muted w-full relative">
            <Input
                className="w-full h-7 bg-white bg-opacity-100 dark:border-gray-500 ring-1 ring-gray-300 rounded-md px-2 py-1 text-xs text-gray-700"
                type="text"
                value={name}
                onChange={handleNameRemap}
                onFocus={() => setOpen(true)}
                onClick={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                disabled={id < 1}
                wrapperClassName="relative"
            />
            {open && id >= 1 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-md border border-gray-200 bg-white shadow-md dark:border-gray-600 dark:bg-dark">
                    {filteredOptions.length === 0 && (
                        <div className="px-2 py-1 text-xs text-gray-500">
                            No matches
                        </div>
                    )}
                    {filteredOptions.map((option) => (
                        <div
                            key={option}
                            className="cursor-pointer px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                setToolName(id, option);
                                setName(option);
                                setOpen(false);
                            }}
                        >
                            {option}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
