
import React, { useState, useCallback } from 'react';
import { generateDocumentaryScript, generateTitlesAndThumbnailPrompt, generateTitlesOnly, generateImageFromPrompt, generateLogline, translateTitlesToPortuguese } from './services/geminiService';
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


const MIN_WORDS = 5000;
const MAX_WORDS = 6500;

type GenerationMode = 'text' | 'logline' | null;

interface ScriptAttempt {
  script: string;
  wordCount: number;
  message: string;
}

const App: React.FC = () => {
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
  const [isTranslatingTitles, setIsTranslatingTitles] = useState<boolean>(false);
  const [titlesError, setTitlesError] = useState<string | null>(null);
  const [isThumbnailPromptCopied, setIsThumbnailPromptCopied] = useState<boolean>(false);
  const [copiedTitle, setCopiedTitle] = useState<string | null>(null);

  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const [chosenTitle, setChosenTitle] = useState<string>('');
  const [isCopiedForDoc, setIsCopiedForDoc] = useState<boolean>(false);

  const [scriptAttempt, setScriptAttempt] = useState<ScriptAttempt | null>(null);

  const resetAllOutputs = () => {
    setOutputText('');
    setTitles([]);
    setSelectedTitles([]);
    setTitleKeywords('');
    setNegativeKeywords('');
    setThumbnailPrompt('');
    setTitlesError(null);
    setGeneratedImageUrl(null);
    setImageError(null);
    setChosenTitle('');
    setError(null);
    setScriptAttempt(null);
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


  const handleGenerateInitialIdeas = useCallback(async () => {
    if (!outputText) return;
    setIsGeneratingTitles(true);
    setTitlesError(null);
    setTitles([]);
    setThumbnailPrompt('');
    setGeneratedImageUrl(null);
    setImageError(null);
    setSelectedTitles([]);
    setTitleKeywords('');
    setNegativeKeywords('');
    try {
        const result = await generateTitlesAndThumbnailPrompt(outputText, language);
        setTitles(result.titles);
        setThumbnailPrompt(result.thumbnailPrompt);
    } catch (err) {
        setTitlesError('Erro ao gerar títulos e sugestão.');
        console.error(err);
    } finally {
        setIsGeneratingTitles(false);
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
    if (outputWordCount === 0) return 'text-gray-400';
    if (outputWordCount >= MIN_WORDS && outputWordCount <= MAX_WORDS) return 'text-green-400';
    return 'text-red-500';
  };

  const renderInputPanel = () => {
    if (generationMode === null) {
      return (
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-gray-800 border-2 border-gray-700 rounded-lg min-h-[448px]">
            <h2 className="text-2xl font-bold text-gray-200 mb-6 text-center">Como você quer começar?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-md">
                <button 
                    onClick={() => handleModeSelection('logline')}
                    className="flex flex-col items-center justify-center p-6 bg-gray-700/50 hover:bg-gray-700 rounded-lg border-2 border-gray-600 hover:border-cyan-500 transition-all duration-300 transform hover:-translate-y-1"
                >
                    <PencilSparkleIcon className="w-12 h-12 text-cyan-400 mb-3" />
                    <span className="font-semibold text-lg text-gray-200">Começar com uma Ideia</span>
                    <span className="text-sm text-gray-400 text-center mt-1">Gere uma logline para guiar a criação do seu roteiro.</span>
                </button>
                <button 
                    onClick={() => handleModeSelection('text')}
                    className="flex flex-col items-center justify-center p-6 bg-gray-700/50 hover:bg-gray-700 rounded-lg border-2 border-gray-600 hover:border-sky-500 transition-all duration-300 transform hover:-translate-y-1"
                >
                    <DocumentTextIcon className="w-12 h-12 text-sky-400 mb-3" />
                    <span className="font-semibold text-lg text-gray-200">Começar com um Texto</span>
                    <span className="text-sm text-gray-400 text-center mt-1">Use uma transcrição ou texto longo como base.</span>
                </button>
            </div>
        </div>
      );
    }
    
    if (generationMode === 'text') {
       return (
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <label htmlFor="input-text" className="text-lg font-semibold text-gray-300">Seu Texto Original</label>
              <button onClick={() => handleModeSelection(null)} className="text-sm text-cyan-400 hover:text-cyan-300">&larr; Voltar</button>
            </div>
            <div className="relative flex-grow">
              <textarea
                id="input-text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Cole aqui a transcrição de um vídeo ou um texto longo..."
                className="w-full h-96 p-4 bg-gray-800 border-2 border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 text-gray-200"
              />
            </div>
          </div>
       );
    }

    if (generationMode === 'logline') {
      return (
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                  <label htmlFor="logline-idea" className="text-lg font-semibold text-gray-300">Sua Ideia</label>
                  <button onClick={() => handleModeSelection(null)} className="text-sm text-cyan-400 hover:text-cyan-300">&larr; Voltar</button>
              </div>
              <textarea
                  id="logline-idea"
                  value={loglineIdea}
                  onChange={(e) => setLoglineIdea(e.target.value)}
                  placeholder="Ex: A história de um programador que criou uma IA que ficou consciente."
                  className="w-full p-3 bg-gray-800 border-2 border-gray-700 rounded-lg resize-none h-28 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 text-gray-200"
              />
              <button
                  onClick={handleGenerateLogline}
                  disabled={isGeneratingLogline || !loglineIdea.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500 transition-colors disabled:opacity-50"
              >
                  <PencilSparkleIcon className="w-5 h-5" />
                  {isGeneratingLogline ? 'Gerando Logline...' : 'Gerar Logline'}
              </button>

              {loglineError && <div className="text-red-400 text-center mt-2">{loglineError}</div>}
              
              <div className="mt-2">
                <label className="text-lg font-semibold text-gray-300">Logline Gerada</label>
                <div className="w-full min-h-[100px] mt-2 p-3 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center text-center">
                    {isGeneratingLogline ? <Loader /> : (
                      <p className="text-cyan-300 italic">{generatedLogline || 'Sua logline aparecerá aqui...'}</p>
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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-3 mb-2">
            <SparklesIcon className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-sky-400 to-cyan-300 text-transparent bg-clip-text">
              Gerador de Roteiro para Documentário
            </h1>
          </div>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
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
              <label htmlFor="output-text" className="text-lg font-semibold text-gray-300">Roteiro Gerado</label>
              {outputText && !isLoading && (
                <div className="flex items-center gap-2">
                  <a
                    href="https://content-creation-tools-pctn.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300 hover:text-cyan-400 transition-colors duration-200"
                  >
                    <CaptionIcon className="w-4 h-4" />
                    <span>Criar Legenda</span>
                  </a>
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300 hover:text-cyan-400 transition-colors duration-200"
                  >
                    <ClipboardIcon className="w-4 h-4" />
                    {isCopied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              )}
            </div>
            <div id="output-text" className="relative w-full h-96 p-4 bg-gray-800 border-2 border-gray-700 rounded-lg overflow-y-auto">
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 bg-opacity-75">
                  <Loader />
                  <p className="mt-4 text-gray-300 text-center">{loadingMessage}</p>
                </div>
              )}
              {error && (
                <div className="text-red-400 h-full flex items-center justify-center text-center">
                  {error}
                </div>
              )}
              {!isLoading && !error && outputText && (
                <pre className="whitespace-pre-wrap text-gray-200 font-sans">{outputText}</pre>
              )}
              {!isLoading && !error && !outputText && (
                <div className="text-gray-500 h-full flex items-center justify-center text-center">
                  {generationMode === null ? 'Escolha um modo para começar.' : 'Seu roteiro de documentário aparecerá aqui...'}
                </div>
              )}
            </div>
            {scriptAttempt && !isLoading && (
              <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg text-center shadow-lg">
                <p className="text-yellow-200 mb-3 font-medium">{scriptAttempt.message}</p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleRetryGeneration}
                    className="px-5 py-2 bg-green-600 text-white hover:bg-green-500 rounded-md font-semibold transition-colors duration-200"
                  >
                    Sim, gerar novamente
                  </button>
                  <button
                    onClick={handleCancelRetry}
                    className="px-5 py-2 bg-gray-600 text-white hover:bg-gray-500 rounded-md transition-colors duration-200"
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
                <span className="text-gray-400">
                  Total de caracteres: {outputCharCount}
                </span>
              </div>
            )}
          </div>
        </main>
        
        {/* Title and Thumbnail Generation Section */}
        {outputText && !isLoading && !error && (
          <section className="mt-12 w-full">
            <div className="text-center mb-6">
              <button
                onClick={handleGenerateInitialIdeas}
                disabled={isGeneratingTitles}
                className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <LightbulbIcon className="w-5 h-5"/>
                <span>{isGeneratingTitles && titles.length === 0 ? 'Gerando Ideias...' : 'Gerar Títulos e Sugestão de Thumbnail'}</span>
              </button>
            </div>

            {isGeneratingTitles && titles.length === 0 && (
              <div className="flex justify-center items-center mt-6">
                <Loader />
                <p className="ml-4 text-gray-300">Buscando inspiração...</p>
              </div>
            )}
             {titlesError && (
              <div className="text-red-400 text-center mt-6 bg-red-900/20 p-4 rounded-lg">{titlesError}</div>
            )}

            {(titles.length > 0 || thumbnailPrompt) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                {/* Titles */}
                <div>
                  <div className="flex flex-wrap gap-2 justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold text-gray-200">Sugestões de Título</h3>
                    <div className="flex items-center gap-2">
                      {language !== 'BR' && titles.length > 0 && !isGeneratingTitles && (
                        <button
                          onClick={handleTranslateTitles}
                          disabled={isTranslatingTitles}
                          className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300 hover:text-cyan-400 transition-colors duration-200 disabled:opacity-50"
                          aria-label="Traduzir títulos para Português (BR)"
                        >
                          <LanguageIcon className="w-4 h-4" />
                          <span>{isTranslatingTitles ? 'Traduzindo...' : 'Traduzir para PT-BR'}</span>
                        </button>
                      )}
                      <button
                        onClick={handleRegenerateTitles}
                        disabled={isGeneratingTitles}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300 hover:text-cyan-400 transition-colors duration-200 disabled:opacity-50"
                        aria-label="Gerar novos títulos"
                      >
                        <RefreshIcon className="w-4 h-4" />
                        <span>{isGeneratingTitles ? 'Gerando...' : 'Gerar Novamente'}</span>
                      </button>
                    </div>
                  </div>
                   <div className="space-y-2 mb-3">
                    <input
                      type="text"
                      value={titleKeywords}
                      onChange={(e) => setTitleKeywords(e.target.value)}
                      placeholder="Incluir palavras-chave (ex: conspiração, segredo)"
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-sm text-gray-200 placeholder-gray-400 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                     <input
                      type="text"
                      value={negativeKeywords}
                      onChange={(e) => setNegativeKeywords(e.target.value)}
                      placeholder="Excluir palavras (ex: polêmico, chocou)"
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-sm text-gray-200 placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div className="p-4 bg-gray-800 border-2 border-gray-700 rounded-lg min-h-[200px] relative">
                    {isGeneratingTitles && (
                       <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 rounded-lg">
                         <Loader />
                       </div>
                    )}
                    <ul className="space-y-3">
                      {titles.map((title, index) => (
                        <li key={index} className="flex items-center justify-between gap-2 group">
                          <div className="flex items-start flex-1">
                            <input
                              type="checkbox"
                              id={`title-${index}`}
                              checked={selectedTitles.includes(title)}
                              onChange={() => handleTitleSelection(title)}
                              className="mt-1 mr-3 h-5 w-5 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-600 focus:ring-offset-gray-800"
                              aria-labelledby={`title-label-${index}`}
                            />
                            <span id={`title-label-${index}`} className={`flex-1 select-text ${chosenTitle === title ? 'text-cyan-400 font-semibold' : 'text-gray-300'}`}>
                              {title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                             <button
                                onClick={() => setChosenTitle(title)}
                                className={`p-1.5 rounded-md ${chosenTitle === title ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600 hover:text-yellow-400'}`}
                                aria-label={`Escolher título: ${title}`}
                              >
                               <StarIcon className="w-4 h-4" />
                             </button>
                             <button
                              onClick={() => handleCopyTitle(title)}
                              className="p-1.5 rounded-md bg-gray-700/50 text-gray-400 hover:bg-gray-600 hover:text-cyan-400"
                              aria-label={`Copiar título: ${title}`}
                            >
                              {copiedTitle === title ? (
                                <CheckIcon className="w-4 h-4 text-green-400" />
                              ) : (
                                <ClipboardIcon className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Thumbnail Prompt */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold text-gray-200">Sugestão de Prompt para Thumbnail</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage || !thumbnailPrompt}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-cyan-600 hover:bg-cyan-500 rounded-md text-white transition-colors duration-200 disabled:opacity-50"
                      >
                        <ImageIcon className="w-4 h-4" />
                        {isGeneratingImage ? 'Gerando...' : 'Gerar Imagem'}
                      </button>
                      <button 
                        onClick={handleCopyThumbnailPrompt}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300 hover:text-cyan-400 transition-colors duration-200"
                      >
                        <ClipboardIcon className="w-4 h-4" />
                        {isThumbnailPromptCopied ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                   <div className="p-4 bg-gray-800 border-2 border-gray-700 rounded-lg min-h-[150px]">
                    <p className="text-gray-300 whitespace-pre-wrap font-mono text-sm">{thumbnailPrompt}</p>
                   </div>
                   <div className="mt-4">
                    {isGeneratingImage && (
                      <div className="flex flex-col items-center justify-center p-4 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg min-h-[200px]">
                        <Loader />
                        <p className="mt-2 text-gray-400">Criando a imagem da thumbnail...</p>
                      </div>
                    )}
                    {imageError && (
                      <div className="text-red-400 text-center bg-red-900/20 p-4 rounded-lg">{imageError}</div>
                    )}
                    {generatedImageUrl && !isGeneratingImage && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                           <h4 className="text-lg font-semibold text-gray-200">Imagem Gerada</h4>
                           <button
                              onClick={handleDownloadImage}
                              className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300 hover:text-cyan-400 transition-colors duration-200"
                              aria-label="Baixar imagem gerada"
                            >
                              <DownloadIcon className="w-4 h-4" />
                              <span>Baixar</span>
                            </button>
                        </div>
                        <img src={generatedImageUrl} alt="Thumbnail gerada pela IA" className="rounded-lg border-2 border-gray-700 w-full" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

         {/* Finalization Section */}
        {outputText && !isLoading && !error && (
            <section className="mt-12 w-full max-w-4xl mx-auto">
                <h2 className="text-2xl font-semibold text-center mb-6 text-gray-200">Finalização</h2>
                <div className="bg-gray-800 p-6 rounded-lg border-2 border-gray-700 space-y-4">
                    <div>
                        <label htmlFor="chosen-title" className="block text-sm font-medium text-gray-400 mb-1">Título Escolhido</label>
                        <input
                            id="chosen-title"
                            type="text"
                            readOnly
                            value={chosenTitle}
                            placeholder="Escolha um título da lista acima..."
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-lg text-cyan-400 font-semibold placeholder-gray-500"
                        />
                    </div>
                    <button
                        onClick={handleCopyToDoc}
                        disabled={!chosenTitle}
                        className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-500 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <GoogleDocIcon className="w-6 h-6" />
                        <span>{isCopiedForDoc ? 'Copiado! Cole no Google Docs' : 'Copiar Conteúdo para Google Docs'}</span>
                    </button>
                </div>
            </section>
        )}
        
        <footer className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-gray-700 pt-8">
          <div className="flex items-center gap-3">
            <label htmlFor="language-select" className="font-medium text-gray-300">Idioma:</label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-800 border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
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
