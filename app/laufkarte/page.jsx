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
        sakko: false,
        anzughose: false,
        hose:false,
        jeansHose: false,
      jacke: false,
      hemd: false,
      weste: false,
      pullover: false,
      tShirt: false,
      daMantel: false,
        blazer: false,
      kleid: false,
      rock: false,
      bluse: false,
        gardinenVorhaenge: false,
        bettwaesche: false,
        tischwaesche: false
    },
    aenderungen: {
      kuerzen: false,
        verlaengern: false,
      engen: false,
      weiten: false,
      reissverschluss: false,
      fuetter: false,
      tasche: false,
      kragen: false,
      stossband: false,
      knopfKnopfloch: false,
      gummiband: false,
    },
    positionen: {
      vorne: false,
      hinten: false,
        oben: false,
        unten: false,
      aermel: false,
      beine: false,
        bund: false
    },
    hinweise: "",
  });

  const [notification, setNotification] = useState({ visible: false, message: '', type: '' });

  const laufkarteRef = useRef(null);
  const [printing, setPrinting] = useState(false);
  const [showHinweiseInReceipt, setShowHinweiseInReceipt] = useState(false);

  const getToday = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

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
    setFormData(prev => ({ ...prev, abgegeben: getToday() }));
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
      abgegeben: getToday(),
      abholtermin: "",
      kleidungstuecke: {
        heMantel: false,
        sakko: false,
        anzughose: false,
        hose:false,
        jeansHose: false,
        jacke: false,        
        hemd: false,
        weste: false,
        pullover: false,
        tShirt: false,
        daMantel: false,
        blazer: false,
        kleid: false,
        rock: false,
        bluse: false,        
        gardinenVorhaenge: false,
        bettwaesche: false,
        tischwaesche: false
      },
      aenderungen: {
        kuerzen: false,
        verlaengern: false,
        engen: false,
        weiten: false,
        reissverschluss: false,
        fuetter: false,
        tasche: false,
        kragen: false,
        stossband: false,        
        knopfKnopfloch: false,        
        gummiband: false,
      },
      positionen: {
        vorne: false,
        hinten: false,
        oben: false,
        unten: false,
        aermel: false,
        beine: false,
        bund: false
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

  return (
    <div className={styles.container}>
    <div className={styles.laufkartePage}>
        {/* Steuerungsknöpfe */}
          <div className="controls">
            <button onClick={generateNewNumber}>Neue Nummer generieren</button>
            <button onClick={resetLaufkarte}>Reset</button>
            <button onClick={handleSaveAndPrintPDF}>PDF speichern & drucken</button>
          </div>
        <div className={styles.laufkarteContainer}>          
          {/* Formular */}
          <div className={styles.a4} ref={laufkarteRef}>
            <div className={styles.laufkarteContent}>
          <LaufkarteForm
            companyData={companyData}
            laufkarteNumber={laufkarteNumber}
            formData={formData}
            onInputChange={handleInputChange}
            onCheckboxChange={handleCheckboxChange}
            isFirst={true}
                readOnly={false}
                showHinweiseInReceipt={showHinweiseInReceipt}
                setShowHinweiseInReceipt={setShowHinweiseInReceipt}
          />
              <div className={styles.signature} style={{ minHeight: 60, textAlign: 'left', paddingTop: '2.5rem', fontSize: '1.2rem' }}>
                Kundenunterschrift: _________________________________
              </div>
            </div>
            <div className={styles.receipt}>
              {/* Abtrennbarer Kundenbeleg */}
              <div className={styles.receiptHeader}>
                <div>
                  <div className={styles.receiptCompany}>{companyData.companyName}</div>
                  <div className={styles.receiptDetails}>{companyData.address}</div>
                  <div className={styles.receiptDetails}>Tel: {companyData.phone}</div>
                  <div className={styles.receiptDetails}>Email: {companyData.email}</div>
                </div>
                <div className={styles.receiptNr}>
                  <div className={styles.receiptNrLabel}>Abholnummer:</div>
                  <div className={styles.receiptNrValue}>{laufkarteNumber}</div>
                </div>
              </div>
              <div className={styles.receiptInfo}>
                <div>
                  {/* Name und Abholdatum: fett und nur wenn nicht leer */}
                  {formData.name && formData.abholtermin && (
                    <span>
                      <span style={{ fontWeight: 'bold' }}>Name:</span> {formData.name} {' | '}<span style={{ fontWeight: 'bold' }}>Abholdatum:</span> {formData.abholtermin}
                    </span>
                  )}
                  {formData.name && !formData.abholtermin && (
                    <span><span style={{ fontWeight: 'bold' }}>Name:</span> {formData.name}</span>
                  )}
                  {!formData.name && formData.abholtermin && (
                    <span><span style={{ fontWeight: 'bold' }}>Abholdatum:</span> {formData.abholtermin}</span>
                  )}
                </div>
                {/* Drei Spalten mit ausgewählten Einträgen */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
                  {/* Kleidungsstück Spalte */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: 8, textDecoration: 'underline', marginRight: 6 }}>Kleidungsstück:</div>
                    <div style={{ fontSize: '0.8rem', color: '#374151', wordWrap: 'break-word', marginBottom: 6 }}>
                      {Object.entries({
                        heMantel: "He-Mantel",
                        sakko: "Sakko",
                        anzughose: "Anzughose",
                        hose: "Hose",
                        jeansHose: "Jeanshose",
                        jacke: "Jacke",
                        hemd: "Hemd",
                        weste: "Weste",
                        pullover: "Pullover",
                        tShirt: "T-Shirt",
                        daMantel: "Da-Mantel",
                        blazer: "Blazer",
                        kleid: "Kleid",
                        rock: "Rock",
                        bluse: "Bluse",
                        gardinenVorhaenge: "Gardinen/Vorhänge",
                        bettwaesche: "Bettwäsche",
                        tischwaesche: "Tischwäsche"
                      })
                      .filter(([key, label]) => formData.kleidungstuecke[key])
                      .map(([key, label]) => label)
                      .join(', ')}
                    </div>
                  </div>
                  
                  {/* Änderung Spalte */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: 8, textDecoration: 'underline', marginRight: 6 }}>Änderung:</div>
                    <div style={{ fontSize: '0.8rem', color: '#374151', wordWrap: 'break-word', marginBottom: 6 }}>
                      {Object.entries({
                        kuerzen: "kürzen",
                        verlaengern: "verlängern",
                        engen: "engen",
                        weiten: "weiten",
                        reissverschluss: "Reißverschluss",
                        fuetter: "Fütter",
                        tasche: "Tasche",
                        kragen: "Kragen",
                        stossband: "Stoßband",
                        knopfKnopfloch: "Knopf/Knopfloch",
                        gummiband: "Gummiband"
                      })
                      .filter(([key, label]) => formData.aenderungen[key])
                      .map(([key, label]) => label)
                      .join(', ')}
                    </div>
                  </div>
                  
                  {/* Position Spalte */}
                  <div style={{ display: 'flex', alignItems: 'center'}}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: 8, textDecoration: 'underline', marginRight: 6  }}>Position:</div>
                    <div style={{ fontSize: '0.8rem', color: '#374151', wordWrap: 'break-word', marginBottom: 6 }}>
                      {Object.entries({
                        vorne: "vorne",
                        hinten: "hinten",
                        oben: "oben",
                        unten: "unten",
                        aermel: "Ärmel",
                        beine: "Beine",
                        bund: "Bund"
                      })
                      .filter(([key, label]) => formData.positionen[key])
                      .map(([key, label]) => label)
                      .join(', ')}
                    </div>
                  </div>
                </div>
                
                {/* Hinweise falls vorhanden */}
                {showHinweiseInReceipt && formData.hinweise && (
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: 0 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: 0, marginRight: 8 }}>Hinweise:</div>
                    <div style={{ fontSize: '0.85rem', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formData.hinweise}</div>
                  </div>
                )} 
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LaufkarteForm({ companyData, laufkarteNumber, formData, onInputChange, onCheckboxChange, isFirst, readOnly, showHinweiseInReceipt, setShowHinweiseInReceipt }) {
  return (
    <div className={styles.laufkarteForm}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.company}>{companyData.companyName}</div>
          <div className={styles.companyDetails}>
            <div>{companyData.address}</div>
            <div>Tel: {companyData.phone}</div>
            <div>Email: {companyData.email}</div>
          </div>
        </div>
        <div className={styles.kontrollNr}>
          <div className={styles.kontrollNrLabel}>Kontroll-Nr.</div>
          <div className={styles.kontrollNrValue}>{laufkarteNumber}</div>
        </div>
      </div>
      {/* Kundeninfo + Datumsinfo in einer Zeile, 4 Spalten: Label Input Label Input */}
      <div className={styles.grid} style={{ gridTemplateColumns: 'auto 1fr auto 1fr', alignItems: 'center', marginBottom: 24 }}>
        <label className={styles.label} style={{ textAlign: 'right' }}>Name:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => isFirst && onInputChange("name", e.target.value)}
            className={styles.input}
          readOnly={readOnly || !isFirst}
          />
        <label className={styles.label} style={{ textAlign: 'right' }}>Tel:</label>
          <input
            type="text"
            value={formData.tel}
            onChange={(e) => isFirst && onInputChange("tel", e.target.value)}
            className={styles.input}
          readOnly={readOnly || !isFirst}
          />
      </div>
      <div className={styles.grid} style={{ gridTemplateColumns: 'auto 1fr auto 1fr', alignItems: 'center', marginBottom: 24 }}>
        <label className={styles.label} style={{ textAlign: 'right' }}>Abgegeben am:</label>
        <input
          type="text"
          value={formData.abgegeben}
          onChange={(e) => isFirst && onInputChange("abgegeben", e.target.value)}
          className={styles.input}
          readOnly={readOnly || !isFirst}
        />
        <label className={styles.label} style={{ textAlign: 'right' }}>Abholtermin:</label>
          <input
            type="text"
            value={formData.abholtermin}
            onChange={(e) => isFirst && onInputChange("abholtermin", e.target.value)}
            className={styles.input}
          readOnly={readOnly || !isFirst}
          />
      </div>
      {/* Hauptinhalt-Grid */}
      <div className={styles.grid} style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: 24 }}>
        {/* Kleidungsstück */}
        <div>
          <div className={styles.sectionTitle}>Kleidungsstück</div>
          <div className={styles.checkboxGroup}>
            {Object.entries({
              heMantel: "He-Mantel",
              sakko: "Sakko",
              anzughose: "Anzughose",
              hose: "Hose",
              jeansHose: "Jeanshose",
              jacke: "Jacke",
              hemd: "Hemd",
              weste: "Weste",
              pullover: "Pullover",
              tShirt: "T-Shirt",
              daMantel: "Da-Mantel",
              blazer: "Blazer",
              kleid: "Kleid",
              rock: "Rock",
              bluse: "Bluse",
              gardinenVorhaenge: "Gardinen/Vorhänge",
              bettwaesche: "Bettwäsche",
              tischwaesche: "Tischwäsche"
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
              verlaengern: "verlängern",
              engen: "engen",
              weiten: "weiten",
              reissverschluss: "Reißverschluss",
              fuetter: "Fütter",
              tasche: "Tasche",
              kragen: "Kragen",
              stossband: "Stoßband",
              knopfKnopfloch: "Knopf/Knopfloch",
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
              oben: "oben",
              unten: "unten",
              aermel: "Ärmel",
              beine: "Beine",
              bund: "Bund"
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
      {/* Hinweise falls vorhanden */}
      <div className={styles.hinweise}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className={styles.sectionTitle}>Hinweise</div>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="checkbox"
              checked={showHinweiseInReceipt}
              onChange={e => setShowHinweiseInReceipt(e.target.checked)}
              style={{ marginRight: 4 }}
            />
            unten anzeigen
          </label>
        </div>
        <textarea
          value={formData.hinweise}
          onChange={(e) => isFirst && onInputChange("hinweise", e.target.value)}
          className={`${styles.textarea}`}
          style={{ resize: 'none', border: '1px solid #cbd5e1', padding: 8, fontSize: 13, readOnly: readOnly || !isFirst }}
        />
      </div>
    </div>
  );
}