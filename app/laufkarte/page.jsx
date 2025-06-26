"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { generateLaufnummer } from "../lib/generateLaufnummer";
import companyData from "../constants/company_data.json";
import styles from "./laufkarte.module.css";

const LAUFKARTEN_DIR = 'Laufkarten';

export default function LaufkartePage() {
  const [laufkarteNumber, setLaufkarteNumber] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    tel: "",
    abgegeben: "",
    abholtermin: "",
    kleidungstuecke: {
      heMantel: false,
      anzug: false,
      jacke: false,
      hose: false,
      hemd: false,
      weste: false,
      pullover: false,
      tShirt: false,
      daMantel: false,
      kostuem: false,
      kleid: false,
      rock: false,
      bluse: false,
      gardinen: false,
    },
    aenderungen: {
      kuerzen: false,
      engen: false,
      weiten: false,
      reissverschluss: false,
      fuetter: false,
      tasche: false,
      kragen: false,
      stossband: false,
      saumNaehen: false,
      knopfKnopfloch: false,
      falten: false,
      gummiband: false,
    },
    positionen: {
      vorne: false,
      hinten: false,
      aermel: false,
      beine: false,
    },
    hinweise: "",
  });

  const [notification, setNotification] = useState({ visible: false, message: '', type: '' });

  const laufkarteRef = useRef(null);
  const [printing, setPrinting] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [laufkartenFiles, setLaufkartenFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewData, setViewData] = useState(null);

  const handlePrint = useCallback(async () => {
    setPrinting(true);
    const result = await window.electronAPI.laufkarteSaveAndCheck({
      filename: laufkarteNumber + ".json",
      data: formData,
    });
    if (result.success) {
      window.print();
      setTimeout(() => setPrinting(false), 500);
      onSuccess();
      resetLaufkarte();
    } else {
      setPrinting(false);
      onError(result.error);
    }
  }, [laufkarteNumber, formData]);

  const handleSaveAndPrintPDF = async () => {
    const result = await window.electronAPI.saveAndPrintLaufkartePDF({
      laufkarteNumber,
    });
    if (result && result.success) {
      setNotification({ visible: true, message: 'PDF gespeichert und zum Drucken geöffnet!', type: 'success' });
      setTimeout(() => setNotification({ visible: false, message: '', type: '' }), 3000);
    } else {
      setNotification({ visible: true, message: result?.error || 'Fehler beim PDF-Export oder Drucken!', type: 'error' });
      setTimeout(() => setNotification({ visible: false, message: '', type: '' }), 3000);
    }
  };

  useEffect(() => {
    generateNewNumber();
  }, []);

  const generateNewNumber = () => {
    setLaufkarteNumber(generateLaufnummer());
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCheckboxChange = (category, field) => {
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: !prev[category][field],
      },
    }));
  };

  const resetLaufkarte = () => {
    setFormData({
      name: "",
      tel: "",
      abgegeben: "",
      abholtermin: "",
      kleidungstuecke: {
        heMantel: false,
        anzug: false,
        jacke: false,
        hose: false,
        hemd: false,
        weste: false,
        pullover: false,
        tShirt: false,
        daMantel: false,
        kostuem: false,
        kleid: false,
        rock: false,
        bluse: false,
        gardinen: false,
      },
      aenderungen: {
        kuerzen: false,
        engen: false,
        weiten: false,
        reissverschluss: false,
        fuetter: false,
        tasche: false,
        kragen: false,
        stossband: false,
        saumNaehen: false,
        knopfKnopfloch: false,
        falten: false,
        gummiband: false,
      },
      positionen: {
        vorne: false,
        hinten: false,
        aermel: false,
        beine: false,
      },
      hinweise: "",
    });
    generateNewNumber();
  };

  function onSuccess() {
    setNotification({ visible: true, message: 'Laufkarte wurde erfolgreich gespeichert und zum Drucken gesendet!', type: 'success' });
    setTimeout(() => setNotification({ visible: false, message: '', type: '' }), 3000);
  }

  function onError(errorMsg) {
    setNotification({ visible: true, message: errorMsg || 'Fehler beim Speichern oder Drucken!', type: 'error' });
    setTimeout(() => setNotification({ visible: false, message: '', type: '' }), 3000);
  }

  // Получить список файлов Laufkarten
  const fetchLaufkartenFiles = async () => {
    try {
      const result = await window.electronAPI.listLaufkarten();
      if (result && Array.isArray(result.files)) {
        setLaufkartenFiles(result.files);
      }
    } catch (e) {
      setLaufkartenFiles([]);
    }
  };

  // Загрузить данные выбранного файла
  const loadLaufkarteFile = async (filename) => {
    try {
      const result = await window.electronAPI.readLaufkarte({ filename });
      if (result && result.data) {
        setViewData(result.data);
        setSelectedFile(filename);
      }
    } catch (e) {
      setViewData(null);
      setSelectedFile(null);
    }
  };

  useEffect(() => {
    if (viewMode) {
      fetchLaufkartenFiles();
      setViewData(null);
      setSelectedFile(null);
    }
  }, [viewMode]);

  return (
    <div className={styles.laufkartePage}>
      <button
        onClick={() => setViewMode((v) => !v)}
        style={{ marginBottom: 16, padding: '8px 18px', background: viewMode ? '#2563eb' : '#059669', color: '#fff', borderRadius: 6, border: 'none', fontWeight: 500, cursor: 'pointer' }}
      >
        {viewMode ? 'Zurück zum Erstellen' : 'Laufkarten ansehen'}
      </button>
      {viewMode ? (
        <div style={{ display: 'flex', gap: 24 }}>
          {/* Sidebar: список файлов и поиск */}
          <div style={{ minWidth: 260, maxWidth: 320 }}>
            <input
              type="text"
              placeholder="Suche..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 15 }}
            />
            <div style={{ maxHeight: 600, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff' }}>
              {laufkartenFiles.filter(f => f.toLowerCase().includes(search.toLowerCase())).map(f => (
                <div
                  key={f}
                  onClick={() => loadLaufkarteFile(f)}
                  style={{ padding: '10px 14px', cursor: 'pointer', background: selectedFile === f ? '#e0e7ff' : 'transparent', borderBottom: '1px solid #f1f5f9' }}
                >
                  {f}
                </div>
              ))}
              {laufkartenFiles.length === 0 && <div style={{ padding: 12, color: '#64748b' }}>Keine Dateien</div>}
            </div>
          </div>
          {/* Main: просмотр laufkarte */}
          <div style={{ flex: 1 }}>
            {viewData ? (
              <LaufkarteForm
                companyData={companyData}
                laufkarteNumber={selectedFile.replace(/\.json$/, "")}
                formData={viewData}
                onInputChange={() => {}}
                onCheckboxChange={() => {}}
                isFirst={true}
                readOnly={true}
              />
            ) : (
              <div style={{ color: '#64748b', fontSize: 18, marginTop: 40 }}>Wählen Sie eine Laufkarte aus</div>
            )}
          </div>
        </div>
      ) : (
        <>
          {notification.visible && (
            <div className={`${styles.notification} ${styles[notification.type]}`}>{notification.message}</div>
          )}
          <div className={styles.laufkarteContainer}>
            {/* Header Controls */}
            {!printing && (
              <div style={{ marginBottom: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} className="print:hidden">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1e293b' }}>Laufkarte Generator</h1>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <button
                      onClick={generateNewNumber}
                      style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', borderRadius: 6, border: 'none', fontWeight: 500, cursor: 'pointer' }}
                    >
                      Neue Nummer generieren
                    </button>
                    <button
                      onClick={resetLaufkarte}
                      style={{ padding: '10px 20px', background: '#f59e42', color: '#fff', borderRadius: 6, border: 'none', fontWeight: 500, cursor: 'pointer' }}
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleSaveAndPrintPDF}
                      style={{ padding: '10px 20px', background: '#6366f1', color: '#fff', borderRadius: 6, border: 'none', fontWeight: 500, cursor: 'pointer' }}
                    >
                      PDF speichern & drucken
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: 8, fontSize: 15, color: '#64748b' }}>
                  Aktuelle Kontroll-Nr.: <span style={{ fontFamily: 'Fira Mono, monospace', fontWeight: 700 }}>{laufkarteNumber}</span>
                </div>
              </div>
            )}
            {/* Laufkarte Forms - A4 Size */}
            <div className={styles.a4} ref={laufkarteRef} style={printing ? { boxShadow: 'none', margin: 0 } : {}}>
              <LaufkarteForm
                companyData={companyData}
                laufkarteNumber={laufkarteNumber}
                formData={formData}
                onInputChange={handleInputChange}
                onCheckboxChange={handleCheckboxChange}
                isFirst={true}
                readOnly={false}
              />
            </div>
          </div>
        </>
      )}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .${styles.a4}, .${styles.a4} * {
            visibility: visible !important;
          }
          .${styles.a4} {
            position: absolute !important;
            left: 0; top: 0; width: 100vw; background: #fff;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

function LaufkarteForm({ companyData, laufkarteNumber, formData, onInputChange, onCheckboxChange, isFirst, readOnly }) {
  return (
    <div className={styles.laufkarteForm}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.company}>{companyData.companyName}</div>
          <div className={styles.companyDetails}>
            <div>{companyData.owner}</div>
            <div>{companyData.address}</div>
            <div>Tel: {companyData.phone}</div>
          </div>
        </div>
        <div className={styles.kontrollNr}>
          <div className={styles.kontrollNrLabel}>Kontroll-Nr.</div>
          <div className={styles.kontrollNrValue}>{laufkarteNumber}</div>
        </div>
      </div>
      {/* Customer Info */}
      <div className={styles.grid} style={{ marginBottom: 24 }}>
        <div>
          <label className={styles.label}>Name:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => isFirst && onInputChange("name", e.target.value)}
            className={styles.input}
            readOnly={readOnly || !isFirst}
          />
        </div>
        <div>
          <label className={styles.label}>Tel:</label>
          <input
            type="text"
            value={formData.tel}
            onChange={(e) => isFirst && onInputChange("tel", e.target.value)}
            className={styles.input}
            readOnly={readOnly || !isFirst}
          />
        </div>
      </div>
      {/* Date Info */}
      <div className={styles.grid} style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 24 }}>
        <div>
          <label className={styles.label}>Abgegeben am:</label>
          <input
            type="text"
            value={formData.abgegeben}
            onChange={(e) => isFirst && onInputChange("abgegeben", e.target.value)}
            className={styles.input}
            readOnly={readOnly || !isFirst}
          />
        </div>
        <div>
          <label className={styles.label}>Abholtermin:</label>
          <input
            type="text"
            value={formData.abholtermin}
            onChange={(e) => isFirst && onInputChange("abholtermin", e.target.value)}
            className={styles.input}
            readOnly={readOnly || !isFirst}
          />
        </div>
      </div>
      {/* Main Content Grid */}
      <div className={styles.grid} style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: 24 }}>
        {/* Kleidungsstück */}
        <div>
          <div className={styles.sectionTitle}>Kleidungsstück</div>
          <div className={styles.checkboxGroup}>
            {Object.entries({
              heMantel: "He-Mantel",
              anzug: "Anzug",
              jacke: "Jacke",
              hose: "Hose",
              hemd: "Hemd",
              weste: "Weste",
              pullover: "Pullover",
              tShirt: "T-Shirt",
              daMantel: "Da-Mantel",
              kostuem: "Kostüm",
              kleid: "Kleid",
              rock: "Rock",
              bluse: "Bluse",
              gardinen: "Gardinen",
            }).map(([key, label]) => (
              <label key={key} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.kleidungstuecke[key]}
                  onChange={(e) => isFirst && onCheckboxChange("kleidungstuecke", key)}
                  className={styles.checkbox}
                  disabled={readOnly || !isFirst}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        {/* Änderung */}
        <div>
          <div className={styles.sectionTitle}>Änderung</div>
          <div className={styles.checkboxGroup}>
            {Object.entries({
              kuerzen: "kürzen",
              engen: "engen",
              weiten: "weiten",
              reissverschluss: "Reißverschluss",
              fuetter: "Fütter",
              tasche: "Tasche",
              kragen: "Kragen",
              stossband: "Stoßband",
              saumNaehen: "Saum nähen",
              knopfKnopfloch: "Knopf/Knopfloch",
              falten: "Falten",
              gummiband: "Gummiband",
            }).map(([key, label]) => (
              <label key={key} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.aenderungen[key]}
                  onChange={(e) => isFirst && onCheckboxChange("aenderungen", key)}
                  className={styles.checkbox}
                  disabled={readOnly || !isFirst}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        {/* Position */}
        <div>
          <div className={styles.sectionTitle}>Position</div>
          <div className={styles.checkboxGroup}>
            {Object.entries({
              vorne: "vorne",
              hinten: "hinten",
              aermel: "Ärmel",
              beine: "Beine",
            }).map(([key, label]) => (
              <label key={key} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.positionen[key]}
                  onChange={(e) => isFirst && onCheckboxChange("positionen", key)}
                  className={styles.checkbox}
                  disabled={readOnly || !isFirst}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>
      {/* Hinweise */}
      <div className={styles.hinweise}>
        <div className={styles.sectionTitle}>Hinweise</div>
        <textarea
          value={formData.hinweise}
          onChange={(e) => isFirst && onInputChange("hinweise", e.target.value)}
          className={styles.textarea}
          style={{ height: 60, resize: 'none', border: '1px solid #cbd5e1', padding: 8, fontSize: 13, readOnly: readOnly || !isFirst }}
        />
      </div>
      {/* Signature Area */}
      <div className={styles.signature} style={{ minHeight: 60, textAlign: 'left', paddingTop: '2.5rem', fontSize: '1.2rem' }}>
        Kundenunterschrift: _________________________________
      </div>
      {/* Detachable Customer Receipt */}
      <div className={styles.receipt}>
        <div className={styles.receiptHeader}>
          <div>
            <div className={styles.receiptCompany}>{companyData.companyName}</div>
            <div className={styles.receiptDetails}>{companyData.address}</div>
            <div className={styles.receiptDetails}>Tel: {companyData.phone}</div>
          </div>
          <div className={styles.receiptNr}>
            <div className={styles.receiptNrLabel}>Abholnummer:</div>
            <div className={styles.receiptNrValue}>{laufkarteNumber}</div>
          </div>
        </div>
        <div className={styles.receiptInfo}>
          <div>{formData.name}</div>
          <div>Abholtermin: {formData.abholtermin}</div>
        </div>
      </div>
    </div>
  );
}

// ipcMain.handle('laufkarteSaveAndCheck', async (event, { filename, data }) => {
//   try {
//     const filePath = path.join(__dirname, 'somefolder', `${filename}.json`);
//     await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
//     return { success: true };
//   } catch (error) {
//     return { success: false, error: error.message };
//   }
// });