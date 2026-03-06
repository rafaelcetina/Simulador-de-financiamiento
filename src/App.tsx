import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, 
  Bell, 
  Download, 
  Share2, 
  Info, 
  TrendingUp, 
  RotateCcw, 
  DollarSign, 
  Calendar, 
  RefreshCw,
  Edit2,
  ChevronRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for Tailwind class merging
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

interface FinancingState {
  membershipPrice: number;
  currency: 'USD' | 'MXN';
  exchangeRate: number;
  totalDownPaymentPct: number;
  idpPct: number;
  cdpPct: number;
  cdpTerm: number;
  interestRate: number;
  renewalFee: number;
  financingTerm: number;
}

// --- Components ---

const InputGroup = ({ label, icon: Icon, children, className }: { label: string, icon?: any, children: React.ReactNode, className?: string }) => (
  <div className={cn("flex flex-col gap-2", className)}>
    <label className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
      {Icon && <Icon className="w-4 h-4 text-primary" />}
      {label}
    </label>
    {children}
  </div>
);

const MetricCard = ({ title, value, subValue, icon: Icon, trend, variant = 'default' }: { 
  title: string, 
  value: string, 
  subValue?: string, 
  icon?: any, 
  trend?: { text: string, color: string },
  variant?: 'default' | 'primary'
}) => (
  <div className={cn(
    "p-6 rounded-2xl border transition-all duration-200",
    variant === 'primary' 
      ? "bg-primary border-primary shadow-xl shadow-primary/20 text-white relative overflow-hidden" 
      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
  )}>
    {variant === 'primary' && (
      <div className="absolute -right-4 -bottom-4 opacity-10">
        <TrendingUp size={96} />
      </div>
    )}
    <p className={cn(
      "text-xs font-bold uppercase tracking-widest mb-1",
      variant === 'primary' ? "text-white/70" : "text-slate-400"
    )}>
      {title}
    </p>
    <h3 className="text-3xl font-extrabold flex items-baseline gap-1">
      {value}
      {subValue && (
        <span className={cn(
          "text-lg font-normal",
          variant === 'primary' ? "text-white/70" : "text-slate-400"
        )}>
          {subValue}
        </span>
      )}
    </h3>
    {trend && (
      <div className={cn("mt-4 flex items-center gap-2 text-sm font-semibold", trend.color)}>
        <Info size={14} />
        <span>{trend.text}</span>
      </div>
    )}
    {!trend && variant === 'primary' && (
      <div className="mt-4 flex items-center gap-2 text-white/80 text-sm font-medium">
        <Calendar size={14} />
        <span>For 60 Months</span>
      </div>
    )}
    {!trend && variant === 'default' && (
      <div className="mt-4 flex items-center gap-2 text-slate-500 text-sm font-medium">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <span>65% of Membership</span>
      </div>
    )}
  </div>
);

const CustomRange = ({ value, min, max, onChange, step = 1 }: { value: number, min: number, max: number, onChange: (val: number) => void, step?: number }) => (
  <input 
    type="range"
    min={min}
    max={max}
    step={step}
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
    className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
  />
);

