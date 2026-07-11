import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2, RefreshCw, Calendar, Users, AlertTriangle, Clock,
  Train, ShieldAlert, Zap, Settings, HelpCircle, ArrowRight
} from 'lucide-react';
import { driverFormService } from '../../services/services';

const SWITCH_KEYS = ['atcbs', 'dis', 'pibs', 'vsos', 'dmcb', 'eos', 'eebs', 'rbcs', 'hbcs', 'gbccos', 'zvrbs'];

export default function DriverFormsAnalysisPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // '7' | '30' | 'all' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await driverFormService.list();
      setForms(res.data || []);
    } catch (err) {
      console.error('Failed to load analysis data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Data Processing ────────────────────────────────────────────────────────
  // Filter forms by time range or custom date period
  const filteredForms = forms.filter(f => {
    if (timeRange === 'custom') {
      const formDateStr = f.shiftDate; // YYYY-MM-DD
      if (startDate && formDateStr < startDate) return false;
      if (endDate && formDateStr > endDate) return false;
      return true;
    }
    if (timeRange === 'all') return true;
    const limit = new Date();
    limit.setDate(limit.getDate() - parseInt(timeRange));
    const formDate = new Date(f.shiftDate);
    return formDate >= limit;
  });

  const handleQuickRange = (range) => {
    setTimeRange(range);
    setStartDate('');
    setEndDate('');
  };

  // 1. Metric Counts
  const totalSubmissions = filteredForms.length;
  
  const totalOT = filteredForms.reduce((acc, f) => {
    const val = parseFloat(f.overtimeHours);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const incidentForms = filteredForms.filter(f => {
    const hasDamage = f.damageMainline || f.damageDepot || f.rollingstockDamage || f.infraDamageSignaling || f.infraDamageTrack || f.infraDamageOthers;
    const hasIsolatedSwitches = f.isolatedSwitches && Object.values(f.isolatedSwitches).some(v => v);
    return hasDamage || hasIsolatedSwitches;
  });
  
  const incidentRate = totalSubmissions ? ((incidentForms.length / totalSubmissions) * 100).toFixed(1) : 0;

  // 2. Service Type Breakdown (With Passengers vs. Empty vs. Rescue)
  const serviceCounts = { with_passengers: 0, empty: 0, rescue: 0, other: 0 };
  filteredForms.forEach(f => {
    const s = f.trainService || 'other';
    if (serviceCounts[s] !== undefined) {
      serviceCounts[s]++;
    } else {
      serviceCounts.other++;
    }
  });

  // 3. Isolated Switches frequency
  const switchCounts = Object.fromEntries(SWITCH_KEYS.map(k => [k, 0]));
  filteredForms.forEach(f => {
    if (f.isolatedSwitches) {
      SWITCH_KEYS.forEach(k => {
        if (f.isolatedSwitches[k]) switchCounts[k]++;
      });
    }
  });

  const sortedSwitches = Object.entries(switchCounts)
    .sort((a, b) => b[1] - a[1]);

  // 4. Damage Types
  const damageCounts = { rollingstock: 0, signaling: 0, track: 0, others: 0 };
  filteredForms.forEach(f => {
    if (f.rollingstockDamage) damageCounts.rollingstock++;
    if (f.infraDamageSignaling) damageCounts.signaling++;
    if (f.infraDamageTrack) damageCounts.track++;
    if (f.infraDamageOthers) damageCounts.others++;
  });

  // 5. Daily Submissions Trend (last 10 days with submissions)
  const dateCounts = {};
  filteredForms.forEach(f => {
    const d = f.shiftDate;
    dateCounts[d] = (dateCounts[d] || 0) + 1;
  });

  const sortedDates = Object.entries(dateCounts)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .slice(-10); // last 10 days

  // ── Render Charts Helper ───────────────────────────────────────────────────
  // A. Donut Chart (SVG-based)
  const renderServiceDonut = () => {
    const total = serviceCounts.with_passengers + serviceCounts.empty + serviceCounts.rescue + serviceCounts.other;
    if (total === 0) {
      return (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          No service distribution data available
        </div>
      );
    }

    const segments = [
      { key: 'with_passengers', label: 'With Passengers', value: serviceCounts.with_passengers, color: '#00A591' },
      { key: 'empty', label: 'Empty Train', value: serviceCounts.empty, color: '#3a86ff' },
      { key: 'rescue', label: 'Rescue Ops', value: serviceCounts.rescue, color: '#ef4444' },
      { key: 'other', label: 'Other/Not Specified', value: serviceCounts.other, color: '#94a3b8' }
    ].filter(s => s.value > 0);

    let cumulativePercent = 0;
    const getCoordinatesForPercent = (percent) => {
      const x = Math.cos(2 * Math.PI * percent);
      const y = Math.sin(2 * Math.PI * percent);
      return [x, y];
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '10px 0' }}>
        <div style={{ position: 'relative', width: 140, height: 140 }}>
          <svg viewBox="-1.1 -1.1 2.2 2.2" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
            {segments.map((seg) => {
              const percent = seg.value / total;
              const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
              cumulativePercent += percent;
              const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
              const largeArcFlag = percent > 0.5 ? 1 : 0;
              const pathData = [
                `M ${startX} ${startY}`,
                `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                `L 0 0`
              ].join(' ');

              return (
                <path
                  key={seg.key}
                  d={pathData}
                  fill={seg.color}
                  stroke="#ffffff"
                  strokeWidth="0.02"
                />
              );
            })}
            <circle cx="0" cy="0" r="0.6" fill="#ffffff" />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{total}</span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Forms</span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          {segments.map(seg => (
            <div key={seg.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: seg.color }} />
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{seg.label}</span>
              </div>
              <div style={{ fontWeight: 700 }}>
                {seg.value} <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.7rem' }}>({((seg.value / total) * 100).toFixed(0)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // B. Trend Bar Chart (SVG-based)
  const renderTrendChart = () => {
    if (sortedDates.length === 0) {
      return (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          No trend data available for this range
        </div>
      );
    }

    const maxCount = Math.max(...sortedDates.map(d => d[1]), 5);
    const chartHeight = 150;
    const chartWidth = 480;
    const barWidth = 24;
    const gap = (chartWidth - (sortedDates.length * barWidth)) / (sortedDates.length + 1);

    return (
      <div style={{ padding: '16px 0 10px' }}>
        <div style={{ position: 'relative', height: chartHeight, width: '100%', borderBottom: '1px solid var(--border)' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute', bottom: `${r * 100}%`, left: 0, right: 0,
                borderTop: '1px dashed var(--border)', opacity: 0.5,
                pointerEvents: 'none'
              }}
            />
          ))}

          {/* Bars */}
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '100%', padding: '0 10px' }}>
            {sortedDates.map(([date, count]) => {
              const heightPercent = (count / maxCount) * 100;
              const formattedDate = new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
              return (
                <div key={date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative', flex: 1, group: 'true' }}>
                  {/* Tooltip on hover */}
                  <div className="chart-tooltip" style={{
                    position: 'absolute', bottom: `${heightPercent + 5}%`,
                    background: 'var(--brand-dark)', color: '#fff', padding: '3px 8px', borderRadius: 4,
                    fontSize: '0.68rem', fontWeight: 700, pointerEvents: 'none',
                    opacity: 1, transition: 'opacity 0.15s', whiteSpace: 'nowrap', zIndex: 10
                  }}>
                    {count} forms
                  </div>
                  
                  {/* Bar */}
                  <div
                    style={{
                      width: barWidth,
                      height: `${heightPercent}%`,
                      background: 'linear-gradient(to top, var(--brand-primary), #00c4ad)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.5s ease',
                      cursor: 'pointer'
                    }}
                  />
                  
                  {/* Label */}
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: 6, position: 'absolute', bottom: -20, fontWeight: 600 }}>
                    {formattedDate}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ height: 20 }} /> {/* spacer for labels */}
      </div>
    );
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Driver Forms Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 4 }}>
            System indicators and trend analysis of submitted driver service forms
          </p>
        </div>

        {/* Time Filter & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Quick Ranges */}
          <div style={{ display: 'flex', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', padding: 3, border: '1px solid var(--border)' }}>
            {[
              { val: '7', label: '7 Days' },
              { val: '30', label: '30 Days' },
              { val: 'all', label: 'All Time' }
            ].map(t => (
              <button
                key={t.val}
                onClick={() => handleQuickRange(t.val)}
                style={{
                  padding: '5px 12px', borderRadius: 'var(--radius-sm)', border: 'none',
                  fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  background: timeRange === t.val ? '#ffffff' : 'transparent',
                  color: timeRange === t.val ? 'var(--brand-dark)' : 'var(--text-secondary)',
                  boxShadow: timeRange === t.val ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', padding: '3px 12px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                setTimeRange('custom');
              }}
              style={{
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                padding: '2px 6px', fontSize: '0.78rem', background: '#fff',
                color: 'var(--text-primary)', outline: 'none', height: 26
              }}
            />
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => {
                setEndDate(e.target.value);
                setTimeRange('custom');
              }}
              style={{
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                padding: '2px 6px', fontSize: '0.78rem', background: '#fff',
                color: 'var(--text-primary)', outline: 'none', height: 26
              }}
            />
            {timeRange === 'custom' && (
              <button
                onClick={() => handleQuickRange('30')}
                style={{
                  background: 'none', border: 'none', color: '#ef4444',
                  fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: '0 4px',
                  textDecoration: 'underline'
                }}
              >
                Clear
              </button>
            )}
          </div>

          <button onClick={loadData} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34 }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="spin" style={{ marginBottom: 12, color: 'var(--brand-primary)' }} />
          <div>Compiling charts and reports...</div>
        </div>
      ) : (
        <div>
          {/* Main Indicators Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { icon: Train, label: 'Submissions Count', value: totalSubmissions, color: 'var(--brand-primary)' },
              { icon: AlertTriangle, label: 'Incidents / Deviations', value: incidentForms.length, color: '#ef4444', sub: `${incidentRate}% deviation rate` },
              { icon: Clock, label: 'Reported Overtime', value: `${totalOT.toFixed(1)} h`, color: '#f48c06' },
              { icon: Zap, label: 'Highest Isolation Switch', value: sortedSwitches[0] && sortedSwitches[0][1] > 0 ? `${sortedSwitches[0][0].toUpperCase()} (${sortedSwitches[0][1]})` : 'None', color: '#3a86ff' }
            ].map((stat, i) => (
              <div key={i} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, borderLeft: `4px solid ${stat.color}` }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                  <stat.icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{stat.label}</div>
                  {stat.sub && <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 700, marginTop: 2 }}>{stat.sub}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 24 }}>
            {/* Trend Chart */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 10 }}>
                <Calendar size={15} /> Submission Trend Over Time
              </div>
              {renderTrendChart()}
            </div>

            {/* Service Type Donut */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 10 }}>
                <Train size={15} /> Train Service Types
              </div>
              {renderServiceDonut()}
            </div>
          </div>

          {/* Bottom Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Switch Isolations Frequency */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 14 }}>
                <Zap size={15} /> Isolation Switch Frequency
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sortedSwitches.slice(0, 5).map(([sw, count]) => {
                  const percent = totalSubmissions ? (count / totalSubmissions) * 100 : 0;
                  return (
                    <div key={sw}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700 }}>{sw.toUpperCase()} Switch</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{count} times ({percent.toFixed(0)}%)</span>
                      </div>
                      <div style={{ height: 8, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${percent}%`, background: 'var(--brand-primary)', borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })}
                {sortedSwitches.every(x => x[1] === 0) && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: '0.8rem' }}>
                    No switch isolations recorded in this period.
                  </div>
                )}
              </div>
            </div>

            {/* Damage Incidents Reported */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 14 }}>
                <ShieldAlert size={15} /> Incidents & Damage Types
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { key: 'rollingstock', label: 'Rollingstock Damage', val: damageCounts.rollingstock, color: '#f48c06' },
                  { key: 'signaling', label: 'Signaling Damage', val: damageCounts.signaling, color: '#ef4444' },
                  { key: 'track', label: 'Track Damage', val: damageCounts.track, color: '#ef4444' },
                  { key: 'others', label: 'Other Infra Damage', val: damageCounts.others, color: '#94a3b8' }
                ].map(dmg => (
                  <div key={dmg.key} style={{ padding: 14, background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: dmg.val > 0 ? dmg.color : 'var(--text-muted)' }}>{dmg.val}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{dmg.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
