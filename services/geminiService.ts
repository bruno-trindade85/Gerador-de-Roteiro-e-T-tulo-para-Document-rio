

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const languageMap: { [key: string]: string } = {
  BR: 'Português (Brasil)',
  EN: 'Inglês',
  ES: 'Espanhol',
};

export async function generateLogline(idea: string, language: string): Promise<string> {
  const targetLanguage = languageMap[language] || 'Português (Brasil)';
  const prompt = `
    Você é um roteirista experiente. Com base na seguinte ideia, crie uma logline atraente e concisa no idioma ${targetLanguage}.
    Uma logline é um resumo de uma única frase que estabelece o protagonista, seu objetivo e o conflito que ele enfrenta. Deve ser intrigante e clara.

    Ideia Fornecida:
    ---
    ${idea}
    ---

    Logline (em ${targetLanguage}):
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    // Limpa a resposta para garantir que seja uma única linha.
    return response.text.replace(/(\r\n|\n|\r)/gm, " ").trim();
  } catch (error) {
    console.error("Error calling Gemini API for logline:", error);
    throw new Error("Failed to generate logline from Gemini API.");
  }
}

export async function generateDocumentaryScript(
  text: string, 
  language: string,
  previousScript?: string,
  previousWordCount?: number
): Promise<string> {
  const targetLanguage = languageMap[language] || 'Português (Brasil)';

  let retryInstruction = '';
  if (previousScript && previousWordCount) {
    const MIN_WORDS_TARGET = 5000;
    const MAX_WORDS_TARGET = 6500;
    if (previousWordCount < MIN_WORDS_TARGET) {
      retryInstruction = `A tentativa anterior resultou em apenas ${previousWordCount} palavras, o que é muito pouco. Você PRECISA expandir o conteúdo significativamente para atingir a meta de ${MIN_WORDS_TARGET}-${MAX_WORDS_TARGET} palavras. Adicione mais detalhes, mais contexto, mais exemplos ou narrativas secundárias.`;
    } else if (previousWordCount > MAX_WORDS_TARGET) {
      retryInstruction = `A tentativa anterior resultou em ${previousWordCount} palavras, o que excedeu o limite. Você PRECISA resumir o conteúdo e ser mais conciso para se adequar à meta de ${MIN_WORDS_TARGET}-${MAX_WORDS_TARGET} palavras. Remova informações menos relevantes e compacte as frases.`;
    }
  }
  
  const prompt = `
    ${retryInstruction ? `Contexto da Tentativa Anterior:\n${retryInstruction}\n\n` : ''}
    Transforme o seguinte texto em uma narrativa de documentário detalhada e expansiva no idioma ${targetLanguage}, em formato de texto corrido. Use um tom dramático e envolvente, mas com uma linguagem clara, direta e de fácil compreensão para todos os públicos. Evite palavras complexas ou rebuscadas. A narração deve fluir como a de um documentário para a TV aberta.

    REQUISITO CRÍTICO: O roteiro final DEVE OBRIGATORIAMENTE ter entre 5000 e 6500 palavras. Seja extremamente criterioso para se manter dentro desta margem. Para atingir essa meta, expanda os temas do texto original, adicione detalhes, contexto histórico, entrevistas fictícias, reflexões profundas e crie uma narrativa rica e aprofundada. Não ultrapasse 6500 palavras e não gere menos de 5000 palavras.

    O resultado deve ser um texto contínuo e fluído, sem elementos de roteiro como 'NARRADOR:', descrições de cena ou nomes de personagens.

    Texto Original:
    ---
    ${text}
    ---
    ${retryInstruction ? `Lembre-se: A sua tarefa é corrigir a contagem de palavras, ajustando para ficar entre 5000 e 6500 palavras.\nTexto do Documentário (${targetLanguage}):` : `Texto do Documentário (${targetLanguage}) com 5000 a 6500 palavras:`}
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate script from Gemini API.");
  }
}

