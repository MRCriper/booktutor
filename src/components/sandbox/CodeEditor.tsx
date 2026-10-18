import React, { useState } from 'react';
import { Play, RotateCcw, CheckCircle2, XCircle, Terminal, Check, Copy, FileText, Upload, Download, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TestCase, AttachedFile } from '../../types';
import { executeCode, runTestCases, TestCaseResult } from '../../services/pistonApi';

interface CodeEditorProps {
  initialCode?: string;
  language?: 'python' | 'cpp' | 'javascript';
  testCases?: TestCase[];
  files?: AttachedFile[];
  onCodeChange?: (code: string) => void;
  onAllTestsPassed?: () => void;
  title?: string;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  initialCode = '',
  language = 'python',
  testCases = [],
  files: initialFiles = [],
  onCodeChange,
  onAllTestsPassed,
  title,
  readOnly = false,
}) => {
  const [code, setCode] = useState(initialCode);
  const [selectedLang, setSelectedLang] = useState<'python' | 'cpp' | 'javascript'>(language);
  const [stdin, setStdin] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>(initialFiles);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<{ stdout: string; stderr: string; code: number; duration: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'output' | 'tests' | 'stdin' | 'files'>('output');
  const [testResults, setTestResults] = useState<TestCaseResult[] | null>(null);
  const [copied, setCopied] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    if (onCodeChange) onCodeChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      if (onCodeChange) onCodeChange(newCode);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setAttachedFiles((prev) => [
          ...prev.filter((f) => f.name !== file.name),
          {
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} КБ`,
            content: text,
          },
        ]);
        setActiveTab('files');
      };
      reader.readAsText(file);
    });
  };

  const handleRemoveFile = (fileName: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  const handleDownloadFile = (f: AttachedFile) => {
    const blob = new Blob([f.content || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = f.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setActiveTab('output');
    const start = performance.now();
    try {
      const res = await executeCode({
        language: selectedLang,
        code,
        stdin,
        files: attachedFiles,
      });
      const duration = Math.round(performance.now() - start);
      setOutput({
        stdout: res.run.stdout || res.run.output || '',
        stderr: res.run.stderr || '',
        code: res.run.code,
        duration,
      });
    } catch (err: unknown) {
      const duration = Math.round(performance.now() - start);
      const errorMsg = err instanceof Error ? err.message : 'Ошибка запуска';
      setOutput({
        stdout: '',
        stderr: errorMsg,
        code: 1,
        duration,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunAllTests = async () => {
    if (!testCases || testCases.length === 0) return;
    setIsRunning(true);
    setActiveTab('tests');
    try {
      const results = await runTestCases(selectedLang, code, testCases);
      setTestResults(results);

      const allPassed = results.length > 0 && results.every((r) => r.passed);
      if (allPassed) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
        if (onAllTestsPassed) onAllTestsPassed();
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 6) }, (_, i) => i + 1);

  return (
    <div className="flex flex-col bg-white dark:bg-[#121316] border border-[#1B1B19] dark:border-[#323642] shadow-2xs overflow-hidden text-xs font-mono">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#F8F7F4] dark:bg-[#1A1C24] border-b border-[#1B1B19] dark:border-[#323642] gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="text-[#1B1B19] dark:text-[#F3F3EE] font-bold text-xs truncate max-w-[200px] sm:max-w-none">
            {title || 'Среда исполнения КЕГЭ (Python 3.10)'}
          </span>
          {attachedFiles.length > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-[10px] font-bold border border-amber-600/30">
              📁 {attachedFiles.length} файл(а)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value as any)}
            className="text-[11px] bg-white dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19] dark:border-[#323642] px-2 py-1 font-mono focus:outline-none cursor-pointer"
            disabled={readOnly}
          >
            <option value="python">Python 3.10 (КЕГЭ/ОГЭ)</option>
            <option value="javascript">JavaScript (Node.js)</option>
          </select>

          <button
            onClick={handleCopy}
            className="p-1 border border-[#1B1B19]/30 dark:border-[#323642] hover:border-[#1B1B19] bg-white dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] cursor-pointer"
            title="Скопировать код"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {testCases.length > 0 && (
            <button
              onClick={handleRunAllTests}
              disabled={isRunning}
              className="text-[11px] font-bold px-2 py-1 bg-white dark:bg-[#1A1C24] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19] dark:border-[#323642] hover:bg-[#F8F7F4] transition flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle2 className="w-3 h-3 text-[#D4AF37]" />
              <span className="hidden sm:inline">Тесты</span> ({testCases.length})
            </button>
          )}

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="text-[11px] font-bold px-3 py-1 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] transition flex items-center gap-1 shadow-2xs uppercase tracking-wider cursor-pointer"
          >
            {isRunning ? (
              <>
                <RotateCcw className="w-3 h-3 animate-spin" />
                <span>Запуск...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Запустить</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex bg-[#FAFAF8] dark:bg-[#0E1015] font-mono min-h-[180px] max-h-[340px] overflow-auto">
        <div className="py-2.5 px-2 text-right select-none text-[#1B1B19]/40 dark:text-gray-600 text-[11px] border-r border-[#1B1B19]/15 dark:border-[#2A2D36] bg-[#F4F3EE] dark:bg-[#0B0D11] min-w-[28px]">
          {lineNumbers.map((n) => (
            <div key={n} className="leading-5">
              {n}
            </div>
          ))}
        </div>
        <textarea
          value={code}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          spellCheck={false}
          className="w-full py-2.5 px-3 bg-transparent text-[#1B1B19] dark:text-[#F3F3EE] font-mono text-xs leading-5 resize-none focus:outline-none whitespace-pre"
          rows={Math.max(lineCount, 6)}
          placeholder="# Напишите код программы на Python..."
        />
      </div>

      {/* Tabs */}
      <div className="border-t border-[#1B1B19] dark:border-[#323642] bg-[#F8F7F4] dark:bg-[#1A1C24] flex items-center justify-between px-3 overflow-x-auto">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('output')}
            className={`py-1.5 px-2 text-[11px] font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'output'
                ? 'border-[#1B1B19] text-[#1B1B19] dark:border-[#E5C048] dark:text-[#E5C048]'
                : 'border-transparent text-[#1B1B19]/60 dark:text-gray-400'
            }`}
          >
            Вывод консоли
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`py-1.5 px-2 text-[11px] font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              activeTab === 'files'
                ? 'border-[#1B1B19] text-[#1B1B19] dark:border-[#E5C048] dark:text-[#E5C048]'
                : 'border-transparent text-[#1B1B19]/60 dark:text-gray-400'
            }`}
          >
            <FileText className="w-3 h-3" />
            Файлы {attachedFiles.length > 0 ? `(${attachedFiles.length})` : ''}
          </button>

          {testCases.length > 0 && (
            <button
              onClick={() => setActiveTab('tests')}
              className={`py-1.5 px-2 text-[11px] font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeTab === 'tests'
                  ? 'border-[#1B1B19] text-[#1B1B19] dark:border-[#E5C048] dark:text-[#E5C048]'
                  : 'border-transparent text-[#1B1B19]/60 dark:text-gray-400'
              }`}
            >
              Тесты ({testCases.length})
            </button>
          )}

          <button
            onClick={() => setActiveTab('stdin')}
            className={`py-1.5 px-2 text-[11px] font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'stdin'
                ? 'border-[#1B1B19] text-[#1B1B19] dark:border-[#E5C048] dark:text-[#E5C048]'
                : 'border-transparent text-[#1B1B19]/60 dark:text-gray-400'
            }`}
          >
            Входные данные {stdin.trim() ? '•' : ''}
          </button>
        </div>

        {output && activeTab === 'output' && (
          <div className="text-[10px] text-[#1B1B19]/60 dark:text-gray-400 font-mono whitespace-nowrap">
            {output.duration} мс • Код {output.code}
          </div>
        )}
      </div>

      {/* Output / Tabs Content Panel */}
      <div className="p-3 bg-white dark:bg-[#121316] min-h-[90px] max-h-[170px] overflow-y-auto text-xs font-mono border-t border-[#1B1B19]/10 dark:border-[#323642]">
        {activeTab === 'output' && (
          <>
            {!output && !isRunning && (
              <span className="text-[#1B1B19]/40 dark:text-gray-500 italic">Нажмите «Запустить» для выполнения кода</span>
            )}
            {isRunning && (
              <span className="text-[#D4AF37] flex items-center gap-1.5 font-bold">
                <RotateCcw className="w-3.5 h-3.5 animate-spin" /> Выполнение в среде Python 3.10...
              </span>
            )}
            {output && !isRunning && (
              <div className="space-y-1">
                {output.stdout && (
                  <pre className="text-emerald-700 dark:text-emerald-400 whitespace-pre-wrap font-mono">
                    {output.stdout}
                  </pre>
                )}
                {output.stderr && (
                  <pre className="text-rose-700 dark:text-rose-400 whitespace-pre-wrap font-mono">
                    {output.stderr}
                  </pre>
                )}
                {!output.stdout && !output.stderr && (
                  <span className="text-[#1B1B19]/50 dark:text-gray-500 italic">(Программа завершилась без вывода)</span>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'files' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#1B1B19]/70 dark:text-gray-400">
                Файлы размещаются в текущей директории скрипта и открываются через <code className="px-1 bg-gray-100 dark:bg-gray-800 text-[#D4AF37]">open("имя_файла.txt")</code>:
              </span>
              <label className="px-2 py-1 bg-[#1B1B19] dark:bg-[#E5C048] text-[#F8F7F4] dark:text-[#121316] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer">
                <Upload className="w-3 h-3" /> Добавить файл
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {attachedFiles.length === 0 ? (
              <div className="text-center py-4 text-[#1B1B19]/40 dark:text-gray-500 italic">
                Нет прикреплённых файлов данных. Вы можете загрузить текстовый файл задачи (.txt, .csv).
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachedFiles.map((f) => (
                  <div
                    key={f.name}
                    className="p-2 border border-[#1B1B19]/20 dark:border-[#323642] bg-[#F8F7F4] dark:bg-[#1A1C24] flex items-center justify-between"
                  >
                    <div className="truncate">
                      <div className="font-bold text-[#1B1B19] dark:text-[#F3F3EE] truncate flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </div>
                      <div className="text-[10px] text-[#1B1B19]/50 dark:text-gray-400">
                        {f.size || `${f.content?.length || 0} симв.`}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => handleDownloadFile(f)}
                        className="p-1 hover:text-[#D4AF37] text-[#1B1B19]/70 dark:text-gray-300"
                        title="Скачать файл"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveFile(f.name)}
                        className="p-1 hover:text-rose-600 text-[#1B1B19]/50 dark:text-gray-400"
                        title="Удалить файл из песочницы"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stdin' && (
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Вставьте входные данные (input() / sys.stdin)..."
            className="w-full h-24 bg-transparent text-[#1B1B19] dark:text-[#F3F3EE] font-mono text-xs focus:outline-none resize-none"
          />
        )}

        {activeTab === 'tests' && (
          <div className="space-y-2">
            {!testResults ? (
              <span className="text-[#1B1B19]/50 dark:text-gray-500 italic">
                Тесты ещё не запускались. Нажмите «Тесты» в панели.
              </span>
            ) : (
              testResults.map((tr, i) => (
                <div
                  key={tr.testCaseId}
                  className={`p-2 border text-xs ${
                    tr.passed
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300'
                      : 'border-rose-600 bg-rose-50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      {tr.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      Тест #{i + 1}
                    </span>
                    <span>{tr.durationMs} мс</span>
                  </div>
                  {!tr.passed && (
                    <div className="mt-1 font-mono text-[11px] space-y-0.5">
                      <div>Ожидалось: {tr.expectedOutput}</div>
                      <div>Получено: {tr.actualOutput || tr.error || '(пусто)'}</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
