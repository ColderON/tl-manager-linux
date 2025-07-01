"use client";
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import styles from './preisliste.module.css';
import { openJsonFile } from '../lib/jsonUtils';
import { useRouter } from 'next/navigation';

export default function PreislistePage() {
  const [eintraege, setEintraege] = useState([]);
  const [gefilterteEintraege, setGefilterteEintraege] = useState([]);
  const [aktuelleSortierung, setAktuelleSortierung] = useState('none');
  const [suchText, setSuchText] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', category: '', price: '' });
  const [currentFilePath, setCurrentFilePath] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [notification, setNotification] = useState({ visible: false, message: '', type: '' });
  const [isElectron, setIsElectron] = useState(false);
  const [config, setConfig] = useState(null);
  const [showPathInput, setShowPathInput] = useState(false);
  const [newPath, setNewPath] = useState("");
  const router = useRouter();
  const tableRef = useRef(null);


  useEffect(() => {
    const inElectron = typeof window !== 'undefined' && !!window.electronAPI;
    setIsElectron(inElectron);

    const loadInitialData = async () => {
      if (inElectron) {
        const cfg = await window.electronAPI.getConfig();
        setConfig(cfg);
        setNewPath(cfg.preislistePath || "");
        const result = await window.electronAPI.getInitialData();
        if (result) {
          const arr = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
          setEintraege(arr || []);
          setCurrentFilePath(result.filePath || null);
          setIsDirty(false);
        } else {
          setEintraege([]);
          setCurrentFilePath(null);
          showNotification('Standard-Preisliste konnte nicht geladen werden.', 'error');
        }
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    sucheAktualisieren();
  }, [suchText, eintraege, aktuelleSortierung]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.onNavigate) {
      const handler = (path) => router.push(path);
      window.electronAPI.onNavigate(handler);
    }
  }, [router]);

  const showNotification = (message, type) => {
    setNotification({ visible: true, message, type });
    setTimeout(() => {
      setNotification({ visible: false, message: '', type: '' });
    }, 3000);
  };

  const speichereJson = async (dataToSave) => {
    const data = dataToSave || eintraege;
    if (typeof window !== 'undefined' && window.electronAPI) {
      const result = await window.electronAPI.saveCurrentFile({
        filePath: currentFilePath,
        data: data
      });
      if (result.success) {
        setCurrentFilePath(result.filePath);
        setIsDirty(false);
        showNotification('Datei erfolgreich gespeichert!', 'success');
      } else if (!result.canceled) {
        showNotification(result.error || 'Datei konnte nicht gespeichert werden.', 'error');
      }
    } else {
      // Web browser fallback to download the file
      const dataString = JSON.stringify(data, null, 2);
      const blob = new Blob([dataString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'preisliste.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotification('Datei wird heruntergeladen.', 'success');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const data = await openJsonFile(file);
      setEintraege(data);
      setAktuelleSortierung('none');
      setSuchText('');
      setCurrentFilePath(null);
      setIsDirty(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const sortiereNachPreis = () => {
    const newSortierung = aktuelleSortierung === 'asc' ? 'desc' : 'asc';
    setAktuelleSortierung(newSortierung);
  };

  const sortierungZuruecksetzen = () => {
    setAktuelleSortierung('none');
  };

  const sucheAktualisieren = () => {
    let filtered = [];
    if (!suchText.trim()) {
      filtered = [...eintraege];
    } else {
      const suchWoerter = suchText
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

      // Finde alle Wörter, die mit einer Kategorie eines Eintrags übereinstimmen
      const kategorien = suchWoerter.filter(wort =>
        eintraege.some(e => e.category && e.category.toLowerCase().includes(wort))
      );

      if (kategorien.length > 0) {
        // Wenn es Übereinstimmungen bei Kategorien gibt, suche nur in diesen Kategorien
        const rest = suchWoerter.filter(wort => !kategorien.includes(wort));
        // Alle Einträge, deren Kategorie mit einem der Wörter übereinstimmt
        const inKategorie = eintraege.filter(e =>
          kategorien.some(kat => e.category && e.category.toLowerCase().includes(kat))
        );
        if (rest.length > 0) {
          // Filtere nach Name oder Preis innerhalb der gefundenen Kategorien
          filtered = inKategorie.filter(e =>
            rest.some(wort =>
              (e.name && e.name.toLowerCase().includes(wort)) ||
              (e.price && e.price.toFixed(2).includes(wort))
            )
          );
        } else {
          // Wenn nur Kategorie — zeige alle aus dieser Kategorie
          filtered = inKategorie;
        }
      } else {
        // Normale Suche über alle Felder
        const resultSet = new Set();
        suchWoerter.forEach(wort => {
          eintraege.forEach(e => {
            if (
              (e.name && e.name.toLowerCase().includes(wort)) ||
              (e.category && e.category.toLowerCase().includes(wort)) ||
              (e.price && e.price.toFixed(2).includes(wort))
            ) {
              if (!resultSet.has(e.id)) {
                filtered.push(e);
                resultSet.add(e.id);
              }
            }
          });
        });
      }
    }

    if (aktuelleSortierung === 'asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (aktuelleSortierung === 'desc') {
      filtered.sort((a, b) => b.price - a.price);
    }

    setGefilterteEintraege(filtered);
  };

  const neuenEintragHinzufuegen = () => {
    const { name, category, price } = formData;
    if (!name || !category || isNaN(parseFloat(price))) {
      alert('Bitte alle Felder korrekt ausfüllen.');
      return;
    }

    let neueId = 1;
    while (eintraege.some(e => e.id === neueId)) neueId++;

    const neuerEintrag = {
      id: neueId,
      name,
      category,
      price: parseFloat(price)
    };

    const neueEintraege = [...eintraege, neuerEintrag];
    setEintraege(neueEintraege);
    speichereJson(neueEintraege);

    setFormData({ name: '', category: '', price: '' });
    setShowForm(false);
  };

  const eintragEntfernen = (id) => {
    if (!confirm('Eintrag wirklich entfernen?')) return;
    const neueEintraege = eintraege.filter(e => e.id !== id);
    setEintraege(neueEintraege);
    speichereJson(neueEintraege);
  };

  const druckeTabelle = () => {
    window.print();
  };

  return (
    <>
      <Head>
        <title>Preisliste Manager</title>
        <meta name="description" content="Desktop Preisliste Manager" />
      </Head>

      {notification.visible && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          {notification.message}
        </div>
      )}

      <div className={styles.container}>
        <div className={styles.controls}>
          <div className={styles.leftControls}>
            <button onClick={druckeTabelle} className={styles.primaryBtn}>Als PDF exportieren / Drucken</button>
            <button onClick={sortierungZuruecksetzen} className={styles.secondaryBtn}>Sortierung zurücksetzen</button>
            <button onClick={() => setShowForm(!showForm)} className={styles.primaryBtn}>Item erstellen</button>
          </div>
          <div className={styles.rightControls}>
            <button
              onClick={() => setShowPathInput((v) => !v)}
              className={styles.pathBtn}
            >
              {showPathInput ? 'Pfad ausblenden' : 'Pfad anzeigen'}
            </button>
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              id="jsonFileInput"
              onChange={handleFileUpload}
            />
            <button
              onClick={async () => {
                if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.openJsonDialog) {
                  const result = await window.electronAPI.openJsonDialog();
                  if (result && result.filePath && result.data) {
                    setCurrentFilePath(result.filePath);
                    const arr = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
                    setEintraege(arr || []);
                    setAktuelleSortierung('none');
                    setSuchText('');
                    setIsDirty(false);
                    if (isElectron && config) {
                      const newConfig = { ...config, preislistePath: result.filePath };
                      await window.electronAPI.setConfig(newConfig);
                      setConfig(newConfig);
                      setNewPath(result.filePath);
                      showNotification('Pfad aktualisiert!', 'success');
                    }
                  }
                } else {
                  document.getElementById('jsonFileInput').click();
                }
              }}
              className={styles.secondaryBtn}
            >
              JSON-Datei laden
            </button>
            <button
              onClick={() => speichereJson()}
              disabled={!isDirty}
              className={styles.saveBtn}
            >
              Änderungen speichern
            </button>
          </div>
        </div>
        {isElectron && config && showPathInput && (
          <div style={{ margin: '16px 0', padding: 12, background: '#f3f4f6', borderRadius: 8 }}>
            <b>Pfad zur Preisliste:</b> {config.preislistePath}
          </div>
        )}

        {showForm && (
          <div className={styles.formContainer}>
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <input
              type="text"
              placeholder="Kategorie"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Preis"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
            />
            <button onClick={neuenEintragHinzufuegen}>Hinzufügen</button>
            <button onClick={() => setShowForm(false)}>Abbrechen</button>
          </div>
        )}

        <div ref={tableRef} className={styles.contentContainer}>
          <div className={styles.header}>
            <h1>Preisliste</h1>
            <span className={styles.count}>{gefilterteEintraege.length} Einträge</span>
          </div>

          <input
            type="text"
            placeholder="Suche nach Name, Kategorie oder Preis..."
            value={suchText}
            onChange={(e) => setSuchText(e.target.value)}
            className={styles.searchInput}
          />

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className="id">ID</th>
                  <th className="name">Name</th>
                  <th className="category">Kategorie</th>
                  <th className="price" onClick={sortiereNachPreis} style={{cursor: 'pointer'}}>
                    Preis (€) ▲▼
                  </th>
                  <th className="action">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {gefilterteEintraege.length === 0 && eintraege.length === 0 && isElectron ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                      Bitte laden Sie eine JSON-Datei, um zu beginnen.
                    </td>
                  </tr>
                ) : (
                  gefilterteEintraege.map((eintrag, idx) => (
                    <tr key={idx}>
                      <td className="id">{eintrag.id}</td>
                      <td
                        className={`${styles.name} ${styles.editable}`}
                        contentEditable
                        suppressContentEditableWarning={true}
                        onBlur={e => {
                          const newValue = e.target.textContent;
                          setEintraege(prev =>
                            prev.map(item =>
                              item.id === eintrag.id ? { ...item, name: newValue } : item
                            )
                          );
                          setIsDirty(true);
                        }}
                      >
                        {eintrag.name}
                      </td>
                      <td
                        className={`${styles.category} ${styles.editable}`}
                        contentEditable
                        suppressContentEditableWarning={true}
                        onBlur={e => {
                          const newValue = e.target.textContent;
                          setEintraege(prev =>
                            prev.map(item =>
                              item.id === eintrag.id ? { ...item, category: newValue } : item
                            )
                          );
                          setIsDirty(true);
                        }}
                      >
                        {eintrag.category?.toUpperCase()}
                      </td>
                      <td
                        className={`${styles.price} ${styles.editable}`}
                        contentEditable
                        suppressContentEditableWarning={true}
                        onBlur={e => {
                          const newValue = parseFloat(e.target.textContent);
                          setEintraege(prev =>
                            prev.map(item =>
                              item.id === eintrag.id ? { ...item, price: isNaN(newValue) ? item.price : newValue } : item
                            )
                          );
                          setIsDirty(true);
                        }}
                      >
                        {typeof eintrag.price === 'number' && !isNaN(eintrag.price)
                          ? eintrag.price.toFixed(2)
                          : eintrag.price}
                      </td>
                      <td className={`${styles.actionCell}`}>
                        <button
                          className={`${styles.actionBtn} ${styles.remove}`}
                          onClick={() => eintragEntfernen(eintrag.id)}
                        >
                          Entfernen
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .${styles.tableContainer}, .${styles.table}, .${styles.table} * {
            visibility: visible !important;
          }
          .${styles.tableContainer} {
            position: absolute !important;
            left: 0; top: 0; width: 100vw; background: #fff;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
        .dirtyRow {
          background: #fffbe7 !important;
        }
      `}</style>
    </>
  );
} 