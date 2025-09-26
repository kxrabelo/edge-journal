import React, { useState, useEffect } from 'react';

const App = () => {
  // ✅ Mock data — no backend needed
  const initialTrades = [
    {
      id: 1,
      pair: "EUR/USD",
      side: "buy",
      pnl: 125.50,
      stopLoss: 1.0800,
      takeProfit: 1.1000,
      notes: "Bullish breakout confirmed on 4H, RSI divergence.",
      entryDate: "2024-05-15T14:30:00Z",
      psychologyTags: ["Patience", "Proper Analysis"],
      psychologyNotes: "Waited for confirmation, didn't FOMO.",
      lotSize: 0.5,
      entryPrice: 1.0850,
      exitPrice: 1.0975
    },
    {
      id: 2,
      pair: "GBP/JPY",
      side: "sell",
      pnl: -85.20,
      stopLoss: 185.00,
      takeProfit: 182.00,
      notes: "Entered too early before London session.",
      entryDate: "2024-05-18T08:15:00Z",
      psychologyTags: ["Impatience", "FOMO"],
      psychologyNotes: "Jumped in without waiting for price action confirmation.",
      lotSize: 0.3,
      entryPrice: 184.20,
      exitPrice: 184.65
    }
  ];

  const [trades, setTrades] = useState(initialTrades);
  const [stats, setStats] = useState({});
  const [form, setForm] = useState({
    pair: "",
    side: "",
    pnl: "",
    stopLoss: "",
    takeProfit: "",
    notes: "",
    entryDate: new Date().toISOString().slice(0, 16),
    psychologyTags: [],
    psychologyNotes: "",
    lotSize: "",
    entryPrice: "",
    exitPrice: ""
  });
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [showPsychologyStep, setShowPsychologyStep] = useState(false);
  const [tempTradeData, setTempTradeData] = useState(null);
  const [view, setView] = useState("calendar");
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [expandedTradeId, setExpandedTradeId] = useState(null);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Compute stats
  useEffect(() => {
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const wins = trades.filter(t => t.pnl > 0).length;
    const total = trades.length;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";
    const avgTrade = total > 0 ? (totalPnL / total).toFixed(2) : "0.00";
    setStats({
      totalPnL: parseFloat(totalPnL.toFixed(2)),
      winRate: parseFloat(winRate),
      totalTrades: total,
      avgTrade: parseFloat(avgTrade)
    });
  }, [trades]);

  // Navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setNavbarVisible(false);
      } else {
        setNavbarVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // === All helper functions (getDailyPnL, getCalendarDays, etc.) ===
  const getDailyPnL = () => {
    const daily = {};
    trades.forEach(trade => {
      if (trade.pnl === null || trade.pnl === undefined) return;
      const date = trade.entryDate.split("T")[0];
      daily[date] = (daily[date] || 0) + trade.pnl;
    });
    return daily;
  };

  const getCalendarDays = () => {
    const year = parseInt(currentMonth.split("-")[0]);
    const month = parseInt(currentMonth.split("-")[1]) - 1;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      days.push(dateStr);
    }
    return days;
  };

  const getWeeklyPnL = () => {
    const dailyPnL = getDailyPnL();
    const weeks = {};
    const days = getCalendarDays().filter(d => d !== null);
    let weekIndex = 0;
    days.forEach((dateStr, i) => {
      if (i % 7 === 0 && i > 0) weekIndex++;
      if (!weeks[weekIndex]) weeks[weekIndex] = 0;
      weeks[weekIndex] += dailyPnL[dateStr] || 0;
    });
    return weeks;
  };

  const formatPnL = (pnl) => {
    if (pnl === null || pnl === undefined) return "Open";
    return `$${pnl.toFixed(2)}`;
  };

  const getPnLColor = (pnl) => {
    if (pnl === null || pnl === undefined) return "#6b7280";
    return pnl > 0 ? "#00C853" : "#D50000";
  };

  const getDayColor = (dateStr) => {
    const dailyPnL = getDailyPnL();
    const pnl = dailyPnL[dateStr];
    if (pnl === undefined) return "#ffffff";
    return pnl > 0 ? "#E8F5E9" : "#FFEBEE";
  };

  const getDayTextColor = (dateStr) => {
    const dailyPnL = getDailyPnL();
    const pnl = dailyPnL[dateStr];
    if (pnl === undefined) return "#666";
    return pnl > 0 ? "#00C853" : "#D50000";
  };

  const tradesForSelectedDate = selectedDate
    ? trades.filter(t => t.entryDate.startsWith(selectedDate))
    : [];

  const getPsychologyInsights = () => {
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    const winTags = {}, lossTags = {};
    wins.forEach(trade => {
      if (trade.psychologyTags?.length > 0) {
        trade.psychologyTags.forEach(tag => winTags[tag] = (winTags[tag] || 0) + 1);
      }
    });
    losses.forEach(trade => {
      if (trade.psychologyTags?.length > 0) {
        trade.psychologyTags.forEach(tag => lossTags[tag] = (lossTags[tag] || 0) + 1);
      }
    });
    const totalWins = wins.length, totalLosses = losses.length;
    const winInsights = Object.keys(winTags)
      .map(tag => ({ tag, count: winTags[tag], percentage: totalWins > 0 ? ((winTags[tag] / totalWins) * 100) : 0 }))
      .sort((a, b) => b.percentage - a.percentage);
    const lossInsights = Object.keys(lossTags)
      .map(tag => ({ tag, count: lossTags[tag], percentage: totalLosses > 0 ? ((lossTags[tag] / totalLosses) * 100) : 0 }))
      .sort((a, b) => b.percentage - a.percentage);
    return { winInsights, lossInsights, totalWins, totalLosses };
  };

  const insights = getPsychologyInsights();
  const WIN_REASONS = ["Patience","Proper Analysis","Discipline","Risk Management","Following Plan","Market Structure","News Confirmation","Technical Confirmation"];
  const LOSS_REASONS = ["Greed","FOMO","Revenge Trading","Impatience","Ignoring Stop Loss","Overtrading","No Plan","Emotional Trading"];

  // === Handlers ===
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTagToggle = (tag) => {
    setForm(prev => {
      const tags = prev.psychologyTags || [];
      return { ...prev, psychologyTags: tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag] };
    });
    if (tempTradeData) {
      setTempTradeData(prev => {
        const tags = prev.psychologyTags || [];
        return { ...prev, psychologyTags: tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag] };
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const pnlValue = parseFloat(form.pnl);
    if (isNaN(pnlValue)) return alert("Please enter a valid P&L.");
    if (!form.side || !['buy', 'sell'].includes(form.side.toLowerCase())) return alert("Select Buy or Sell.");
    
    setTempTradeData({
      pair: form.pair,
      side: form.side,
      pnl: pnlValue,
      stopLoss: form.stopLoss,
      takeProfit: form.takeProfit,
      notes: form.notes,
      entryDate: form.entryDate,
      psychologyTags: form.psychologyTags || [],
      psychologyNotes: form.psychologyNotes || "",
      lotSize: form.lotSize,
      entryPrice: form.entryPrice,
      exitPrice: form.exitPrice
    });
    setShowPsychologyStep(true);
  };

  const handlePsychologySubmit = () => {
    if (!tempTradeData?.psychologyTags?.length) return alert("Select at least one reason.");
    const newTrade = { id: Date.now(), ...tempTradeData, entryDate: new Date(tempTradeData.entryDate).toISOString() };
    setTrades(prev => [...prev, newTrade]);
    setShowPsychologyStep(false);
    setTempTradeData(null);
    setForm({
      pair: "",
      side: "",
      pnl: "",
      stopLoss: "",
      takeProfit: "",
      notes: "",
      entryDate: new Date().toISOString().slice(0, 16),
      psychologyTags: [],
      psychologyNotes: "",
      lotSize: "",
      entryPrice: "",
      exitPrice: ""
    });
  };

  // === Render ===
  return (
    <div style={{ maxWidth: "1300px", margin: "0 auto", fontFamily: "'Inter', sans-serif", paddingBottom: "80px" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: "80px", padding: "60px 20px 40px", background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)", borderRadius: "32px", boxShadow: "0 18px 40px rgba(0,0,0,0.10)", border: "1px solid rgba(240,240,245,0.6)" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: "700", color: "#111", marginBottom: "20px", letterSpacing: "-0.02em", lineHeight: "1.1" }}>EDGE</h1>
        <p style={{ fontSize: "1.2rem", fontWeight: "400", color: "#555", maxWidth: "720px", margin: "0 auto", lineHeight: "1.7", opacity: 0.9 }}>Master your trading psychology. Let discipline, not emotion, drive your edge.</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "40px", marginBottom: "60px", justifyContent: "center" }}>
        {[
          { label: "Total P&L", value: stats.totalPnL || "0.00", prefix: "$", color: (stats.totalPnL >= 0) ? "#00C853" : "#D50000", dynamic: true },
          { label: "Win Rate", value: stats.winRate || "0.0", suffix: "%", color: "#007AFF", dynamic: false },
          { label: "Total Trades", value: stats.totalTrades || "0", color: "#5856D6", dynamic: false },
          { label: "Avg Trade", value: stats.avgTrade || "0.00", prefix: "$", color: (stats.avgTrade >= 0) ? "#00C853" : "#D50000", dynamic: true },
        ].map((stat, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ minWidth: stat.dynamic ? "100px" : "130px", width: stat.dynamic ? "auto" : "130px", height: "130px", borderRadius: "50%", background: `linear-gradient(135deg, ${stat.color}08, ${stat.color}03)`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", boxShadow: `0 8px 28px ${stat.color}0a`, border: `1px solid ${stat.color}15`, padding: stat.dynamic ? "0 24px" : "0", boxSizing: "border-box" }}>
              <div style={{ fontSize: "2rem", fontWeight: "700", color: stat.color, textShadow: "0 2px 4px rgba(0,0,0,0.03)", whiteSpace: "nowrap" }}>{stat.prefix}{stat.value}{stat.suffix}</div>
            </div>
            <div style={{ fontSize: "1rem", fontWeight: "500", color: "#333", textAlign: "center", marginTop: "6px", letterSpacing: "0.01em" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <div style={{ display: "flex", justifyContent: "center", gap: "32px", marginBottom: "60px", flexWrap: "wrap" }}>
        <button onClick={() => setView("list")} style={{ padding: "16px 36px", background: view === "list" ? "#007AFF" : "white", color: view === "list" ? "white" : "#111", border: view === "list" ? "none" : "1px solid #f0f0f0", borderRadius: "50px", cursor: "pointer", fontWeight: "600", fontSize: "1.2rem", boxShadow: view === "list" ? "0 8px 24px rgba(0,122,255,0.25)" : "0 2px 8px rgba(0,0,0,0.03)", transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}>📋 Trade List</button>
        <button onClick={() => setView("calendar")} style={{ padding: "16px 36px", background: view === "calendar" ? "#007AFF" : "white", color: view === "calendar" ? "white" : "#111", border: view === "calendar" ? "none" : "1px solid #f0f0f0", borderRadius: "50px", cursor: "pointer", fontWeight: "600", fontSize: "1.2rem", boxShadow: view === "calendar" ? "0 8px 24px rgba(0,122,255,0.25)" : "0 2px 8px rgba(0,0,0,0.03)", transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}>📅 Performance Calendar</button>
      </div>

      {/* Calendar View */}
      {view === "calendar" && (
        <div style={{ background: "white", borderRadius: "28px", padding: "50px", boxShadow: "0 10px 40px rgba(0,0,0,0.03)", border: "1px solid rgba(240,240,245,0.7)", marginBottom: "60px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
            <button onClick={() => { const [y, m] = currentMonth.split("-"); const nm = parseInt(m) - 1; setCurrentMonth(nm < 1 ? `${parseInt(y) - 1}-12` : `${y}-${String(nm).padStart(2, "0")}`); }} style={{ padding: "16px 28px", background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: "16px", cursor: "pointer", fontWeight: "500", fontSize: "1.15rem", color: "#111" }}>← Previous</button>
            <h2 style={{ fontSize: "2.2rem", fontWeight: "700", color: "#111", margin: "0" }}>{new Date(currentMonth + "-01").toLocaleDateString(undefined, { year: "numeric", month: "long" })}</h2>
            <button onClick={() => { const [y, m] = currentMonth.split("-"); const nm = parseInt(m) + 1; setCurrentMonth(nm > 12 ? `${parseInt(y) + 1}-01` : `${y}-${String(nm).padStart(2, "0")}`); }} style={{ padding: "16px 28px", background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: "16px", cursor: "pointer", fontWeight: "500", fontSize: "1.15rem", color: "#111" }}>Next →</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr) 180px", gap: "8px", alignItems: "start" }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} style={{ padding: "16px 0", textAlign: "center", fontWeight: "600", fontSize: "0.95rem", color: "#777", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #f0f0f0" }}>{day}</div>
            ))}
            <div style={{ padding: "16px 0", textAlign: "center", fontWeight: "600", fontSize: "0.95rem", color: "#777", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #f0f0f0" }}>Weekly</div>
            {(() => {
              const days = getCalendarDays();
              const weeklyPnL = getWeeklyPnL();
              const elements = [];
              days.forEach((dateStr, i) => {
                if (dateStr === null) {
                  elements.push(<div key={`empty-${i}`} style={{ padding: "16px 0" }} />);
                } else {
                  const dailyPnL = getDailyPnL();
                  const pnl = dailyPnL[dateStr] || 0;
                  const dayOfMonth = new Date(dateStr).getDate();
                  elements.push(
                    <div key={dateStr} onClick={() => setSelectedDate(dateStr)} style={{ padding: "20px 8px", textAlign: "center", fontWeight: "500", fontSize: "1.2rem", color: getDayTextColor(dateStr), background: getDayColor(dateStr), borderRadius: "16px", cursor: "pointer", border: selectedDate === dateStr ? "2px solid #007AFF" : "none", transition: "all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}>
                      <div style={{ fontWeight: "700", fontSize: "1.4rem", marginBottom: "6px" }}>{dayOfMonth}</div>
                      <div style={{ fontSize: "0.9rem", fontWeight: "600", color: getDayTextColor(dateStr) }}>{pnl !== 0 ? `$${pnl.toFixed(2)}` : ""}</div>
                    </div>
                  );
                }
                if ((i + 1) % 7 === 0 || i === days.length - 1) {
                  const weekIndex = Math.floor(i / 7);
                  const weekPnL = weeklyPnL[weekIndex] || 0;
                  elements.push(
                    <div key={`week-${weekIndex}`} style={{ padding: "20px 8px", textAlign: "center", fontWeight: "600", fontSize: "1.15rem", color: weekPnL >= 0 ? "#00C853" : "#D50000", background: weekPnL >= 0 ? "#E8F5E9" : "#FFEBEE", borderRadius: "16px", border: "1px solid " + (weekPnL >= 0 ? "#d0f0d0" : "#ffd0d0") }}>${weekPnL.toFixed(2)}</div>
                  );
                }
              });
              return elements;
            })()}
            {selectedDate && tradesForSelectedDate.length > 0 && (
              <div style={{ gridColumn: "1 / -1", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #f0f0f0" }}>
                <h3 style={{ fontSize: "1.8rem", fontWeight: "700", color: "#111", marginBottom: "30px", textAlign: "center" }}>Trades on {new Date(selectedDate).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {tradesForSelectedDate.map(trade => (
                    <div key={trade.id} style={{ padding: "7px", border: "1px solid #f0f0f0", borderRadius: "22px", background: "#fcfcfd", boxShadow: "10px 10px 16px rgba(0,0,0,0.02)" }}>
                      <div onClick={() => setExpandedTradeId(expandedTradeId === trade.id ? null : trade.id)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: "18px", marginBottom: "18px" }}>
                        <div>
                          <div style={{ fontSize: "1.35rem", fontWeight: "700", color: "#111", marginBottom: "6px" }}>{trade.pair}</div>
                          <span style={{ display: "inline-block", padding: "8px 16px", borderRadius: "9999px", fontSize: "0.9rem", fontWeight: "600", backgroundColor: trade.pnl > 0 ? "#E8F5E9" : "#FFEBEE", color: trade.pnl > 0 ? "#00C853" : "#D50000", marginRight: "10px" }}>{trade.pnl > 0 ? "PROFIT" : "LOSS"}</span>
                          <span style={{ display: "inline-block", padding: "8px 16px", borderRadius: "9999px", fontSize: "0.9rem", fontWeight: "600", backgroundColor: "#F5F5F5", color: "#666" }}>CLOSED</span>
                        </div>
                        <div style={{ fontSize: "1.5rem", fontWeight: "700", color: getPnLColor(trade.pnl) }}>{formatPnL(trade.pnl)}</div>
                      </div>
                      {expandedTradeId === trade.id && (
                        <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #f0f0f0", fontSize: "1rem", color: "#333", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                          <div><strong>Profit/Loss:</strong> {formatPnL(trade.pnl)}</div>
                          <div><strong>Side:</strong> {trade.side?.toUpperCase() || "—"}</div>
                          <div><strong>Entry Date:</strong> {new Date(trade.entryDate).toLocaleString()}</div>
                          {trade.lotSize !== null && <div><strong>Lot Size:</strong> {trade.lotSize}</div>}
                          {trade.entryPrice !== null && <div><strong>Entry Price:</strong> {trade.entryPrice}</div>}
                          {trade.exitPrice !== null && <div><strong>Exit Price:</strong> {trade.exitPrice}</div>}
                          {trade.notes && <div style={{ gridColumn: "1 / -1" }}><strong>Trade Notes:</strong><div style={{ marginTop: "8px", padding: "12px", background: "white", borderRadius: "10px", borderLeft: `3px solid ${getPnLColor(trade.pnl)}`, fontStyle: "italic", color: "#444" }}>"{trade.notes}"</div></div>}
                          {trade.psychologyTags && trade.psychologyTags.length > 0 && <div style={{ gridColumn: "1 / -1" }}><strong>Psychology Tags:</strong><div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "8px" }}>{trade.psychologyTags.map(tag => <span key={tag} style={{ padding: "6px 12px", background: trade.pnl > 0 ? "#E8F5E9" : "#FFEBEE", color: trade.pnl > 0 ? "#00C853" : "#D50000", borderRadius: "9999px", fontSize: "0.9rem", fontWeight: "500" }}>{tag}</span>)}</div></div>}
                          {trade.psychologyNotes && <div style={{ gridColumn: "1 / -1" }}><strong>Psychology Notes:</strong><div style={{ marginTop: "8px", padding: "12px", background: "white", borderRadius: "10px", borderLeft: `3px solid ${trade.pnl > 0 ? "#00C853" : "#D50000"}`, fontStyle: "italic", color: "#444" }}>"{trade.psychologyNotes}"</div></div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trade List */}
      {view === "list" && (
        <div style={{ background: "white", borderRadius: "10px", padding: "10px", boxShadow: "0 10px 40px rgba(0,0,0,0.03)", border: "1px solid rgba(240,240,245,0.7)" }}>
          <h3 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#111", marginBottom: "10px", textAlign: "center" }}>📊 All Trades ({trades.length})</h3>
          {trades.length === 0 ? (
            <div style={{ textAlign: "center", padding: "10px 10px", color: "#666", fontSize: "1.25rem", fontStyle: "italic", opacity: 0.8 }}>No trades yet. Your edge begins with the first disciplined entry.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {trades.map(trade => (
                <div key={trade.id} style={{ padding: "10px", border: "1px solid #f0f0f0", borderRadius: "22px", background: "#fcfcfd", boxShadow: "0 4px 16px rgba(0,0,0,0.02)" }}>
                  <div onClick={() => setExpandedTradeId(expandedTradeId === trade.id ? null : trade.id)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: "18px", marginBottom: "18px" }}>
                    <div>
                      <div style={{ fontSize: "1.35rem", fontWeight: "700", color: "#111", marginBottom: "6px" }}>{trade.pair}</div>
                      <span style={{ display: "inline-block", padding: "8px 16px", borderRadius: "9999px", fontSize: "0.9rem", fontWeight: "600", backgroundColor: trade.pnl > 0 ? "#E8F5E9" : "#FFEBEE", color: trade.pnl > 0 ? "#00C853" : "#D50000", marginRight: "10px" }}>{trade.pnl > 0 ? "PROFIT" : "LOSS"}</span>
                      <span style={{ display: "inline-block", padding: "8px 16px", borderRadius: "9999px", fontSize: "0.9rem", fontWeight: "600", backgroundColor: "#F5F5F5", color: "#666" }}>CLOSED</span>
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "700", color: getPnLColor(trade.pnl) }}>{formatPnL(trade.pnl)}</div>
                  </div>
                  {expandedTradeId === trade.id && (
                    <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #f0f0f0", fontSize: "1rem", color: "#333", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                      <div><strong>Profit/Loss:</strong> {formatPnL(trade.pnl)}</div>
                      <div><strong>Side:</strong> {trade.side?.toUpperCase() || "—"}</div>
                      <div><strong>Entry Date:</strong> {new Date(trade.entryDate).toLocaleString()}</div>
                      {trade.lotSize !== null && <div><strong>Lot Size:</strong> {trade.lotSize}</div>}
                      {trade.entryPrice !== null && <div><strong>Entry Price:</strong> {trade.entryPrice}</div>}
                      {trade.exitPrice !== null && <div><strong>Exit Price:</strong> {trade.exitPrice}</div>}
                      {trade.notes && <div style={{ gridColumn: "1 / -1" }}><strong>Trade Notes:</strong><div style={{ marginTop: "8px", padding: "12px", background: "white", borderRadius: "10px", borderLeft: `3px solid ${getPnLColor(trade.pnl)}`, fontStyle: "italic", color: "#444" }}>"{trade.notes}"</div></div>}
                      {trade.psychologyTags && trade.psychologyTags.length > 0 && <div style={{ gridColumn: "1 / -1" }}><strong>Psychology Tags:</strong><div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "8px" }}>{trade.psychologyTags.map(tag => <span key={tag} style={{ padding: "6px 12px", background: trade.pnl > 0 ? "#E8F5E9" : "#FFEBEE", color: trade.pnl > 0 ? "#00C853" : "#D50000", borderRadius: "9999px", fontSize: "0.9rem", fontWeight: "500" }}>{tag}</span>)}</div></div>}
                      {trade.psychologyNotes && <div style={{ gridColumn: "1 / -1" }}><strong>Psychology Notes:</strong><div style={{ marginTop: "8px", padding: "12px", background: "white", borderRadius: "10px", borderLeft: `3px solid ${trade.pnl > 0 ? "#00C853" : "#D50000"}`, fontStyle: "italic", color: "#444" }}>"{trade.psychologyNotes}"</div></div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showTradeForm && !showPsychologyStep && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div style={{ background: "#f0f2f5", borderRadius: "24px", padding: "40px", boxShadow: "0 10px 30px rgba(0,0,0,0.08), inset 0 2px 6px rgba(255,255,255,0.7)", maxWidth: "500px", width: "90%", border: "1px solid #e0e0e0", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#333", textAlign: "center", marginBottom: "30px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Log Your Trade</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <input type="text" name="pair" value={form.pair} onChange={handleChange} placeholder="Currency Pair / Asset" required style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
              <select name="side" value={form.side} onChange={handleChange} required style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }}>
                <option value="">Select Side</option>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
              <input type="number" step="0.01" name="pnl" value={form.pnl} onChange={handleChange} placeholder="Profit/Loss ($)" required style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button type="button" onClick={() => setShowTradeForm(false)} style={{ padding: "12px 24px", background: "#f0f0f0", border: "none", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "12px 24px", background: "#007AFF", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>✅ Save Trade</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPsychologyStep && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div style={{ background: "white", borderRadius: "28px", padding: "50px", width: "90%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: "700", color: "#111", marginBottom: "30px", textAlign: "center" }}>{tempTradeData?.pnl > 0 ? "🏆 Why Did You Win?" : "💔 Why Did You Lose?"}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginBottom: "30px" }}>
              {(tempTradeData?.pnl > 0 ? WIN_REASONS : LOSS_REASONS).map(tag => (
                <button key={tag} type="button" onClick={() => handleTagToggle(tag)} style={{ padding: "14px 20px", border: (tempTradeData?.psychologyTags || []).includes(tag) ? "2px solid #007AFF" : "2px solid #f0f0f0", background: (tempTradeData?.psychologyTags || []).includes(tag) ? "#007AFF10" : "white", color: (tempTradeData?.psychologyTags || []).includes(tag) ? "#007AFF" : "#333", borderRadius: "16px", fontSize: "1rem", fontWeight: "500", cursor: "pointer" }}>{tag}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
              <button type="button" onClick={() => { setShowPsychologyStep(false); setTempTradeData(null); }} style={{ padding: "16px 40px", background: "#f0f0f0", border: "none", borderRadius: "50px", cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={handlePsychologySubmit} style={{ padding: "16px 40px", background: "#007AFF", color: "white", border: "none", borderRadius: "50px", cursor: "pointer" }}>✅ Submit & Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: "80px", paddingTop: "40px", borderTop: "1px solid #f0f0f0", color: "#777", fontSize: "1.15rem", fontStyle: "italic", opacity: 0.8 }}>EdgeOverEmotions — Where discipline meets execution. One trade at a time.</div>
    </div>
  );
};

export default App;