export async function generateTitles(
  script: string, 
  language: string,
): Promise<string[]> {
  const targetLanguage = languageMap[language] || 'Português (Brasil)';

  const prompt = `
    Analise o seguinte roteiro de documentário e gere uma lista de 5 a 7 títulos de documentário no idioma ${targetLanguage}.
    Cada título deve ser uma frase fluida e natural, sem usar dois-pontos (:) ou outros separadores. O título deve ter NO MÁXIMO 100 caracteres e contar uma mini-história, combinando um protagonista, uma ação e uma revelação ou mistério impactante. Pense no título como uma sentença completa. Exemplo de bom título: 'O Detetive que Infiltrou na Máfia e Revelou a Conspiração do Século'. Evite formatos como 'Protagonista: A Ação'.

    Roteiro:
    ---
    ${script.substring(0, 8000)}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titles: {
              type: Type.ARRAY,
              description: "Uma lista de 5 a 7 títulos de documentário, formatados como frases fluidas e naturais, com no máximo 100 caracteres cada.",
              items: {
                type: Type.STRING
              }
            }
          },
          required: ['titles']
        },
      }
    });

    const jsonResponse = JSON.parse(response.text);
    return jsonResponse.titles;

  } catch (error) {
    console.error("Error calling Gemini API for titles:", error);
    throw new Error("Failed to generate titles from Gemini API.");
  }
}


export async function generateThumbnailPrompt(
  script: string, 
  language: string,
): Promise<string> {
  const targetLanguage = languageMap[language] || 'Português (Brasil)';

  const prompt = `
    Analise o seguinte roteiro de documentário e gere uma sugestão de prompt ALTAMENTE DETALHADO para uma IA de geração de imagem (como o Imagen). O objetivo é criar uma imagem FOTORREALISTA e cinematográfica.
    O prompt deve ser retornado como uma única string de texto.
    Descreva uma cena visualmente rica que capture a essência do documentário, incluindo detalhes sobre o ambiente, iluminação, emoção do personagem (se houver) e composição.
    O prompt deve ser focado em elementos visuais concretos e seguir as diretrizes de segurança da IA. Não adicione nenhuma formatação ou texto extra, apenas o prompt.

    Roteiro:
    ---
    ${script.substring(0, 8000)}
    ---
    Prompt (em ${targetLanguage}):
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Error calling Gemini API for thumbnail prompt:", error);
    throw new Error("Failed to generate thumbnail prompt from Gemini API.");
  }
}

export async function generateImagePrompts(
  script: string,
  language: string
): Promise<string[]> {
  const targetLanguage = languageMap[language] || 'Português (Brasil)';

  const prompt = `
    Analise o seguinte roteiro de documentário. Seu objetivo é dividi-lo em 100 cenas ou momentos visuais distintos, em estrita ordem cronológica, e criar um prompt de imagem detalhado para cada um.

    Cada prompt deve:
    - Representar uma cena sequencial do roteiro.
    - Ser focado em criar uma imagem FOTORREALISTA e com qualidade CINEMATOGRÁFICA.
    - Descrever a cena com detalhes visuais: ambiente, iluminação, objetos, emoções (se aplicável) e composição.
    - Ser uma única string de texto.
    - Estar no idioma ${targetLanguage}.

    Retorne o resultado como um objeto JSON com uma chave "prompts" contendo um array com exatamente 100 prompts de imagem gerados, em ordem cronológica.

    Roteiro:
    ---
    ${script.substring(0, 20000)}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompts: {
              type: Type.ARRAY,
              description: "Uma lista de 100 prompts detalhados para geração de imagem, em ordem cronológica.",
              items: {
                type: Type.STRING
              }
            }
          },
          required: ['prompts']
        },
      }
    });

    const jsonResponse = JSON.parse(response.text);
    return jsonResponse.prompts;

  } catch (error) {
    console.error("Error calling Gemini API for image prompts:", error);
    throw new Error("Failed to generate image prompts from Gemini API.");
  }
}

export async function generateVideoPrompts(
  imagePrompts: string[],
  language: string
): Promise<string[]> {
  const targetLanguage = languageMap[language] || 'Português (Brasil)';

  const prompt = `
    Sua tarefa é transformar uma lista de 100 prompts para imagens estáticas em 100 prompts para clipes de vídeo curtos.
    Cada novo prompt de vídeo deve descrever uma pequena ação, movimento de câmera ou mudança sutil que anima a cena estática original, como se estivesse dando vida à fotografia.
    Mantenha o tom cinematográfico, fotorrealista e o idioma original (${targetLanguage}).

    Por exemplo:
    - Prompt de Imagem: "Um detetive olha pela janela chuvosa de seu escritório à noite, com o rosto melancólico."
    - Prompt de Vídeo correspondente: "Câmera faz um zoom lento no rosto melancólico de um detetive enquanto ele olha pela janela chuvosa de seu escritório à noite; uma lágrima escorre lentamente por sua bochecha."

    Abaixo estão os 100 prompts de imagem. Gere um prompt de vídeo para cada um, em ordem.

    Prompts de Imagem:
    ---
    ${imagePrompts.map((p, i) => `${i + 1}. ${p}`).join('\n')}
    ---

    Retorne o resultado como um objeto JSON com uma chave "video_prompts" contendo um array com exatamente 100 strings dos novos prompts de vídeo, na mesma ordem cronológica.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            video_prompts: {
              type: Type.ARRAY,
              description: "Uma lista de 100 prompts detalhados para geração de clipes de vídeo, baseados nos prompts de imagem, em ordem cronológica.",
              items: {
                type: Type.STRING
              }
            }
          },
          required: ['video_prompts']
        },
      }
    });

    const jsonResponse = JSON.parse(response.text);
    return jsonResponse.video_prompts;

  } catch (error) {
    console.error("Error calling Gemini API for video prompts:", error);
    throw new Error("Failed to generate video prompts from Gemini API.");
  }
}


