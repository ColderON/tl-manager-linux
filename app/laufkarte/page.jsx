"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { generateLaufnummer } from "../lib/generateLaufnummer";
import companyData from "../constants/company_data.json";
import styles from "./laufkarte.module.css";
import { useReactToPrint } from 'react-to-print';

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

  const printHandler = useReactToPrint({
    content: () => laufkarteRef.current,
    documentTitle: laufkarteNumber ? `Laufkarte_${laufkarteNumber}` : 'Laufkarte',
    onAfterPrint: () => {
      setPrinting(false);
      onSuccess();
    },
  });

  const handlePrint = useCallback(async () => {
    setPrinting(true);
    const result = await window.electronAPI.laufkarteSaveAndCheck({
      filename: laufkarteNumber,
      data: formData,
    });
    if (result.success) {
      printHandler();
    } else {
      setPrinting(false);
      onError(result.error);
    }
  }, [laufkarteNumber, formData, printHandler]);

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

  function onSuccess() {
    setNotification({ visible: true, message: 'Laufkarte успешно сохранена и отправлена на печать!', type: 'success' });
    setTimeout(() => setNotification({ visible: false, message: '', type: '' }), 3000);
  }

  function onError(errorMsg) {
    setNotification({ visible: true, message: errorMsg || 'Ошибка при сохранении или печати!', type: 'error' });
    setTimeout(() => setNotification({ visible: false, message: '', type: '' }), 3000);
  }

  return (
    <div className={styles.laufkartePage}>
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
                  onClick={handlePrint}
                  style={{ padding: '10px 20px', background: '#059669', color: '#fff', borderRadius: 6, border: 'none', fontWeight: 500, cursor: 'pointer' }}
                >
                  Drucken
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
          />
          <div className={styles.separator}></div>
          <LaufkarteForm
            companyData={companyData}
            laufkarteNumber={laufkarteNumber}
            formData={formData}
            onInputChange={handleInputChange}
            onCheckboxChange={handleCheckboxChange}
            isFirst={false}
          />
        </div>
      </div>
      <style jsx global>{`
        @media print {
          .${styles.laufkartePage} > *:not(.${styles.laufkarteContainer}) {
            display: none !important;
          }
          .${styles.laufkarteContainer} > *:not(.${styles.a4}) {
            display: none !important;
          }
          .${styles.a4} {
            box-shadow: none !important;
            margin: 0 !important;
            width: 100vw !important;
            min-height: 100vh !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

function LaufkarteForm({ companyData, laufkarteNumber, formData, onInputChange, onCheckboxChange, isFirst }) {
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
            readOnly={!isFirst}
          />
        </div>
        <div>
          <label className={styles.label}>Tel:</label>
          <input
            type="text"
            value={formData.tel}
            onChange={(e) => isFirst && onInputChange("tel", e.target.value)}
            className={styles.input}
            readOnly={!isFirst}
          />
        </div>
      </div>
      {/* Date Info */}
      <div className={styles.grid} style={{ gridTemplateColumns: '1fr 3fr', marginBottom: 24 }}>
        <div>
          <label className={styles.label}>Abgegeben:</label>
          <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
            <label className={styles.checkboxLabel}><input type="checkbox" disabled className={styles.checkbox}/> Mo</label>
            <label className={styles.checkboxLabel}><input type="checkbox" disabled className={styles.checkbox}/> Di</label>
            <label className={styles.checkboxLabel}><input type="checkbox" disabled className={styles.checkbox}/> Mi</label>
            <label className={styles.checkboxLabel}><input type="checkbox" disabled className={styles.checkbox}/> Do</label>
            <label className={styles.checkboxLabel}><input type="checkbox" disabled className={styles.checkbox}/> Fr</label>
            <label className={styles.checkboxLabel}><input type="checkbox" disabled className={styles.checkbox}/> Sa</label>
          </div>
        </div>
        <div>
          <label className={styles.label}>Abholtermin:</label>
          <input
            type="text"
            value={formData.abholtermin}
            onChange={(e) => isFirst && onInputChange("abholtermin", e.target.value)}
            className={styles.input}
            readOnly={!isFirst}
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
                  onChange={() => isFirst && onCheckboxChange("kleidungstuecke", key)}
                  className={styles.checkbox}
                  disabled={!isFirst}
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
                  onChange={() => isFirst && onCheckboxChange("aenderungen", key)}
                  className={styles.checkbox}
                  disabled={!isFirst}
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
                  onChange={() => isFirst && onCheckboxChange("positionen", key)}
                  className={styles.checkbox}
                  disabled={!isFirst}
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
          style={{ height: 60, resize: 'none', border: '1px solid #cbd5e1', padding: 8, fontSize: 13 }}
          readOnly={!isFirst}
        />
      </div>
      {/* Signature Area */}
      <div className={styles.signature}>
        Unterschrift Kunde: _______________________
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
          <div>Kunde: {formData.name}</div>
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