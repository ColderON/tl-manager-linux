"use client";
import { useState, useEffect } from "react";
import styles from "./laufkarten-liste.module.css";

export default function LaufkartenListe() {
  const [laufkartenFiles, setLaufkartenFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [notification, setNotification] = useState({ visible: false, message: '', type: '' });

  // Получить список PDF Laufkarten
  const fetchLaufkartenFiles = async () => {
    try {
      const result = await window.electronAPI.listLaufkartenPDFs();
      if (result && Array.isArray(result.files)) {
        setLaufkartenFiles(result.files);
      }
    } catch (e) {
      setLaufkartenFiles([]);
    }
  };

  // Загрузить PDF-файл (теперь просто имя файла)
  const loadLaufkarteFile = async (filename) => {
    setSelectedFile(filename);
  };

  useEffect(() => {
    fetchLaufkartenFiles();
  }, []);

  return (
    <div className={styles.laufkartenListePage}>
      <h1 className={styles.listeHeader}>Laufkarten Liste</h1>
      <div className={styles.listeLayout}>
        {/* Sidebar: список файлов и поиск */}
        <div className={styles.sidebar}>
          <input
            type="text"
            placeholder="Suche..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <div className={styles.fileList}>
            {laufkartenFiles.filter(f => f.toLowerCase().includes(search.toLowerCase())).map(f => (
              <div
                key={f}
                onClick={() => loadLaufkarteFile(f)}
                className={selectedFile === f ? `${styles.fileItem} ${styles.fileItemActive}` : styles.fileItem}
              >
                {f}
              </div>
            ))}
            {laufkartenFiles.length === 0 && <div className={styles.noFiles}>Keine Dateien</div>}
          </div>
        </div>
        {/* Main: просмотр laufkarte */}
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