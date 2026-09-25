'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { formatManila, formatFriendlyDate, getManilaTodayString } from '@/lib/timezone';
import { addDays, parseISO } from 'date-fns';

interface DateSelectorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  maxAdvanceDays?: number;
}

export default function DateSelector({
  selectedDate,
  onSelectDate,
  maxAdvanceDays = 7,
}: DateSelectorProps) {
  const todayStr = getManilaTodayString();
  const maxDateStr = formatManila(addDays(parseISO(todayStr), maxAdvanceDays), 'yyyy-MM-dd');

  // Generate array of available dates
  const availableDates: string[] = [];
  const baseDate = parseISO(todayStr);
  for (let i = 0; i <= maxAdvanceDays; i++) {
    availableDates.push(formatManila(addDays(baseDate, i), 'yyyy-MM-dd'));
  }

  const currentIndex = availableDates.indexOf(selectedDate);
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex !== -1 && currentIndex < availableDates.length - 1;

  const handlePrev = () => {
    if (canGoBack) {
      onSelectDate(availableDates[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (canGoForward) {
      onSelectDate(availableDates[currentIndex + 1]);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Select Reservation Date</h3>
            <p className="text-xs text-slate-500">Corporate booking window: Up to {maxAdvanceDays} days in advance (PHT)</p>
          </div>
        </div>

        {/* Quick Date Navigator + Native Picker */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handlePrev}
            disabled={!canGoBack}
            className={`p-2 rounded-lg border text-slate-600 transition-colors ${
              canGoBack
                ? 'border-slate-300 hover:bg-slate-100 hover:text-slate-900'
                : 'border-slate-200 text-slate-300 cursor-not-allowed'
            }`}
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            min={todayStr}
            max={maxDateStr}
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) onSelectDate(e.target.value);
            }}
            className="text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
          />

          <button
            onClick={handleNext}
            disabled={!canGoForward}
            className={`p-2 rounded-lg border text-slate-600 transition-colors ${
              canGoForward
                ? 'border-slate-300 hover:bg-slate-100 hover:text-slate-900'
                : 'border-slate-200 text-slate-300 cursor-not-allowed'
            }`}
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Date Pill Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
        {availableDates.map((dateStr) => {
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === todayStr;
          const dayName = formatManila(dateStr, 'EEE');
          const dayNumber = formatManila(dateStr, 'd');
          const monthName = formatManila(dateStr, 'MMM');

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[76px] py-2.5 px-3 rounded-xl transition-all border ${
                isSelected
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-[1.02]'
                  : 'bg-slate-50/80 hover:bg-slate-100/90 border-slate-200 text-slate-700'
              }`}
            >
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                {isToday ? 'Today' : dayName}
              </span>
              <span className="text-lg font-extrabold leading-tight mt-0.5">
                {dayNumber}
              </span>
              <span className={`text-[10px] font-medium ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                {monthName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
