import { useState, useEffect, useMemo, useRef } from 'react'
import './App.css'

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Get next Ch. No. from localStorage
function getNextChNo() {
  // First check the counter
  const lastChNo = localStorage.getItem('bhagat_last_chno')
  if (lastChNo) {
    return parseInt(lastChNo) + 1
  }

  // If no counter, check existing receipts to find highest Ch. No.
  const stored = localStorage.getItem('bhagat_receipts')
  if (stored) {
    const receipts = JSON.parse(stored)
    let maxChNo = 0
    receipts.forEach(r => {
      const num = parseInt(r.customerInfo.chNo)
      if (!isNaN(num) && num > maxChNo) {
        maxChNo = num
      }
    })
    if (maxChNo > 0) {
      return maxChNo + 1
    }
  }

  return 1
}

function App() {
  const [activeTab, setActiveTab] = useState('create')
  const [savedReceipts, setSavedReceipts] = useState([])
  const [viewingReceipt, setViewingReceipt] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const formRef = useRef(null)

  // Debounce search query - 300ms delay
  const debouncedSearch = useDebounce(searchQuery, 300)

  const [customerInfo, setCustomerInfo] = useState({
    ms: '',
    tone: '',
    charak: '',
    chNo: getNextChNo().toString(),
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

  // Load receipts from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('bhagat_receipts')
    if (stored) {
      const receipts = JSON.parse(stored)
      setSavedReceipts(receipts)

      // Initialize Ch. No. counter if not set
      if (!localStorage.getItem('bhagat_last_chno') && receipts.length > 0) {
        let maxChNo = 0
        receipts.forEach(r => {
          const num = parseInt(r.customerInfo.chNo)
          if (!isNaN(num) && num > maxChNo) {
            maxChNo = num
          }
        })
        if (maxChNo > 0) {
          localStorage.setItem('bhagat_last_chno', maxChNo.toString())
          setCustomerInfo(prev => ({ ...prev, chNo: (maxChNo + 1).toString() }))
        }
      }
    }
  }, [])

  // Save receipts to localStorage
  const saveToStorage = (receipts) => {
    localStorage.setItem('bhagat_receipts', JSON.stringify(receipts))
    setSavedReceipts(receipts)
  }

  // Filter receipts based on search query (name, ch no, charak)
  const filteredReceipts = useMemo(() => {
    if (!debouncedSearch.trim()) return savedReceipts

    const query = debouncedSearch.toLowerCase().trim()
    return savedReceipts.filter(receipt => {
      const name = (receipt.customerInfo.ms || '').toLowerCase()
      const chNo = (receipt.customerInfo.chNo || '').toLowerCase()
      const charak = (receipt.customerInfo.charak || '').toLowerCase()

      return name.includes(query) || chNo.includes(query) || charak.includes(query)
    })
  }, [savedReceipts, debouncedSearch])

  const updateCustomer = (field, value) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }))
  }

  // Handle Enter key to move to next field
  const handleEnterKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const form = formRef.current
      if (!form) return

      const inputs = Array.from(form.querySelectorAll('input:not([type="hidden"])'))
      const currentIndex = inputs.indexOf(e.target)

      if (currentIndex >= 0 && currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus()
      }
    }
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

  // Auto-fill Ch. No. when user focuses on other fields in the row
  const handleRowFocus = (id, index) => {
    setItems(prev => prev.map(item => {
      if (item.id === id && item.chNo === '') {
        return { ...item, chNo: (index + 1).toString() }
      }
      return item
    }))
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

  const resetForm = () => {
    setCustomerInfo({
      ms: '',
      tone: '',
      charak: '',
      chNo: getNextChNo().toString(),
      date: new Date().toLocaleDateString('en-GB')
    })
    setItems(Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      chNo: '',
      lotNo: '',
      description: '',
      pieces: ''
    })))
    setEditingId(null)
  }

  const saveReceipt = () => {
    // Validate - at least M/s should be filled
    if (!customerInfo.ms.trim()) {
      alert('Please enter M/s (Customer Name)')
      return
    }

    const receipt = {
      id: editingId || Date.now(),
      customerInfo,
      items: items.filter(item => item.description || item.pieces),
      total: getTotal(),
      createdAt: editingId
        ? savedReceipts.find(r => r.id === editingId)?.createdAt
        : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    let updatedReceipts
    if (editingId) {
      updatedReceipts = savedReceipts.map(r => r.id === editingId ? receipt : r)
    } else {
      updatedReceipts = [receipt, ...savedReceipts]
      // Save the Ch. No. for auto-increment (only for new receipts)
      const chNoNum = parseInt(customerInfo.chNo)
      if (!isNaN(chNoNum)) {
        localStorage.setItem('bhagat_last_chno', chNoNum.toString())
      }
    }

    saveToStorage(updatedReceipts)
    resetForm()
    setActiveTab('list')
  }

  const viewReceipt = (receipt) => {
    setViewingReceipt(receipt)
  }

  const editReceipt = (receipt) => {
    setCustomerInfo(receipt.customerInfo)
    // Restore items with empty rows to fill up to 8
    const filledItems = [...receipt.items]
    while (filledItems.length < 8) {
      filledItems.push({
        id: Date.now() + filledItems.length,
        chNo: '',
        lotNo: '',
        description: '',
        pieces: ''
      })
    }
    setItems(filledItems)
    setEditingId(receipt.id)
    setViewingReceipt(null)
    setActiveTab('create')
  }

  const deleteReceipt = (id) => {
    if (confirm('Are you sure you want to delete this receipt?')) {
      const updatedReceipts = savedReceipts.filter(r => r.id !== id)
      saveToStorage(updatedReceipts)
      setViewingReceipt(null)
    }
  }

  const closeViewing = () => {
    setViewingReceipt(null)
  }

  return (
    <div className="app">
      {/* Tabs */}
      <div className="tabs no-print">
        <button
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          {editingId ? 'Edit Receipt' : 'Create Receipt'}
        </button>
        <button
          className={`tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          All Receipts ({savedReceipts.length})
        </button>
      </div>

      {/* Create/Edit Receipt Tab */}
      {activeTab === 'create' && (
        <>
          <div className="no-print controls-bar">
            <button className="add-btn" onClick={addRow}>+ Add Row</button>
            <button className="save-btn" onClick={saveReceipt}>
              {editingId ? 'Update Receipt' : 'Save Receipt'}
            </button>
            <button className="print-btn" onClick={handlePrint}>Print</button>
            {editingId && (
              <button className="cancel-btn" onClick={resetForm}>Cancel Edit</button>
            )}
          </div>

          <div className="receipt" id="receipt" ref={formRef}>
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
                    onKeyDown={handleEnterKey}
                  />
                </div>
                <div className="field-row">
                  <label>Tone</label>
                  <input
                    type="text"
                    value={customerInfo.tone}
                    onChange={(e) => updateCustomer('tone', e.target.value)}
                    onKeyDown={handleEnterKey}
                  />
                </div>
                <div className="field-row">
                  <label>Charak</label>
                  <input
                    type="text"
                    value={customerInfo.charak}
                    onChange={(e) => updateCustomer('charak', e.target.value)}
                    onKeyDown={handleEnterKey}
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
                    onKeyDown={handleEnterKey}
                  />
                </div>
                <div className="field-row">
                  <label>Date :</label>
                  <input
                    type="text"
                    value={customerInfo.date}
                    onChange={(e) => updateCustomer('date', e.target.value)}
                    onKeyDown={handleEnterKey}
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
                {items.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      <span className="cell-value ch-no-cell">{item.chNo}</span>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.lotNo}
                        onChange={(e) => updateItem(item.id, 'lotNo', e.target.value)}
                        onKeyDown={handleEnterKey}
                        onFocus={() => handleRowFocus(item.id, index)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        onKeyDown={handleEnterKey}
                        onFocus={() => handleRowFocus(item.id, index)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.pieces}
                        onChange={(e) => updateItem(item.id, 'pieces', e.target.value)}
                        onKeyDown={(e) => {
                          if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                            e.preventDefault()
                          } else {
                            handleEnterKey(e)
                          }
                        }}
                        onFocus={() => handleRowFocus(item.id, index)}
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
        </>
      )}

      {/* Receipts List Tab */}
      {activeTab === 'list' && !viewingReceipt && (
        <div className="receipts-list">
          <h2>Saved Receipts</h2>

          {/* Search Bar */}
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by Name, Ch. No., or Charak..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>

          {savedReceipts.length === 0 ? (
            <div className="no-receipts">
              <p>No receipts saved yet</p>
              <button onClick={() => setActiveTab('create')}>Create First Receipt</button>
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="no-receipts">
              <p>No receipts found for "{searchQuery}"</p>
              <button onClick={() => setSearchQuery('')}>Clear Search</button>
            </div>
          ) : (
            <>
              <p className="results-count">{filteredReceipts.length} receipt{filteredReceipts.length !== 1 ? 's' : ''} found</p>
              <div className="receipts-grid">
                {filteredReceipts.map(receipt => (
                  <div key={receipt.id} className="receipt-card" onClick={() => viewReceipt(receipt)}>
                    <div className="receipt-card-header">
                      <h3>{receipt.customerInfo.ms}</h3>
                      <span className="receipt-date">{receipt.customerInfo.date}</span>
                    </div>
                    <div className="receipt-card-body">
                      <p><strong>Ch. No:</strong> {receipt.customerInfo.chNo || '-'}</p>
                      <p><strong>Charak:</strong> {receipt.customerInfo.charak || '-'}</p>
                      <p><strong>Items:</strong> {receipt.items.length}</p>
                    </div>
                    <div className="receipt-card-footer">
                      <span className="total-badge">Total: {receipt.total} pcs</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* View Receipt Detail */}
      {activeTab === 'list' && viewingReceipt && (
        <div className="receipt-detail">
          <div className="detail-actions no-print">
            <button className="back-btn" onClick={closeViewing}>← Back to List</button>
            <button className="edit-btn" onClick={() => editReceipt(viewingReceipt)}>Edit</button>
            <button className="delete-btn" onClick={() => deleteReceipt(viewingReceipt.id)}>Delete</button>
            <button className="print-btn" onClick={handlePrint}>Print</button>
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
            <div className="customer-section view-mode">
              <div className="customer-left">
                <div className="field-row">
                  <label>M/s.</label>
                  <span className="field-value">{viewingReceipt.customerInfo.ms}</span>
                </div>
                <div className="field-row">
                  <label>Tone</label>
                  <span className="field-value">{viewingReceipt.customerInfo.tone}</span>
                </div>
                <div className="field-row">
                  <label>Charak</label>
                  <span className="field-value">{viewingReceipt.customerInfo.charak}</span>
                </div>
              </div>
              <div className="customer-right">
                <div className="field-row">
                  <label>Ch. No.</label>
                  <span className="field-value">{viewingReceipt.customerInfo.chNo}</span>
                </div>
                <div className="field-row">
                  <label>Date :</label>
                  <span className="field-value">{viewingReceipt.customerInfo.date}</span>
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
                </tr>
              </thead>
              <tbody>
                {viewingReceipt.items.map((item, index) => (
                  <tr key={index}>
                    <td><span className="cell-value">{item.chNo}</span></td>
                    <td><span className="cell-value">{item.lotNo}</span></td>
                    <td><span className="cell-value">{item.description}</span></td>
                    <td><span className="cell-value">{item.pieces}</span></td>
                  </tr>
                ))}
                {/* Add empty rows if less than 8 items for print */}
                {Array.from({ length: Math.max(0, 8 - viewingReceipt.items.length) }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
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
                  <span className="total-value">{viewingReceipt.total || ''}</span>
                </div>
              </div>
            </div>

            <div className="signature-row">
              <p>RECEIVER'S SIGN.........................</p>
              <p className="for-company">FOR, BHAGAT CREATION</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
