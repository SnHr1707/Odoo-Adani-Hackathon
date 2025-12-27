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
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [miniDate, setMiniDate] = useState(new Date()); 
  const [requests, setRequests] = useState([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    API.get('/requests').then(res => setRequests(res.data));
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // --- CONFIG ---
  const START_HOUR = 6; 
  const END_HOUR = 23;  
  const TOTAL_HOURS = END_HOUR - START_HOUR + 1;
  const CELL_HEIGHT = 60; 

  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 }); 
  const weekDays = [...Array(7)].map((_, i) => addDays(startDate, i));
  const timeSlots = [...Array(TOTAL_HOURS)].map((_, i) => i + START_HOUR);

  // Mini Calendar logic
  const miniMonthStart = startOfMonth(miniDate);
  const miniMonthEnd = endOfMonth(miniMonthStart);
  const miniStartDate = startOfWeek(miniMonthStart);
  const miniEndDate = endOfWeek(miniMonthEnd);
  const miniCalendarDays = [];
  let day = miniStartDate;
  while (day <= miniEndDate) { miniCalendarDays.push(day); day = addDays(day, 1); }

  const getEvents = (day, hour) => {
    return requests.filter(r => {
      if (!r.scheduled_date) return false;
      const rDate = parseISO(r.scheduled_date);
      return isSameDay(rDate, day) && rDate.getHours() === hour;
    });
  };

  const getCurrentTimePosition = () => {
    const currentHour = now.getHours();
    if (currentHour < START_HOUR || currentHour > END_HOUR) return null;
    const minutesFromStart = differenceInMinutes(now, setMinutes(setHours(now, START_HOUR), 0));
    return (minutesFromStart / 60) * CELL_HEIGHT;
  };
  const timeLineTop = getCurrentTimePosition();

  // --- NEW: HANDLE CLICK ON EMPTY SLOT ---
  const handleSlotClick = (day, hour) => {
      const clickedDate = new Date(day);
      clickedDate.setHours(hour, 0, 0, 0);
      
      const localDateString = format(clickedDate, "yyyy-MM-dd'T'HH:mm");
      
      navigate('/requests/new', { state: { prefillDate: localDateString } });
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f] text-gray-300 font-sans">
      
      {/* --- TOP TOOLBAR --- */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border-b border-[#333] shadow-md z-20">
        <div className="flex items-center gap-4">
            <button 
                onClick={() => navigate('/')} 
                className="flex items-center gap-2 text-gray-400 hover:text-odoo-primary bg-[#2a2a2a] hover:bg-[#333] px-3 py-1.5 rounded transition"
            >
                <Home size={16}/> <span className="text-sm font-medium">Dashboard</span>
            </button>

            <div className="h-6 w-px bg-[#444] mx-2"></div>

            <div className="flex items-center gap-2">
                <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-1 hover:bg-[#333] rounded text-gray-400"><ChevronLeft size={20}/></button>
                <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-1 hover:bg-[#333] rounded text-gray-400"><ChevronRight size={20}/></button>
                <button onClick={() => setCurrentDate(new Date())} className="bg-[#2a2a2a] hover:bg-[#333] text-gray-300 px-3 py-1 text-sm font-semibold rounded border border-[#333]">Today</button>
            </div>

            <h2 className="text-xl font-bold text-gray-200 ml-4">
                {format(currentDate, 'MMMM yyyy')} 
                <span className="text-gray-500 font-normal text-sm ml-2">Week {getISOWeek(currentDate)}</span>
            </h2>
        </div>

        <div className="flex gap-4 text-xs font-medium text-gray-500">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> New</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> In Progress</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Repaired</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Scrap</div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* --- MAIN CALENDAR AREA --- */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-[#0f0f0f] relative custom-scrollbar">
            
            {/* Days Header */}
            <div className="flex border-b border-[#333] sticky top-0 bg-[#1a1a1a] z-10 shadow ml-14">
                {weekDays.map(day => (
                    <div key={day.toString()} className="flex-1 text-center py-3 border-r border-[#333] last:border-0">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">{format(day, 'EEE')}</div>
                        <div className={`text-2xl mt-1 ${isSameDay(day, new Date()) ? 'text-odoo-primary font-bold bg-odoo-primary/20 rounded-full w-8 h-8 flex items-center justify-center mx-auto' : 'text-gray-400'}`}>
                            {format(day, 'd')}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex relative min-h-max">
                {/* Time Labels */}
                <div className="w-14 flex-none border-r border-[#333] bg-[#1a1a1a] z-10 sticky left-0">
                    {timeSlots.map(hour => (
                        <div key={hour} className="text-xs text-gray-500 text-right pr-2 relative" style={{ height: CELL_HEIGHT }}>
                            <span className="relative -top-2">{hour}:00</span>
                        </div>
                    ))}
                </div>

                {/* Grid Columns */}
                <div className="flex-1 flex relative">
                    {/* Horizontal Guidelines */}
                    <div className="absolute inset-0 w-full pointer-events-none">
                        {timeSlots.map((_, i) => (
                            <div key={i} className="border-b border-[#2a2a2a] w-full" style={{ height: CELL_HEIGHT }}></div>
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

                    {/* Events & Clickable Slots */}
                    {weekDays.map(day => (
                        <div key={day.toString()} className="flex-1 border-r border-[#333] relative last:border-0">
                            {timeSlots.map(hour => {
                                const events = getEvents(day, hour);
                                return (
                                    <React.Fragment key={hour}>
                                        {/* INVISIBLE CLICKABLE AREA FOR SCHEDULING */}
                                        <div 
                                            onClick={() => handleSlotClick(day, hour)}
                                            className="absolute w-full hover:bg-[#1f1f1f] cursor-pointer z-0 transition-colors"
                                            style={{ top: (hour - START_HOUR) * CELL_HEIGHT, height: CELL_HEIGHT }}
                                            title="Click to schedule here"
                                        ></div>

                                        {/* EVENTS (Rendered on top) */}
                                        {events.map(ev => (
                                            <div 
                                                key={ev.id}
                                                onClick={(e) => { e.stopPropagation(); navigate(`/requests/${ev.id}`); }}
                                                className={`absolute left-1 right-1 p-1.5 rounded border-l-4 cursor-pointer text-xs hover:brightness-125 hover:shadow-lg transition-all z-10
                                                    ${ev.stage === 'New' ? 'bg-blue-900/50 border-blue-500 text-blue-200' : 
                                                      ev.stage === 'In Progress' ? 'bg-yellow-900/50 border-yellow-500 text-yellow-200' :
                                                      ev.stage === 'Repaired' ? 'bg-green-900/50 border-green-500 text-green-200' : 
                                                      'bg-red-900/50 border-red-500 text-red-200'}
                                                `}
                                                style={{ top: (hour - START_HOUR) * CELL_HEIGHT + 2, height: CELL_HEIGHT - 4 }}
                                            >
                                                <div className="font-bold truncate">{ev.subject}</div>
                                                <div className="truncate opacity-70 text-[10px]">{ev.equipment_name}</div>
                                                <div className="flex items-center gap-1 mt-1 opacity-60">
                                                    <Clock size={10} /> {format(parseISO(ev.scheduled_date), 'HH:mm')}
                                                </div>
                                            </div>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* --- RIGHT SIDEBAR: MINI CALENDAR --- */}
        <div className="w-64 bg-[#1a1a1a] border-l border-[#333] p-4 hidden lg:block z-30">
            <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-gray-300 text-sm">
                    {format(miniDate, 'MMMM yyyy')}
                </span>
                <div className="flex gap-1">
                    <button onClick={() => setMiniDate(subMonths(miniDate, 1))} className="p-1 hover:bg-[#333] rounded"><ChevronLeft size={16} className="text-gray-500"/></button>
                    <button onClick={() => setMiniDate(addMonths(miniDate, 1))} className="p-1 hover:bg-[#333] rounded"><ChevronRight size={16} className="text-gray-500"/></button>
                </div>
            </div>

            <div className="grid grid-cols-7 text-center text-xs gap-y-2">
                {['S','M','T','W','T','F','S'].map(d => (
                    <div key={d} className="font-bold text-gray-500">{d}</div>
                ))}
                {miniCalendarDays.map((day, i) => (
                    <div 
                        key={i} 
                        onClick={() => setCurrentDate(day)}
                        className={`
                            py-1.5 rounded-full cursor-pointer transition
                            ${!isSameMonth(day, miniDate) ? 'text-gray-600' : 'text-gray-400 hover:bg-[#333]'}
                            ${isSameDay(day, currentDate) ? 'bg-odoo-primary text-white hover:bg-odoo-primary' : ''}
                            ${isSameDay(day, new Date()) && !isSameDay(day, currentDate) ? 'border border-odoo-primary text-odoo-primary font-bold' : ''}
                        `}
                    >
                        {format(day, 'd')}
                    </div>
                ))}
            </div>
            
            <div className="mt-8 pt-4 border-t border-[#333]">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Up Next</h4>
                {requests.filter(r => r.stage !== 'Repaired' && r.stage !== 'Scrap').slice(0,3).map(r => (
                    <div key={r.id} onClick={() => navigate(`/requests/${r.id}`)} className="flex items-center gap-3 mb-3 cursor-pointer group">
                        <div className={`w-2 h-2 rounded-full ${r.priority > 1 ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                        <div className="flex-1 overflow-hidden">
                            <div className="text-sm font-medium text-gray-300 truncate group-hover:text-odoo-primary">{r.subject}</div>
                            <div className="text-xs text-gray-500 truncate">{r.equipment_name}</div>
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