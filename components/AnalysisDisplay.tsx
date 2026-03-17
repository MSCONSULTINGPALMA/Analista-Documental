import React, { useRef, useState, useEffect } from 'react';
import { AlertTriangleIcon, CheckCircleIcon, ScaleIcon, DownloadIcon, EditIcon, StarIcon } from './Icons';

interface Props {
  markdown: string;
  type: 'JURIDICAL' | 'FORM';
}

const AnalysisDisplay: React.FC<Props> = ({ markdown, type }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Feedback state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Reset feedback when content changes
  useEffect(() => {
    setRating(0);
    setHoverRating(0);
    setComment('');
    setFeedbackSubmitted(false);
  }, [markdown, type]);

  // Split by lines to process custom formatting
  const sections = markdown.split('\n');

  const handleExportPdf = () => {
    if (!contentRef.current || typeof (window as any).html2pdf === 'undefined') return;
    
    setIsExporting(true);
    const element = contentRef.current;
    
    const filename = type === 'JURIDICAL' ? 'Analisis_Legal_Fondo.pdf' : 'Analisis_Legal_Forma.pdf';

    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // @ts-ignore
    window.html2pdf().set(opt).from(element).save().then(() => {
      setIsExporting(false);
    }).catch((err: any) => {
      console.error("PDF export failed", err);
      setIsExporting(false);
    });
  };

  const handleRate = (value: number) => {
    if (!feedbackSubmitted) setRating(value);
  };

  const submitFeedback = () => {
    if (rating === 0) return;
    // Simulate API submission
    console.log(`Feedback submitted for ${type}: ${rating} stars, comment: "${comment}"`);
    setFeedbackSubmitted(true);
  };

  const renderContent = () => {
    let currentSectionType: 'normal' | 'red' | 'yellow' | 'green' = 'normal';
    
    return sections.map((line, index) => {
      // Detect headers for Traffic Light System OR Form Error detection
      if (line.includes('🔴') || line.toLowerCase().includes('alerta roja') || line.toLowerCase().includes('error de forma')) {
        currentSectionType = 'red';
        return (
          <div key={index} className="mt-6 mb-3 flex items-start gap-2 text-red-700 font-bold text-lg border-b border-red-200 pb-2 break-inside-avoid">
            <AlertTriangleIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <span>{line.replace(/[*#]/g, '').replace('🔴', '').trim()}</span>
          </div>
        );
      }
      if (line.includes('🟡') || line.toLowerCase().includes('alerta amarilla')) {
        currentSectionType = 'yellow';
        return (
          <div key={index} className="mt-6 mb-3 flex items-start gap-2 text-yellow-700 font-bold text-lg border-b border-yellow-200 pb-2 break-inside-avoid">
            <AlertTriangleIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <span>{line.replace(/[*#]/g, '').replace('🟡', '').trim()}</span>
          </div>
        );
      }
      if (line.includes('🟢') || line.toLowerCase().includes('luz verde') || line.toLowerCase().includes('propuesta de corrección')) {
        currentSectionType = 'green';
        return (
          <div key={index} className="mt-6 mb-3 flex items-start gap-2 text-green-700 font-bold text-lg border-b border-green-200 pb-2 break-inside-avoid">
            <CheckCircleIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <span>{line.replace(/[*#]/g, '').replace('🟢', '').trim()}</span>
          </div>
        );
      }

      // Standard Markdown Headers (Level 1-3)
      if (line.startsWith('# ')) {
        currentSectionType = 'normal';
        return <h2 key={index} className="text-2xl font-bold text-slate-800 mt-8 mb-4 break-after-avoid">{line.replace('# ', '')}</h2>;
      }
      if (line.startsWith('## ')) {
        currentSectionType = 'normal';
        return <h3 key={index} className="text-xl font-semibold text-slate-700 mt-6 mb-3 break-after-avoid">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('### ')) {
        return <h4 key={index} className="text-lg font-semibold text-slate-700 mt-4 mb-2 break-after-avoid">{line.replace('### ', '')}</h4>;
      }

      // Separators
      if (line.trim() === '---') {
          return <hr key={index} className="my-6 border-slate-200" />;
      }

      // Lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const content = line.trim().substring(2);
        // Check if it's a key-value pair inside a list
        const parts = content.split(':');
        
        let listStyle = "text-slate-700";
        if (currentSectionType === 'red') listStyle = "text-red-800 bg-red-50 p-3 rounded border-l-4 border-red-500 mb-2";
        if (currentSectionType === 'yellow') listStyle = "text-yellow-800 bg-yellow-50 p-3 rounded border-l-4 border-yellow-500 mb-2";
        if (currentSectionType === 'green') listStyle = "text-green-800 bg-green-50 p-3 rounded border-l-4 border-green-500 mb-2";

        if (parts.length > 1 && currentSectionType === 'normal') {
            return (
                <div key={index} className="ml-4 mb-2 pl-2 border-l-2 border-indigo-100 break-inside-avoid">
                    <span className="font-bold text-indigo-900">{parts[0]}:</span>
                    <span className="text-slate-700">{parts.slice(1).join(':')}</span>
                </div>
            )
        }

        return (
          <div key={index} className={`ml-4 ${listStyle} break-inside-avoid text-sm sm:text-base`}>
             {currentSectionType === 'normal' && <span className="mr-2">•</span>}
             <span dangerouslySetInnerHTML={{ 
               __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
             }} />
          </div>
        );
      }

      // Regular Text paragraphs handling styling based on section
      if (line.trim() !== '') {
        let pStyle = "text-slate-600 leading-relaxed mb-2";
        if (currentSectionType === 'red') pStyle = "text-red-800 bg-red-50 p-3 rounded mb-2 border-l-4 border-red-500";
        if (currentSectionType === 'green') pStyle = "text-green-800 bg-green-50 p-3 rounded mb-2 border-l-4 border-green-500";

        return (
            <p key={index} className={pStyle}>
            <span dangerouslySetInnerHTML={{ 
                __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
            }} />
            </p>
        );
      }

      return <div key={index} className="h-2"></div>;
    });
  };

  return (
    <div className="animate-fadeIn">
      <div className="bg-white shadow-xl rounded-xl min-h-[500px] border border-slate-200 overflow-hidden">
        {/* Header / Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg text-white ${type === 'JURIDICAL' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                 {type === 'JURIDICAL' ? <ScaleIcon /> : <EditIcon />}
             </div>
             <div>
                 <h2 className="text-xl font-bold text-slate-900">
                     {type === 'JURIDICAL' ? 'Análisis Jurídico' : 'Análisis de Forma'}
                 </h2>
                 <p className="text-xs text-slate-500">Generado por Analista Documental</p>
             </div>
           </div>
           
           <button 
             onClick={handleExportPdf}
             disabled={isExporting}
             className="flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
           >
             {isExporting ? (
               <span className="animate-pulse">Generando PDF...</span>
             ) : (
               <>
                 <DownloadIcon className="w-4 h-4" />
                 Exportar PDF
               </>
             )}
           </button>
        </div>

        {/* Printable Content */}
        <div ref={contentRef} className="p-8 bg-white">
          <div className="prose prose-slate max-w-none">
            {renderContent()}
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-center text-slate-400 break-inside-avoid">
            Aviso: El análisis de IA es solo para fines informativos y no constituye asesoramiento legal profesional. Consulta a un abogado calificado antes de firmar documentos legales.
          </div>
        </div>

        {/* Feedback Section (Not printable) */}
        <div className="bg-slate-50 border-t border-slate-200 p-8">
            {!feedbackSubmitted ? (
                <div className="max-w-2xl mx-auto text-center">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">
                        {type === 'JURIDICAL' ? '¿Te resultó útil este análisis legal?' : '¿Fue acertada la corrección de forma?'}
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">Ayúdanos a entrenar y mejorar la precisión del Abogado IA.</p>
                    
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => handleRate(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                                title={`Calificar con ${star} estrellas`}
                            >
                                <StarIcon 
                                    className={`w-10 h-10 ${
                                        star <= (hoverRating || rating) 
                                            ? "text-yellow-400" 
                                            : "text-slate-300"
                                    }`} 
                                    filled={star <= (hoverRating || rating)}
                                />
                            </button>
                        ))}
                    </div>

                    <div className="mb-4 text-left">
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Cuéntanos más detalles sobre la calidad del reporte (opcional)..."
                            className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white shadow-sm"
                            rows={3}
                        />
                    </div>

                    <button
                        onClick={submitFeedback}
                        disabled={rating === 0}
                        className={`px-6 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all
                            ${rating > 0 
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/30' 
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }
                        `}
                    >
                        Enviar Comentarios
                    </button>
                </div>
            ) : (
                <div className="text-center py-6 animate-fadeIn">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircleIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">¡Gracias por tu opinión!</h3>
                    <p className="text-slate-500">Tus comentarios son fundamentales para mejorar nuestros modelos.</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default AnalysisDisplay;