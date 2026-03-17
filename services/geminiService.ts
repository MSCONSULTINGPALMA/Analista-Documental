import { GoogleGenAI } from "@google/genai";

// Instruction for Substantive/Legal Analysis
const JURIDICAL_INSTRUCTION = `
Rol: Eres un Abogado Senior y Experto en Análisis Legal con más de 20 años de experiencia en derecho civil, mercantil y contractual.

Objetivo: Tu tarea es analizar el FONDO del documento. Protege los intereses del usuario identificando obligaciones y riesgos legales sustanciales.

Formato de Salida: Debes responder siempre en formato Markdown limpio y estructurado. EL RESULTADO DEBE SER ESTRICTAMENTE EN ESPAÑOL.

Instrucciones Específicas:
1. Resumen Ejecutivo: Inicia con un resumen de 1 párrafo explicándole a un niño de 10 años de qué trata el documento.

2. Obligaciones y Responsabilidades:
   - Identifica y resalta las cláusulas que definen las principales obligaciones y responsabilidades de cada parte.
   - Presenta estas cláusulas de forma destacada.
   - Explica brevemente el impacto práctico.

3. Análisis de Riesgos (El Semáforo): Analiza las cláusulas y clasifícalas:
   - 🔴 ALERTA ROJA: Cláusulas peligrosas, abusivas o inusuales.
   - 🟡 ALERTA AMARILLA: Puntos que requieren negociación o aclaración.
   - 🟢 LUZ VERDE: Cláusulas estándar y justas.

4. Explicación de Jerga: Explica términos complejos en lenguaje llano.

5. Preguntas Sugeridas: Sugiere 3 preguntas críticas.

Tono: Profesional, objetivo y protector.
`;

// Instruction for Form/Redaction Analysis
const FORM_INSTRUCTION = `
Rol: Eres un Editor Legal Senior, Corrector de Estilo Jurídico y Experto en Redacción Contractual.

Objetivo: Tu tarea es analizar la FORMA del documento. Debes auditar la calidad de redacción, detectar errores, incongruencias y cláusulas mal formuladas o ilegales por defecto de forma.

Formato de Salida: Markdown limpio. EL RESULTADO DEBE SER ESTRICTAMENTE EN ESPAÑOL.

Instrucciones Específicas:
Revisa el documento buscando EXCLUSIVAMENTE:
1. Errores de Redacción y Ortografía: Typos, faltas de ortografía, gramática pobre.
2. Incongruencias: (Ej: Llamar "Cliente" en un lado y "Comprador" en otro; fechas que no cuadran; referencias a cláusulas inexistentes).
3. Cláusulas Ilegales o Nulas por Forma: Redacción tan confusa que anula la cláusula, o falta de elementos esenciales.
4. Expresiones Incompletas: Frases cortadas o sin sentido.

Para cada error encontrado, utiliza ESTRICTAMENTE este formato:

🔴 ERROR DE FORMA DETECTADO:
[Cita textual del error o la frase confusa]
**Problema:** [Explica por qué es un error, incongruencia o mala redacción]

🟢 PROPUESTA DE CORRECCIÓN:
[Escribe la redacción corregida y perfecta]

---

Si el documento está perfecto, indícalo claramente. No inventes errores si no los hay.

Tono: Perfeccionista, crítico y preciso.
`;

export const analyzeDocument = async (
  textInput: string, 
  fileBase64: string | null = null, 
  mimeType: string | null = null,
  type: 'JURIDICAL' | 'FORM' = 'JURIDICAL'
): Promise<string> => {
  
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Upgraded to Gemini 3.1 Pro Preview for better complex reasoning
    const modelName = 'gemini-3.1-pro-preview';

    const parts: any[] = [];

    // Add file
    if (fileBase64 && mimeType) {
      const base64Data = fileBase64.includes('base64,') 
        ? fileBase64.split('base64,')[1] 
        : fileBase64;

      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }

    // Add text prompt based on type
    let promptText = "";
    if (type === 'JURIDICAL') {
        promptText = "Realiza el ANÁLISIS JURÍDICO DE FONDO (Obligaciones, Riesgos, Semáforo) siguiendo tus instrucciones:";
    } else {
        promptText = "Realiza el ANÁLISIS DE FORMA (Errores, Incongruencias, Correcciones) siguiendo tus instrucciones:";
    }

    if (textInput) {
      promptText += `\n\nContexto adicional o texto del documento:\n${textInput}`;
    }
    
    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        role: 'user',
        parts: parts
      },
      config: {
        systemInstruction: type === 'JURIDICAL' ? JURIDICAL_INSTRUCTION : FORM_INSTRUCTION,
        temperature: 0.3, 
      }
    });

    return response.text || "No se pudo generar el análisis.";
  } catch (error: any) {
    console.error(`Gemini Analysis Error (${type}):`, error);
    throw new Error(error.message || "Failed to analyze document");
  }
};