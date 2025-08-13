import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Download, FileText, MessageSquare, Clipboard, CheckCircle2, Link as LinkIcon, Search, Filter, Clock, User, RotateCcw, ListTodo, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Results = ({ results, onReset }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [copied, setCopied] = useState(false);
  const [summaryText, setSummaryText] = useState(results.summary || '');
  const [reSummarizing, setReSummarizing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const listRef = useRef(null);
  const actions = results.actions || [];

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const downloadMarkdown = (content, filename) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setSummaryText(results.summary || '');
  }, [results.summary]);

  const downloadSummary = () => {
    downloadMarkdown(summaryText, 'summary.md');
  };

  const downloadDialogue = () => {
    let content = '# Текст созвона\n\n';
    results.dialogue.forEach((segment, index) => {
      const startTime = formatTime(segment.start);
      const endTime = formatTime(segment.end);
      content += `**${segment.speaker}** [${startTime} – ${endTime}]: ${segment.text}\n\n`;
    });
    downloadMarkdown(content, 'dialogue.md');
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {
      // no-op
    }
  };

  const triggerResummarize = async () => {
    try {
      setReSummarizing(true);
      const text = (results.dialogue || []).map(s => s.text).join(' ');
      const { data } = await axios.post('/resummarize', { text }, { timeout: 120000 });
      if (data && data.success && data.summary) {
        setSummaryText(data.summary);
      }
    } catch (e) {
      // опустим уведомление, можно добавить тост
    } finally {
      setReSummarizing(false);
    }
  };

  const slugify = (text) =>
    String(text)
      .toLowerCase()
      .trim()
      .replace(/[^a-zа-я0-9\s-]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const tocHeadings = useMemo(() => {
    const headings = [];
    const md = results.summary || '';
    const regex = /^(#{1,3})\s+(.+)$/gim;
    let match;
    while ((match = regex.exec(md)) !== null) {
      const level = match[1].length; // 1-3
      const title = match[2].trim();
      headings.push({ level, title, id: slugify(title) });
    }
    return headings;
  }, [results.summary]);

  const MarkdownComponents = {
    h1: ({ node, ...props }) => {
      const text = React.Children.toArray(props.children).join('');
      const id = slugify(text);
      return (
        <h1 id={id} className="group scroll-mt-24 text-3xl font-extrabold tracking-tight mb-4">
          <a href={`#${id}`} className="-ml-6 pr-2 opacity-0 group-hover:opacity-100 inline-flex align-middle text-primary-600 transition">
            <LinkIcon className="h-4 w-4" />
          </a>
          <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            {props.children}
          </span>
        </h1>
      );
    },
    h2: ({ node, ...props }) => {
      const text = React.Children.toArray(props.children).join('');
      const id = slugify(text);
      return (
        <h2 id={id} className="group scroll-mt-24 text-2xl font-bold mt-8 mb-3 flex items-center gap-2">
          <a href={`#${id}`} className="-ml-6 pr-2 opacity-0 group-hover:opacity-100 inline-flex align-middle text-primary-600 transition">
            <LinkIcon className="h-4 w-4" />
          </a>
          <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            {props.children}
          </span>
        </h2>
      );
    },
    h3: ({ node, ...props }) => {
      const text = React.Children.toArray(props.children).join('');
      const id = slugify(text);
      return (
        <h3 id={id} className="group scroll-mt-24 text-xl font-semibold mt-6 mb-2">
          <a href={`#${id}`} className="-ml-6 pr-2 opacity-0 group-hover:opacity-100 inline-flex align-middle text-primary-600 transition">
            <LinkIcon className="h-4 w-4" />
          </a>
          {props.children}
        </h3>
      );
    },
    ul: ({ node, ordered, ...props }) => (
      <ul className="space-y-2 list-none pl-0" {...props} />
    ),
    li: ({ children, ...props }) => (
      <li className="flex items-start gap-2" {...props}>
        <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 shrink-0" />
        <span className="leading-relaxed">{children}</span>
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary-300 bg-primary-50 text-primary-900 p-4 rounded-r-lg">
        {children}
      </blockquote>
    ),
    p: ({ node, ...props }) => (
      <p className="leading-relaxed" {...props} />
    ),
  };

  // Dialogue enhancements
  const uniqueSpeakers = useMemo(() => {
    return Array.from(new Set((results.dialogue || []).map((s) => s.speaker)));
  }, [results.dialogue]);

  const [speakerFilter, setSpeakerFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [copiedDialogue, setCopiedDialogue] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);

  const colorPalette = [
    { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-400', dot: 'bg-blue-400' },
    { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-400', dot: 'bg-green-400' },
    { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-400', dot: 'bg-purple-400' },
    { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-400', dot: 'bg-amber-400' },
    { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-400', dot: 'bg-pink-400' },
    { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-400', dot: 'bg-cyan-400' },
  ];

  const getSpeakerColors = (speaker) => {
    const idx = Math.max(0, uniqueSpeakers.indexOf(speaker)) % colorPalette.length;
    return colorPalette[idx];
  };

  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const renderHighlighted = (text, q) => {
    if (!q) return text;
    try {
      const parts = String(text).split(new RegExp(`(${escapeRegExp(q)})`, 'gi'));
      return parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 rounded px-1">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      );
    } catch {
      return text;
    }
  };

  const filteredSegments = useMemo(() => {
    const list = results.dialogue || [];
    return list.filter((seg) => {
      const bySpeaker = speakerFilter === 'all' || seg.speaker === speakerFilter;
      const byQuery = !query || seg.text.toLowerCase().includes(query.toLowerCase());
      return bySpeaker && byQuery;
    });
  }, [results.dialogue, speakerFilter, query]);

  // Автоскролл диалога к текущему месту
  useEffect(() => {
    if (!listRef.current) return;
    const idx = filteredSegments.findIndex(
      (s) => currentTime >= s.start && currentTime <= s.end
    );
    if (idx >= 0) {
      const node = listRef.current.querySelector(`[data-idx="${idx}"]`);
      if (node) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentTime, filteredSegments]);

  const copyVisibleDialogue = async () => {
    try {
      let content = '# Текст созвона (фильтрованный)\n\n';
      filteredSegments.forEach((segment) => {
        const timeLabel = `${formatTime(segment.start)} – ${formatTime(segment.end)}`;
        content += `**${segment.speaker}**${showTimestamps ? ` [${timeLabel}]` : ''}: ${segment.text}\n\n`;
      });
      await navigator.clipboard.writeText(content);
      setCopiedDialogue(true);
      setTimeout(() => setCopiedDialogue(false), 1500);
    } catch (_) {
      // no-op
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок результатов */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Анализ завершен!
        </h2>
        <p className="text-gray-600">
          Результаты обработки вашего аудио файла
        </p>
      </div>

      {/* Кнопки действий */}
      {/* Кнопка перенесена в Header */}

      {/* Табы */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 justify-center">
          <button
            onClick={() => setActiveTab('summary')}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm inline-flex items-center space-x-2
              ${activeTab === 'summary'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <FileText className="h-4 w-4" />
            <span>Анализ</span>
          </button>
          <button
            onClick={() => setActiveTab('dialogue')}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm inline-flex items-center space-x-2
              ${activeTab === 'dialogue'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Диалог</span>
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm inline-flex items-center space-x-2
              ${activeTab === 'actions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <ListTodo className="h-4 w-4" />
            <span>Задачи</span>
          </button>
        </nav>
      </div>

      {/* Контент табов */}
      <div className="animate-fade-in">
        {activeTab === 'summary' && (
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Резюме созвона</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={copySummary}
                  className={`btn-secondary inline-flex items-center space-x-2 text-sm ${copied ? 'ring-2 ring-green-300' : ''}`}
                >
                  <Clipboard className="h-4 w-4" />
                  <span>{copied ? 'Скопировано' : 'Копировать'}</span>
                </button>
                <button
                  onClick={downloadSummary}
                  className="btn-secondary inline-flex items-center space-x-2 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Скачать</span>
                </button>
                <button
                  onClick={triggerResummarize}
                  disabled={reSummarizing}
                  className={`btn-secondary inline-flex items-center space-x-2 text-sm ${reSummarizing ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{reSummarizing ? 'Анализ...' : 'Повторить анализ'}</span>
                </button>
              </div>
            </div>

            {tocHeadings.length > 1 && (
              <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="text-sm font-medium text-gray-700 mb-2">Содержание</div>
                <ul className="space-y-1">
                  {tocHeadings.map((h, idx) => (
                    <li key={idx} className="text-sm">
                      <a
                        href={`#${h.id}`}
                        className={`inline-flex items-center gap-2 text-gray-600 hover:text-primary-700 transition ${h.level === 1 ? 'pl-0' : h.level === 2 ? 'pl-2' : 'pl-4'}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                        <span>{h.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="prose prose-gray max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                {summaryText}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {activeTab === 'dialogue' && (
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Текст созвона с идентификацией спикеров</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyVisibleDialogue}
                  className={`btn-secondary inline-flex items-center space-x-2 text-sm ${copiedDialogue ? 'ring-2 ring-green-300' : ''}`}
                >
                  <Clipboard className="h-4 w-4" />
                  <span>{copiedDialogue ? 'Скопировано' : 'Копировать видимое'}</span>
                </button>
                <button
                  onClick={downloadDialogue}
                  className="btn-secondary inline-flex items-center space-x-2 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Скачать</span>
                </button>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={speakerFilter}
                  onChange={(e) => setSpeakerFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="all">Все спикеры</option>
                  {uniqueSpeakers.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Поиск по тексту..."
                  className="input-field"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button
                  onClick={() => setShowTimestamps((v) => !v)}
                  className="btn-secondary inline-flex items-center space-x-2 text-sm"
                >
                  <Clock className="h-4 w-4" />
                  <span>{showTimestamps ? 'Скрыть время' : 'Показать время'}</span>
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-3">Показано сегментов: {filteredSegments.length}</div>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto" ref={listRef}>
              {filteredSegments.map((segment, index) => {
                const colors = getSpeakerColors(segment.speaker);
                const initials = (segment.speaker.match(/([A-ZА-Я])/g) || [segment.speaker[0] || 'S']).slice(0, 2).join('');
                return (
                  <div key={index} data-idx={index} className={`flex items-start gap-3`}>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${colors.bg} ${colors.text} font-semibold shadow-sm`}>
                      {initials}
                    </div>
                    <div className={`flex-1 p-4 bg-white rounded-xl border ${colors.border} shadow-sm`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`font-semibold ${colors.text} inline-flex items-center gap-1`}>
                          <User className="h-4 w-4" /> {segment.speaker}
                        </span>
                        {showTimestamps && (
                          <span className="text-xs text-gray-500">
                            {formatTime(segment.start)} – {formatTime(segment.end)}
                          </span>
                        )}
                      </div>
                      <div className="text-gray-800 leading-relaxed">
                        {renderHighlighted(segment.text, query)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <ListTodo className="h-5 w-5" /> Действия и задачи
              </h3>
              {actions.length > 0 && (
                <button
                  onClick={() => {
                    const md = `# Действия и задачи\n\n` + actions.map((a, i) => {
                      const title = a.title || `Задача ${i+1}`;
                      const deadline = a.deadline ? `\n- Срок: ${a.deadline}` : '';
                      const resp = a.responsible ? `\n- Ответственный: ${a.responsible}` : '';
                      const details = a.details ? `\n- Детали: ${a.details}` : '';
                      return `- ${title}${deadline}${resp}${details}`;
                    }).join('\n');
                    navigator.clipboard.writeText(md).catch(()=>{});
                  }}
                  className="btn-secondary inline-flex items-center space-x-2 text-sm"
                >
                  <Clipboard className="h-4 w-4" />
                  <span>Копировать</span>
                </button>
              )}
            </div>

            {actions.length === 0 ? (
              <div className="text-gray-500">Задачи не обнаружены.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {actions.map((a, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 pr-2">{a.title || `Задача ${idx+1}`}</h4>
                      {a.deadline && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                          <Calendar className="h-3 w-3" /> {a.deadline}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-sm text-gray-700">
                      {a.responsible && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Ответственный:</span>
                          <span>{a.responsible}</span>
                        </div>
                      )}
                      {a.details && (
                        <div className="text-gray-700 whitespace-pre-wrap">{a.details}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600 mb-1">
            {results.dialogue.length}
          </div>
          <div className="text-sm text-gray-600">Кол-во сегментов диалога</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {new Set(results.dialogue.map(s => s.speaker)).size}
          </div>
          <div className="text-sm text-gray-600">Кол-во участников</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {Math.round((results.dialogue[results.dialogue.length - 1]?.end || 0) / 60)}
          </div>
          <div className="text-sm text-gray-600">Длительность</div>
        </div>
      </div>
    </div>
  );
};

export default Results;