export default function App() {
  // --- State ---
  const [state, setState] = useState<FinancingState>({
    membershipPrice: 43950,
    currency: 'USD',
    exchangeRate: 17.35,
    totalDownPaymentPct: 35,
    idpPct: 15,
    cdpPct: 20,
    cdpTerm: 12,
    interestRate: 7.99,
    renewalFee: 376,
    financingTerm: 48,
  });

  // --- Calculations ---
  const results = useMemo(() => {
    const { 
      membershipPrice, 
      totalDownPaymentPct, 
      idpPct, 
      cdpPct, 
      cdpTerm, 
      interestRate, 
      renewalFee, 
      financingTerm,
      exchangeRate,
      currency
    } = state;

    // Conversion factor for display/calculation
    const toMXN = (val: number) => currency === 'MXN' ? val : val * exchangeRate;
    const toUSD = (val: number) => currency === 'USD' ? val : val / exchangeRate;

    // Base calculations in current currency
    const downPaymentAmount = membershipPrice * (totalDownPaymentPct / 100);
    const idpAmount = membershipPrice * (idpPct / 100);
    const cdpAmount = membershipPrice * (cdpPct / 100);
    
    // Membership portion to finance
    const membershipToFinance = membershipPrice - downPaymentAmount;
    
    // Renewal fees to finance (Total over the term)
    const years = financingTerm / 12;
    const totalRenewalFees = renewalFee * years;
    
    // Total Amount to Finance (Principal)
    const amountToFinance = membershipToFinance + totalRenewalFees;
    
    // Standard Amortization Formula
    const monthlyInterestRate = (interestRate / 100) / 12;
    const monthlyFinancingPayment = amountToFinance > 0 
      ? (amountToFinance * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, financingTerm)) / (Math.pow(1 + monthlyInterestRate, financingTerm) - 1)
      : 0;
    
    // Total of all monthly payments (Total Financed Cost)
    const totalPayments = monthlyFinancingPayment * financingTerm;
    
    // Total value of the deal (Payments + Down Payment)
    const totalDealValue = totalPayments + downPaymentAmount;
    
    const totalInterest = totalPayments - amountToFinance;
    
    const cdpMonthlyInstallment = cdpAmount / cdpTerm;
    const monthlyRenewalContrib = renewalFee / 12; // This is the "recurrent" part, but it's already financed? 
    // Usually if it's financed, you don't pay it monthly separately. 
    // However, the user's "Total Monthly Burden" includes it. 
    // Let's assume the "Monthly Renewal Contrib" in the table is just for information or if it's NOT financed.
    // But the user said "Amount to finance must include renewal fees".
    
    const totalBurdenDuringCDP = monthlyFinancingPayment + cdpMonthlyInstallment;
    const totalBurdenAfterCDP = monthlyFinancingPayment;

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

    // Values for display (always provide both for the table)
    const valInUSD = (val: number) => currency === 'USD' ? val : val / exchangeRate;
    const valInMXN = (val: number) => currency === 'MXN' ? val : val * exchangeRate;

    return {
      currencySymbol: currency === 'USD' ? '$' : '$',
      currencyLabel: currency,
      totalToPay: totalPayments, // Matching user's "Total a pagar" which is sum of payments
      totalToPayFormatted: formatCurrency(totalPayments),
      totalDealValue,
      totalDealValueFormatted: formatCurrency(totalDealValue),
      totalInterest,
      totalInterestFormatted: formatCurrency(totalInterest),
      amountToFinance,
      amountToFinanceFormatted: formatCurrency(amountToFinance),
      monthlyFinancingPayment,
      monthlyFinancingPaymentFormatted: formatCurrency(monthlyFinancingPayment),
      cdpMonthlyInstallment,
      cdpMonthlyInstallmentFormatted: formatCurrency(cdpMonthlyInstallment),
      monthlyRenewalContrib,
      monthlyRenewalContribFormatted: formatCurrency(monthlyRenewalContrib),
      totalBurdenDuringCDP,
      totalBurdenDuringCDPFormatted: formatCurrency(totalBurdenDuringCDP),
      totalBurdenAfterCDP,
      totalBurdenAfterCDPFormatted: formatCurrency(totalBurdenAfterCDP),
      downPaymentAmount,
      downPaymentAmountFormatted: formatCurrency(downPaymentAmount),
      membershipPriceFormatted: formatCurrency(membershipPrice),
      
      // Table helpers
      getRowValues: (val: number) => ({
        usd: formatCurrency(valInUSD(val)),
        mxn: formatCurrency(valInMXN(val))
      })
    };
  }, [state]);

  const chartData = [
    { name: 'Principal', value: results.amountToFinance, color: '#137fec' },
    { name: 'Down Payment', value: results.downPaymentAmount, color: '#10b981' },
    { name: 'Interest', value: results.totalInterest, color: '#fbbf24' },
  ];

  const handleCurrencySwitch = (newCurrency: 'USD' | 'MXN') => {
    if (newCurrency === state.currency) return;

    setState(prev => {
      const rate = prev.exchangeRate;
      const isToMXN = newCurrency === 'MXN';
      
      return {
        ...prev,
        currency: newCurrency,
        membershipPrice: isToMXN ? prev.membershipPrice * rate : prev.membershipPrice / rate,
        renewalFee: isToMXN ? prev.renewalFee * rate : prev.renewalFee / rate,
      };
    });
  };

  const handleInputChange = (key: keyof FinancingState, value: any) => {
    setState(prev => {
      const newState = { ...prev, [key]: value };
      
      // Sync IDP and CDP if total DP changes
      if (key === 'totalDownPaymentPct') {
        newState.idpPct = 15; // Maintain 15% IDP as base
        newState.cdpPct = Math.max(0, value - 15);
      }
      // Sync total DP if IDP or CDP changes
      if (key === 'idpPct' || key === 'cdpPct') {
        newState.totalDownPaymentPct = newState.idpPct + newState.cdpPct;
      }
      
      return newState;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-primary/20">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 md:px-10 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4 text-primary">
          <div className="size-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">Financing Simulator</h2>
        </div>
        
        <div className="flex items-center gap-4 md:gap-8">
          <nav className="hidden lg:flex items-center gap-6">
            <a className="text-primary text-sm font-semibold" href="#">Simulator</a>
            <a className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors" href="#">Saved Quotes</a>
            <a className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors" href="#">Market Rates</a>
          </nav>
          <div className="flex gap-3">
            <button className="flex items-center justify-center rounded-xl h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <Bell size={20} />
            </button>
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
              <img 
                alt="Profile" 
                src="https://picsum.photos/seed/user/100/100" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-[380px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 overflow-y-auto lg:max-h-[calc(100vh-73px)] custom-scrollbar">
          <div className="mb-8">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-6">Core Parameters</h3>
            <div className="space-y-6">
              <InputGroup label="Membership Price" icon={DollarSign}>
                <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1">
                  <button 
                    onClick={() => handleCurrencySwitch('USD')}
                    className={cn(
                      "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                      state.currency === 'USD' ? "bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 text-primary" : "text-slate-500"
                    )}
                  >
                    USD
                  </button>
                  <button 
                    onClick={() => handleCurrencySwitch('MXN')}
                    className={cn(
                      "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                      state.currency === 'MXN' ? "bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 text-primary" : "text-slate-500"
                    )}
                  >
                    MXN
                  </button>
                </div>
                <input 
                  type="number"
                  value={state.membershipPrice}
                  onChange={(e) => handleInputChange('membershipPrice', Number(e.target.value))}
                  className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary text-lg font-semibold transition-all"
                />
              </InputGroup>

              <InputGroup label="Exchange Rate">
                <div className="relative">
                  <input 
                    type="number"
                    value={state.exchangeRate}
                    onChange={(e) => handleInputChange('exchangeRate', Number(e.target.value))}
                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-3 px-4 text-slate-500 pr-10"
                  />
                  <Edit2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-primary transition-colors" />
                </div>
              </InputGroup>
            </div>
          </div>

          <div className="mb-8 border-t border-slate-100 dark:border-slate-800 pt-6">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-6">Down Payment (Enganche)</h3>
            <div className="space-y-8">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Down Payment %</span>
                  <span className="text-lg font-bold text-primary">{state.totalDownPaymentPct}%</span>
                </div>
                <CustomRange 
                  value={state.totalDownPaymentPct} 
                  min={10} 
                  max={100} 
                  onChange={(val) => handleInputChange('totalDownPaymentPct', val)} 
                />
                <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold px-1">
                  <span>10%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Initial (IDP %)</label>
                  <input 
                    type="number"
                    value={state.idpPct}
                    onChange={(e) => handleInputChange('idpPct', Number(e.target.value))}
                    className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Complem. (CDP %)</label>
                  <input 
                    type="number"
                    value={state.cdpPct}
                    onChange={(e) => handleInputChange('cdpPct', Number(e.target.value))}
                    className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">CDP Payment Term</span>
                  <span className="text-sm font-bold">{state.cdpTerm} Months</span>
                </div>
                <CustomRange 
                  value={state.cdpTerm} 
                  min={1} 
                  max={24} 
                  onChange={(val) => handleInputChange('cdpTerm', val)} 
                />
              </div>
            </div>
          </div>

          <div className="mb-8 border-t border-slate-100 dark:border-slate-800 pt-6">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-6">Financing & Fees</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Interest Rate</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={state.interestRate}
                      onChange={(e) => handleInputChange('interestRate', Number(e.target.value))}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-3 text-sm font-bold pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Renewal Fee</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={state.renewalFee}
                      onChange={(e) => handleInputChange('renewalFee', Number(e.target.value))}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-3 text-sm font-bold pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Financing Term</span>
                  <span className="text-sm font-bold">{state.financingTerm} Months</span>
                </div>
                <CustomRange 
                  value={state.financingTerm} 
                  min={12} 
                  max={120} 
                  step={12}
                  onChange={(val) => handleInputChange('financingTerm', val)} 
                />
              </div>
            </div>
          </div>

          <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group active:scale-[0.98]">
            <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            Recalculate Results
          </button>
        </aside>

        {/* Results Section */}
        <section className="flex-1 p-6 md:p-10 overflow-y-auto lg:max-h-[calc(100vh-73px)] custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Simulation Results</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Overview of the financing structure based on current parameters.</p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm">
                  <Download size={16} />
                  Export PDF
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm">
                  <Share2 size={16} />
                  Share Quote
                </button>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <MetricCard 
                title="Total a Pagar (Financing)"
                value={`${results.currencySymbol}${results.totalToPayFormatted.split('.')[0]}`}
                subValue={`.${results.totalToPayFormatted.split('.')[1]}`}
                trend={{ text: `Includes $${results.totalInterestFormatted} Interest`, color: 'text-emerald-500' }}
              />
              <MetricCard 
                title="Total Financiado (Principal)"
                value={`${results.currencySymbol}${results.amountToFinanceFormatted.split('.')[0]}`}
                subValue={`.${results.amountToFinanceFormatted.split('.')[1]}`}
              />
              <MetricCard 
                variant="primary"
                title="Standard Monthly Payment"
                value={`${results.currencySymbol}${results.monthlyFinancingPaymentFormatted.split('.')[0]}`}
                subValue={`.${results.monthlyFinancingPaymentFormatted.split('.')[1]}`}
              />
            </div>

            {/* Charts and Burden */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
              {/* Breakdown */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">Payment Breakdown</h4>
                  <span className="text-[10px] font-black px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 uppercase tracking-wider">{results.currencyLabel}</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-10">
                  <div className="relative w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{results.currencySymbol}{(results.totalDealValue / 1000).toFixed(1)}k</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total Deal Value</span>
                    </div>
                  </div>
                  <div className="space-y-5 flex-1 w-full">
                    {chartData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{results.currencySymbol}{new Intl.NumberFormat('en-US').format(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Burden */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h4 className="font-bold text-lg mb-8 text-slate-800 dark:text-slate-100">Total Monthly Burden</h4>
                <div className="space-y-8">
                  <div className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex justify-between items-center mb-5">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">During CDP (Month 1-{state.cdpTerm})</span>
                      <span className="text-2xl font-black text-primary">{results.currencySymbol}{results.totalBurdenDuringCDPFormatted}</span>
                    </div>
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-inner">
                      <div className="h-full bg-primary w-[35%] transition-all duration-500" />
                      <div className="h-full bg-primary/40 w-[60%] border-l border-white/20 transition-all duration-500" />
                    </div>
                    <p className="mt-4 text-[11px] text-slate-500 font-medium flex items-center gap-2">
                      <Info size={12} />
                      Financing + CDP Installment
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                    <div className="flex justify-between items-center mb-5">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">After CDP (Month {state.cdpTerm + 1}+)</span>
                      <span className="text-2xl font-black text-slate-700 dark:text-slate-200">{results.currencySymbol}{results.totalBurdenAfterCDPFormatted}</span>
                    </div>
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-inner">
                      <div className="h-full bg-primary w-[100%] transition-all duration-500" />
                    </div>
                    <p className="mt-4 text-[11px] text-slate-500 font-medium flex items-center gap-2">
                      <Info size={12} />
                      Financing Payment
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-10">
              <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h4 className="font-bold text-xl text-slate-800 dark:text-slate-100">Detailed Payment Schedule</h4>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button className="px-5 py-2 bg-white dark:bg-slate-700 text-[11px] font-bold rounded-lg shadow-sm text-primary transition-all">CDP Period</button>
                  <button className="px-5 py-2 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all">Standard</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Item</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Standard (USD)</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Standard (MXN)</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr className="group hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-8 py-6">
                        <p className="font-bold text-slate-800 dark:text-slate-100">Monthly Financing (P+I)</p>
                        <p className="text-xs text-slate-500 mt-0.5">Principal + Interest (Includes Renewal Fees)</p>
                      </td>
                      <td className="px-8 py-6 text-right font-bold text-slate-900 dark:text-white">${results.getRowValues(results.monthlyFinancingPayment).usd}</td>
                      <td className="px-8 py-6 text-right font-semibold text-slate-500">{results.getRowValues(results.monthlyFinancingPayment).mxn}</td>
                      <td className="px-8 py-6 text-right">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full">{state.financingTerm} Months</span>
                      </td>
                    </tr>
                    <tr className="bg-primary/5 dark:bg-primary/10 group hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors">
                      <td className="px-8 py-6">
                        <p className="font-bold text-primary">CDP Installment</p>
                        <p className="text-xs text-primary/70 mt-0.5 italic">Only for the first {state.cdpTerm} months</p>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-primary">${results.getRowValues(results.cdpMonthlyInstallment).usd}</td>
                      <td className="px-8 py-6 text-right font-bold text-primary/70">{results.getRowValues(results.cdpMonthlyInstallment).mxn}</td>
                      <td className="px-8 py-6 text-right">
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-600 text-[10px] font-bold rounded-full flex items-center gap-1 justify-end">
                          <RotateCcw size={10} />
                          Temporary
                        </span>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-primary text-white">
                      <td className="px-8 py-8 font-black text-sm uppercase tracking-wider">Estimated Total Burden (CDP Period)</td>
                      <td className="px-8 py-8 text-right font-black text-2xl">${results.getRowValues(results.totalBurdenDuringCDP).usd}</td>
                      <td className="px-8 py-8 text-right font-bold text-white/80 text-xl">{results.getRowValues(results.totalBurdenDuringCDP).mxn}</td>
                      <td className="px-8 py-8 text-right">
                        <ChevronRight className="w-6 h-6 ml-auto opacity-50" />
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
