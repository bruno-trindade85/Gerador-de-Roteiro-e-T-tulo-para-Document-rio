
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

export async function generateTitlesAndThumbnailPrompt(
  script: string, 
  language: string,
): Promise<{ titles: string[]; thumbnailPrompt: string }> {
  const targetLanguage = languageMap[language] || 'Português (Brasil)';

  const prompt = `
    Analise o seguinte roteiro de documentário e gere o seguinte conteúdo no idioma ${targetLanguage}:
    1. Uma lista de 5 a 7 títulos de documentário. Cada título deve ser uma frase fluida e natural, sem usar dois-pontos (:) ou outros separadores. O título deve ter NO MÁXIMO 100 caracteres e contar uma mini-história, combinando um protagonista, uma ação e uma revelação ou mistério impactante. Pense no título como uma sentença completa. Exemplo de bom título: 'O Detetive que Infiltrou na Máfia e Revelou a Conspiração do Século'. Evite formatos como 'Protagonista: A Ação'.
    2. Uma sugestão de prompt simples e direto para uma IA de geração de imagem do Google (como o Imagen). O prompt deve ser descritivo, focado em elementos visuais concretos (pessoas, objetos, cenários) e seguir as diretrizes de segurança da IA, evitando conteúdo violento, odioso ou explícito. Descreva uma cena que capture a essência do documentário de forma impactante e visualmente atraente.

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
            },
            thumbnailPrompt: {
              type: Type.STRING,
              description: 'Um prompt para gerar a thumbnail em uma IA de imagem.'
            }
          },
          required: ['titles', 'thumbnailPrompt']
        },
      }
    });

    const jsonResponse = JSON.parse(response.text);
    return jsonResponse;

  } catch (error) {
    console.error("Error calling Gemini API for titles:", error);
    throw new Error("Failed to generate titles from Gemini API.");
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

export async function translateTitlesToPortuguese(titles: string[]): Promise<string[]> {
  const prompt = `
    Traduza a seguinte lista de títulos para o Português (Brasil).
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
              description: "A lista de títulos traduzidos para o Português (Brasil).",
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
    console.error("Error calling Gemini API for title translation:", error);
    throw new Error("Failed to translate titles from Gemini API.");
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
