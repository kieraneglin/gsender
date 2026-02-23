import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Button } from 'app/components/Button';
import { Badge } from 'app/components/shadcn/Badge';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import cn from 'classnames';
import { useConfigContext } from 'app/features/ATC/components/Configuration/hooks/useConfigStore.tsx';
import {
    ATCIMacroConfig,
    Macro,
} from 'app/features/ATC/assets/defaultATCIMacros.ts';
import GcodeViewer from 'app/components/GcodeViewer';
import store from 'app/store';

type TemplateUploadData = Pick<ATCIMacroConfig, 'version' | 'macros'> &
    Partial<ATCIMacroConfig>;

interface TemplateManagerContextValue {
    defaultVersion: number;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleUploadClick: () => void;
    selectedTemplate: Macro | null;
    selectTemplate: (template: Macro) => void;
    sortedTemplates: Macro[];
    templates: ATCIMacroConfig | undefined;
    uploadError: string;
    versionMismatch: boolean;
}

const TemplateManagerContext = createContext<
    TemplateManagerContextValue | undefined
>(undefined);

function useTemplateManagerContext() {
    const context = useContext(TemplateManagerContext);
    if (!context) {
        throw new Error(
            'Template manager components must be used within TemplateManagerProvider',
        );
    }
    return context;
}