export async function generateTitlesOnly(
  script: string,
  language: string,
  selectedTitles: string[],
  keywords: string,
  negativeKeywords: string
): Promise<string[]> {
  const targetLanguage = languageMap[language] || 'Português (Brasil)';

  let promptInstruction = `Gere uma lista de 5 a 7 novos títulos de documentário no idioma ${targetLanguage}, baseados no roteiro fornecido.`;
  
  if (selectedTitles && selectedTitles.length > 0) {
    promptInstruction += `\nO usuário gostou especialmente dos seguintes títulos. Use-os como inspiração principal para criar variações, combinações ou melhorias:\n---\n${selectedTitles.join('\n')}\n---`;
  }

  if (keywords && keywords.trim() !== '') {
    promptInstruction += `\nÉ crucial que os novos títulos incluam ou girem em torno das seguintes palavras-chave: "${keywords}".`;
  }
  
  if (negativeKeywords && negativeKeywords.trim() !== '') {
    promptInstruction += `\nÉ crucial que os novos títulos NÃO contenham nenhuma das seguintes palavras: "${negativeKeywords}".`;
  }

  promptInstruction += `\nTodos os títulos devem ser uma frase fluida e natural, sem usar dois-pontos (:) ou outros separadores. Eles devem contar uma mini-história combinando um protagonista, uma ação e uma revelação impactante, com NO MÁXIMO 100 caracteres. Pense em cada título como uma sentença completa e evite formatos como 'Protagonista: A Ação'.`;

  const prompt = `
    ${promptInstruction}

    Roteiro:
    ---
    ${script.substring(0, 8000)}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titles: {
              type: Type.ARRAY,
              description: "Uma lista de títulos para o documentário.",
              items: {
                type: Type.STRING
              }
            }
          },
          required: ['titles']
        },
      }
    });

    const jsonResponse = JSON.parse(response.text);
    return jsonResponse.titles;

  } catch (error) {
    console.error("Error calling Gemini API for titles only:", error);
    throw new Error("Failed to generate titles from Gemini API.");
  }
}

export async function translateTitles(titles: string[], language: string): Promise<string[]> {
  const targetLanguage = languageMap[language];
  if (!targetLanguage) {
    throw new Error(`Unsupported language code: ${language}`);
  }
  const prompt = `
    Traduza a seguinte lista de títulos para o idioma ${targetLanguage}.
    Mantenha o tom e o estilo de cada título.
    Retorne o resultado como um objeto JSON com uma única chave "translated_titles" contendo um array com os títulos traduzidos.

    Títulos para traduzir:
    ---
    ${titles.join('\n')}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translated_titles: {
              type: Type.ARRAY,
              description: `A lista de títulos traduzidos para ${targetLanguage}.`,
              items: {
                type: Type.STRING
              }
            }
          },
          required: ['translated_titles']
        },
      }
    });

    const jsonResponse = JSON.parse(response.text);
    return jsonResponse.translated_titles;
  } catch (error) {
    console.error(`Error calling Gemini API for title translation to ${language}:`, error);
    throw new Error(`Failed to translate titles to ${language} from Gemini API.`);
  }
}


export async function generateImageFromPrompt(prompt: string): Promise<string> {
  const enhancedPrompt = `Fotografia realista, cinematográfica, cor vibrante, iluminação dramática, alta definição. Uma imagem que serve como um poderoso gatilho visual para a seguinte cena: ${prompt}`;

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: enhancedPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '16:9',
      },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    if (!base64ImageBytes) {
      throw new Error("A API não retornou dados de imagem.");
    }
    return base64ImageBytes;

  } catch (error) {
    console.error("Erro ao chamar a API Gemini para geração de imagem:", error);
    throw new Error("Falha ao gerar imagem da API Gemini.");
  }
}
