
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateDocumentaryScript, generateTitles, generateThumbnailPrompt, generateImageFromPrompt, generateLogline, translateTitles, generateTitlesOnly, generateImagePrompts, generateVideoPrompts } from './services/geminiService';
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
import { PlusIcon } from './components/icons/PlusIcon';
import { TrashIcon } from './components/icons/TrashIcon';
import { SaveIcon } from './components/icons/SaveIcon';


const MIN_WORDS = 5000;
const MAX_WORDS = 6500;

type GenerationMode = 'text' | 'logline' | null;
type ActiveTab = 'titles' | 'thumbnail' | 'images' | 'videos';
type Theme = 'light' | 'dark';
type View = 'dashboard' | 'editor';
type VideoStatus = 'pending' | 'completed';


interface ScriptAttempt {
  script: string;
  wordCount: number;
  message: string;
}

interface SavedScript {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  sourceText: string;
  generationMode: GenerationMode;
  script: string;
  titles: string[];
  thumbnailPrompt: string;
  generatedImageUrl: string | null;
  imagePrompts: string[];
  videoPrompts: string[];
  videoProgress: Record<number, boolean>;
  videoStatus: VideoStatus;
}

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [view, setView] = useState<View>('editor');
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([]);
  const [currentScriptId, setCurrentScriptId] = useState<string | null>(null);

  const [generationMode, setGenerationMode] = useState<GenerationMode>('text');

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
  const [translationTarget, setTranslationTarget] = useState<'EN' | 'ES' | null>(null);
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
  const [videoProgress, setVideoProgress] = useState<Record<number, boolean>>({});

  // Manual save state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveConfirmation, setSaveConfirmation] = useState<boolean>(false);
  const isInitialLoadRef = useRef(true);
  
  // Load scripts from localStorage on initial render
  useEffect(() => {
    try {
        const storedScripts = localStorage.getItem('documentaryScripts');
        if (storedScripts) {
            const parsedScripts: (Omit<SavedScript, 'videoStatus'> & { videoStatus?: VideoStatus })[] = JSON.parse(storedScripts);
            const scriptsWithDefaults = parsedScripts.map(script => ({
                ...script,
                videoStatus: script.videoStatus || 'pending', // Set default for old scripts
            })) as SavedScript[];
            setSavedScripts(scriptsWithDefaults);
        }
    } catch (error) {
        console.error("Failed to load scripts from localStorage", error);
    }
}, []);
  
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

  const resetAllOutputs = (resetInputs = false) => {
    if (resetInputs) {
        setInputText('');
        setLoglineIdea('');
        setGeneratedLogline('');
        setLoglineError(null);
        setGenerationMode(null);
        setCurrentScriptId(null);
    }
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
    setVideoProgress({});
  }

  const handleModeSelection = (mode: GenerationMode) => {
    setGenerationMode(mode);
  }
  
  const handleCreateNew = () => {
    resetAllOutputs(true);
    setView('editor');
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
        const result = await generateTitles(outputText, 'BR');
        setTitles(result.map(title => title.toUpperCase()));
    } catch (err) {
        setTitlesError('Erro ao gerar títulos.');
        console.error(err);
    } finally {
        setIsGeneratingTitles(false);
    }
  }, [outputText]);

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
        const newTitles = await generateTitlesOnly(outputText, 'BR', selectedTitles, titleKeywords, negativeKeywords);
        setTitles(newTitles.map(title => title.toUpperCase()));
        setSelectedTitles([]); // Limpa a seleção após gerar novos títulos
    } catch (err) {
        setTitlesError('Erro ao gerar novos títulos.');
        console.error(err);
    } finally {
        setIsGeneratingTitles(false);
    }
  }, [outputText, selectedTitles, titleKeywords, negativeKeywords]);
  
  const handleTranslate = useCallback(async (targetLanguage: 'EN' | 'ES') => {
      if (!titles.length || isTranslatingTitles) return;
      setTranslationTarget(targetLanguage);
      setIsTranslatingTitles(true);
      setTitlesError(null);
      try {
          const translated = await translateTitles(titles, targetLanguage);
          setTitles(translated.map(title => title.toUpperCase()));
      } catch (err) {
          setTitlesError(`Erro ao traduzir títulos para ${targetLanguage}.`);
          console.error(err);
      } finally {
          setIsTranslatingTitles(false);
          setTranslationTarget(null);
      }
  }, [titles, isTranslatingTitles]);


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
    setVideoProgress({});
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

  const handleToggleVideoProgress = (index: number) => {
    setVideoProgress(prev => ({
        ...prev,
        [index]: !prev[index],
    }));
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
  
  const handleSaveScript = useCallback(() => {
    if (!outputText || isSaving) return;

    setIsSaving(true);
    setSaveConfirmation(false);

    const date = new Date().toISOString();
    let updatedScripts: SavedScript[];
    
    const scriptData = {
        title: chosenTitle || `Roteiro - ${new Date().toLocaleDateString()}`,
        updatedAt: date,
        script: outputText,
        titles,
        thumbnailPrompt,
        generatedImageUrl,
        imagePrompts,
        videoPrompts,
        videoProgress,
        sourceText: generationMode === 'logline' ? generatedLogline : inputText,
        generationMode,
    };

    if (currentScriptId) {
      // Update existing script
      updatedScripts = savedScripts.map(script => 
        script.id === currentScriptId
          ? { ...script, ...scriptData }
          : script
      );
    } else {
      // Create new script
      const newScriptId = Date.now().toString();
      const newScript: SavedScript = {
        id: newScriptId,
        createdAt: date,
        videoStatus: 'pending',
        ...scriptData,
      };
      setCurrentScriptId(newScriptId);
      if (!chosenTitle) {
          setChosenTitle(scriptData.title);
      }
      updatedScripts = [...savedScripts, newScript];
    }
    
    setSavedScripts(updatedScripts);
    localStorage.setItem('documentaryScripts', JSON.stringify(updatedScripts));
    
    setTimeout(() => {
        setIsSaving(false);
        setSaveConfirmation(true);
        setTimeout(() => setSaveConfirmation(false), 2000);
    }, 500);
  }, [
    currentScriptId, savedScripts, chosenTitle, outputText, titles, thumbnailPrompt, 
    generatedImageUrl, imagePrompts, videoPrompts, videoProgress, generationMode, generatedLogline, inputText, isSaving
  ]);

  const handleLoadScript = (scriptId: string) => {
    const scriptToLoad = savedScripts.find(s => s.id === scriptId);
    if (scriptToLoad) {
      isInitialLoadRef.current = true;
      resetAllOutputs(true);
      setCurrentScriptId(scriptToLoad.id);
      setChosenTitle(scriptToLoad.title);
      setOutputText(scriptToLoad.script);
      setTitles(scriptToLoad.titles);
      setThumbnailPrompt(scriptToLoad.thumbnailPrompt);
      setGeneratedImageUrl(scriptToLoad.generatedImageUrl || null);
      setImagePrompts(scriptToLoad.imagePrompts);
      setVideoPrompts(scriptToLoad.videoPrompts);
      setVideoProgress(scriptToLoad.videoProgress || {});
      setGenerationMode(scriptToLoad.generationMode);
      if (scriptToLoad.generationMode === 'text') {
        setInputText(scriptToLoad.sourceText);
      } else if (scriptToLoad.generationMode === 'logline') {
        setGeneratedLogline(scriptToLoad.sourceText);
      }
      setView('editor');
    }
  };

  const handleDeleteScript = (scriptId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este roteiro? Esta ação não pode ser desfeita.")) {
      const updatedScripts = savedScripts.filter(s => s.id !== scriptId);
      setSavedScripts(updatedScripts);
      localStorage.setItem('documentaryScripts', JSON.stringify(updatedScripts));
      if(currentScriptId === scriptId) {
        handleCreateNew();
      }
    }
  };
  
  const handleToggleVideoStatus = (scriptId: string) => {
    const updatedScripts = savedScripts.map(script => {
      if (script.id === scriptId) {
        return {
          ...script,
          videoStatus: script.videoStatus === 'pending' ? 'completed' : 'pending'
        } as SavedScript;
      }
      return script;
    });
    setSavedScripts(updatedScripts);
    localStorage.setItem('documentaryScripts', JSON.stringify(updatedScripts));
  };


  const outputCharCount = outputText.length;
  const outputWordCount = outputText.trim() ? outputText.trim().split(/\s+/).length : 0;
  const inputCharCount = inputText.length;
  const inputWordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  
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
              <button onClick={() => setGenerationMode(null)} className="text-sm text-cyan-500 hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300">&larr; Mudar modo</button>
            </div>
            <div className="relative flex-grow">
              <textarea
                id="input-text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Cole aqui a transcrição de um vídeo ou um texto longo..."
                className="w-full h-96 p-4 pb-10 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 text-gray-800 dark:text-gray-200"
              />
              <div className="absolute bottom-3 right-4 text-sm text-gray-500 dark:text-gray-400 select-none">
                {inputWordCount} {inputWordCount === 1 ? 'palavra' : 'palavras'} / {inputCharCount} {inputCharCount === 1 ? 'caracter' : 'caracteres'}
              </div>
            </div>
          </div>
       );
    }

    if (generationMode === 'logline') {
      return (
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                  <label htmlFor="logline-idea" className="text-lg font-semibold text-gray-700 dark:text-gray-300">Sua Ideia</label>
                  <button onClick={() => setGenerationMode(null)} className="text-sm text-cyan-500 hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300">&larr; Mudar modo</button>
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

  const renderDashboard = () => {
    const sortedScripts = [...savedScripts].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return (
        <section className="w-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200">Meus Roteiros Salvos</h2>
                <button
                    onClick={handleCreateNew}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow-md transition-colors duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500/50"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Criar Novo Roteiro</span>
                </button>
            </div>
            {sortedScripts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedScripts.map(script => (
                        <div key={script.id} className="bg-white dark:bg-gray-800 p-5 rounded-lg border-2 border-gray-300 dark:border-gray-700 flex flex-col justify-between shadow-sm hover:shadow-lg hover:border-cyan-400 dark:hover:border-cyan-500 transition-all duration-300">
                            <div>
                                <h3 className="text-lg font-bold text-cyan-600 dark:text-cyan-400 truncate mb-2">{script.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                                    {script.script.substring(0, 150)}...
                                </p>
                            </div>
                            <div className="mt-4">
                                <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                                    Última atualização: {new Date(script.updatedAt).toLocaleString()}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleToggleVideoStatus(script.id)}
                                        className={`p-2 rounded-md transition-colors ${
                                            script.videoStatus === 'completed'
                                                ? 'bg-green-100 dark:bg-green-800/40 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/60'
                                                : 'bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/60'
                                        }`}
                                        aria-label={script.videoStatus === 'completed' ? 'Marcar vídeo como pendente' : 'Marcar vídeo como concluído'}
                                    >
                                        <VideoCameraIcon className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => handleLoadScript(script.id)}
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-md text-sm transition-colors"
                                    >
                                        Carregar
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteScript(script.id)}
                                        className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors"
                                        aria-label="Excluir roteiro"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                    <FilmIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-300">Nenhum roteiro salvo ainda.</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2 mb-6">Clique em "Criar Novo Roteiro" para começar sua primeira obra-prima!</p>
                </div>
            )}
        </section>
    );
  };
  
  const renderEditor = () => (
    <>
     <div className="w-full mb-6">
        <button onClick={() => setView('dashboard')} className="text-sm text-cyan-500 hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300 font-semibold">&larr; Voltar para Meus Roteiros</button>
      </div>
      <main className="flex flex-col lg:flex-row gap-8 items-start w-full">
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
                        <div className="flex flex-wrap items-center gap-2">
                            <button onClick={() => handleTranslate('EN')} disabled={isTranslatingTitles || isGeneratingTitles} className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-200 disabled:opacity-50" aria-label="Traduzir títulos para Inglês">
                                <LanguageIcon className="w-4 h-4" /> <span>{isTranslatingTitles && translationTarget === 'EN' ? 'Traduzindo...' : 'Traduzir p/ Inglês'}</span>
                            </button>
                            <button onClick={() => handleTranslate('ES')} disabled={isTranslatingTitles || isGeneratingTitles} className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-200 disabled:opacity-50" aria-label="Traduzir títulos para Espanhol">
                                <LanguageIcon className="w-4 h-4" /> <span>{isTranslatingTitles && translationTarget === 'ES' ? 'Traduzindo...' : 'Traduzir p/ Espanhol'}</span>
                            </button>
                            <button onClick={handleRegenerateTitles} disabled={isGeneratingTitles || isTranslatingTitles} className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-200 disabled:opacity-50" aria-label="Gerar novos títulos">
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

                        {videoPrompts.length > 0 && (() => {
                          const completedVideos = Object.values(videoProgress).filter(Boolean).length;
                          return (
                            <div>
                              <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                                <div className="flex justify-center flex-wrap gap-4">
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
                                <div className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-full text-sm font-semibold text-gray-800 dark:text-gray-200">
                                  <span>Progresso: {completedVideos} / {videoPrompts.length}</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {videoPrompts.map((videoPrompt, index) => {
                                  const isCompleted = !!videoProgress[index];
                                  return (
                                    <div 
                                      key={index} 
                                      className={`p-4 border-2 rounded-lg space-y-3 flex flex-col transition-all duration-300 ${isCompleted ? 'opacity-60 bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-700' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700'}`}
                                    >
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
                                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                                        <label htmlFor={`video-progress-${index}`} className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                                          <input
                                            type="checkbox"
                                            id={`video-progress-${index}`}
                                            checked={isCompleted}
                                            onChange={() => handleToggleVideoProgress(index)}
                                            className="h-5 w-5 rounded border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-900 text-green-600 focus:ring-green-500 focus:ring-offset-white dark:focus:ring-offset-gray-800"
                                          />
                                          Marcar como vídeo criado
                                        </label>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )
                        })()}
                      </>
                    )}
                  </div>
              )}
          </div>
        </section>
      )}

       {/* Finalization Section */}
      {view === 'editor' && outputText && !isLoading && !error && (
          <section className="mt-12 w-full max-w-4xl mx-auto">
              <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800 dark:text-gray-200">Finalização</h2>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-300 dark:border-gray-700 space-y-4">
                  <div>
                      <label htmlFor="chosen-title" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Título Escolhido</label>
                      <input
                          id="chosen-title"
                          type="text"
                          value={chosenTitle}
                          onChange={(e) => setChosenTitle(e.target.value)}
                          placeholder="Escolha um título na aba 'Títulos' ou digite um aqui..."
                          className="w-full p-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-lg text-cyan-600 dark:text-cyan-400 font-semibold placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleCopyToDoc}
                        disabled={!chosenTitle || !thumbnailPrompt}
                        className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-500 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <GoogleDocIcon className="w-6 h-6" />
                        <span>{isCopiedForDoc ? 'Copiado! Cole no Docs' : 'Copiar para Google Docs'}</span>
                    </button>
                  </div>
                  {!chosenTitle && <p className="text-center text-sm text-yellow-600 dark:text-yellow-400">Escolha um título para habilitar a cópia.</p>}
                  {!thumbnailPrompt && <p className="text-center text-sm text-yellow-600 dark:text-yellow-400">Gere uma sugestão de thumbnail para habilitar a cópia para Docs.</p>}

              </div>
          </section>
      )}
      
      <footer className="mt-12 w-full flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-gray-300 dark:border-gray-700 pt-8">
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
        {view === 'editor' &&
           <div className="flex items-center gap-4">
            <button
              onClick={handleGenerateScript}
              disabled={isGenerateButtonDisabled()}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold rounded-lg shadow-lg hover:from-sky-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <FilmIcon className="w-5 h-5"/>
              <span>{getGenerateButtonText()}</span>
            </button>
             <button
                  onClick={handleSaveScript}
                  disabled={!outputText || isSaving || saveConfirmation}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-green-500/50 disabled:opacity-50"
              >
                  {isSaving ? (
                      <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Salvando...</span>
                      </>
                  ) : saveConfirmation ? (
                      <>
                          <CheckIcon className="w-5 h-5" />
                          <span>Salvo!</span>
                      </>
                  ) : (
                      <>
                          <SaveIcon className="w-5 h-5" />
                          <span>Salvar</span>
                      </>
                  )}
              </button>
           </div>
        }
      </footer>
      </>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
        <header className="text-center mb-8 md:mb-12 w-full">
          <div className="inline-flex items-center gap-3 mb-2">
            <SparklesIcon className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-sky-500 to-cyan-400 text-transparent bg-clip-text">
              Gerador de Roteiro para Documentário
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
           {view === 'dashboard' ? 'Gerencie seus roteiros salvos ou crie um novo projeto.' : 'A IA transformará sua ideia ou texto em um roteiro de documentário com 5000 a 6500 palavras.'}
          </p>
        </header>
        
        {view === 'dashboard' ? renderDashboard() : renderEditor()}

      </div>
    </div>
  );
};

export default App;