export function TemplateManagerProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { templates, setTemplates } = useConfigContext();
    const [selectedTemplateName, setSelectedTemplateName] = useState<
        string | null
    >(null);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const defaultVersion = store.get('widgets.atc.templates.version', 20250909);
    const versionMismatch =
        !!templates && templates.sdVersion !== defaultVersion;

    const sortedTemplates = useMemo(() => {
        if (!templates?.macros) {
            return [];
        }
        return [...templates.macros].sort((a, b) => a.name.localeCompare(b.name));
    }, [templates]);

    useEffect(() => {
        if (!sortedTemplates.length) {
            setSelectedTemplateName(null);
            return;
        }

        if (
            !selectedTemplateName ||
            !sortedTemplates.some(
                (template) => template.name === selectedTemplateName,
            )
        ) {
            setSelectedTemplateName(sortedTemplates[0].name);
        }
    }, [selectedTemplateName, sortedTemplates]);

    const selectedTemplate = useMemo(() => {
        if (!selectedTemplateName) {
            return null;
        }

        return (
            sortedTemplates.find(
                (template) => template.name === selectedTemplateName,
            ) || null
        );
    }, [selectedTemplateName, sortedTemplates]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const input = event.target;
        const file = input.files?.[0];
        if (!file) {
            return;
        }

        if (!file.name.toLowerCase().endsWith('.json')) {
            setUploadError('Please select a valid JSON file');
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            try {
                const content = loadEvent.target?.result;
                if (typeof content !== 'string') {
                    throw new Error('Invalid file content');
                }

                const data = JSON.parse(content) as TemplateUploadData;
                if (!data.version || !Array.isArray(data.macros)) {
                    throw new Error('Invalid template file structure');
                }

                const nextTemplates = {
                    ...(templates || store.get('widgets.atc.templates', {})),
                    ...data,
                    sdVersion: templates?.sdVersion ?? defaultVersion,
                } as ATCIMacroConfig;

                setTemplates(nextTemplates);
                store.replace('widgets.atc.templates', nextTemplates);
                setSelectedTemplateName(nextTemplates.macros[0]?.name ?? null);
                setUploadError('');
            } catch {
                setUploadError('Invalid JSON file or incorrect structure');
            } finally {
                input.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const value: TemplateManagerContextValue = {
        defaultVersion,
        fileInputRef,
        handleFileUpload,
        handleUploadClick,
        selectedTemplate,
        selectTemplate: (template) => setSelectedTemplateName(template.name),
        sortedTemplates,
        templates,
        uploadError,
        versionMismatch,
    };

    return (
        <TemplateManagerContext.Provider value={value}>
            {children}
        </TemplateManagerContext.Provider>
    );
}

function TemplateManagerVersionInfo() {
    const { defaultVersion, templates, versionMismatch } =
        useTemplateManagerContext();

    return (
        <div className="border border-border bg-white dark:border-slate-700 dark:bg-dark-darker px-4 py-3">
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold dark:text-white">
                        Template Version:
                    </span>
                    <Badge
                        variant="secondary"
                        className={cn(
                            'text-sm font-bold border px-3 py-1 bg-white text-blue-800 dark:bg-slate-900 dark:text-blue-200 dark:border-slate-600',
                        )}
                    >
                        {templates?.version || defaultVersion}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold dark:text-white">
                        Reported Version:
                    </span>
                    <Badge
                        variant="secondary"
                        className={cn(
                            'text-sm border-2 border font-bold px-3 py-1 bg-white text-gray-800 dark:bg-slate-900 dark:text-gray-200 dark:border-slate-600',
                            versionMismatch
                                ? 'border-red-600 bg-red-600/20 text-red-600 dark:border-red-500 dark:bg-red-900/30 dark:text-red-300'
                                : '',
                        )}
                    >
                        {templates?.sdVersion}
                    </Badge>
                </div>
            </div>
        </div>
    );
}

function TemplateManagerUploadSection() {
    const { handleUploadClick, uploadError } = useTemplateManagerContext();

    return (
        <div className="border border-border bg-white dark:border-slate-700 dark:bg-dark-darker p-3">
            <Button
                onClick={handleUploadClick}
                className="w-full flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
            >
                <Upload className="h-4 w-4" />
                Upload JSON Template File
            </Button>
            {uploadError && (
                <div className="flex items-center gap-2 text-red-500 text-xs mt-2">
                    <AlertCircle className="h-4 w-4" />
                    {uploadError}
                </div>
            )}
        </div>
    );
}

function TemplateViewer({
    className = '',
}: {
    className?: string;
}) {
    const { selectedTemplate } = useTemplateManagerContext();

    return (
        <div
            className={cn(
                'border border-border bg-white dark:border-slate-700 dark:bg-dark-darker flex flex-col min-h-0 overflow-hidden',
                className,
            )}
        >
            <h1 className="text-sm font-semibold p-2 text-blue-500">
                {selectedTemplate ? selectedTemplate.name : 'Content'}
            </h1>
            <div className="flex-1 min-h-0 p-2 overflow-hidden">
                <div className="border rounded h-full min-h-0 overflow-hidden dark:border-slate-700 dark:bg-slate-900/50">
                    {selectedTemplate ? (
                        <div className="h-full min-h-0 overflow-auto overscroll-contain p-2">
                            <GcodeViewer
                                gcode={selectedTemplate.content}
                                className="dark:text-white"
                            />
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground text-sm py-8">
                            Select a macro to view its contents
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function TemplateManagerListContent({
    className = '',
    showUploadButton = false,
}: {
    className?: string;
    showUploadButton?: boolean;
}) {
    const { selectedTemplate, selectTemplate, sortedTemplates } =
        useTemplateManagerContext();

    return (
        <div
            className={cn(
                'flex flex-col min-h-0 h-full gap-3',
                className,
            )}
        >
            {showUploadButton && <TemplateManagerUploadSection />}

            <div className="border border-border bg-white dark:border-slate-700 dark:bg-dark-darker flex flex-col min-h-0 flex-1 overflow-hidden">
                <h1 className="text-sm font-semibold text-blue-500 p-2">
                    Macros ({sortedTemplates.length})
                </h1>
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                    {sortedTemplates.map((template) => (
                        <button
                            key={template.name}
                            onClick={() => selectTemplate(template)}
                            className={cn(
                                'w-full text-left px-4 py-3 text-sm text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2 transition-colors',
                                selectedTemplate?.name === template.name &&
                                    'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700/50',
                            )}
                        >
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-300" />
                            <span className="font-medium dark:text-white">
                                {template.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function TemplateManagerFileInput() {
    const { fileInputRef, handleFileUpload } = useTemplateManagerContext();

    return (
        <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
        />
    );
}

export function TemplateManagerMainContent({
    className = '',
}: {
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex h-full flex-col gap-4 min-h-0 overflow-hidden',
                className,
            )}
        >
            <TemplateManagerVersionInfo />
            <TemplateViewer className="flex-1" />
            <TemplateManagerFileInput />
        </div>
    );
}

function TemplatesTabContent() {
    return (
        <div className="flex h-full flex-col gap-4 min-h-0 overflow-hidden">
            <TemplateManagerVersionInfo />
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 flex-1 min-h-0">
                <TemplateManagerListContent
                    className="md:col-span-2"
                    showUploadButton
                />
                <TemplateViewer className="md:col-span-4" />
            </div>
            <TemplateManagerFileInput />
        </div>
    );
}

export const TemplatesTab: React.FC = () => {
    return (
        <TemplateManagerProvider>
            <TemplatesTabContent />
        </TemplateManagerProvider>
    );
};
