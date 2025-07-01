"use client";
import { useState, useEffect } from "react";
import styles from "./laufkarten-liste.module.css";

export default function LaufkartenListe() {
  const [laufkartenFiles, setLaufkartenFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [notification, setNotification] = useState({ visible: false, message: '', type: '' });
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'name'

  // PDF-Laufkarten abrufen
  const fetchLaufkartenFiles = async () => {
    try {
      const result = await window.electronAPI.listLaufkartenPDFs();
      //console.log('API result:', result);
      if (result && Array.isArray(result.files)) {
        // result.files теперь массив объектов { name, ctime }
        setLaufkartenFiles(result.files);
      }
    } catch (e) {
      console.error('API error:', e);
      setLaufkartenFiles([]);
    }
  };

  // PDF-Datei laden (jetzt nur Dateiname)
  const loadLaufkarteFile = async (filename) => {
    setSelectedFile(filename);
  };

  useEffect(() => {
    fetchLaufkartenFiles();
  }, []);

  // Filtern und Sortieren
  const filteredAndSortedFiles = laufkartenFiles
    .map(f => typeof f === 'string' ? { name: f, ctime: 0 } : f)
    .filter(f => f.name && f.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date') {
        return b.ctime - a.ctime;
      } else {
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }
    });

  return (
    <div className={styles.laufkartenListePage}>
      <h1 className={styles.listeHeader}>Laufkarten Liste</h1>
      <div className={styles.listeLayout}>
        {/* Sidebar: Dateiliste und Suche */}
        <div className={styles.sidebar}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button
              onClick={() => setSortBy('date')}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                border: sortBy === 'date' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                background: sortBy === 'date' ? '#2563eb' : '#f1f5f9',
                color: sortBy === 'date' ? '#fff' : '#1e293b',
                fontWeight: sortBy === 'date' ? 700 : 400,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Nach Datum
            </button>
            <button
              onClick={() => setSortBy('name')}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                border: sortBy === 'name' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                background: sortBy === 'name' ? '#2563eb' : '#f1f5f9',
                color: sortBy === 'name' ? '#fff' : '#1e293b',
                fontWeight: sortBy === 'name' ? 700 : 400,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Nach Name
            </button>
          </div>
          <input
            type="text"
            placeholder="Suche..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <div className={styles.fileList}>
            {filteredAndSortedFiles.map(f => (
              <div
                key={f.name}
                onClick={() => loadLaufkarteFile(f.name)}
                className={selectedFile === f.name ? `${styles.fileItem} ${styles.fileItemActive}` : styles.fileItem}
              >
                {f.name}
              </div>
            ))}
            {laufkartenFiles.length === 0 && <div className={styles.noFiles}>Keine Dateien</div>}
          </div>
        </div>
        {/* Main: Laufkarte anzeigen */}
        <div className={styles.viewer}>
          {selectedFile ? (
            <PDFViewer pdfFileName={selectedFile} />
          ) : (
            <div style={{ color: '#64748b', fontSize: 18, marginTop: 40 }}>Wählen Sie eine Laufkarte aus</div>
          )}
        </div>
      </div>
      {notification.visible && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>{notification.message}</div>
      )}
    </div>
  );
}

function PDFViewer({ pdfFileName }) {
  const [pdfPath, setPdfPath] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    window.electronAPI.getLaufkartePDFPathByFile({ pdfFileName })
      .then(result => {
        if (!active) return;
        if (result && result.exists && result.path) {
          setPdfPath(result.path);
          setError(null);
        } else {
          setPdfPath(null);
          setError('PDF nicht gefunden');
        }
      });
    return () => { active = false; };
  }, [pdfFileName]);
  if (error) return <div style={{ color: '#ef4444', fontSize: 16, marginTop: 40 }}>{error}</div>;
  if (!pdfPath) return <div style={{ color: '#64748b', fontSize: 16, marginTop: 40 }}>Lade PDF...</div>;
  return (
    <iframe
      src={pdfPath}
      className={styles.pdfFrame}
      title="Laufkarte PDF"
    />
  );
} 