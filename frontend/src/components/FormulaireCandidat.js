import React, { useState } from 'react';
import { coverLetterAPI } from "../services/api";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun } from "docx";
import jsPDF from "jspdf";


function FormulaireCandidat() {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    poste: '',
    entreprise: '',
    competences: ''
  });
  const [letter, setLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLetter('');

    try {
      const payload = formData;
      console.log(payload);
      const response = await coverLetterAPI.generate(payload);
      setLetter(response.data.lettre || response.data.letter || "");
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la génération. Vérifiez que le backend est démarré sur le port 5000.');
    } finally {
      setLoading(false);
    }
  };

  // Télécharger en Word
const downloadWord = async () => {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: letter,
                size: 24
              })
            ]
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "Lettre_de_Motivation.docx");
};

// Télécharger en PDF
const downloadPDF = () => {
  const doc = new jsPDF();
  const lines = doc.splitTextToSize(letter, 180);
  doc.text(lines, 10, 10);
  doc.save("Lettre_de_Motivation.pdf");
};


  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h2> Générer une Lettre de Motivation</h2>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        {/* Section Informations Personnelles */}
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          <h3 style={{ marginTop: 0, color: '#495057' }}>📋 Vos Informations</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Nom <span style={{ color: 'red' }}>*</span> :
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                placeholder="Ex: saadeddine"
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                  border: '2px solid #ddd',
                  borderRadius: '5px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Prénom <span style={{ color: 'red' }}>*</span> :
              </label>
              <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                placeholder="Ex: Ahmed"
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                  border: '2px solid #ddd',
                  borderRadius: '5px'
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Email <span style={{ color: 'red' }}>*</span> :
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Ex: ahmed@example.com"
              required
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '5px'
              }}
            />
          </div>

          <div style={{ marginTop: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Téléphone <span style={{ color: 'red' }}>*</span> :
            </label>
            <input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              placeholder="Ex: +212 6 12 34 56 78"
              required
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '5px'
              }}
            />
          </div>

          <div style={{ marginTop: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Adresse (optionnel) :
            </label>
            <input
              type="text"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              placeholder="Ex: Tanger, Maroc"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '5px'
              }}
            />
          </div>
        </div>

        {/* Section Candidature */}
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          <h3 style={{ marginTop: 0, color: '#1976d2' }}>💼 Détails du Poste</h3>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Poste visé <span style={{ color: 'red' }}>*</span> :
            </label>
            <input
              type="text"
              name="poste"
              value={formData.poste}
              onChange={handleChange}
              placeholder="Ex: Développeur Full Stack"
              required
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '5px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Entreprise <span style={{ color: 'red' }}>*</span> :
            </label>
            <input
              type="text"
              name="entreprise"
              value={formData.entreprise}
              onChange={handleChange}
              placeholder="Ex: Google"
              required
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '5px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Compétences <span style={{ color: 'red' }}>*</span> :
            </label>
            <textarea
              name="competences"
              value={formData.competences}
              onChange={handleChange}
              placeholder="Ex: React, Python, Flask, MySQL, Docker, Git"
              required
              rows="3"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '2px solid #ddd',
                borderRadius: '5px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '15px 40px',
            fontSize: '18px',
            fontWeight: 'bold',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            width: '100%',
            transition: 'all 0.3s'
          }}
        >
          {loading ? '⏳ Génération en cours...' : '✨ Générer la Lettre'}
        </button>
      </form>

      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '5px',
          marginBottom: '20px',
          borderLeft: '4px solid #c62828'
        }}>
           {error}
        </div>
      )}

      {letter && (
        <div style={{
          padding: '25px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          borderLeft: '4px solid #007bff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0, color: '#007bff' }}>📝 Lettre Générée :</h3>
          <pre style={{
            whiteSpace: 'pre-wrap',
            fontFamily: 'Georgia, serif',
            fontSize: '15px',
            lineHeight: '1.8',
            color: '#333',
            margin: 0
          }}>
            {letter}
          </pre>
          
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
  <button
    onClick={() => {
      navigator.clipboard.writeText(letter);
      alert("Lettre copiée !");
    }}
    style={{
      padding: "10px 20px",
      backgroundColor: "#28a745",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer"
    }}
  >
    📋 Copier
  </button>

  <button
    onClick={downloadWord}
    style={{
      padding: "10px 20px",
      backgroundColor: "#1976d2",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer"
    }}
  >
    📄 Télécharger Word
  </button>

  <button
    onClick={downloadPDF}
    style={{
      padding: "10px 20px",
      backgroundColor: "#d32f2f",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer"
    }}
  >
    📕 Télécharger PDF
  </button>
</div>

        </div>
      )}
    </div>
  );
}

export default FormulaireCandidat;
