import CodeMirror from '@uiw/react-codemirror';
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';
import { tokyoNightDay } from '@uiw/codemirror-theme-tokyo-night-day';
import { LanguageName, loadLanguage } from '@uiw/codemirror-extensions-langs';
import { EditorView } from '@codemirror/view';
import { CodeTemplate } from '@/utils/types';
import { useTheme } from '@/lib/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Loader2, PlayIcon, SaveIcon, Share2Icon, TextCursorInputIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTemplates } from '@/lib/TemplatesProvider';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@radix-ui/react-separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const customDarkBackgroundOverride = EditorView.theme(
    {
        '&': {
            backgroundColor: '#111A27 !important',
        },
        '.cm-gutters': {
            backgroundColor: '#111A27 !important',
            padding: '0px !important',
        },
        '.cm-line': {
            'padding-top': '2px',
            'padding-bottom': '2px',
        },
        '.cm-gutterElement': {
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
        },
    },
    { dark: true },
);

const customLightBackgroundOverride = EditorView.theme(
    {
        '&': {
            backgroundColor: '#FBFDFF !important',
        },
        '.cm-gutters': {
            backgroundColor: '#FBFDFF !important',
            padding: '0px !important',
        },
        '&.cm-focused': {
            outline: 'none !important',
        },
        '.cm-line': {
            'padding-top': '2px',
            'padding-bottom': '2px',
        },
        '.cm-gutterElement': {
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
        },
    },
    { dark: true },
);

function formatTime(timeTaken) {
    if (timeTaken >= 1000) {
        // Convert to seconds with one decimal place
        return (timeTaken / 1000).toFixed(1) + ' s';
    } else {
        // Display in milliseconds
        return timeTaken + ' ms';
    }
}

