import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  format, startOfWeek, addDays, startOfMonth, endOfMonth, 
  endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, 
  parseISO, getISOWeek, differenceInMinutes, setHours, setMinutes 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Home, Clock } from 'lucide-react';
import { API } from '../../context/AuthContext';

const CalendarView = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date()); // For main week view
  const [miniDate, setMiniDate] = useState(new Date()); // For mini calendar
  const [requests, setRequests] = useState([]);
  const [now, setNow] = useState(new Date());

  // --- Fetch Data & Timer ---
  useEffect(() => {
    API.get('/requests').then(res => setRequests(res.data));
    
    // Update "Red Line" every minute
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // --- CONSTANTS ---
  const START_HOUR = 6; // 06:00
  const END_HOUR = 23;  // 23:00
  const TOTAL_HOURS = END_HOUR - START_HOUR + 1;
  const CELL_HEIGHT = 60; // Height of one hour in pixels

  // --- Main Calendar Logic ---
  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 }); 
  const weekDays = [...Array(7)].map((_, i) => addDays(startDate, i));
  const timeSlots = [...Array(TOTAL_HOURS)].map((_, i) => i + START_HOUR);

  // --- Mini Calendar Logic ---
  const miniMonthStart = startOfMonth(miniDate);
  const miniMonthEnd = endOfMonth(miniMonthStart);
  const miniStartDate = startOfWeek(miniMonthStart);
  const miniEndDate = endOfWeek(miniMonthEnd);

  const miniCalendarDays = [];
  let day = miniStartDate;
  while (day <= miniEndDate) {
    miniCalendarDays.push(day);
    day = addDays(day, 1);
  }

  // --- Event Positioning ---
  const getEvents = (day, hour) => {
    return requests.filter(r => {
      if (!r.scheduled_date) return false;
      const rDate = parseISO(r.scheduled_date);
      return isSameDay(rDate, day) && rDate.getHours() === hour;
    });
  };

  // --- Current Time Line Position ---
  const getCurrentTimePosition = () => {
    const currentHour = now.getHours();
    if (currentHour < START_HOUR || currentHour > END_HOUR) return null;
    
    const minutesFromStart = differenceInMinutes(now, setMinutes(setHours(now, START_HOUR), 0));
    return (minutesFromStart / 60) * CELL_HEIGHT;
  };
  
  const timeLineTop = getCurrentTimePosition();

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-800 font-sans">
      
      {/* --- TOP TOOLBAR --- */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm flex-none z-20">
        <div className="flex items-center gap-4">
            {/* Back to Home */}
            <button 
                onClick={() => navigate('/')} 
                className="flex items-center gap-2 text-gray-600 hover:text-odoo-primary bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded transition"
            >
                <Home size={16}/> <span className="text-sm font-medium">Dashboard</span>
            </button>

            <div className="h-6 w-px bg-gray-300 mx-2"></div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-2">
                <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronLeft size={20}/></button>
                <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronRight size={20}/></button>
                <button onClick={() => setCurrentDate(new Date())} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 text-sm font-semibold rounded">Today</button>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-800 ml-4">
                {format(currentDate, 'MMMM yyyy')} 
                <span className="text-gray-400 font-normal text-sm ml-2">Week {getISOWeek(currentDate)}</span>
            </h2>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs font-medium text-gray-600">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> New</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> In Progress</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Repaired</div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* --- MAIN CALENDAR AREA --- */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-white relative custom-scrollbar">
            
            {/* Days Header */}
            <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)] ml-14">
                {weekDays.map(day => (
                    <div key={day.toString()} className="flex-1 text-center py-3 border-r border-gray-100 last:border-0">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">{format(day, 'EEE')}</div>
                        <div className={`text-2xl mt-1 ${isSameDay(day, new Date()) ? 'text-odoo-primary font-bold bg-odoo-primary/10 rounded-full w-8 h-8 flex items-center justify-center mx-auto' : 'text-gray-700'}`}>
                            {format(day, 'd')}
                        </div>
                    </div>
                ))}
            </div>

            {/* Grid Body */}
            <div className="flex relative min-h-max">
                
                {/* Time Labels Column */}
                <div className="w-14 flex-none border-r border-gray-200 bg-white z-10 sticky left-0">
                    {timeSlots.map(hour => (
                        <div key={hour} className="text-xs text-gray-400 text-right pr-2 relative" style={{ height: CELL_HEIGHT }}>
                            <span className="relative -top-2">{hour}:00</span>
                        </div>
                    ))}
                </div>

                {/* Grid Columns */}
                <div className="flex-1 flex relative">
                    {/* Horizontal Guidelines */}
                    <div className="absolute inset-0 w-full pointer-events-none">
                        {timeSlots.map((_, i) => (
                            <div key={i} className="border-b border-gray-100 w-full" style={{ height: CELL_HEIGHT }}></div>
                        ))}
                    </div>

                    {/* Red Current Time Line */}
                    {timeLineTop !== null && (
                        <div 
                            className="absolute w-full border-t-2 border-red-500 z-20 flex items-center pointer-events-none"
                            style={{ top: timeLineTop }}
                        >
                            <div className="w-2 h-2 bg-red-500 rounded-full -ml-1"></div>
                        </div>
                    )}

                    {/* Days Columns */}
                    {weekDays.map(day => (
                        <div key={day.toString()} className="flex-1 border-r border-gray-100 relative last:border-0">
                            {timeSlots.map(hour => {
                                const events = getEvents(day, hour);
                                return events.map(ev => (
                                    <div 
                                        key={ev.id}
                                        onClick={() => navigate(`/requests/${ev.id}`)}
                                        className={`absolute left-0.5 right-0.5 p-1.5 rounded border-l-4 cursor-pointer text-xs hover:brightness-95 hover:shadow-md transition-all z-10
                                            ${ev.stage === 'New' ? 'bg-blue-50 border-blue-500 text-blue-700' : 
                                              ev.stage === 'In Progress' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
                                              ev.stage === 'Repaired' ? 'bg-green-50 border-green-500 text-green-700' : 
                                              'bg-red-50 border-red-500 text-red-700'}
                                        `}
                                        style={{ 
                                            top: (hour - START_HOUR) * CELL_HEIGHT + 2, 
                                            height: CELL_HEIGHT - 4 
                                        }}
                                    >
                                        <div className="font-bold truncate">{ev.subject}</div>
                                        <div className="truncate opacity-80 text-[10px]">{ev.equipment_name}</div>
                                    </div>
                                ));
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* --- RIGHT SIDEBAR: MINI CALENDAR --- */}
        <div className="w-64 bg-white border-l border-gray-200 p-4 hidden lg:block shadow-[-4px_0_15px_rgba(0,0,0,0.02)] z-30">
            {/* Mini Nav */}
            <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-gray-700 text-sm">
                    {format(miniDate, 'MMMM yyyy')}
                </span>
                <div className="flex gap-1">
                    <button onClick={() => setMiniDate(subMonths(miniDate, 1))} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={16} className="text-gray-500"/></button>
                    <button onClick={() => setMiniDate(addMonths(miniDate, 1))} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={16} className="text-gray-500"/></button>
                </div>
            </div>

            {/* Mini Grid */}
            <div className="grid grid-cols-7 text-center text-xs gap-y-2">
                {['S','M','T','W','T','F','S'].map(d => (
                    <div key={d} className="font-bold text-gray-400">{d}</div>
                ))}
                {miniCalendarDays.map((day, i) => (
                    <div 
                        key={i} 
                        onClick={() => setCurrentDate(day)}
                        className={`
                            py-1.5 rounded-full cursor-pointer transition
                            ${!isSameMonth(day, miniDate) ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-100'}
                            ${isSameDay(day, currentDate) ? 'bg-odoo-primary text-white hover:bg-odoo-primary' : ''}
                            ${isSameDay(day, new Date()) && !isSameDay(day, currentDate) ? 'border border-odoo-primary text-odoo-primary font-bold' : ''}
                        `}
                    >
                        {format(day, 'd')}
                    </div>
                ))}
            </div>
            
            {/* Additional Info */}
            <div className="mt-8 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Next Up</h4>
                {requests.filter(r => r.stage !== 'Repaired' && r.stage !== 'Scrap').slice(0,3).map(r => (
                    <div key={r.id} onClick={() => navigate(`/requests/${r.id}`)} className="flex items-center gap-3 mb-3 cursor-pointer group">
                        <div className={`w-2 h-2 rounded-full ${r.priority > 1 ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                        <div className="flex-1 overflow-hidden">
                            <div className="text-sm font-medium text-gray-700 truncate group-hover:text-odoo-primary">{r.subject}</div>
                            <div className="text-xs text-gray-400 truncate">{r.equipment_name}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;