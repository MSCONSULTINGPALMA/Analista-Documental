import React, { useState, useRef, useEffect } from 'react';
import { analyzeDocument } from './services/geminiService';
import { AnalysisStatus, FileUploadState, AnalysisResult } from './types';
import AnalysisDisplay from './components/AnalysisDisplay';
import { ScaleIcon, UploadIcon, FileTextIcon, XIcon, PdfIcon, EditIcon } from './components/Icons';

function App() {
  const [textInput, setTextInput] = useState('');
  const [fileState, setFileState] = useState<FileUploadState>({
    file: null,
    previewUrl: null,
    base64: null,
    mimeType: null
  });
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [results, setResults] = useState<AnalysisResult>({ juridical: null, form: null });
  const [activeTab, setActiveTab] = useState<'JURIDICAL' | 'FORM'>('JURIDICAL');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (fileState.previewUrl) {
        URL.revokeObjectURL(fileState.previewUrl);
      }
    };
  }, [fileState.previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    processFile(file);
  };

  const processFile = (file: File) => {
     // Accept images and PDFs
     if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setError("Por favor sube una imagen (JPG, PNG) o un PDF del contrato.");
        return;
     }

     const reader = new FileReader();
     reader.onloadend = () => {
       setFileState({
         file: file,
         previewUrl: URL.createObjectURL(file),
         base64: reader.result as string,
         mimeType: file.type
       });
       setError(null);
     };
     reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const clearFile = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFileState({ file: null, previewUrl: null, base64: null, mimeType: null });
  };

  const handleAnalyze = async () => {
    if (!textInput && !fileState.base64) {
      setError("Por favor proporciona texto o sube un documento.");
      return;
    }

    setStatus(AnalysisStatus.ANALYZING);
    setError(null);
    setResults({ juridical: null, form: null });
    setActiveTab('JURIDICAL'); // Default to juridical view

    try {
      // Run both analyses in parallel
      const [juridicalResult, formResult] = await Promise.all([
        analyzeDocument(textInput, fileState.base64, fileState.mimeType, 'JURIDICAL'),
        analyzeDocument(textInput, fileState.base64, fileState.mimeType, 'FORM')
      ]);

      setResults({
        juridical: juridicalResult,
        form: formResult
      });
      setStatus(AnalysisStatus.COMPLETED);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado durante el análisis.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md">
              <ScaleIcon className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">Analista <span className="text-indigo-600">Documental</span></span>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            Impulsado por Gemini 3.1
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Intro Hero */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Entiende lo que firmas.
          </h1>
          <p className="text-lg text-slate-600">
            Sube un contrato (PDF o Imagen) o pega texto legal. Realizamos un doble análisis: <span className="font-bold text-indigo-600">Jurídico</span> (fondo) y de <span className="font-bold text-emerald-600">Forma</span> (redacción y errores).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Text Input Area */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Pegar Texto Legal
              </label>
              <textarea
                className="w-full h-64 p-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-sm leading-relaxed bg-slate-50 focus:bg-white"
                placeholder="Pega los términos del contrato, política de privacidad o texto legal aquí..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={status === AnalysisStatus.ANALYZING}
              />
            </div>

            {/* OR Separator */}
            <div className="flex items-center gap-4">
              <div className="h-px bg-slate-300 flex-1"></div>
              <span className="text-slate-400 text-sm font-medium">O SUBE UN DOCUMENTO</span>
              <div className="h-px bg-slate-300 flex-1"></div>
            </div>

            {/* File Upload Area */}
            <div 
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer group ${
                fileState.file 
                  ? 'border-indigo-200 bg-indigo-50' 
                  : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => !fileState.file && fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                className="hidden"
              />

              {fileState.file ? (
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    {fileState.mimeType === 'application/pdf' ? (
                       <div className="h-32 w-32 bg-white flex items-center justify-center rounded-lg border border-slate-200 shadow-sm">
                          <div className="text-red-500 flex flex-col items-center">
                             <PdfIcon className="w-12 h-12" />
                             <span className="text-xs font-bold mt-2 text-slate-600">PDF</span>
                          </div>
                       </div>
                    ) : (
                      <img 
                        src={fileState.previewUrl!} 
                        alt="Preview" 
                        className="h-32 w-auto object-contain rounded-lg shadow-sm border border-slate-200" 
                      />
                    )}
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-900 font-medium">
                    <FileTextIcon className="w-4 h-4" />
                    <span className="truncate max-w-[200px]">{fileState.file.name}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <UploadIcon className="w-6 h-6" />
                  </div>
                  <p className="text-slate-900 font-medium mb-1">Haz clic para subir o arrastra y suelta</p>
                  <p className="text-slate-500 text-xs">Soporta JPG, PNG, PDF</p>
                </>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={handleAnalyze}
              disabled={status === AnalysisStatus.ANALYZING || (!textInput && !fileState.file)}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2
                ${status === AnalysisStatus.ANALYZING 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/30'
                }
              `}
            >
              {status === AnalysisStatus.ANALYZING ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analizando Documento...
                </>
              ) : (
                <>
                  <ScaleIcon className="w-5 h-5" />
                  Analizar Documento
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 animate-fadeIn">
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-7">
            {status === AnalysisStatus.COMPLETED ? (
              <div className="space-y-4">
                
                {/* Tabs */}
                <div className="flex rounded-xl bg-slate-200 p-1 shadow-inner">
                  <button
                    onClick={() => setActiveTab('JURIDICAL')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all
                      ${activeTab === 'JURIDICAL' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                      }
                    `}
                  >
                    <ScaleIcon className="w-4 h-4" />
                    Análisis Jurídico
                  </button>
                  <button
                    onClick={() => setActiveTab('FORM')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all
                      ${activeTab === 'FORM' 
                        ? 'bg-white text-emerald-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                      }
                    `}
                  >
                    <EditIcon className="w-4 h-4" />
                    Análisis de Forma
                  </button>
                </div>

                {/* Content Display */}
                {activeTab === 'JURIDICAL' && results.juridical && (
                   <AnalysisDisplay markdown={results.juridical} type="JURIDICAL" />
                )}
                {activeTab === 'FORM' && results.form && (
                   <AnalysisDisplay markdown={results.form} type="FORM" />
                )}

              </div>
            ) : (
              <div className="h-full min-h-[500px] bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                 {status === AnalysisStatus.ANALYZING ? (
                   <div className="max-w-xs">
                      <div className="flex justify-center mb-6 gap-2">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <p className="font-medium text-slate-600 mb-2">Revisando Fondo y Forma...</p>
                      <p className="text-sm">El Abogado IA está detectando riesgos y corrigiendo errores de redacción simultáneamente.</p>
                   </div>
                 ) : (
                   <>
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                      <ScaleIcon className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-lg font-medium text-slate-500">El análisis aparecerá aquí</p>
                    <p className="text-sm text-slate-400 mt-2 max-w-sm">
                      Obtendrás dos informes detallados: uno sobre la validez legal y otro con correcciones de redacción.
                    </p>
                   </>
                 )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;