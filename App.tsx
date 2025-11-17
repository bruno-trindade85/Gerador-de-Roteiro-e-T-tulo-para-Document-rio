
import React, { useState, useCallback, useEffect } from 'react';
import { generateDocumentaryScript, generateTitles, generateThumbnailPrompt, generateImageFromPrompt, generateLogline, translateTitlesToPortuguese, generateTitlesOnly, generateImagePrompts, generateVideoPrompts } from './services/geminiService';
import { Loader } from './components/Loader';
import { FilmIcon } from './components/icons/FilmIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { ClipboardIcon } from './components/icons/ClipboardIcon';
import { CaptionIcon } from './components/icons/CaptionIcon';
import { LightbulbIcon } from './components/icons/LightbulbIcon';
import { ImageIcon } from './components/icons/ImageIcon';
import { RefreshIcon } from './components/icons/RefreshIcon';
import { CheckIcon } from './components/icons/CheckIcon';
import { StarIcon } from './components/icons/StarIcon';
import { GoogleDocIcon } from './components/icons/GoogleDocIcon';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { DocumentTextIcon } from './components/icons/DocumentTextIcon';
import { PencilSparkleIcon } from './components/icons/PencilSparkleIcon';
import { LanguageIcon } from './components/icons/LanguageIcon';
import { VideoCameraIcon } from './components/icons/VideoCameraIcon';
import { SunIcon } from './components/icons/SunIcon';
import { MoonIcon } from './components/icons/MoonIcon';


const MIN_WORDS = 5000;
const MAX_WORDS = 6500;

type GenerationMode = 'text' | 'logline' | null;
type ActiveTab = 'titles' | 'thumbnail' | 'images' | 'videos';
type Theme = 'light' | 'dark';

