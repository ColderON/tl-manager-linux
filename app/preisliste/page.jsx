"use client";
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import styles from '../page.module.css';
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
          setEintraege(result.data || []);
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
        data: JSON.stringify(data, null, 2)
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

      // Найти все слова, которые совпадают с категорией хотя бы у одного элемента
      const kategorien = suchWoerter.filter(wort =>
        eintraege.some(e => e.category && e.category.toLowerCase().includes(wort))
      );

      if (kategorien.length > 0) {
        // Если есть совпадения по категории, ищем только внутри этих категорий
        const rest = suchWoerter.filter(wort => !kategorien.includes(wort));
        // Все элементы, у которых категория совпадает с любым из слов
        const inKategorie = eintraege.filter(e =>
          kategorien.some(kat => e.category && e.category.toLowerCase().includes(kat))
        );
        if (rest.length > 0) {
          // Фильтруем по name oder price внутри найденных категорий
          filtered = inKategorie.filter(e =>
            rest.some(wort =>
              (e.name && e.name.toLowerCase().includes(wort)) ||
              (e.price && e.price.toFixed(2).includes(wort))
            )
          );
        } else {
          // Если только категория — показываем все из этой категории
          filtered = inKategorie;
        }
      } else {
        // Обычный поиск по всем полям
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

  const bestaetigeAenderung = (id, field, value) => {
    setEintraege(prev => prev.map(item => {
      if (item.id === id) {
        const newItem = { ...item };
        if (field === 'price') {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            newItem[field] = numValue;
          }
        } else {
          newItem[field] = value;
        }
        return newItem;
      }
      return item;
    }));
    setIsDirty(true);
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
      {isElectron && config && (
        <div style={{ margin: '16px 0', padding: 12, background: '#f3f4f6', borderRadius: 8 }}>
          <button onClick={() => setShowPathInput((v) => !v)}>
            {showPathInput ? 'Pfad ausblenden' : 'Pfad anzeigen'}
          </button>
          {showPathInput && (
            <div style={{ marginTop: 8 }}>
              <b>Pfad zur Preisliste:</b> {config.preislistePath}
            </div>
          )}
        </div>
      )}
        <div className={styles.controls}>
          <div className={styles.leftControls}>
            <button onClick={druckeTabelle}>Als PDF exportieren / Drucken</button>
            <button onClick={sortierungZuruecksetzen}>Sortierung zurücksetzen</button>
            <button onClick={() => setShowForm(!showForm)}>Item erstellen</button>
          </div>
          <div className={styles.rightControls}>
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
                    setEintraege(result.data);
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
            >
              JSON-Datei laden
            </button>
            <button onClick={() => speichereJson()} disabled={!isDirty}>JSON speichern</button>
          </div>
        </div>

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
                  gefilterteEintraege.map((eintrag) => (
                    <tr key={eintrag.id}>
                      <td className="id">{eintrag.id}</td>
                      <td
                        className={`${styles.name} ${styles.editable}`}
                        contentEditable
                        suppressContentEditableWarning={true}
                        onBlur={(e) => bestaetigeAenderung(eintrag.id, 'name', e.target.textContent)}
                      >
                        {eintrag.name}
                      </td>
                      <td
                        className={`${styles.category} ${styles.editable}`}
                        contentEditable
                        suppressContentEditableWarning={true}
                        onBlur={(e) => bestaetigeAenderung(eintrag.id, 'category', e.target.textContent)}
                      >
                        {eintrag.category?.toUpperCase()}
                      </td>
                      <td
                        className={`${styles.pri} ${styles.editable}`}
                        contentEditable
                        suppressContentEditableWarning={true}
                        onBlur={(e) => bestaetigeAenderung(eintrag.id, 'price', e.target.textContent)}
                      >
                        {eintrag.price?.toFixed(2)}
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
      `}</style>
    </>
  );
} 