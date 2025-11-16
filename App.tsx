
import React, { useState, useCallback } from 'react';
import { generateDocumentaryScript, generateTitlesAndThumbnailPrompt, generateTitlesOnly, generateImageFromPrompt } from './services/geminiService';
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


const MIN_WORDS = 5500;
const MAX_WORDS = 6500;

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>('BR');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  
  const [titles, setTitles] = useState<string[]>([]);
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [titleKeywords, setTitleKeywords] = useState<string>('');
  const [negativeKeywords, setNegativeKeywords] = useState<string>('');
  const [thumbnailPrompt, setThumbnailPrompt] = useState<string>('');
  const [isGeneratingTitles, setIsGeneratingTitles] = useState<boolean>(false);
  const [titlesError, setTitlesError] = useState<string | null>(null);
  const [isThumbnailPromptCopied, setIsThumbnailPromptCopied] = useState<boolean>(false);
  const [copiedTitle, setCopiedTitle] = useState<string | null>(null);

  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const [chosenTitle, setChosenTitle] = useState<string>('');
  const [isCopiedForDoc, setIsCopiedForDoc] = useState<boolean>(false);


  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleGenerateScript = useCallback(async () => {
    if (!inputText.trim()) {
      setError('Por favor, insira um texto para transformar.');
      return;
    }

    setIsLoading(true);
    setError(null);
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

    try {
      const script = await generateDocumentaryScript(inputText, language);
      setOutputText(script);
    } catch (err) {
      setError('Ocorreu um erro ao gerar o roteiro. Por favor, tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, language]);

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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-3 mb-2">
            <SparklesIcon className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-sky-400 to-cyan-300 text-transparent bg-clip-text">
              Gerador de Roteiro de Documentário
            </h1>
          </div>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Cole seu texto abaixo e a IA o transformará em um roteiro de documentário com 5500 a 6500 palavras.
          </p>
        </header>

        <main className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Input Panel */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <label htmlFor="input-text" className="text-lg font-semibold text-gray-300">Seu Texto Original</label>
            <div className="relative flex-grow">
              <textarea
                id="input-text"
                value={inputText}
                onChange={handleInputChange}
                placeholder="Era uma vez, em uma terra distante..."
                className="w-full h-96 p-4 bg-gray-800 border-2 border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 text-gray-200"
              />
            </div>
          </div>

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
                  <p className="mt-4 text-gray-300">Gerando roteiro longo...</p>
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
                  Seu roteiro de documentário aparecerá aqui...
                </div>
              )}
            </div>
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
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold text-gray-200">Sugestões de Título</h3>
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
                        <h4 className="text-lg font-semibold text-gray-200 mb-2">Imagem Gerada</h4>
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
            disabled={isLoading || !inputText.trim()}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold rounded-lg shadow-lg hover:from-sky-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <FilmIcon className="w-5 h-5"/>
            <span>{isLoading ? 'Gerando...' : 'Gerar Roteiro'}</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default App;
