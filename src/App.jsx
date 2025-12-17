import { useState } from 'react'
import './App.css'

function App() {
  const [customerInfo, setCustomerInfo] = useState({
    ms: '',
    tone: '',
    charak: '',
    chNo: '',
    date: new Date().toLocaleDateString('en-GB')
  })

  const [items, setItems] = useState(
    Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      chNo: '',
      lotNo: '',
      description: '',
      pieces: ''
    }))
  )

  const updateCustomer = (field, value) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }))
  }

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const addRow = () => {
    setItems(prev => [...prev, {
      id: Date.now(),
      chNo: '',
      lotNo: '',
      description: '',
      pieces: ''
    }])
  }

  const removeRow = (id) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id))
    }
  }

  const getTotal = () => {
    return items.reduce((sum, item) => {
      const pieces = parseInt(item.pieces) || 0
      return sum + pieces
    }, 0)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="app">
      <div className="no-print controls-bar">
        <button className="add-btn" onClick={addRow}>+ Add Row</button>
        <button className="print-btn" onClick={handlePrint}>Print Receipt</button>
      </div>

      <div className="receipt" id="receipt">
        {/* Header */}
        <div className="header">
          <div className="phone-left">
            <p>Mo. 98253 45258</p>
            <p>82005 83692</p>
          </div>
          <div className="center-header">
            <p className="blessing">|| Shree Ganeshay Namh ||</p>
            <img
              src="https://i.pinimg.com/736x/48/96/b7/4896b72ec65e2a7d7407415818d3ca2f.jpg"
              alt="Ganpati"
              className="ganpati-icon"
            />
            <h1 className="company-name">BHAGAT CREATION</h1>
            <p className="tagline">Specialist in All Type of Hand Work</p>
          </div>
          <div className="phone-right">
            <p>Mo. 99788 25558</p>
            <p>91041 53558</p>
          </div>
        </div>

        <p className="address">A-168, Sitaram Society Part-1, Nr. Archana School, Puna-Bombay Market Road, Surat.</p>

        {/* Customer Info */}
        <div className="customer-section">
          <div className="customer-left">
            <div className="field-row">
              <label>M/s.</label>
              <input
                type="text"
                value={customerInfo.ms}
                onChange={(e) => updateCustomer('ms', e.target.value)}
              />
            </div>
            <div className="field-row">
              <label>Tone</label>
              <input
                type="text"
                value={customerInfo.tone}
                onChange={(e) => updateCustomer('tone', e.target.value)}
              />
            </div>
            <div className="field-row">
              <label>Charak</label>
              <input
                type="text"
                value={customerInfo.charak}
                onChange={(e) => updateCustomer('charak', e.target.value)}
              />
            </div>
          </div>
          <div className="customer-right">
            <div className="field-row">
              <label>Ch. No.</label>
              <input
                type="text"
                value={customerInfo.chNo}
                onChange={(e) => updateCustomer('chNo', e.target.value)}
              />
            </div>
            <div className="field-row">
              <label>Date :</label>
              <input
                type="text"
                value={customerInfo.date}
                onChange={(e) => updateCustomer('date', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="items-table">
          <thead>
            <tr>
              <th style={{width: '60px'}}>Ch. No.</th>
              <th style={{width: '70px'}}>Lot. No.</th>
              <th>Description</th>
              <th style={{width: '80px'}}>Pieces</th>
              <th className="no-print" style={{width: '40px'}}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <input
                    type="text"
                    value={item.chNo}
                    onChange={(e) => updateItem(item.id, 'chNo', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={item.lotNo}
                    onChange={(e) => updateItem(item.id, 'lotNo', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.pieces}
                    onChange={(e) => updateItem(item.id, 'pieces', e.target.value)}
                    onKeyDown={(e) => ['e', 'E', '+', '-', '.'].includes(e.key) && e.preventDefault()}
                  />
                </td>
                <td className="no-print">
                  <button className="remove-btn" onClick={() => removeRow(item.id)}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="footer">
          <div className="footer-left">
            <p className="thanks">Thanks.....</p>
          </div>
          <div className="footer-right">
            <div className="total-box">
              <span>TOTAL</span>
              <span className="total-value">{getTotal() || ''}</span>
            </div>
          </div>
        </div>

        <div className="signature-row">
          <p>RECEIVER'S SIGN.........................</p>
          <p className="for-company">FOR, BHAGAT CREATION</p>
        </div>
      </div>
    </div>
  )
}

export default App