interface ScriptAttempt {
  script: string;
  wordCount: number;
  message: string;
}

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [generationMode, setGenerationMode] = useState<GenerationMode>(null);

  const [inputText, setInputText] = useState<string>('');
  const [loglineIdea, setLoglineIdea] = useState<string>('');
  const [generatedLogline, setGeneratedLogline] = useState<string>('');
  const [isGeneratingLogline, setIsGeneratingLogline] = useState<boolean>(false);
  const [loglineError, setLoglineError] = useState<string | null>(null);

  const [outputText, setOutputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Gerando roteiro longo...');
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>('BR');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  
  const [titles, setTitles] = useState<string[]>([]);
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [titleKeywords, setTitleKeywords] = useState<string>('');
  const [negativeKeywords, setNegativeKeywords] = useState<string>('');
  const [thumbnailPrompt, setThumbnailPrompt] = useState<string>('');
  const [isGeneratingTitles, setIsGeneratingTitles] = useState<boolean>(false);
  const [isGeneratingThumbnailPrompt, setIsGeneratingThumbnailPrompt] = useState<boolean>(false);
  const [isTranslatingTitles, setIsTranslatingTitles] = useState<boolean>(false);
  const [titlesError, setTitlesError] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [isThumbnailPromptCopied, setIsThumbnailPromptCopied] = useState<boolean>(false);
  const [copiedTitle, setCopiedTitle] = useState<string | null>(null);

  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const [chosenTitle, setChosenTitle] = useState<string>('');
  const [isCopiedForDoc, setIsCopiedForDoc] = useState<boolean>(false);

  const [scriptAttempt, setScriptAttempt] = useState<ScriptAttempt | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('titles');

  // State for the "Images" tab
  const [imagePrompts, setImagePrompts] = useState<string[]>([]);
  const [isGeneratingImagePrompts, setIsGeneratingImagePrompts] = useState<boolean>(false);
  const [imagePromptsError, setImagePromptsError] = useState<string | null>(null);
  const [generatedSceneImages, setGeneratedSceneImages] = useState<Record<string, string>>({});
  const [isGeneratingSceneImage, setIsGeneratingSceneImage] = useState<Record<string, boolean>>({});
  const [sceneImageError, setSceneImageError] = useState<Record<string, string | null>>({});
  const [copiedScenePrompt, setCopiedScenePrompt] = useState<string | null>(null);
  const [isAllPromptsCopied, setIsAllPromptsCopied] = useState<boolean>(false);

  // State for the "Videos" tab
  const [videoPrompts, setVideoPrompts] = useState<string[]>([]);
  const [isGeneratingVideoPrompts, setIsGeneratingVideoPrompts] = useState<boolean>(false);
  const [videoPromptsError, setVideoPromptsError] = useState<string | null>(null);
  const [copiedVideoPrompt, setCopiedVideoPrompt] = useState<string | null>(null);
  const [isAllVideoPromptsCopied, setIsAllVideoPromptsCopied] = useState<boolean>(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const resetAllOutputs = () => {
    setOutputText('');
    setTitles([]);
    setSelectedTitles([]);
    setTitleKeywords('');
    setNegativeKeywords('');
    setThumbnailPrompt('');
    setTitlesError(null);
    setThumbnailError(null);
    setGeneratedImageUrl(null);
    setImageError(null);
    setChosenTitle('');
    setError(null);
    setScriptAttempt(null);
    setActiveTab('titles');
    setImagePrompts([]);
    setIsGeneratingImagePrompts(false);
    setImagePromptsError(null);
    setGeneratedSceneImages({});
    setIsGeneratingSceneImage({});
    setSceneImageError({});
    setVideoPrompts([]);
    setIsGeneratingVideoPrompts(false);
    setVideoPromptsError(null);
  }

  const handleModeSelection = (mode: GenerationMode) => {
    setGenerationMode(mode);
    resetAllOutputs();
    setInputText('');
    setLoglineIdea('');
    setGeneratedLogline('');
    setLoglineError(null);
  }

  const handleGenerateLogline = useCallback(async () => {
    if (!loglineIdea.trim()) {
      setLoglineError('Por favor, insira uma ideia para gerar a logline.');
      return;
    }
    setIsGeneratingLogline(true);
    setLoglineError(null);
    setGeneratedLogline('');
    try {
      const logline = await generateLogline(loglineIdea, language);
      setGeneratedLogline(logline);
    } catch (err) {
      setLoglineError('Ocorreu um erro ao gerar a logline.');
      console.error(err);
    } finally {
      setIsGeneratingLogline(false);
    }
  }, [loglineIdea, language]);

  const handleGenerateScript = useCallback(async () => {
    const sourceText = generationMode === 'logline' ? generatedLogline : inputText;

    if (!sourceText.trim()) {
      setError(generationMode === 'logline' ? 'Gere e aprove uma logline primeiro.' : 'Por favor, insira um texto para transformar.');
      return;
    }

    setIsLoading(true);
    resetAllOutputs();
    setLoadingMessage('Gerando roteiro longo...');

    try {
      const script = await generateDocumentaryScript(sourceText, language);
      const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;
      
      setOutputText(script);

      if (wordCount < MIN_WORDS) {
        setScriptAttempt({
          script,
          wordCount,
          message: `Roteiro abaixo do ideal (${wordCount} palavras). Gostaria de gerar novamente para tentar expandir?`
        });
      } else if (wordCount > MAX_WORDS) {
        setScriptAttempt({
          script,
          wordCount,
          message: `Roteiro acima do ideal (${wordCount} palavras). Gostaria de gerar novamente para tentar resumir?`
        });
      }

    } catch (err) {
      setError('Ocorreu um erro ao gerar o roteiro. Por favor, tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, language, generationMode, generatedLogline]);
  
  const handleRetryGeneration = useCallback(async () => {
    if (!scriptAttempt) return;
    const sourceText = generationMode === 'logline' ? generatedLogline : inputText;

    setIsLoading(true);
    setLoadingMessage('Ajustando roteiro...');
    const { script: previousScript, wordCount: previousWordCount } = scriptAttempt;
    setScriptAttempt(null);

    try {
        const newScript = await generateDocumentaryScript(sourceText, language, previousScript, previousWordCount);
        setOutputText(newScript);
    } catch (err) {
        setError('Ocorreu um erro ao tentar ajustar o roteiro.');
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [scriptAttempt, inputText, language, generationMode, generatedLogline]);

  const handleCancelRetry = () => {
    setScriptAttempt(null);
  };


  const handleGenerateTitles = useCallback(async () => {
    if (!outputText) return;
    setIsGeneratingTitles(true);
    setTitlesError(null);
    setTitles([]);
    try {
        const result = await generateTitles(outputText, language);
        setTitles(result);
    } catch (err) {
        setTitlesError('Erro ao gerar títulos.');
        console.error(err);
    } finally {
        setIsGeneratingTitles(false);
    }
  }, [outputText, language]);

  const handleGenerateThumbnailPrompt = useCallback(async () => {
    if (!outputText) return;
    setIsGeneratingThumbnailPrompt(true);
    setThumbnailError(null);
    setThumbnailPrompt('');
    try {
        const result = await generateThumbnailPrompt(outputText, language);
        setThumbnailPrompt(result);
    } catch (err) {
        setThumbnailError('Erro ao gerar a sugestão de prompt.');
        console.error(err);
    } finally {
        setIsGeneratingThumbnailPrompt(false);
    }
  }, [outputText, language]);

  const handleRegenerateTitles = useCallback(async () => {
    if (!outputText) return;
    setIsGeneratingTitles(true);
    setTitlesError(null);
    setTitles([]);
    try {
        const newTitles = await generateTitlesOnly(outputText, language, selectedTitles, titleKeywords, negativeKeywords);
        setTitles(newTitles);
        setSelectedTitles([]); // Limpa a seleção após gerar novos títulos
    } catch (err) {
        setTitlesError('Erro ao gerar novos títulos.');
        console.error(err);
    } finally {
        setIsGeneratingTitles(false);
    }
  }, [outputText, language, selectedTitles, titleKeywords, negativeKeywords]);
  
  const handleTranslateTitles = useCallback(async () => {
    if (!titles.length) return;
    setIsTranslatingTitles(true);
    setTitlesError(null);
    try {
        const translated = await translateTitlesToPortuguese(titles);
        setTitles(translated);
    } catch (err) {
        setTitlesError('Erro ao traduzir os títulos.');
        console.error(err);
    } finally {
        setIsTranslatingTitles(false);
    }
  }, [titles]);


  const handleTitleSelection = (titleToToggle: string) => {
    setSelectedTitles(prev => 
      prev.includes(titleToToggle)
        ? prev.filter(title => title !== titleToToggle)
        : [...prev, titleToToggle]
    );
  };
  
  const handleCopyTitle = (title: string) => {
    navigator.clipboard.writeText(title);
    setCopiedTitle(title);
    setTimeout(() => setCopiedTitle(null), 2000);
  };

  const handleGenerateImage = useCallback(async () => {
    if (!thumbnailPrompt) return;
    setIsGeneratingImage(true);
    setImageError(null);
    setGeneratedImageUrl(null);
    try {
      const base64Image = await generateImageFromPrompt(thumbnailPrompt);
      setGeneratedImageUrl(`data:image/jpeg;base64,${base64Image}`);
    } catch (err) {
      setImageError('Erro ao gerar a imagem.');
      console.error(err);
    } finally {
      setIsGeneratingImage(false);
    }
  }, [thumbnailPrompt]);
  
  const handleDownloadImage = () => {
    if (!generatedImageUrl) return;
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = 'thumbnail-gerada.jpeg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handlers for the "Images" tab
  const handleGenerateImagePrompts = useCallback(async () => {
    if (!outputText) return;
    setIsGeneratingImagePrompts(true);
    setImagePromptsError(null);
    setImagePrompts([]);
    try {
      const prompts = await generateImagePrompts(outputText, language);
      setImagePrompts(prompts);
    } catch (err) {
      setImagePromptsError('Erro ao gerar sugestões de imagem.');
      console.error(err);
    } finally {
      setIsGeneratingImagePrompts(false);
    }
  }, [outputText, language]);

  const handleGenerateSceneImage = useCallback(async (prompt: string) => {
    if (!prompt) return;
    setIsGeneratingSceneImage(prev => ({ ...prev, [prompt]: true }));
    setSceneImageError(prev => ({ ...prev, [prompt]: null }));
    try {
      const base64Image = await generateImageFromPrompt(prompt);
      setGeneratedSceneImages(prev => ({ ...prev, [prompt]: `data:image/jpeg;base64,${base64Image}` }));
    } catch (err) {
      setSceneImageError(prev => ({ ...prev, [prompt]: 'Erro ao gerar imagem.' }));
      console.error(err);
    } finally {
      setIsGeneratingSceneImage(prev => ({ ...prev, [prompt]: false }));
    }
  }, []);

  const handleDownloadSceneImage = (url: string, prompt: string) => {
    const link = document.createElement('a');
    link.href = url;
    // Creates a simplified filename from the prompt
    const filename = prompt.toLowerCase().replace(/\s+/g, '-').substring(0, 50) + '.jpeg';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleCopyScenePrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedScenePrompt(prompt);
    setTimeout(() => setCopiedScenePrompt(null), 2000);
  };

  const handleCopyAllPrompts = () => {
    if (imagePrompts.length > 0) {
      const allPromptsText = imagePrompts
        .map((prompt, index) => `Cena ${index + 1}:\n"${prompt}"`)
        .join('\n\n---\n\n');
      navigator.clipboard.writeText(allPromptsText);
      setIsAllPromptsCopied(true);
      setTimeout(() => setIsAllPromptsCopied(false), 3000);
    }
  };

  // Handlers for the "Videos" tab
  const handleGenerateVideoPrompts = useCallback(async () => {
    if (imagePrompts.length === 0) {
        setVideoPromptsError("Gere os prompts de imagem primeiro.");
        return;
    }
    setIsGeneratingVideoPrompts(true);
    setVideoPromptsError(null);
    setVideoPrompts([]);
    try {
        const prompts = await generateVideoPrompts(imagePrompts, language);
        setVideoPrompts(prompts);
    } catch (err) {
        setVideoPromptsError('Erro ao gerar sugestões de vídeo.');
        console.error(err);
    } finally {
        setIsGeneratingVideoPrompts(false);
    }
  }, [imagePrompts, language]);

  const handleCopyVideoPrompt = (prompt: string) => {
      navigator.clipboard.writeText(prompt);
      setCopiedVideoPrompt(prompt);
      setTimeout(() => setCopiedVideoPrompt(null), 2000);
  };

  const handleCopyAllVideoPrompts = () => {
      if (videoPrompts.length > 0) {
          const allPromptsText = videoPrompts
              .map((prompt, index) => `Cena de Vídeo ${index + 1}:\n"${prompt}"`)
              .join('\n\n---\n\n');
          navigator.clipboard.writeText(allPromptsText);
          setIsAllVideoPromptsCopied(true);
          setTimeout(() => setIsAllVideoPromptsCopied(false), 3000);
      }
  };

  const handleCopy = () => {
    if (outputText) {
      navigator.clipboard.writeText(outputText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };
  
  const handleCopyThumbnailPrompt = () => {
    if (thumbnailPrompt) {
      navigator.clipboard.writeText(thumbnailPrompt);
      setIsThumbnailPromptCopied(true);
      setTimeout(() => setIsThumbnailPromptCopied(false), 2000);
    }
  };

  const handleCopyToDoc = () => {
    if (!chosenTitle || !outputText || !thumbnailPrompt) return;

    const contentForDoc = `Título: ${chosenTitle}\n\n---\n\nSugestão de Prompt para Thumbnail:\n${thumbnailPrompt}\n\n---\n\nRoteiro Gerado:\n\n${outputText}`;

    navigator.clipboard.writeText(contentForDoc);
    setIsCopiedForDoc(true);
    setTimeout(() => setIsCopiedForDoc(false), 3000);
  };

  const outputCharCount = outputText.length;
  const outputWordCount = outputText.trim() ? outputText.trim().split(/\s+/).length : 0;
  
  const getWordCounterColor = () => {
    if (outputWordCount === 0) return 'text-gray-500 dark:text-gray-400';
    if (outputWordCount >= MIN_WORDS && outputWordCount <= MAX_WORDS) return 'text-green-600 dark:text-green-400';
    return 'text-red-600 dark:text-red-500';
  };

  const renderInputPanel = () => {
    if (generationMode === null) {
      return (
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-lg min-h-[448px]">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">Como você quer começar?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-md">
                <button 
                    onClick={() => handleModeSelection('logline')}
                    className="flex flex-col items-center justify-center p-6 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-cyan-500 transition-all duration-300 transform hover:-translate-y-1"
                >
                    <PencilSparkleIcon className="w-12 h-12 text-cyan-400 mb-3" />
                    <span className="font-semibold text-lg text-gray-800 dark:text-gray-200">Começar com uma Ideia</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">Gere uma logline para guiar a criação do seu roteiro.</span>
                </button>
                <button 
                    onClick={() => handleModeSelection('text')}
                    className="flex flex-col items-center justify-center p-6 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-sky-500 transition-all duration-300 transform hover:-translate-y-1"
                >
                    <DocumentTextIcon className="w-12 h-12 text-sky-400 mb-3" />
                    <span className="font-semibold text-lg text-gray-800 dark:text-gray-200">Começar com um Texto</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">Use uma transcrição ou texto longo como base.</span>
                </button>
            </div>
        </div>
      );
    }
    
    if (generationMode === 'text') {
       return (
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <label htmlFor="input-text" className="text-lg font-semibold text-gray-700 dark:text-gray-300">Seu Texto Original</label>
              <button onClick={() => handleModeSelection(null)} className="text-sm text-cyan-500 hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300">&larr; Voltar</button>
            </div>
            <div className="relative flex-grow">
              <textarea
                id="input-text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Cole aqui a transcrição de um vídeo ou um texto longo..."
                className="w-full h-96 p-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>
       );
    }

    if (generationMode === 'logline') {
      return (
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                  <label htmlFor="logline-idea" className="text-lg font-semibold text-gray-700 dark:text-gray-300">Sua Ideia</label>
                  <button onClick={() => handleModeSelection(null)} className="text-sm text-cyan-500 hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300">&larr; Voltar</button>
              </div>
              <textarea
                  id="logline-idea"
                  value={loglineIdea}
                  onChange={(e) => setLoglineIdea(e.target.value)}
                  placeholder="Ex: A história de um programador que criou uma IA que ficou consciente."
                  className="w-full p-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-lg resize-none h-28 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 text-gray-800 dark:text-gray-200"
              />
              <button
                  onClick={handleGenerateLogline}
                  disabled={isGeneratingLogline || !loglineIdea.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white dark:bg-gray-600 font-semibold rounded-md hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
              >
                  <PencilSparkleIcon className="w-5 h-5" />
                  {isGeneratingLogline ? 'Gerando Logline...' : 'Gerar Logline'}
              </button>

              {loglineError && <div className="text-red-500 dark:text-red-400 text-center mt-2">{loglineError}</div>}
              
              <div className="mt-2">
                <label className="text-lg font-semibold text-gray-700 dark:text-gray-300">Logline Gerada</label>
                <div className="w-full min-h-[100px] mt-2 p-3 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center text-center">
                    {isGeneratingLogline ? <Loader /> : (
                      <p className="text-cyan-600 dark:text-cyan-300 italic">{generatedLogline || 'Sua logline aparecerá aqui...'}</p>
                    )}
                </div>
              </div>
          </div>
      );
    }

    return null;
  }

  const isGenerateButtonDisabled = () => {
    if (isLoading) return true;
    if (generationMode === 'text') return !inputText.trim();
    if (generationMode === 'logline') return !generatedLogline.trim();
    return true;
  }
  
  const getGenerateButtonText = () => {
    if (isLoading) return 'Gerando...';
    if (generationMode === 'logline') return 'Usar Logline e Gerar Roteiro';
    return 'Gerar Roteiro';
  }

  const getTabClassName = (tabName: ActiveTab) => {
    const baseClasses = "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 font-semibold text-sm sm:text-base border-b-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-cyan-400 rounded-t-lg";
    if (activeTab === tabName) {
      return `${baseClasses} bg-white dark:bg-gray-800 border-cyan-500 dark:border-cyan-400 text-cyan-600 dark:text-cyan-300`;
    }
    return `${baseClasses} border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50 hover:text-gray-700 dark:hover:text-gray-200`;
  };
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-3 mb-2">
            <SparklesIcon className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-sky-500 to-cyan-400 text-transparent bg-clip-text">
              Gerador de Roteiro para Documentário
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
           {generationMode === null ? 
            'Escolha como começar e a IA criará um roteiro de documentário com 5000 a 6500 palavras.' :
            'A IA transformará sua ideia ou texto em um roteiro de documentário com 5000 a 6500 palavras.'
           }
          </p>
        </header>

        <main className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Input Panel */}
          {renderInputPanel()}

          {/* Output Panel */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <label htmlFor="output-text" className="text-lg font-semibold text-gray-700 dark:text-gray-300">Roteiro Gerado</label>
              {outputText && !isLoading && (
                <div className="flex items-center gap-2">
                  <a
                    href="https://content-creation-tools-pctn.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-200"
                  >
                    <CaptionIcon className="w-4 h-4" />
                    <span>Criar Legenda</span>
                  </a>
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-200"
                  >
                    <ClipboardIcon className="w-4 h-4" />
                    {isCopied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              )}
            </div>
            <div id="output-text" className="relative w-full h-96">
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-gray-800/75 rounded-lg z-10">
                  <Loader />
                  <p className="mt-4 text-gray-700 dark:text-gray-300 text-center">{loadingMessage}</p>
                </div>
              )}
              {error ? (
                <div className="w-full h-full p-4 bg-red-100/50 dark:bg-gray-800 border-2 border-red-300 dark:border-gray-700 rounded-lg flex items-center justify-center text-center text-red-600 dark:text-red-400">
                  {error}
                </div>
              ) : (
                <textarea
                  id="output-textarea"
                  value={outputText}
                  onChange={(e) => setOutputText(e.target.value)}
                  placeholder={
                    generationMode === null
                      ? 'Escolha um modo para começar.'
                      : 'Seu roteiro aparecerá aqui. Você também pode colar ou editar o texto manualmente...'
                  }
                  className="w-full h-full p-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 text-gray-800 dark:text-gray-200 font-sans"
                  disabled={isLoading}
                />
              )}
            </div>
            {scriptAttempt && !isLoading && (
              <div className="mt-4 p-4 bg-yellow-100/80 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg text-center shadow-lg">
                <p className="text-yellow-800 dark:text-yellow-200 mb-3 font-medium">{scriptAttempt.message}</p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleRetryGeneration}
                    className="px-5 py-2 bg-green-600 text-white hover:bg-green-500 rounded-md font-semibold transition-colors duration-200"
                  >
                    Sim, gerar novamente
                  </button>
                  <button
                    onClick={handleCancelRetry}
                    className="px-5 py-2 bg-gray-500 dark:bg-gray-600 text-white hover:bg-gray-600 dark:hover:bg-gray-500 rounded-md transition-colors duration-200"
                  >
                    Não, usar este
                  </button>
                </div>
              </div>
            )}
            {!isLoading && !error && outputText && (
              <div className="flex justify-end items-center gap-4 text-sm font-medium mt-2">
                <span className={getWordCounterColor()}>
                  Total de palavras: {outputWordCount}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  Total de caracteres: {outputCharCount}
                </span>
              </div>
            )}
          </div>
        </main>
        
        {/* Title and Thumbnail Generation Section with Tabs */}
        {outputText && !isLoading && !error && (
          <section className="mt-12 w-full">
            <div className="border-b border-gray-300 dark:border-gray-700">
              <nav className="-mb-px flex flex-wrap gap-x-2" aria-label="Tabs">
                <button onClick={() => setActiveTab('titles')} className={getTabClassName('titles')}>
                  <LightbulbIcon className="w-5 h-5" /> Títulos
                </button>
                <button onClick={() => setActiveTab('thumbnail')} className={getTabClassName('thumbnail')}>
                  <ImageIcon className="w-5 h-5" /> Thumbnail
                </button>
                 <button onClick={() => setActiveTab('images')} className={getTabClassName('images')}>
                  <ImageIcon className="w-5 h-5" /> Imagens do Roteiro
                </button>
                <button onClick={() => setActiveTab('videos')} className={getTabClassName('videos')}>
                    <VideoCameraIcon className="w-5 h-5" /> Vídeos
                </button>
              </nav>
            </div>
            
            <div className="mt-6">
              {/* Titles Tab Content */}
              {activeTab === 'titles' && (
                <div>
                  {titles.length === 0 && !isGeneratingTitles && (
                    <div className="text-center">
                        <button
                          onClick={handleGenerateTitles}
                          disabled={isGeneratingTitles}
                          className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-gray-800 text-white dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg shadow-md hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 disabled:opacity-50"
                        >
                          <LightbulbIcon className="w-5 h-5"/>
                          <span>Gerar Sugestões de Título</span>
                        </button>
                    </div>
                  )}
                  {isGeneratingTitles && titles.length === 0 && (
                      <div className="flex justify-center items-center mt-6">
                          <Loader />
                          <p className="ml-4 text-gray-700 dark:text-gray-300">Buscando inspiração para títulos...</p>
                      </div>
                  )}
                  {titlesError && <div className="text-red-600 dark:text-red-400 text-center mt-6 bg-red-100/50 dark:bg-red-900/20 p-4 rounded-lg">{titlesError}</div>}
                  
                  {titles.length > 0 && (
                     <div>
                        <div className="flex flex-wrap gap-2 justify-between items-center mb-3">
                          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Sugestões de Título</h3>
                          <div className="flex items-center gap-2">
                            {language !== 'BR' && !isGeneratingTitles && (
                              <button onClick={handleTranslateTitles} disabled={isTranslatingTitles} className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-200 disabled:opacity-50" aria-label="Traduzir títulos para Português (BR)">
                                <LanguageIcon className="w-4 h-4" /> <span>{isTranslatingTitles ? 'Traduzindo...' : 'Traduzir para PT-BR'}</span>
                              </button>
                            )}
                            <button onClick={handleRegenerateTitles} disabled={isGeneratingTitles} className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-200 disabled:opacity-50" aria-label="Gerar novos títulos">
                              <RefreshIcon className="w-4 h-4" /> <span>{isGeneratingTitles ? 'Gerando...' : 'Gerar Novamente'}</span>
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2 mb-3">
                          <input type="text" value={titleKeywords} onChange={(e) => setTitleKeywords(e.target.value)} placeholder="Incluir palavras-chave (ex: conspiração, segredo)" className="w-full p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500" />
                          <input type="text" value={negativeKeywords} onChange={(e) => setNegativeKeywords(e.target.value)} placeholder="Excluir palavras (ex: polêmico, chocou)" className="w-full p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500" />
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-lg min-h-[200px] relative">
                          {isGeneratingTitles && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/75 dark:bg-gray-800/75 rounded-lg"><Loader /></div>
                          )}
                          <ul className="space-y-3">
                            {titles.map((title, index) => (
                              <li key={index} className="flex items-center justify-between gap-2 group">
                                <div className="flex items-start flex-1">
                                  <input type="checkbox" id={`title-${index}`} checked={selectedTitles.includes(title)} onChange={() => handleTitleSelection(title)} className="mt-1 mr-3 h-5 w-5 rounded border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-cyan-500 focus:ring-cyan-600 focus:ring-offset-white dark:focus:ring-offset-gray-800" aria-labelledby={`title-label-${index}`} />
                                  <span id={`title-label-${index}`} className={`flex-1 select-text ${chosenTitle === title ? 'text-cyan-500 dark:text-cyan-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>{title}</span>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                  <button onClick={() => setChosenTitle(title)} className={`p-1.5 rounded-md ${chosenTitle === title ? 'bg-yellow-400/20 text-yellow-500 dark:bg-yellow-500/20 dark:text-yellow-400' : 'bg-gray-200/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 hover:text-yellow-500 dark:hover:text-yellow-400'}`} aria-label={`Escolher título: ${title}`}><StarIcon className="w-4 h-4" /></button>
                                  <button onClick={() => handleCopyTitle(title)} className="p-1.5 rounded-md bg-gray-200/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 hover:text-cyan-500 dark:hover:text-cyan-400" aria-label={`Copiar título: ${title}`}>{copiedTitle === title ? <CheckIcon className="w-4 h-4 text-green-500 dark:text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}</button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                  )}
                </div>
              )}

              {/* Thumbnail Tab Content */}
              {activeTab === 'thumbnail' && (
                <div className="space-y-6">
                  {isGeneratingThumbnailPrompt && (
                     <div className="flex justify-center items-center">
                        <Loader />
                        <p className="ml-4 text-gray-700 dark:text-gray-300">Criando sugestão de prompt...</p>
                    </div>
                  )}
                  {thumbnailError && <div className="text-red-600 dark:text-red-400 text-center bg-red-100/50 dark:bg-red-900/20 p-4 rounded-lg">{thumbnailError}</div>}
                  
                  {!thumbnailPrompt && !isGeneratingThumbnailPrompt && !thumbnailError && (
                     <div className="text-center">
                        <button
                          onClick={handleGenerateThumbnailPrompt}
                          disabled={isGeneratingThumbnailPrompt}
                          className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-gray-800 text-white dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg shadow-md hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 disabled:opacity-50"
                        >
                          <PencilSparkleIcon className="w-5 h-5"/>
                          <span>Gerar Sugestão de Prompt</span>
                        </button>
                    </div>
                  )}

                  {thumbnailPrompt && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Prompt para Thumbnail</h3>
                        <button onClick={handleCopyThumbnailPrompt} className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-200">
                          <ClipboardIcon className="w-4 h-4" /> {isThumbnailPromptCopied ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                      <textarea
                        value={thumbnailPrompt}
                        onChange={(e) => setThumbnailPrompt(e.target.value)}
                        className="w-full h-32 p-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 font-mono text-sm resize-y focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                        placeholder="Edite o prompt para a thumbnail aqui..."
                      />
                      <div className="text-center">
                            <button
                                onClick={handleGenerateImage}
                                disabled={isGeneratingImage || !thumbnailPrompt}
                                className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow-md transition-colors duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 disabled:opacity-50"
                            >
                                <ImageIcon className="w-5 h-5" />
                                <span>{isGeneratingImage ? 'Gerando Imagem...' : 'Gerar Imagem com o Prompt'}</span>
                            </button>
                        </div>
                    </div>
                  )}

                  {isGeneratingImage && (
                    <div className="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg min-h-[200px]">
                      <Loader />
                      <p className="mt-2 text-gray-600 dark:text-gray-400">Criando a imagem da thumbnail...</p>
                      <p className="text-sm text-gray-500 mt-1">(Isso pode levar um momento)</p>
                    </div>
                  )}
                  {imageError && (
                    <div className="text-red-600 dark:text-red-400 text-center bg-red-100/50 dark:bg-red-900/20 p-4 rounded-lg">{imageError}</div>
                  )}
                  
                  {generatedImageUrl && !isGeneratingImage && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                         <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Imagem Gerada</h4>
                         <button onClick={handleDownloadImage} className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-200" aria-label="Baixar imagem gerada">
                            <DownloadIcon className="w-4 h-4" /> <span>Baixar</span>
                         </button>
                      </div>
                      <img src={generatedImageUrl} alt="Thumbnail gerada pela IA" className="rounded-lg border-2 border-gray-300 dark:border-gray-700 w-full" />
                    </div>
                  )}
                </div>
              )}
                {/* Images Tab Content */}
                {activeTab === 'images' && (
                  <div className="space-y-8">
                    {isGeneratingImagePrompts && imagePrompts.length === 0 && (
                      <div className="flex justify-center items-center">
                        <Loader />
                        <p className="ml-4 text-gray-700 dark:text-gray-300">Analisando o roteiro para criar 100 prompts...</p>
                      </div>
                    )}
                    {imagePromptsError && <div className="text-red-600 dark:text-red-400 text-center bg-red-100/50 dark:bg-red-900/20 p-4 rounded-lg">{imagePromptsError}</div>}
                    
                    {!isGeneratingImagePrompts && imagePrompts.length === 0 && (
                      <div className="text-center">
                        <button
                          onClick={handleGenerateImagePrompts}
                          className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-gray-800 text-white dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg shadow-md hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500/50"
                        >
                          <PencilSparkleIcon className="w-5 h-5"/>
                          <span>Gerar 100 Prompts de Cena (Cronológico)</span>
                        </button>
                      </div>
                    )}

                    {imagePrompts.length > 0 && (
                      <div>
                        <div className="mb-6 flex justify-center flex-wrap gap-4">
                          <button
                            onClick={handleCopyAllPrompts}
                            className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-gray-800 text-white dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg shadow-md hover:bg-gray-700 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-500/50"
                          >
                            <ClipboardIcon className="w-5 h-5"/>
                            <span>{isAllPromptsCopied ? 'Todos os 100 prompts copiados!' : 'Copiar Todos os Prompts'}</span>
                          </button>
                          <button
                            onClick={handleGenerateImagePrompts}
                            disabled={isGeneratingImagePrompts}
                            className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-gray-800 text-white dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg shadow-md hover:bg-gray-700 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 disabled:opacity-50"
                          >
                            <RefreshIcon className="w-5 h-5"/>
                            <span>{isGeneratingImagePrompts ? 'Refazendo...' : 'Refazer Prompts'}</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {imagePrompts.map((prompt, index) => (
                            <div key={index} className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-lg space-y-3 flex flex-col">
                              <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-gray-800 dark:text-gray-200">Cena {index + 1}</h4>
                                    <span className="text-xs font-mono px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                        {index + 1} / {imagePrompts.length}
                                    </span>
                                </div>
                                <button 
                                  onClick={() => handleCopyScenePrompt(prompt)}
                                  className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
                                  aria-label={`Copiar prompt da cena ${index + 1}`}
                                >
                                  {copiedScenePrompt === prompt 
                                    ? <CheckIcon className="w-4 h-4 text-green-500 dark:text-green-400" /> 
                                    : <ClipboardIcon className="w-4 h-4" />
                                  }
                                </button>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 text-sm font-mono flex-grow">"{prompt}"</p>
                              
                              {!generatedSceneImages[prompt] && !isGeneratingSceneImage[prompt] && (
                                  <button 
                                  onClick={() => handleGenerateSceneImage(prompt)}
                                  className="w-full mt-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-700 dark:hover:bg-cyan-600 text-white font-semibold rounded-md transition-colors"
                                  >
                                  <ImageIcon className="w-5 h-5" />
                                  Gerar Imagem
                                  </button>
                              )}
                              
                              {isGeneratingSceneImage[prompt] && (
                                  <div className="flex flex-col items-center justify-center min-h-[100px]">
                                      <Loader />
                                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Gerando...</p>
                                  </div>
                              )}

                              {sceneImageError[prompt] && (
                                  <div className="text-red-600 dark:text-red-400 text-center text-sm p-2 rounded-md bg-red-100/50 dark:bg-red-900/20">
                                      {sceneImageError[prompt]}
                                  </div>
                              )}

                              {generatedSceneImages[prompt] && (
                                  <div className="space-y-2">
                                  <img src={generatedSceneImages[prompt]} alt={`Imagem gerada para: ${prompt.substring(0, 30)}...`} className="rounded-lg border-2 border-gray-300 dark:border-gray-600 w-full" />
                                  <button onClick={() => handleDownloadSceneImage(generatedSceneImages[prompt], prompt)} className="w-full flex items-center justify-center gap-2 px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-200" aria-label="Baixar imagem gerada">
                                      <DownloadIcon className="w-4 h-4" /> <span>Baixar</span>
                                  </button>
                                  </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                 {/* Videos Tab Content */}
                 {activeTab === 'videos' && (
                    <div className="space-y-8">
                      {imagePrompts.length === 0 ? (
                        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                          <VideoCameraIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-300">Primeiro, crie as cenas.</h3>
                          <p className="text-gray-600 dark:text-gray-400 mt-2 mb-6">Os prompts de vídeo são baseados nos prompts de imagem. Por favor, gere os prompts na aba anterior primeiro.</p>
                          <button
                            onClick={() => setActiveTab('images')}
                            className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow-md transition-colors"
                          >
                            <ImageIcon className="w-5 h-5" />
                            <span>Ir para 'Imagens do Roteiro'</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          {isGeneratingVideoPrompts && videoPrompts.length === 0 && (
                            <div className="flex justify-center items-center">
                              <Loader />
                              <p className="ml-4 text-gray-700 dark:text-gray-300">Animando as cenas do roteiro...</p>
                            </div>
                          )}
                          {videoPromptsError && <div className="text-red-600 dark:text-red-400 text-center bg-red-100/50 dark:bg-red-900/20 p-4 rounded-lg">{videoPromptsError}</div>}
                          
                          {!isGeneratingVideoPrompts && videoPrompts.length === 0 && (
                            <div className="text-center">
                              <button
                                onClick={handleGenerateVideoPrompts}
                                className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-gray-800 text-white dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg shadow-md hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500/50"
                              >
                                <PencilSparkleIcon className="w-5 h-5"/>
                                <span>Gerar 100 Prompts de Vídeo</span>
                              </button>
                            </div>
                          )}

                          {videoPrompts.length > 0 && (
                            <div>
                              <div className="mb-6 flex justify-center flex-wrap gap-4">
                                <button
                                  onClick={handleCopyAllVideoPrompts}
                                  className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-gray-800 text-white dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg shadow-md hover:bg-gray-700 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-500/50"
                                >
                                  <ClipboardIcon className="w-5 h-5"/>
                                  <span>{isAllVideoPromptsCopied ? 'Todos os prompts de vídeo copiados!' : 'Copiar Todos os Prompts'}</span>
                                </button>
                                <button
                                  onClick={handleGenerateVideoPrompts}
                                  disabled={isGeneratingVideoPrompts}
                                  className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-gray-800 text-white dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg shadow-md hover:bg-gray-700 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 disabled:opacity-50"
                                >
                                  <RefreshIcon className="w-5 h-5"/>
                                  <span>{isGeneratingVideoPrompts ? 'Refazendo...' : 'Refazer Prompts'}</span>
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {videoPrompts.map((videoPrompt, index) => (
                                  <div key={index} className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-lg space-y-3 flex flex-col">
                                    <div className="flex justify-between items-start">
                                      <h4 className="font-bold text-gray-800 dark:text-gray-200">Cena de Vídeo {index + 1}</h4>
                                      <button 
                                        onClick={() => handleCopyVideoPrompt(videoPrompt)}
                                        className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
                                        aria-label={`Copiar prompt de vídeo da cena ${index + 1}`}
                                      >
                                        {copiedVideoPrompt === videoPrompt 
                                          ? <CheckIcon className="w-4 h-4 text-green-500 dark:text-green-400" /> 
                                          : <ClipboardIcon className="w-4 h-4" />
                                        }
                                      </button>
                                    </div>
                                    <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-700">
                                      <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">Baseado na Imagem:</p>
                                      <p className="text-gray-600 dark:text-gray-400 text-sm font-mono italic">"{imagePrompts[index]}"</p>
                                    </div>
                                    <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-md border border-cyan-200 dark:border-cyan-700 flex-grow">
                                      <p className="text-xs text-cyan-700 dark:text-cyan-300 font-semibold mb-1">Prompt de Vídeo (Animação):</p>
                                      <p className="text-cyan-800 dark:text-cyan-200 text-sm font-mono">"{videoPrompt}"</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                )}
            </div>
          </section>
        )}

         {/* Finalization Section */}
        {outputText && !isLoading && !error && (
            <section className="mt-12 w-full max-w-4xl mx-auto">
                <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800 dark:text-gray-200">Finalização</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-300 dark:border-gray-700 space-y-4">
                    <div>
                        <label htmlFor="chosen-title" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Título Escolhido</label>
                        <input
                            id="chosen-title"
                            type="text"
                            readOnly
                            value={chosenTitle}
                            placeholder="Escolha um título na aba 'Títulos'..."
                            className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-lg text-cyan-600 dark:text-cyan-400 font-semibold placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>
                    <button
                        onClick={handleCopyToDoc}
                        disabled={!chosenTitle || !thumbnailPrompt}
                        className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-500 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <GoogleDocIcon className="w-6 h-6" />
                        <span>{isCopiedForDoc ? 'Copiado! Cole no Google Docs' : 'Copiar Conteúdo para Google Docs'}</span>
                    </button>
                    {!thumbnailPrompt && <p className="text-center text-sm text-yellow-600 dark:text-yellow-400">Gere uma sugestão de thumbnail para habilitar a cópia.</p>}
                </div>
            </section>
        )}
        
        <footer className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-gray-300 dark:border-gray-700 pt-8">
          <button
              onClick={toggleTheme}
              className="p-3 bg-gray-200 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
              aria-label={`Mudar para modo ${theme === 'light' ? 'escuro' : 'claro'}`}
            >
              {theme === 'light' ? (
                <MoonIcon className="w-5 h-5" />
              ) : (
                <SunIcon className="w-5 h-5" />
              )}
          </button>
          <div className="flex items-center gap-3">
            <label htmlFor="language-select" className="font-medium text-gray-700 dark:text-gray-300">Idioma:</label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-200 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
            >
              <option value="BR">Português (BR)</option>
              <option value="EN">Inglês (EN)</option>
              <option value="ES">Espanhol (ES)</option>
            </select>
          </div>
          <button
            onClick={handleGenerateScript}
            disabled={isGenerateButtonDisabled()}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold rounded-lg shadow-lg hover:from-sky-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <FilmIcon className="w-5 h-5"/>
            <span>{getGenerateButtonText()}</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default App;