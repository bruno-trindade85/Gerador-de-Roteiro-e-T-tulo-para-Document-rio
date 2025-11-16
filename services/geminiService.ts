
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const languageMap: { [key: string]: string } = {
  BR: 'Português (Brasil)',
  EN: 'Inglês',
  ES: 'Espanhol',
};

export async function generateDocumentaryScript(text: string, language: string): Promise<string> {
  const targetLanguage = languageMap[language] || 'Português (Brasil)';
  
  const prompt = `
    Transforme o seguinte texto em uma narrativa de documentário detalhada e expansiva no idioma ${targetLanguage}, em formato de texto corrido. Use um tom dramático e envolvente, mas com uma linguagem clara, direta e de fácil compreensão para todos os públicos. Evite palavras complexas ou rebuscadas. A narração deve fluir como a de um documentário para a TV aberta.

    REQUISITO CRÍTICO: O roteiro final DEVE OBRIGATORIAMENTE ter entre 5500 e 6500 palavras. Seja extremamente criterioso para se manter dentro desta margem. Para atingir essa meta, expanda os temas do texto original, adicione detalhes, contexto histórico, entrevistas fictícias, reflexões profundas e crie uma narrativa rica e aprofundada. Não ultrapasse 6500 palavras e não gere menos de 5500 palavras.

    O resultado deve ser um texto contínuo e fluído, sem elementos de roteiro como 'NARRADOR:', descrições de cena ou nomes de personagens.

    Texto Original:
    ---
    ${text}
    ---
    Texto do Documentário (${targetLanguage}) com 5500 a 6500 palavras:
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
    1. Uma lista de 5 a 7 títulos de documentário. Cada título deve ter NO MÁXIMO 100 caracteres e seguir ESTRITAMENTE a estrutura: [PROTAGONISTA] + [AÇÃO] + [REVELAÇÃO IMPACTANTE/MISTÉRIO/DESCOBERTA/EVENTO INESQUECÍVEL]. Exemplo: 'O Detetive que Infiltrou na Máfia e Revelou a Conspiração do Século'.
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
              description: "Uma lista de títulos para o documentário seguindo a estrutura [PROTAGONISTA] + [AÇÃO] + [REVELAÇÃO] com no máximo 100 caracteres.",
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

  promptInstruction += `\nTodos os títulos devem manter ESTRITAMENTE a estrutura [PROTAGONISTA] + [AÇÃO] + [REVELAÇÃO IMPACTANTE/MISTÉRIO/DESCOBERTA/EVENTO INESQUECÍVEL] e ter NO MÁXIMO 100 caracteres.`;

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


export async function generateImageFromPrompt(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
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