const CodeEditor = ({ template }: { template: CodeTemplate }) => {
    const { theme } = useTheme();
    const { toast } = useToast();
    const [code, setCode] = useState(template.code);
    const [input, setInput] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [output, setOutput] = useState<{ content: string; success: boolean | null; runtime: number | null }>({
        content: '',
        success: null,
        runtime: null,
    });

    const { isLoading, updateTemplate } = useTemplates();
    const [runnerLoading, setRunnerLoading] = useState(false);
    const [osInfo, setOSInfo] = useState('Retrieving OS Info...');

    const isDark = theme === 'dark';

    useEffect(() => {
        getSetOSInfo();
    }, []);

    const getSetOSInfo = async () => {
        const response = await axios.get('/api/health');
        setOSInfo(
            response.data.payload.OS +
                '. ' +
                response.data.payload.uptime +
                '. ' +
                response.data.payload.timestamp +
                '.',
        );
    };

    const runCode = async () => {
        try {
            setRunnerLoading(true);
            const { data } = await axios.post('/api/runners', {
                code,
                language: template.language,
                stdin: input.split('\n'),
            });
            getSetOSInfo();

            const payload = data.payload;
            setOutput({
                content: (payload.stdout ? payload.stdout : payload.stderr) as string,
                success: payload.success as boolean,
                runtime: payload.timeTaken as number,
            });
            console.log(output);
        } catch (error) {
            console.error(error);
            toast({
                title: 'Run Failed',
                description: 'Something went wrong. Please try again later',
                variant: 'destructive',
            });
        } finally {
            setRunnerLoading(false);
        }
    };

    const saveTemplateSubmit = async () => {
        try {
            const updatedTemplate = await updateTemplate({ ...template, code });
            setCode(updatedTemplate.code);
            toast({ title: 'Template saved!' });
        } catch {
            toast({
                title: 'Unable to save template',
                description: 'Something went wrong. Please try again later.',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className='w-full h-full flex flex-row'>
            <Dialog open={dialogOpen} onOpenChange={() => setDialogOpen(false)}>
                <DialogContent className='max-w-[600px] sm:max-w-[425px]'>
                    <DialogHeader>
                        <DialogTitle>Enter Input</DialogTitle>
                        <DialogDescription>
                            Enter in any stdin values to be passed into your program. For multiple inputs, enter them on
                            separate lines.
                        </DialogDescription>
                        <Separator className='!mt-4' />
                    </DialogHeader>
                    <div className='grid gap-2'>
                        <Label htmlFor='stdin'>Stdin</Label>
                        <Textarea
                            id='stdin'
                            placeholder={'My stdin'}
                            required
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className='focus:!ring-blue-600 resize-none'
                        />
                    </div>
                    <DialogFooter className='!mt-4'>
                        <Button onClick={() => setDialogOpen(false)} className='w-full bg-blue-700 hover:bg-blue-600'>
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className='w-[55%] h-full mr-auto block border-r-slate-200 dark:border-r-slate-800 border-r-[1px]'>
                <CodeMirror
                    value={template.code}
                    style={{ padding: '0px !important', outline: 'none' }}
                    className='!p-0 !h-full'
                    height='100%'
                    maxHeight='calc(100vh - 64px)'
                    theme={
                        isDark
                            ? [tokyoNight, customDarkBackgroundOverride]
                            : [tokyoNightDay, customLightBackgroundOverride]
                    }
                    extensions={[
                        loadLanguage(
                            (template.language === 'C++' ? 'cpp' : template.language.toLowerCase()) as LanguageName,
                        )!,
                        EditorView.lineWrapping,
                    ]}
                    onChange={(value) => setCode(value)}
                />
            </div>
            <div className='flex flex-col w-[50%] maxHeight'>
                <div className='w-full flex flex-row gap-2 items-center p-4 dark:bg-[#0D1520] border-b-[1px] border-r-slate-200 dark:border-b-slate-800'>
                    <Button
                        variant='secondary'
                        className='bg-teal-600 dark:bg-teal-700/20 text-white dark:text-teal-400 font-medium rounded-lg hover:bg-teal-500 dark:hover:bg-teal-700/30'
                        onClick={runCode}
                        disabled={runnerLoading}
                    >
                        {runnerLoading && <Loader2 className='animate-spin' />}
                        {!runnerLoading && <PlayIcon />}
                        {runnerLoading ? 'Running' : 'Run'}
                    </Button>
                    <Button
                        variant='secondary'
                        className='bg-blue-500 dark:bg-blue-700/20 text-white dark:text-blue-400 font-medium rounded-lg hover:bg-blue-400 dark:hover:bg-blue-700/30'
                        disabled={isLoading}
                        onClick={() => setDialogOpen(true)}
                    >
                        {isLoading && <Loader2 className='animate-spin' />}
                        {!isLoading && <TextCursorInputIcon />}
                        Input
                    </Button>
                    <Button
                        variant='secondary'
                        className='bg-orange-500 dark:bg-orange-700/20 text-white dark:text-orange-400 font-medium rounded-lg hover:bg-orange-400 dark:hover:bg-orange-700/30'
                        disabled={isLoading}
                        onClick={saveTemplateSubmit}
                    >
                        {isLoading && <Loader2 className='animate-spin' />}
                        {!isLoading && <SaveIcon />}
                        {isLoading ? 'Saving' : 'Save'}
                    </Button>
                    <Button
                        variant='secondary'
                        className='bg-pink-500 dark:bg-pink-700/20 text-white dark:text-pink-400 font-medium rounded-lg hover:bg-pink-400 dark:hover:bg-pink-700/30'
                        onClick={() => {
                            navigator.clipboard.writeText(
                                import.meta.env.VITE_CLIENT_BASE_URL + '/app/posts/' + template.id,
                            );
                            toast({ title: 'Link Copied!' });
                        }}
                    >
                        <Share2Icon />
                        Share
                    </Button>
                    {output.runtime && (
                        <div className='py-1 px-2 font-firaCode ml-auto block bg-[#8F6424] text-xs rounded-md'>
                            {formatTime(output.runtime)}
                        </div>
                    )}
                </div>
                <div className='text-sm font-firaCode markdown w-full h-full overflow-x-clip overflow-y-scroll dark:bg-[#0D1520] p-4 dark:text-purple-50'>
                    <div className='text-slate-500 dark:text-slate-500'>{osInfo}</div>
                    <div
                        className={`!mt-4 ${
                            output.success ? 'text-teal-950 dark:text-teal-50' : 'text-rose-500 font-semibold'
                        }`}
                    >
                        {output.content}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeEditor;