import React, { useState } from 'react';
import api from '../services/api'; 

export default function UploadAndAnalyzeCV() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
  
      const formData = new FormData();
      formData.append('file', file); 

      const uploadRes = await api.post('/profile/cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // const uploadedFileName = uploadRes.data.cv_filename; // khdama f backend

      
      const analyzeForm = new FormData();
      analyzeForm.append('cv', file); 

      const analyzeRes = await api.post('/analyze-cv', analyzeForm);

      setResult(analyzeRes.data);
      setFile(null);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          'Erreur lors de l\'upload ou de l\'analyse. Vérifie backend + token.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>📄 Upload et Analyse du CV</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Fichier CV (PDF/DOCX/Image) :
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '2px solid #ddd',
              borderRadius: '5px',
            }}
          />
          {file && (
            <p style={{ marginTop: '5px', color: '#666', fontSize: '14px' }}>
              Fichier sélectionné : {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          style={{
            padding: '12px 30px',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: loading || !file ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading || !file ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '⏳ Upload & Analyse...' : '📤 Upload & Analyse'}
        </button>
      </form>

      {error && (
        <div
          style={{
            padding: '15px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '5px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#f5f5f5',
            borderRadius: '5px',
            borderLeft: '4px solid #28a745',
          }}
        >
          <h3 style={{ marginTop: 0 }}> Résultat de l'Analyse :</h3>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'Consolas, monospace',
              fontSize: '13px',
              lineHeight: '1.5',
              backgroundColor: '#fff',
              padding: '15px',
              borderRadius: '5px',
              overflow: 'auto',
              maxHeight: '400px',
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}